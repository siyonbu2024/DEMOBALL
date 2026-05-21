# Plan: Online Rooms System

## Context

The football-demo is feature-complete as a client-only Zustand app — 1v1
betting, 4/8/16/32-player brackets, 64-player tournament tickets, token
wallet with ledger, and Lottie-driven animations. The big high-level
plans for going online already exist:

- `ONLINE-ROADMAP.md` — 7-week architecture (Cloudflare Durable Objects
  + WebSocket + Supabase auth/persist)
- `PRODUCT-PLAN.md` — full token-economy + bot orchestration + admin
- `ONLINE-BUILD-PLAN.md` — 13-week phased execution

This plan is **scoped to the room system specifically** — i.e. the
parts that need to flip from "client-only state in `match-store.ts`" to
"server-authoritative state with WebSocket sync". It's the spec for
*how to actually build the rooms* under the architecture those docs
already commit to.

## Approach

Three pillars, built in order. Each pillar is a working slice that
unlocks the next.

### Pillar 1 — Server foundation

Stand up a single Cloudflare Worker + Supabase project. The Worker
exposes WebSocket connections plus a small REST surface for ledger
queries.

**Server pieces:**
- `MatchmakingQueueDO` — singleton Durable Object per (roomType,
  betTier). Buckets queued users by MMR; pairs them or fills with
  a bot after `matchmakingTimeoutSec`.
- `MatchDO` — one instance per active 1v1 match. Holds both players'
  encrypted zone picks, broadcasts the simultaneous reveal, persists
  match + payout to Supabase on end.
- `BracketDO` — one per active 4/8 bracket lobby. Spawns child
  MatchDOs for each pair, blocks round N+1 until round N is fully
  resolved, distributes prizes on completion.
- `TournamentDO` — one per scheduled tournament. Adds ticket-window
  registration + 64-seat seeding + 6 rounds of MatchDO orchestration.
- `BotRunner` (in-process per MatchDO) — picks zone for any seat
  marked as bot, using the existing `aiPickZone` and personality
  data shipped from `/packages/shared`.

**DB tables (Supabase):**
- `users`, `token_transactions` (append-only ledger),
  `matches`, `bracket_matches`, `tournaments`, `tournament_tickets`,
  `room_queue` (snapshot for HomeLobby reads).

### Pillar 2 — Pure logic relocation

The wins from the demo's PURE-FUNCTION discipline pay off here.
Move (don't rewrite) the following to a shared `/packages/shared`
that both client and Worker import:

- `src/lib/game-logic.ts` — `applyRound`, `getNextKicker`,
  `computeWinner`, `aiPickZone`, `resolveRound`, `updateScore`,
  `weightedRandom`, `getPlayerHistory`, `createInitialMatchState`,
  `isMatchOver`.
- `src/lib/match-pairing.ts` — `createMatchOpponent`,
  `createMatchOpponentFor`, `createBracketParticipants`,
  `simulateBotMatch`.
- `src/lib/ai-personalities.ts` — personality bias data + lookup.
- `src/lib/bot-identities.ts` — identity pool.
- `src/lib/types.ts` — single source of truth for all types; the
  WebSocket protocol types live here too.

Client keeps everything else (UI, animations, sound, Lottie wrappers).

### Pillar 3 — Client surgery

Replace the relevant `match-store.ts` actions with thin wrappers that
fire WebSocket messages and reduce server events back into local
state. Keep the rest of the store and every component unchanged.

**WebSocket protocol** (live in `packages/shared/protocol.ts`):

Client → Server
```
JOIN_QUEUE     { roomType, betTier }
LEAVE_QUEUE
JOIN_MATCH     { matchId }
LOCK_ZONE      { matchId, zone }
READY_NEXT     { matchId }
FORFEIT        { matchId }
JOIN_TOURNAMENT { tournamentId }   // when scheduled time arrives
```

Server → Client
```
QUEUE_STATUS        { position, estimatedWaitSec }
MATCH_FOUND         { matchId, opponent }
ROUND_START         { round, role, timerSec }
OPPONENT_LOCKED     {}                       // never reveals their zone
REVEAL              { kickerZone, keeperZone, outcome, score }
MATCH_END           { winnerId, prize, newBalance }
BRACKET_UPDATE      { matches, currentRoundIndex, userOpponent }
TOURNAMENT_UPDATE   { roundIndex, bracket }
TICKET_STATUS       { tournamentId, ticketsSold }
TOKEN_UPDATE        { balance, delta, txType, reference }
ERROR               { code, message }
```

**Token ledger** moves to Supabase. The client's `tokenBalance` and
`tokenTransactions` become read-replicas of the server ledger,
updated on every `TOKEN_UPDATE` event. The actions that currently
mutate locally — `startQuickMatch1v1` (lines 444–464),
`startSpecificMatch1v1` (lines 466–488), `purchaseTicket` (lines
344–376), `record1v1MatchEnd` (lines 825–881) — become:

- Optimistic local update for snap response
- Send the corresponding intent over WS
- Reconcile when the server's `TOKEN_UPDATE` arrives (revert on error)

### Critical files

To add (Worker side, `/apps/server`):
- `index.ts` — Worker entry with DO bindings
- `do/MatchmakingQueueDO.ts`
- `do/MatchDO.ts`
- `do/BracketDO.ts`
- `do/TournamentDO.ts`
- `do/scheduler.ts` — Cron trigger for tournaments

To add (shared, `/packages/shared`):
- `protocol.ts` — WS message types
- Moved copies of game-logic / match-pairing / ai-personalities /
  bot-identities (or re-exports via path config).

To modify (client):
- `src/store/match-store.ts` — actions become WS-backed; bot drift
  loop deleted; `roomAssignments` reduced to "queue snapshot from
  server" instead of locally generated.
- `src/components/screens/MatchmakingScreen.tsx` — listen for
  `MATCH_FOUND` rather than time-based simulation.
- `src/components/screens/BracketView.tsx` — subscribe to
  `BRACKET_UPDATE`; remove the local `simulateBracketMatch` loop.
- `src/components/screens/RoundPlay.tsx` — emit `LOCK_ZONE`,
  await `REVEAL` to advance phase.

To leave untouched: every UI component (HomeLobby cards, Tournament-
Banner, Wallet/Settings/MatchHistory screens, Lottie wrappers, Goal
component, sound layer).

### Execution order

Each row produces a deployable slice. Do not start the next until
the previous is green in browser preview + a CI smoke test.

| # | Slice | What unblocks | Effort |
|---|---|---|---|
| 1 | Worker + Supabase bootstrap, auth via magic-link, `token_transactions` table + REST GET `/me/wallet` | Wallet UI reads live balance | 1 wk |
| 2 | `MatchmakingQueueDO` + `MatchDO` + WS protocol for 1v1; bot fallback at 30s | Online 1v1 with bet tier | 1.5 wk |
| 3 | `BracketDO` for 4/8; round sync; bot vs bot ran inside DO | Online bracket-4/8 | 1 wk |
| 4 | `TournamentDO` + Cron scheduler + ticket purchase API | Tournament-64 ticket flow | 1.5 wk |
| 5 | Reconnect / disconnect / forfeit edge cases | Stability | 0.5 wk |
| 6 | Spectator mode (read-only subscriber to BracketDO / TournamentDO) | Watch other matches | 0.5 wk |

≈ **6 working weeks** for the room system end-to-end with one dev.
Token economics, admin dashboard, bot policy engine (Phase 5 in the
old plan) and payment integration are out of scope for this plan.

## Verification

Each pillar has its own gate.

1. **Server foundation** — `wrangler dev` boots; opening
   `wss://localhost:8787/ws` from the browser succeeds; `/me/wallet`
   returns the seed balance for the logged-in test user.
2. **1v1 slice** — open the demo in two browser windows under
   different test users, each picks the same bet tier, server pairs
   them, both lock a zone, the reveal animation plays in sync, the
   winner's balance increments and the loser's decrements by the
   correct amount (visible in their wallet).
3. **Bracket slice** — 4 windows join the bracket room, lobby waits
   for the 4th, brackets seed, two matches run in parallel,
   round 2 starts only after both round-1 matches finish, prizes
   land in the winners' wallets.
4. **Tournament slice** — admin schedules a tournament 5 minutes
   ahead, 64 test tickets bought, cron fires at the scheduled time,
   bracket starts, runs 6 rounds, champion's wallet gets the top
   prize. Late joiners / no-shows get bot-filled.
5. **Disconnect drill** — kill one browser mid-round; verify the
   match holds for the reconnect window then auto-resolves via
   forfeit, opponent's wallet still pays out, and no token escapes
   the ledger.

## Risks

- **Token ledger consistency** — every state-changing path must go
  through a single Supabase transaction or a deterministic
  reconciliation job. Don't let optimistic client updates leak.
- **Bot-fill timing on small rooms** — bracket-4 needs 4 humans
  *or* 3 humans + 1 bot in 60 s; tune so it doesn't feel like the
  game is throwing bots at users.
- **DC during reveal phase** — the server already holds both choices;
  it must complete the reveal alone and reconcile when the user
  reconnects, otherwise the kicker can dodge a loss by yanking the
  cable.
- **Tournament round drift** — one stalled match shouldn't stall the
  whole 32 → 16 transition. Use a per-match timeout + bot-replace.

## Decision points (decided)

1. **Hosting boundary**: Vercel for the Next.js client + Cloudflare
   Worker for the server. Two dashboards, but uses both free tiers
   well. Allow `Origin: https://<vercel-url>` on the Worker's WS
   handshake.
2. **Auth provider**: Magic-link (email) **and** LINE OAuth via
   Supabase. LINE costs ~3 days extra in pillar 1 but blocks Thai
   mass-market launch otherwise.
3. **Token policy**: virtual currency only. **No real-money
   withdrawal in this round.** Removes KYC + gambling-law work and
   shaves the entire payment-out path from pillar 4.
4. **Staging vs prod env**: ship a separate staging Worker +
   Supabase project from day one. Cost ≈ ฿200/mo, avoids
   destructive migrations against live data.
