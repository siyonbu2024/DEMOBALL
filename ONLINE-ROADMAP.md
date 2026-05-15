# Online Tournament Roadmap & Architecture

> Penalty Shootout — Plan สำหรับขยายจาก demo client-side ไปเป็น online multiplayer + 64-player tournament

---

## Executive Summary

| ประเด็น | สรุป |
|---|---|
| **Goal** | Online 1v1 + 64-player scheduled tournament |
| **Timeline** | 6-7 สัปดาห์ (1 dev full-time) หรือ 4 สัปดาห์ (2 devs) |
| **Stack** | Cloudflare Durable Objects + WebSocket + Supabase (auth/persist) |
| **Cost (initial)** | $5-20/เดือน → scale ตาม traffic |
| **Risk หลัก** | หา 64 user พร้อมกัน → ใช้ scheduled slots + bot fallback |

---

## Phase Roadmap

```
Week 1         Week 2         Week 3         Week 4         Week 5         Week 6         Week 7
├──────────────┼──────────────┼──────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ Phase 1      │ Phase 2      │ Phase 3                     │ Phase 4      │ Phase 5      │ Phase 6      │
│ Infra + Auth │ Online 1v1   │ Tournament 64 + Sync        │ DC/Reconnect │ Spectator    │ Load Test    │
│              │              │                             │ Bot Fallback │ Leaderboard  │ Launch Prep  │
└──────────────┴──────────────┴──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
```

### Phase 1: Backend Infrastructure (Week 1)
**Deliverables:**
- Cloudflare Workers + Durable Objects setup
- Supabase project (auth + user profiles + match history)
- WebSocket connection pattern (client ↔ server)
- Anonymous auth + magic-link login
- CI/CD: Vercel (client) + Wrangler (server)

**Definition of Done:**
- User สามารถ login + connect WebSocket + ping/pong กับ server ได้
- User profile (username, avatar, MMR) เก็บใน Supabase

---

### Phase 2: Online 1v1 (Week 2)
**Deliverables:**
- Matchmaking queue (MMR-based pairing)
- Match Durable Object: state machine ของ 1 match
- Encrypted zone choice (server-authoritative reveal)
- Sync reveal moment ระหว่าง 2 clients

**Critical:**
- **Server-authoritative**: client ส่งแค่ choice → server เก็บไว้ → broadcast พร้อมกันตอน reveal
- **ห้าม leak** opponent choice ก่อน reveal moment

**Definition of Done:**
- 2 users เข้า queue เจอกันใน <10s
- เล่นจบ 5 rounds + sudden death
- ฝั่งหนึ่ง offline = อีกฝั่ง win

---

### Phase 3: Tournament 64-player + Sync (Week 3-4)
**Deliverables:**
- Tournament Durable Object: state machine 64 คน × 6 รอบ × 63 matches
- Scheduled tournament slots (เปิดทุก 30 นาที / 1 ชม)
- Round synchronization: รอบ N+1 เริ่มเมื่อรอบ N จบครบ
- Bracket UI (เห็น progression realtime)

**Critical Path:**
- **Round sync**: 32 matches ต้องจบก่อน R32 → R16 จะเริ่ม
- ถ้า 1 match ยังไม่จบ (DC?) → timeout 60s → force forfeit

**Definition of Done:**
- 64 users join → bracket เริ่ม → จบ 6 รอบ → ประกาศแชมป์
- Late joiner ที่ตกรอบสามารถ spectate ต่อได้

---

### Phase 4: Disconnect/Reconnect/Bot Fallback (Week 5)
**Deliverables:**
- WebSocket reconnect logic (resume session)
- Heartbeat ping/pong (detect DC <5s)
- Bot fallback: DC > 30s → แทนด้วยบอท (เลือก zone ตาม personality)
- Match resume: reconnect ภายใน 60s → join match กลับได้

**Critical:**
- 1 DC ไม่ stall ทั้ง bracket
- User เห็น "Opponent reconnecting... 25s" countdown

**Definition of Done:**
- ปิด/เปิดมือถือกลางเกม → reconnect + join กลับได้
- หลัง 60s timeout → บอทเข้ามาเล่นต่อ → bracket ไม่ค้าง

---

### Phase 5: Spectator + Leaderboard (Week 6)
**Deliverables:**
- Spectator mode: คนที่ตกรอบดู finals ต่อได้
- Live bracket view (broadcast match results)
- Leaderboard: top 100 by MMR + tournament wins
- Match history per user (last 20 matches)

**Definition of Done:**
- User ตกรอบ 1 สามารถดูรอบ finals ได้
- Leaderboard อัพเดท realtime หลังจบ tournament

---

### Phase 6: Load Test + Launch Prep (Week 7)
**Deliverables:**
- Load test: simulate 10 concurrent tournaments × 64 users = 640 connections
- Bug fix + UX polish
- Analytics (PostHog/Plausible): funnel + DAU + retention
- Deploy production + monitoring (Sentry)

**Definition of Done:**
- 100 concurrent users → latency <200ms
- Crash rate <0.1%
- Ready for soft launch

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Mobile Browser)                      │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  Next.js + React + Zustand                                         │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │  │
│  │  │ Lobby UI │  │ Match UI │  │ Bracket  │  │ WebSocket Client │   │  │
│  │  └──────────┘  └──────────┘  │  View    │  │ (auto-reconnect) │   │  │
│  │                              └──────────┘  └─────────┬────────┘   │  │
│  └─────────────────────────────────────────────────────┬┼────────────┘  │
└──────────────────────────────────────────────────────┬─┴┴───────────────┘
                                                       │ WSS (wss://)
                          ┌────────────────────────────┴─────────────────┐
                          │                                              │
                          ▼                                              ▼
┌─────────────────────────────────────────┐    ┌────────────────────────────────┐
│      CLOUDFLARE WORKERS (Edge)          │    │   SUPABASE (Backend Services)  │
│                                         │    │                                │
│  ┌───────────────────────────────────┐  │    │  ┌──────────────────────────┐  │
│  │  WebSocket Gateway                │  │    │  │  Auth (magic-link/OAuth) │  │
│  │  - JWT verify                     │◄─┼────┼──┤                          │  │
│  │  - Route to Durable Object        │  │    │  └──────────────────────────┘  │
│  └─────────────┬─────────────────────┘  │    │                                │
│                │                        │    │  ┌──────────────────────────┐  │
│  ┌─────────────▼─────────────────────┐  │    │  │  Postgres                │  │
│  │  Durable Objects (per-match/bracket)│  │    │  │  - users (id, mmr, name) │  │
│  │  ┌─────────────────────────────┐  │  │    │  │  - matches (history)     │  │
│  │  │ MatchmakingQueue            │  │  │    │  │  - tournaments           │  │
│  │  │ (MMR-based pairing)         │  │  │    │  │  - leaderboard cache     │  │
│  │  └─────────────────────────────┘  │  │    │  └──────────────────────────┘  │
│  │  ┌─────────────────────────────┐  │  │    │                                │
│  │  │ Match (1v1) Object          │◄─┼──┼────┼─ Persist results on match end  │
│  │  │ - 2 client connections      │  │  │    │                                │
│  │  │ - state machine (rounds)    │  │  │    │                                │
│  │  │ - encrypted choices         │  │  │    │                                │
│  │  └─────────────────────────────┘  │  │    │                                │
│  │  ┌─────────────────────────────┐  │  │    │                                │
│  │  │ Tournament Object (64 ppl)  │  │  │    │                                │
│  │  │ - bracket state             │  │  │    │                                │
│  │  │ - spawns 63 Match objects   │  │  │    │                                │
│  │  │ - round sync                │  │  │    │                                │
│  │  │ - broadcast bracket updates │  │  │    │                                │
│  │  └─────────────────────────────┘  │  │    │                                │
│  │  ┌─────────────────────────────┐  │  │    │                                │
│  │  │ Bot Runner                  │  │  │    │                                │
│  │  │ - DC fallback               │  │  │    │                                │
│  │  │ - AI personality decisions  │  │  │    │                                │
│  │  └─────────────────────────────┘  │  │    │                                │
│  └───────────────────────────────────┘  │    │                                │
└─────────────────────────────────────────┘    └────────────────────────────────┘
```

---

## Critical State Machines

### Match (1v1) Lifecycle

```
   [WAITING] ──both connected──► [ROUND_START]
                                       │
                                       ▼
                              [AWAITING_CHOICES] ─┐
                                       │          │ 5s timeout → auto-pick
                                       │ both     │
                                       │ locked   │
                                       ▼          │
                                  [REVEAL] ◄──────┘
                                       │
                                       ▼
                                  [SCORE_UPDATE]
                                       │
                          match over? ──┴── no ──► [ROUND_START]
                                       │
                                      yes
                                       ▼
                                   [ENDED]
                                       │
                                       ▼
                              persist to Supabase
                              update MMR + tournament
```

### Tournament Lifecycle

```
   [SCHEDULED] ──slot reached──► [REGISTRATION]
                                       │
                              wait until 64 join
                              (or 5min + bot fill)
                                       │
                                       ▼
                                  [SEED]
                                  pair 64 → 32 matches
                                       │
                                       ▼
                              ┌─► [ROUND_N_PLAYING] ◄─┐
                              │         │              │
                              │ all matches done       │ next round seeded
                              │         ▼              │
                              │    [ROUND_N_DONE] ─────┘
                              │         │
                              │   final round?
                              │         ▼
                              │    [FINISHED]
                              │         │
                              │         ▼
                              │   persist + leaderboard
                              │         │
                              ▼         ▼
                          spectate    payout/rewards
```

---

## Security & Anti-Cheat

| Threat | Mitigation |
|---|---|
| Client modifies choice after reveal | **Server-authoritative**: server stores choice, client never broadcasts |
| Client sees opponent's choice early | Server holds both choices encrypted, broadcasts simultaneously |
| Bot-net / spam matchmaking | Rate limit per IP + JWT verify per connection |
| MMR manipulation (smurf accounts) | Track device fingerprint + flag rapid MMR climb |
| Match-fixing in tournaments | Random seeding per round (not fixed bracket) |

---

## Cost Estimate (Cloudflare + Supabase)

| Tier | Users | Cost/month |
|---|---|---|
| **Free** (early) | <1k DAU | $0 |
| **Growth** | 1k-10k DAU | $20-50 |
| **Scale** | 10k-100k DAU | $100-300 |
| **Heavy** | 100k+ DAU | $500+ |

**Cost drivers:**
- Durable Objects: $0.15/GB-hr × concurrent matches
- WebSocket messages: $0.50/million
- Postgres: free up to 500MB → $25 for 8GB

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Can't find 64 players** | High (early) | Tournament never starts | Scheduled slots + bot fill after 5min |
| **High DC rate on mobile** | Medium | Bracket stalls | Reconnect window + bot fallback |
| **Server cost spike** | Low | Burn budget | Cloudflare auto-scale + monitoring alerts |
| **Cheating / unfair play** | Medium | Player churn | Server-authoritative + report system |
| **Latency in remote regions** | Medium | Bad UX | Cloudflare edge (200+ locations globally) |

---

## What Stays From Demo

✅ **Reusable as-is:**
- `src/lib/game-logic.ts` (pure function — move to server)
- `src/lib/zone-geometry.ts` (rendering logic — client only)
- `src/lib/ai-personalities.ts` (bot logic — move to server for bot fallback)
- `src/lib/types.ts` (shared between client + server)
- All UI components (`SlideKicker`, `TapKeeper`, `RevealOverlay`, etc.)
- Animation/sound system
- `GameButton`, screen layouts

🔄 **Needs rework:**
- `src/store/match-store.ts` — split into local-state + remote-state
- `match-pairing.ts` — replace with server queue
- Bracket flow — replace `simulateBotMatch` with real WebSocket events
- `MatchmakingScreen` — connect to real queue

❌ **Demo-only (remove):**
- Bot pool drift (`driftRoomAssignments`)
- Hardcoded room counts (cosmetic)
- Local bracket simulation

---

## Open Questions (เคลียร์ก่อนเริ่ม)

1. **Monetization?** — free / in-app purchase / ads / entry fee per tournament?
2. **Account system?** — guest only / email / OAuth (Google/Facebook/LINE)?
3. **Regional servers?** — Thailand-only แรก → expand SEA?
4. **Tournament rewards?** — virtual trophy / leaderboard / real prize?
5. **Anti-cheat policy?** — ban duration / report flow / appeal process?
6. **Compliance?** — PDPA (Thailand) requirements + age gate?

---

## Recommended Next Steps

1. **Validate demand** — ใช้ demo ปัจจุบัน pitch ลูกค้า/ผู้เล่น 10-20 คน → ดู feedback
2. **Pilot ขั้นเล็ก** — ทำ online 1v1 อย่างเดียวก่อน (Phase 1+2) → ใช้เวลา 2 สัปดาห์ → test กับ user 50 คน
3. **ถ้า traction ดี** → expand เป็น tournament 8 → 16 → 32 → 64
4. **อย่าทำ 64-player ตั้งแต่แรก** — risk หาคนไม่ครบสูง, ดู metric ก่อนค่อย scale

---

*Document version: 1.0 — for pitch / planning discussion*
