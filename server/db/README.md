# Supabase migrations

Plain SQL files, applied **in numeric order** in each Supabase project
(staging then production). No Supabase CLI required — paste into the
SQL editor and hit run.

| File | Adds |
|---|---|
| `0001_init.sql` | `users`, `token_transactions` ledger, RLS, sign-up trigger |

## How to apply

1. Open the project's Supabase dashboard.
2. SQL editor → "New query".
3. Paste the whole file, click **Run**.
4. Verify by running the queries at the bottom of the file.

Staging first, always. Don't apply to production until you've signed
in and seen the seed 1000-token promo land in `token_transactions`.

## Conventions

- File names: `NNNN_short_name.sql` (zero-padded, monotonically
  increasing). Once committed, never rename — append a new file.
- Use `create … if not exists` / `drop policy if exists … create …`
  so re-running a migration on a partially-applied project is safe.
- Triggers always `security definer` so RLS doesn't block the seed
  insert into `token_transactions`.
- Server code reads via the service-role key, which bypasses RLS.
  Clients read via the anon key + Supabase Auth JWT, which is bound
  by the `_self` policies.
