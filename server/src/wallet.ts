/**
 * Wallet endpoints.
 *
 * For Slice 1, this is just a read path: the authed user's current
 * balance + the latest 20 transactions. Writes happen in Slice 2 as
 * a side effect of matches / tournaments, and they always go through
 * the service-role client to bypass RLS.
 */

import type { Env } from "./index";
import { makeSupabaseService, requireUser } from "./auth";

interface WalletTx {
  id: string;
  type: string;
  amount: number;
  balance_after: number;
  description: string;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
}

interface WalletResponse {
  userId: string;
  username: string | null;
  avatar: string | null;
  mmr: number;
  balance: number;
  transactions: WalletTx[];
}

/** GET /me/wallet — returns the authed user's profile + balance + last 20 tx. */
export async function handleWallet(req: Request, env: Env): Promise<Response> {
  const auth = await requireUser(req, env);
  if (auth instanceof Response) return auth;

  const sb = makeSupabaseService(env);

  // 1. Profile (created by the auth.users INSERT trigger in 0001_init.sql)
  const { data: profile, error: profileErr } = await sb
    .from("users")
    .select("id, username, avatar, mmr")
    .eq("id", auth.id)
    .maybeSingle();

  if (profileErr) {
    return jsonErr(500, "INTERNAL", profileErr.message);
  }
  if (!profile) {
    // Trigger missed (extremely rare) — return zero state so the UI
    // doesn't break. Slice 2 will repair via ensureUserExists().
    return json({
      userId: auth.id,
      username: null,
      avatar: null,
      mmr: 1200,
      balance: 0,
      transactions: [],
    } satisfies WalletResponse);
  }

  // 2. Latest 20 transactions, newest first.
  const { data: txs, error: txErr } = await sb
    .from("token_transactions")
    .select(
      "id, type, amount, balance_after, description, reference_type, reference_id, created_at",
    )
    .eq("user_id", auth.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (txErr) {
    return jsonErr(500, "INTERNAL", txErr.message);
  }

  // 3. Balance = newest row's balance_after, or 0 if no rows.
  const balance = txs && txs.length > 0 ? (txs[0]!.balance_after as number) : 0;

  return json({
    userId: auth.id,
    username: profile.username,
    avatar: profile.avatar,
    mmr: profile.mmr,
    balance,
    transactions: (txs ?? []) as WalletTx[],
  } satisfies WalletResponse);
}

// ────────────────────────────────────────────────────────────────────
// Internals
// ────────────────────────────────────────────────────────────────────

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function jsonErr(status: number, code: string, message: string): Response {
  return json({ error: code, message }, status);
}
