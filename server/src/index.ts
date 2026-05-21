/**
 * football-demo-server — Cloudflare Worker entry.
 *
 * Slice 1 (this file): just /health + a stub /ws WebSocket echo so we
 * can verify the client can connect from Vercel. No Durable Objects
 * yet — those come in slice 2 (MatchmakingQueueDO, MatchDO, etc.).
 */

import type { ClientToServer, ServerToClient } from "@shared/protocol";
import { verifyToken, extractToken } from "./auth";

export interface Env {
  ENVIRONMENT: "staging" | "production";
  ALLOWED_ORIGINS: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  LINE_CHANNEL_ID?: string;
  LINE_CHANNEL_SECRET?: string;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    // ── Preflight ────────────────────────────────────────────────────
    if (req.method === "OPTIONS") {
      return corsPreflight(req, env);
    }

    // ── Routes ───────────────────────────────────────────────────────
    if (url.pathname === "/health") {
      return json({
        ok: true,
        environment: env.ENVIRONMENT,
        time: new Date().toISOString(),
      }, env, req);
    }

    if (url.pathname === "/ws") {
      return handleWebSocket(req, env);
    }

    return json({ error: "not_found", path: url.pathname }, env, req, 404);
  },
} satisfies ExportedHandler<Env>;

// ────────────────────────────────────────────────────────────────────
// WebSocket — stub echo handler
// ────────────────────────────────────────────────────────────────────

async function handleWebSocket(req: Request, env: Env): Promise<Response> {
  const upgrade = req.headers.get("Upgrade");
  if (upgrade !== "websocket") {
    return new Response("expected websocket upgrade", { status: 426 });
  }

  // Optional origin check — relax during local dev.
  const origin = req.headers.get("Origin") ?? "";
  if (!isOriginAllowed(origin, env)) {
    return new Response(`origin ${origin} not allowed`, { status: 403 });
  }

  // Require a Supabase JWT on the handshake. Without it, no socket is
  // opened — saves us from any per-message auth gating.
  const token = extractToken(req);
  if (!token) {
    return new Response("missing token query param", { status: 401 });
  }
  const authed = await verifyToken(token, env);
  if (!authed) {
    return new Response("invalid token", { status: 401 });
  }

  const pair = new WebSocketPair();
  const [client, server] = Object.values(pair);

  server.accept();

  // Echo handler — every inbound message is parsed as ClientToServer
  // and a PONG (or ERROR) is sent back. Slice 2 will replace this with
  // proper routing into the MatchmakingQueueDO.
  server.addEventListener("message", (event) => {
    let msg: ClientToServer;
    try {
      const data = typeof event.data === "string"
        ? event.data
        : new TextDecoder().decode(event.data as ArrayBuffer);
      msg = JSON.parse(data) as ClientToServer;
    } catch (err) {
      sendError(server, "INTERNAL", `invalid json: ${(err as Error).message}`);
      return;
    }

    if (msg.type === "PING") {
      const pong: ServerToClient = { type: "PONG", t: msg.t };
      server.send(JSON.stringify(pong));
      return;
    }

    // For every other message, ack with an ERROR until slice 2 wires
    // the real handlers. Echo the type so the client knows we saw it.
    sendError(
      server,
      "INTERNAL",
      `slice 1 stub — received "${msg.type}", routing not implemented yet`,
    );
  });

  server.addEventListener("close", () => {
    // Slice 2 will clean up queue subscriptions here.
  });

  return new Response(null, { status: 101, webSocket: client });
}

// ────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────

function sendError(
  ws: WebSocket,
  code: Extract<ServerToClient, { type: "ERROR" }>["code"],
  message: string,
): void {
  const err: ServerToClient = { type: "ERROR", code, message };
  ws.send(JSON.stringify(err));
}

function corsPreflight(req: Request, env: Env): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(req, env),
  });
}

function corsHeaders(req: Request, env: Env): HeadersInit {
  const origin = req.headers.get("Origin") ?? "";
  const allowed = isOriginAllowed(origin, env);
  return {
    "Access-Control-Allow-Origin": allowed ? origin : "null",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function isOriginAllowed(origin: string, env: Env): boolean {
  if (!origin) return true; // direct curl / wrangler dev
  const list = (env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length === 0 || list.includes(origin);
}

function json(
  body: unknown,
  env: Env,
  req: Request,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(req, env),
    },
  });
}
