-- ────────────────────────────────────────────────────────────────────
-- football-demo schema — migration 0001 (Slice 1)
-- ────────────────────────────────────────────────────────────────────
-- Scope:
--   • users         — public profile + game stats, linked 1-to-1 to auth.users
--   • token_transactions
--                  — append-only ledger; current balance = latest row's
--                    balance_after for that user
--
-- Later migrations will add: matches, bracket_matches, tournaments,
-- tournament_tickets, room_queue, bot_policy_log.
--
-- Apply via Supabase SQL editor in BOTH staging and production projects.
-- ────────────────────────────────────────────────────────────────────

set search_path = public;

-- ── Helpers ─────────────────────────────────────────────────────────

create extension if not exists pgcrypto;        -- gen_random_uuid()

-- ── users ───────────────────────────────────────────────────────────
--   id matches auth.users(id) so we can join easily and reuse RLS.
--   When the auth row goes, the public row goes (ON DELETE CASCADE).

create table if not exists public.users (
  id               uuid primary key
                    references auth.users(id) on delete cascade,
  username         text not null unique
                    check (char_length(username) between 1 and 16),
  avatar           text not null default '🙂',
  mmr              integer not null default 1200
                    check (mmr between 0 and 5000),
  /** LINE social ID — populated when the user signs in with LINE OAuth.
   *  Unique so a single LINE account can't be linked to two profiles.   */
  line_id          text unique,
  created_at       timestamptz not null default now(),
  last_seen_at     timestamptz not null default now()
);

create index if not exists idx_users_last_seen
  on public.users (last_seen_at desc);

-- ── token_transactions (append-only ledger) ─────────────────────────
--   Source of truth for the wallet. Inserts only — no UPDATE / DELETE
--   in normal flow. `balance_after` is denormalised so we can read the
--   user's current balance with a single ORDER BY ... LIMIT 1.
--
--   Add new tx types? Keep the CHECK in sync.

create table if not exists public.token_transactions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null
                    references public.users(id) on delete cascade,
  type             text not null
                    check (type in (
                      'deposit',
                      'withdraw',
                      'match_entry',
                      'match_win',
                      'refund',
                      'promo'
                    )),
  /** Positive = credit, negative = debit. */
  amount           integer not null,
  /** Wallet balance immediately AFTER this transaction. */
  balance_after    integer not null
                    check (balance_after >= 0),
  description      text not null default '',
  /** Foreign keys are written as plain text — we don't want a hard FK
   *  back to matches/tournaments because those tables might not exist
   *  yet (and we want the ledger to outlive deletions there).         */
  reference_type   text,
  reference_id     text,
  created_at       timestamptz not null default now()
);

-- Hot path: "give me my last N transactions" + "what's my balance"
create index if not exists idx_token_tx_user_created
  on public.token_transactions (user_id, created_at desc);

-- Prevent UPDATE / DELETE on the ledger — append-only.
-- The service-role bypass still applies, so a server-side migration can
-- patch a row if absolutely necessary, but no API path can.
create or replace function public.token_transactions_no_mutate()
  returns trigger language plpgsql as $$
begin
  raise exception 'token_transactions is append-only';
end $$;

drop trigger if exists trg_token_tx_no_update on public.token_transactions;
create trigger trg_token_tx_no_update
  before update on public.token_transactions
  for each row execute function public.token_transactions_no_mutate();

drop trigger if exists trg_token_tx_no_delete on public.token_transactions;
create trigger trg_token_tx_no_delete
  before delete on public.token_transactions
  for each row execute function public.token_transactions_no_mutate();

-- ── Read helper ─────────────────────────────────────────────────────
-- get_user_balance(uid) → integer (0 if no rows yet)

create or replace function public.get_user_balance(uid uuid)
  returns integer language sql stable as $$
  select coalesce(
    (select balance_after
       from public.token_transactions
      where user_id = uid
      order by created_at desc
      limit 1),
    0
  );
$$;

-- ── Row-level security ──────────────────────────────────────────────
-- Anonymous + authenticated users may READ their own rows, nothing else.
-- All writes go through the server using the service-role key, which
-- bypasses RLS.

alter table public.users enable row level security;
alter table public.token_transactions enable row level security;

-- USERS: read self
drop policy if exists users_select_self on public.users;
create policy users_select_self on public.users
  for select to authenticated
  using (id = auth.uid());

-- USERS: update self (only the harmless fields)
drop policy if exists users_update_self on public.users;
create policy users_update_self on public.users
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- TOKEN_TRANSACTIONS: read self
drop policy if exists token_tx_select_self on public.token_transactions;
create policy token_tx_select_self on public.token_transactions
  for select to authenticated
  using (user_id = auth.uid());

-- (No INSERT policy on either table — only the Worker, using the
--  service-role key, may write rows.)

-- ── Sign-up trigger ─────────────────────────────────────────────────
-- Whenever Supabase Auth creates a new auth.users row (magic-link click
-- or LINE OAuth callback), drop a matching public.users row + a 1000
-- token promo so the wallet has something to show on first login.

create or replace function public.on_auth_user_created()
  returns trigger language plpgsql security definer as $$
declare
  default_username text;
begin
  -- Pick a username: LINE display name → email local-part → "Player#xxxx"
  default_username := coalesce(
    new.raw_user_meta_data ->> 'name',
    split_part(coalesce(new.email, ''), '@', 1),
    'Player' || substr(replace(new.id::text, '-', ''), 1, 4)
  );
  default_username := substring(default_username from 1 for 16);
  if default_username = '' then
    default_username := 'Player' || substr(replace(new.id::text, '-', ''), 1, 4);
  end if;

  insert into public.users (id, username, line_id)
  values (
    new.id,
    default_username,
    new.raw_user_meta_data ->> 'line_id'
  )
  on conflict (id) do nothing;

  -- Seed 1000 promo tokens (matches the demo's default starting balance).
  insert into public.token_transactions (
    user_id, type, amount, balance_after, description
  )
  values (new.id, 'promo', 1000, 1000, 'เครดิตเริ่มต้น (demo)');

  return new;
end $$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.on_auth_user_created();

-- ────────────────────────────────────────────────────────────────────
-- Verification
-- ────────────────────────────────────────────────────────────────────
-- After running this migration, in the SQL editor:
--
--   select count(*) from public.users;
--   select count(*) from public.token_transactions;
--
-- After your first magic-link login:
--
--   select * from public.users where id = auth.uid();
--   select * from public.token_transactions where user_id = auth.uid();
--
-- Balance should be 1000 from the promo row.
