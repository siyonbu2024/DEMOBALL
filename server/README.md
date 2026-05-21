# football-demo-server

Cloudflare Worker that backs the online rooms feature
(see [ONLINE-ROOMS-PLAN.md](../ONLINE-ROOMS-PLAN.md)).

## Slice 1 scope

- `GET /health` — sanity-check endpoint, returns env + timestamp.
- `WS /ws` — echo stub. Replies to `PING` with `PONG`; everything
  else gets an `ERROR { code: "INTERNAL" }` until Slice 2 wires the
  real handlers (Matchmaking / Match / Bracket / Tournament DOs).

## Layout

```
server/
├── src/index.ts        ← Worker entry (fetch + WebSocket)
├── wrangler.toml       ← Worker config + env-scoped vars
├── tsconfig.json       ← Has @shared/* alias into ../shared/src
├── package.json
└── README.md
```

The Worker imports its protocol types directly from `../shared/src/`
via the `@shared/*` TS alias.

## Local dev

```bash
cd server
npm install
npm run dev            # http://127.0.0.1:8787
```

Smoke test:
```bash
curl http://127.0.0.1:8787/health
# → { "ok": true, "environment": "staging", "time": "..." }

# Then from the browser console at http://localhost:3000:
const ws = new WebSocket("ws://127.0.0.1:8787/ws");
ws.onopen = () => ws.send(JSON.stringify({ type: "PING", t: Date.now() }));
ws.onmessage = (e) => console.log(JSON.parse(e.data));
# → { type: "PONG", t: ... }
```

## Secrets

Per-environment, never commit:

```bash
wrangler secret put SUPABASE_URL --env staging
wrangler secret put SUPABASE_ANON_KEY --env staging
wrangler secret put SUPABASE_SERVICE_ROLE_KEY --env staging
wrangler secret put LINE_CHANNEL_ID --env staging
wrangler secret put LINE_CHANNEL_SECRET --env staging
# repeat with --env production
```

For local `npm run dev`, drop a `.dev.vars` file (gitignored) in this
directory using the same keys.

## Deploy

```bash
npm run deploy:staging
npm run deploy:production
```

CORS allow-list lives in `wrangler.toml` under each env's `vars`.
Update `ALLOWED_ORIGINS` when the Vercel URL is settled.
