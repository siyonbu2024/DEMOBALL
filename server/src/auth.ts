/**
 * Auth utilities for the Worker.
 *
 * The browser can't set custom headers on a WebSocket handshake, so the
 * client passes the Supabase JWT as a `token` query parameter on /ws.
 * Plain HTTP requests use a normal `Authorization: Bearer <jwt>` header.
 *
 * Verification goes through Supabase's getUser() — it both validates
 * the JWT signature against the project and returns the user record in
 * a single round trip.
 */

import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { Env } from "./index";

export interface AuthedUser {
  /** The user's uuid (matches public.users.id and auth.users.id). */
  id: string;
  email: string | null;
  user: User;
}

/**
 * Create a fresh Supabase client. We don't memoise across requests
 * because Workers can run on isolates with different env scopes; each
 * request gets its own short-lived client.
 */
export function makeSupabaseAnon(env: Env): SupabaseClient {
  requireEnv(env, "SUPABASE_URL");
  requireEnv(env, "SUPABASE_ANON_KEY");
  return createClient(env.SUPABASE_URL!, env.SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Client with the service-role key — bypasses RLS. Use this when writing
 * to the token ledger or any other server-only mutation.
 */
export function makeSupabaseService(env: Env): SupabaseClient {
  requireEnv(env, "SUPABASE_URL");
  requireEnv(env, "SUPABASE_SERVICE_ROLE_KEY");
  return createClient(env.SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Pull the JWT out of either an Authorization header or ?token=... */
export function extractToken(req: Request): string | null {
  // HTTP: Authorization: Bearer <token>
  const header = req.headers.get("Authorization");
  if (header?.startsWith("Bearer ")) {
    return header.substring("Bearer ".length).trim() || null;
  }
  // WebSocket: ws://.../ws?token=<jwt>
  const url = new URL(req.url);
  const qp = url.searchParams.get("token");
  return qp && qp.length > 0 ? qp : null;
}

/**
 * Verify a JWT against the configured Supabase project. Returns the
 * user record on success, or null on any failure (expired, wrong
 * project, malformed, etc.).
 */
export async function verifyToken(
  token: string,
  env: Env,
): Promise<AuthedUser | null> {
  const supabase = makeSupabaseAnon(env);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return {
    id: data.user.id,
    email: data.user.email ?? null,
    user: data.user,
  };
}

/**
 * Middleware-style helper. Returns the verified user OR a 401 Response.
 *
 *   const user = await requireUser(req, env);
 *   if (user instanceof Response) return user;
 *   // ...use user.id
 */
export async function requireUser(
  req: Request,
  env: Env,
): Promise<AuthedUser | Response> {
  const token = extractToken(req);
  if (!token) {
    return jsonError(401, "AUTH_REQUIRED", "missing bearer token");
  }
  const user = await verifyToken(token, env);
  if (!user) {
    return jsonError(401, "AUTH_INVALID", "token verification failed");
  }
  return user;
}

// ────────────────────────────────────────────────────────────────────
// Internals
// ────────────────────────────────────────────────────────────────────

function requireEnv(env: Env, key: keyof Env): void {
  if (!env[key]) {
    throw new Error(`Missing env: ${String(key)} — set it via wrangler secret put`);
  }
}

function jsonError(status: number, code: string, message: string): Response {
  return new Response(JSON.stringify({ error: code, message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
