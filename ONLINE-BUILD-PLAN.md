# Online Build Plan — Actionable

> Step-by-step plan to take the current demo online.
> Builds on top of `PRODUCT-PLAN.md` (product spec) and `ONLINE-ROADMAP.md` (architecture).
> This doc focuses on **what to build, in what order, week by week.**

---

## Current State (offline demo)

✅ **มีแล้ว:**
- 1v1 + Bracket 4/8/16/32 (cosmetic) + Tournament 64 UI
- Token wallet + deposit/withdraw + transaction ledger (in-memory)
- Bet tier picker (10/50/100/500/1k) with 20% rake
- Tournament ticket purchase with 25% rake + scheduled time
- Match history + win/loss stats
- Settings (avatar, mute, vibration)
- Shooter character + animations
- Bottom nav + sticky top wallet
- Bot AI personalities + match simulation

❌ **ยังไม่มี:**
- Real user accounts (Zustand store reset on reload)
- Real matchmaking (everything is bot)
- Persistence across sessions
- Real money in/out
- Profit-aware bot orchestration
- Admin dashboard
- WebSocket / real-time sync

---

## Total Estimate

| Path | Duration |
|---|---|
| **1 dev full-time** | 13 สัปดาห์ (~3 เดือน) |
| **2 devs full-time** | 7-8 สัปดาห์ |
| **MVP path** (1v1 + tournament only) | 6-7 สัปดาห์ |

---

## Phase 0: Foundation (สัปดาห์ที่ 1)

**Goal:** ตั้ง infrastructure ให้ทุก phase ต่อๆ ไปใช้ได้

### Tasks
- [ ] สร้าง Supabase project (free tier)
  - Project name, region (Singapore), env vars
- [ ] สร้าง Cloudflare account + Workers + Durable Objects setup
  - `wrangler.toml` กำหนด DO bindings
- [ ] Setup monorepo structure
  ```
  /apps/web         (Next.js — มีอยู่แล้ว)
  /apps/server      (Cloudflare Worker — ใหม่)
  /packages/shared  (types, protocol)
  /packages/db      (Supabase schema + queries)
  ```
- [ ] Setup CI/CD
  - Vercel auto-deploy ต่อ push
  - Wrangler deploy บน push
- [ ] Setup `.env.local` + secrets management

### Deliverable
- Hello-world WebSocket connection client ↔ server ↔ DB

### Effort
**5 วัน** (1 dev)

---

## Phase 1: Auth + Real Wallet (สัปดาห์ที่ 2)

**Goal:** ผู้เล่นสมัครได้, มี wallet ที่ persist จริง

### Tasks
- [ ] Supabase Auth: magic-link login (email) + anonymous fallback
- [ ] DB schema: `users`, `token_transactions` (immutable ledger), `user_economics`
- [ ] เปลี่ยน Zustand store → ใช้ Supabase สำหรับ token balance + transaction history
- [ ] UI: login screen, profile completion (username, avatar)
- [ ] Optimistic update + sync back from server
- [ ] Logout flow

### Deliverable
- ผู้เล่นสมัคร → balance persist ข้าม session
- ทุก transaction logged ใน DB
- Wallet หน้าเดิม (UI ไม่เปลี่ยน) — แค่ข้อมูลจริง

### Effort
**5 วัน**

---

## Phase 2: Online 1v1 + Basic Bot (สัปดาห์ที่ 3-4)

**Goal:** ผู้เล่นจริงเจอกันเล่น 1v1 ได้ + มี bot fallback

### Architecture
```
Client
  ↓ WebSocket
MatchmakingQueue (DO)
  ↓ pair 2 players (or 1 player + bot after 30s)
MatchDO (1 per match)
  ↓ orchestrate rounds
  ↓ store/reveal choices (server-authoritative)
  ↓ payout on end
Supabase (matches + token_transactions)
```

### Tasks
- [ ] Define WebSocket message protocol (`@/packages/shared/protocol.ts`)
  - `JOIN_QUEUE`, `MATCH_FOUND`, `LOCK_ZONE`, `OPPONENT_LOCKED`, `REVEAL`, `MATCH_END`
- [ ] `MatchmakingQueueDO` — MMR + bet tier pairing
  - Timeout 30s → spawn bot if no human found
- [ ] `MatchDO` — manage 1 match
  - Track 2 client connections + state machine
  - Server stores both choices encrypted, broadcasts reveal simultaneously
  - Persist match + payout on end
- [ ] Bot v1 — personality-based zone choice + 1.5-3s think delay
  - Win rate ตาม config (default 55%)
- [ ] Client wiring
  - `MatchmakingScreen` → real queue
  - `RoundPlay` → send `LOCK_ZONE` via WS
  - `RevealOverlay` → wait for `REVEAL` event
- [ ] Token deduction + payout via DB transaction

### Deliverable
- 2 human players เจอกัน เล่นจบ 1v1 + token หัก/แจกถูก
- 1 human รอ 30s ไม่เจอใคร → bot เข้ามา
- เปิด 2 tabs ในเครื่องเดียวกัน → เล่นกันได้จริง

### Effort
**10 วัน**

---

## Phase 3: Bracket 4 + 8 Online (สัปดาห์ที่ 5)

**Goal:** Bracket แข่งกันเป็น tournament จริง

### Tasks
- [ ] `BracketDO` — orchestrate 4/8 player bracket
  - Wait for full lobby (60-90s timeout → bot fill)
  - Spawn child `MatchDO` per pair
  - Wait round to complete before next round
  - Calculate ranks + distribute prizes
- [ ] Round sync: round N+1 waits until all N matches done
- [ ] Spectator: ผู้แพ้ดู bracket ต่อได้
- [ ] DC handling: reconnect ใน 60s ไม่งั้น forfeit + bot แทน
- [ ] Prize distribution (70/30 for 4, 60/25/7.5/7.5 for 8)

### Deliverable
- 4 human + bots → bracket จบ + ผู้ชนะรับ prize ตรง
- ตัด session กลางคัน → reconnect ได้ ไม่ stall ทั้ง bracket

### Effort
**5 วัน**

---

## Phase 4: Tournament 64 + Scheduled (สัปดาห์ที่ 6-7)

**Goal:** Tournament 64 คน เริ่มตามตารางจริง

### Tasks
- [ ] DB: `tournaments`, `tournament_tickets`
- [ ] `TournamentSchedulerWorker` (Cloudflare Cron Trigger)
  - ทุก 5 นาที check tournament ที่ใกล้เริ่ม
  - เมื่อถึงเวลา → trigger `TournamentDO`
- [ ] `TournamentDO`
  - Manage 63 matches across 6 rounds
  - Seed bracket from ticket holders
  - Bot fill ถ้าไม่ครบ
  - Sync 32 matches → 16 → 8 → 4 → 2 → 1
  - Distribute prizes (40/20/7.5×2/2.5×4)
- [ ] Spectator mode UI
- [ ] Live bracket viewer (subscribe to tournament events)
- [ ] No-show handling: ใน 5 นาที ก่อนเริ่มไม่ join → bot แทน

### Deliverable
- ผู้เล่นซื้อตั๋ว → เวลาถึง → tournament เริ่ม → จบครบ 6 รอบ → แจก prize
- Realtime bracket update บน client ของผู้ดู

### Effort
**10 วัน**

---

## Phase 5: Profit-Aware Bot Orchestration (สัปดาห์ที่ 8-9)

**Goal:** บอทควบคุมจากกำไรแพลตฟอร์ม + per-user adaptive

### Tasks
- [ ] DB: `platform_ledger`, `bot_policy_log`, `bot_identities`
- [ ] `ProfitMonitorWorker` (Cron ทุก 5 นาที)
  - คำนวณ margin = (deposits - payouts) / deposits
  - Adjust default bot win rate
  - บันทึก policy ใน log
- [ ] `BotOrchestratorDO`
  - รับ request "ขอ bot สำหรับ user X"
  - อ่าน user economics (loss streak, new user, spender)
  - คำนวณ effective win rate (clamp 30-85%)
  - Return bot identity + win rate config
- [ ] `MatchDO` — รับ bot config, ใช้ค่านี้ตัดสินใจ zone
  - Honest play 70% (personality-based)
  - Rigged 30% (toward target)
  - Hard cap: ห้าม < 30% win rate ต่อเนื่อง > 5 matches
- [ ] Anti-spiral: บังคับ "comeback boost" หลัง loss streak 3

### Bot identity pool
- Generate 500+ realistic Thai/English names
- Mix avatars + MMR distribution

### Deliverable
- บอทตอบโจทย์ทั้ง 3 ระดับ:
  1. New user → ชนะ 75% (hook)
  2. Regular → 50-55%
  3. Big loser → boost กลับ (anti-tilt)
- Profit margin คงเส้นคงวา ~18% ตลอดวัน

### Effort
**10 วัน**

---

## Phase 6: Admin Dashboard (สัปดาห์ที่ 10-11)

**Goal:** Admin ทำ daily ops ได้ครบ

### Tasks
- [ ] `/admin` route + auth (role: admin only)
- [ ] **Overview page**
  - Today's stats (active users, matches, token burn, revenue)
  - Live rooms table (auto-refresh 3s)
  - Profit chart (deposits vs payouts, 7 days)
  - Alerts panel
- [ ] **User management**
  - Search by ID/username/email
  - View profile + match history + token tx
  - Adjust token (with reason)
  - Ban/suspend/warn
- [ ] **Tournament creator**
  - Form: title, schedule, entry fee, max tickets, prize distribution
  - List upcoming/past tournaments
  - Force start / cancel + refund
- [ ] **Bot policy**
  - Toggle auto / manual / off
  - Target margin slider + tolerance
  - Override win rates per user segment
  - Policy history table
- [ ] **Manual bot spawn**
  - Pick room → spawn bot with custom win rate
- [ ] **Audit log** — every admin action logged

### Deliverable
- Admin คนเดียวจัดการ platform ทั้งหมดได้จาก dashboard

### Effort
**10 วัน**

---

## Phase 7: Payment + Compliance (สัปดาห์ที่ 12)

**Goal:** เปิดให้เติมเงินจริงได้ปลอดภัย

### Tasks
- [ ] Payment integration
  - Stripe (international cards)
  - TrueMoney Wallet (Thailand)
  - PromptPay QR (Thai bank)
- [ ] Token package purchase flow
  - Server-side webhook verification
  - Idempotency keys (no double-charge)
  - Refund flow
- [ ] T&C + Privacy Policy pages
  - PDPA compliance (Thai law)
  - Age gate (18+)
  - Disclose AI opponents
- [ ] Responsible play
  - Daily spending limit (player-set)
  - Self-exclusion option
  - Cool-down period
- [ ] **Important: ตัดสินใจเรื่องถอนเงิน**
  - **Option A**: ไม่มีถอนเงินจริง → token เป็น virtual currency → ปลอดภัยกฎหมาย
  - **Option B**: มีถอน → ต้องมี KYC + ใบอนุญาตการพนัน → **ปรึกษาทนายก่อน**

### Deliverable
- เติม token ได้จริง ผ่าน payment gateway
- T&C + Privacy Policy publish

### Effort
**5 วัน** (excl. legal review)

---

## Phase 8: Load Test + Launch Prep (สัปดาห์ที่ 13)

**Goal:** พร้อม soft launch

### Tasks
- [ ] Load test
  - K6/Artillery: simulate 100 concurrent matches
  - Stress test matchmaking queue
  - DB query optimization
- [ ] Monitoring + alerting
  - Sentry (errors)
  - Cloudflare Analytics (latency)
  - Custom dashboard (Grafana / Metabase / Looker Studio)
  - Slack alerts (cost spike, crash rate)
- [ ] Bug bash + UX polish
- [ ] App Store / Play Store prep (ถ้าจะมี native app)
- [ ] Marketing assets + landing page
- [ ] Soft launch: 50 closed beta users

### Deliverable
- Production-ready, crash rate <0.1%, ready to invite users

### Effort
**5 วัน**

---

## Total Timeline & Resources

```
Week:  1  2  3  4  5  6  7  8  9  10 11 12 13
       │  │  │  │  │  │  │  │  │  │  │  │  │
Foundation
   Auth + Wallet
       Online 1v1 + Bot v1
                Bracket 4/8
                   Tournament 64
                            Profit Bot
                                  Admin Dashboard
                                           Payment
                                              Launch
```

### Cost breakdown (12-week dev)

| รายการ | ราคา |
|---|---|
| **2 devs × 12 weeks × ฿80k/เดือน** | ฿480,000 |
| **Designer (part-time)** | ฿60,000 |
| **Legal (T&C, gambling consult)** | ฿20,000 |
| **Server (Cloudflare + Supabase) — 3 เดือนแรก** | ฿1,500 |
| **Payment gateway setup** | ฿5,000 |
| **App Store + domain** | ฿5,000 |
| **Marketing assets** | ฿20,000 |
| **Buffer / contingency** | ฿50,000 |
| **รวม launch** | **~฿640,000** |
| **Ongoing (เดือนละ)** | ฿600-3,000 server + ตามจริง |

---

## Decision Points (ต้องเคลียร์ก่อนเริ่ม)

### 1. ⚖️ Legal: Token ถอนเงินได้ไหม?
- **ไม่ถอน** = virtual currency = ปลอดภัย (เริ่มแบบนี้ก่อน)
- **ถอนได้** = อาจเข้าข่ายพนัน = ต้องปรึกษาทนาย + KYC

### 2. 🎯 Scope ก่อน launch?
- **Full scope**: ทุก feature (12 สัปดาห์)
- **MVP**: 1v1 + Tournament 64 เท่านั้น (6-7 สัปดาห์)
- **Lean**: 1v1 อย่างเดียว (4 สัปดาห์)

### 3. 👥 Team size?
- 1 dev: 13 สัปดาห์
- 2 devs: 7-8 สัปดาห์
- 3+ devs: 5-6 สัปดาห์ (overhead เพิ่ม)

### 4. 📱 Platform?
- Web only (PWA) — เริ่มเร็ว, ไม่ต้องผ่าน app store
- Web + iOS — เพิ่ม 2-3 สัปดาห์ submission
- Web + iOS + Android — เพิ่ม 3-4 สัปดาห์

### 5. 💰 Budget?
- ฿300k = MVP web-only, 1 dev
- ฿500k = MVP+, 1-2 devs
- ฿700k+ = Full feature

---

## My Recommendation

### ขั้นแรก (เดือนที่ 1-2): **MVP Lean**
- ✅ Online 1v1 + Bot ตามนโยบาย
- ✅ Token wallet จริง + payment in (ไม่มีถอน)
- ✅ Admin dashboard minimal
- ❌ ข้าม bracket + tournament ก่อน

**Goal:** เปิด beta 50-100 users → วัด metric จริง

### ขั้นที่สอง (เดือนที่ 3): **Expand based on traction**
- ถ้า user retention > 30% week-2 → ทำ tournament
- ถ้าไม่ดี → ปรับ UX, balance, marketing ก่อน

### ขั้นที่สาม (เดือนที่ 4+): **Scale**
- Tournament 64
- Profit-aware bot
- Mobile app

**ห้ามทำ:**
- ❌ ทำทุก feature พร้อมกัน → burn out
- ❌ Launch 64-tournament ก่อน user มี traction → หาคนไม่ครบ
- ❌ เปิดถอนเงินก่อนเคลียร์กฎหมาย → ผิดกฎหมาย/โดน ban

---

## ขั้นตอนต่อไป (Action Items)

1. **ตัดสินใจ 5 Decision Points** ด้านบน
2. ถ้าจะทำต่อ → **บอกผมข้อ 2-4** (scope, team, platform)
3. ผมจะ:
   - แตก Phase 0-1 เป็น tasks ละเอียดใน TaskList
   - สร้าง branch `feat/online-mvp`
   - เริ่มจาก Cloudflare Worker scaffold + Supabase schema

---

## เอกสารอื่นๆ ที่เกี่ยวข้อง

- `PRODUCT-PLAN.md` — Product spec เต็ม (token economy, bot, admin)
- `ONLINE-ROADMAP.md` — Architecture เต็ม + state machines
- `Server-Pricing-Summary.pdf` — รายละเอียดค่า server

---

*Document version 1.0 — Updated to reflect demo state as of `cc72acd`*
