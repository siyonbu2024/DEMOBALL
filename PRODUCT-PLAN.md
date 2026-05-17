# Product Plan — Penalty Shootout Online + Token Economy

> Comprehensive plan for online multiplayer + token-based monetization + admin backend

---

## 1. ภาพรวมระบบ

```
┌───────────────────────────────────────────────────────────────────┐
│                          PLAYER APP                                │
│                                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐    │
│  │  Lobby       │  │  Game        │  │  Wallet              │    │
│  │  - 1v1       │  │  Modes:      │  │  - Token balance     │    │
│  │  - Bracket4  │  │  ⚽ 1v1      │  │  - Buy tokens        │    │
│  │  - Bracket8  │  │  ⚽ Bracket  │  │  - Buy tickets       │    │
│  │  - Tour64    │  │  ⚽ Tour64   │  │  - History           │    │
│  └──────────────┘  └──────────────┘  └──────────────────────┘    │
└───────────────────────────────────────────────────────────────────┘
                              │ WSS
                              ▼
┌───────────────────────────────────────────────────────────────────┐
│                    GAME SERVER (Cloudflare)                        │
│                                                                    │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐    │
│  │ Matchmaking    │  │ Match Engine   │  │ Bot Controller   │    │
│  │ Queue          │  │ (1v1/Bracket)  │  │ - Win rate ctrl  │    │
│  │                │  │                │  │ - Auto-spawn     │    │
│  └────────────────┘  └────────────────┘  └──────────────────┘    │
│                                                                    │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐    │
│  │ Tournament     │  │ Token Ledger   │  │ Anti-Cheat       │    │
│  │ Scheduler      │  │ (transactions) │  │ Monitor          │    │
│  └────────────────┘  └────────────────┘  └──────────────────┘    │
└───────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────────┐
│                    DATABASE (Supabase Postgres)                    │
│  users · matches · tournaments · token_transactions · bots · etc.  │
└───────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────────┐
│                    ADMIN DASHBOARD                                 │
│  - User mgmt   - Token mgmt   - Live rooms   - Tournament mgmt    │
│  - Bot spawner - Analytics    - Audit logs   - Config panel       │
└───────────────────────────────────────────────────────────────────┘
```

---

## 2. Game Modes (รายละเอียด)

### 2.1 ห้อง 1v1 Online

| ประเด็น | รายละเอียด |
|---|---|
| **ผู้เล่น** | 2 คน (1 vs 1) |
| **กติกา** | Best of 5 + sudden death |
| **Entry fee** | Player เลือก token tier (เช่น 10/50/100/500) |
| **Rake** | System หัก 20% จาก pot รวม |
| **รางวัล** | ผู้ชนะได้ 80% ของ pot |
| **Matchmaking** | จับคู่ผู้เล่นที่ใส่ token tier เดียวกัน + MMR ใกล้กัน |
| **Bot fallback** | หาผู้เล่นไม่ครบใน 30s → ใส่ bot ตาม win rate config |

**ตัวอย่าง:**
- 2 ผู้เล่นใส่ tier 100 tokens
- Pot = 200 tokens, rake = 40 tokens
- ผู้ชนะรับ 160 tokens (net gain 60)

### 2.2 Bracket 4 ผู้เล่น

| ประเด็น | รายละเอียด |
|---|---|
| **ผู้เล่น** | 4 คน |
| **โครงสร้าง** | 2 รอบ: Semifinal → Final (3 matches) |
| **Entry fee** | Token tier (เช่น 50/200/500) |
| **Rake** | 20% จาก pot รวม |
| **รางวัล** | อันดับ 1: 70% / อันดับ 2: 30% ของ pot ที่เหลือหลังหัก rake |
| **Bot fallback** | เติม bot ถ้าหาผู้เล่นไม่ครบใน 60s |

**ตัวอย่าง:**
- 4 ผู้เล่นใส่ 100 tokens = pot 400
- Rake 20% = 80 tokens, เหลือ 320
- อันดับ 1: 224 tokens (net +124)
- อันดับ 2: 96 tokens (net -4)
- อันดับ 3-4: 0 (net -100)

### 2.3 Bracket 8 ผู้เล่น

| ประเด็น | รายละเอียด |
|---|---|
| **ผู้เล่น** | 8 คน |
| **โครงสร้าง** | 3 รอบ: QF → SF → F (7 matches) |
| **Entry fee** | Token tier (เช่น 100/500/1000) |
| **Rake** | 20% |
| **รางวัล** | อันดับ 1: 60% / อันดับ 2: 25% / อันดับ 3-4: 7.5% each |
| **Bot fallback** | เติม bot ถ้าหาผู้เล่นไม่ครบใน 90s |

### 2.4 Tournament Knockout 64 ทีม

| ประเด็น | รายละเอียด |
|---|---|
| **ผู้เล่น** | 64 คน |
| **โครงสร้าง** | 6 รอบ: R64 → R32 → R16 → QF → SF → F (63 matches) |
| **เข้าร่วม** | **ซื้อตั๋ว** ล่วงหน้า (ไม่ใช่ token tier) |
| **ตั๋ว** | ระบุ tournament ID + เวลาแข่ง + entry fee |
| **กำหนดเวลา** | Admin สร้างล่วงหน้า (เช่น ทุกวันเสาร์ 19:00) |
| **เริ่มแข่ง** | อัตโนมัติเมื่อถึงเวลา + ครบ 64 ตั๋ว (หรือ admin เริ่มแบบ manual) |
| **Rake** | 25% (สูงกว่าเพราะรางวัลใหญ่) |
| **รางวัล** | แชมป์: 40% / รอง 1: 20% / รอง 2-4: 7.5% each / Quarter (5-8): 2.5% each |
| **No-show** | ผู้ที่ซื้อตั๋วแต่ไม่มา → ถูกแทนด้วย bot (ตั๋วไม่คืน) |
| **Bot fill** | ถ้าตั๋วไม่ครบ 64 → bot เติม (admin config) |

**ตัวอย่าง:**
- 64 ตั๋ว × 100 tokens = pot 6,400
- Rake 25% = 1,600 tokens, เหลือ 4,800
- แชมป์: 1,920 / รอง 1: 960 / รอง 3-4: 360 each / Quarter (4 คน): 120 each

---

## 3. ระบบ Token

### 3.1 Token Lifecycle

```
ผู้เล่นเติม token → wallet → ใช้เข้าห้อง / ซื้อตั๋ว → ชนะ → token + wallet
                       ↑                                       ↓
                   buy package                            ถอนเงิน (option)
                       ↑                                       ↓
                   ผ่าน payment gateway                 ผ่าน payout system
                   (Stripe / TrueMoney / PromptPay)     (ขั้น KYC ก่อน)
```

### 3.2 Token Packages (ตัวอย่าง)

| Package | Token | Bonus | ราคา |
|---|---|---|---|
| Starter | 100 | - | ฿35 |
| Bronze | 500 | +50 | ฿149 |
| Silver | 1,200 | +200 | ฿349 |
| Gold | 3,000 | +700 | ฿799 |
| Platinum | 8,000 | +2,500 | ฿1,999 |

### 3.3 Token Transaction Types

```ts
type TokenTransaction = {
  id: string;
  userId: string;
  type:
    | "purchase"          // ซื้อจาก package
    | "room_entry"        // ใส่เข้าห้อง 1v1/bracket
    | "ticket_purchase"   // ซื้อตั๋ว tournament
    | "match_win"         // ได้จากชนะ
    | "tournament_prize"  // ได้จาก tournament
    | "refund"            // คืนจาก room cancel
    | "admin_grant"       // admin แจก (compensation/promo)
    | "admin_deduct"      // admin หัก (penalty)
    | "withdrawal";       // ถอนเงิน
  amount: number;          // + เข้า, - ออก
  balanceBefore: number;
  balanceAfter: number;
  reference: string;       // match ID / tournament ID / payment ID
  timestamp: Date;
  metadata: Record<string, any>;
};
```

**สำคัญ:** ทุก transaction **immutable** เก็บใน ledger เพื่อตรวจสอบย้อนหลัง

### 3.4 Rake/Prize Distribution Engine

```ts
function distributePrize(roomType, entryFees: number[]): PrizeDistribution {
  const pot = entryFees.reduce((s, x) => s + x, 0);
  const rakeRate = ROOM_RAKE_RATES[roomType]; // 1v1: 0.2, bracket: 0.2, tour64: 0.25
  const rake = Math.floor(pot * rakeRate);
  const prizePool = pot - rake;
  
  switch (roomType) {
    case "1v1":
      return { winner: prizePool };
    case "bracket-4":
      return {
        rank1: Math.floor(prizePool * 0.7),
        rank2: prizePool - Math.floor(prizePool * 0.7),
      };
    case "bracket-8":
      return {
        rank1: Math.floor(prizePool * 0.6),
        rank2: Math.floor(prizePool * 0.25),
        rank3: Math.floor(prizePool * 0.075),
        rank4: Math.floor(prizePool * 0.075),
      };
    case "tournament-64":
      // ตามตารางข้างบน
  }
}
```

---

## 4. ระบบ Bot

### 4.1 Bot Types

| Bot Type | Win Rate Target | Use Case |
|---|---|---|
| **Welcome Bot** | ผู้เล่น 75-80% | 5 matches แรกของ user ใหม่ |
| **Standard Bot** | 50-55% | regular 1v1 fallback |
| **Challenge Bot** | 30-40% | veteran players |
| **Tournament Filler** | 50% | เติม bracket/tour ที่ไม่ครบ |
| **Boss Bot** | 25-30% | semifinal/final ของ tour64 (drama) |

### 4.2 Bot Decision Logic (Server-Side)

```ts
interface BotConfig {
  type: BotType;
  personality: "aggressive" | "defensive" | "random" | "mirror";
  targetWinRate: number;        // 0.0 - 1.0
  naturalnessRatio: number;     // 0-1: ratio ของ "honest play" vs rigged
  decisionDelayMs: { min: 600, max: 2200 }; // เลียนแบบเวลา human
  
  // Dynamic adjustments
  enableAdaptive: boolean;      // ปรับ rate ตาม player state
  enableDrama: boolean;         // ปรับ rate ในรอบสำคัญ
}

function botDecideZone(
  ctx: {
    playerZone: Zone | null;
    role: "kicker" | "keeper";
    matchState: MatchState;
    playerProfile: PlayerProfile;
  },
  config: BotConfig
): { zone: Zone; delayMs: number } {
  // 1. Compute effective win rate
  let winRate = config.targetWinRate;
  if (config.enableAdaptive) {
    winRate = adjustForPlayerState(winRate, ctx.playerProfile);
  }
  if (config.enableDrama) {
    winRate = adjustForRoundTension(winRate, ctx.matchState);
  }
  
  // 2. Decide: honest or rigged?
  const useHonest = Math.random() < config.naturalnessRatio;
  
  let zone: Zone;
  if (useHonest) {
    zone = personalityBasedChoice(ctx, config.personality);
  } else {
    zone = riggedChoice(ctx, winRate);
  }
  
  // 3. Random delay (เลียนแบบ human)
  const delayMs = randomBetween(config.decisionDelayMs.min, config.decisionDelayMs.max);
  
  return { zone, delayMs };
}
```

### 4.3 Adaptive Win Rate

```ts
function adjustForPlayerState(base: number, profile: PlayerProfile): number {
  let rate = base;
  
  // New user — let them win
  if (profile.totalMatches < 5) rate = 0.75;
  else if (profile.totalMatches < 20) rate = 0.6;
  
  // Losing streak — anti-frustration
  if (profile.recentLossStreak >= 3) rate += 0.15;
  if (profile.recentLossStreak >= 5) rate += 0.25;
  
  // Returning user
  if (profile.daysSinceLastPlay > 7) rate += 0.15;
  
  // Big spender — better experience
  if (profile.totalSpentTHB > 1000) rate = Math.max(rate, 0.55);
  
  return clamp(rate, 0.15, 0.9);
}
```

### 4.4 Bot Spawning (Admin)

Admin สามารถ:
- **Manual spawn**: ใส่ bot เข้าห้องที่เปิดอยู่
- **Auto fill**: ระบบเติม bot อัตโนมัติเมื่อ matchmaking timeout
- **Bulk spawn**: สร้าง bot 50 ตัวเข้า tournament

```ts
// Admin API
POST /admin/bots/spawn
{
  "roomId": "room-abc-123",
  "count": 1,
  "botType": "standard",
  "winRate": 0.5,
  "personality": "defensive"
}

POST /admin/bots/fill-tournament
{
  "tournamentId": "tour-xyz-456",
  "fillRemaining": true  // เติมจนครบ 64
}
```

### 4.5 Bot Identity Masking

ป้องกันไม่ให้ผู้เล่นรู้ว่าเป็น bot:
- **Username pool**: 500+ ชื่อ realistic (mix Thai/English)
- **Avatar variety**: 50+ avatars
- **MMR distribution**: spread 800-2000
- **Match history**: bot มี fake history ดูได้
- **Online status**: spawn ตาม active hours

**Transparency option** (แนะนำ): ใส่ subtle indicator เช่น icon เล็กๆ ในโปรไฟล์ขั้นรายละเอียด (ผ่าน T&C compliance)

---

## 5. Admin Dashboard

### 5.1 หน้าหลัก (Overview)

```
┌─────────────────────────────────────────────────────────────────┐
│  ADMIN — Penalty Shootout                          Admin: dew   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📊 STATS HARI INI                                               │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐ │
│  │ Active Users │ Matches Now  │ Token Burned │ Revenue ฿   │ │
│  │    1,234     │     42       │   15,200    │   12,400    │ │
│  └──────────────┴──────────────┴──────────────┴──────────────┘ │
│                                                                  │
│  🏟️ LIVE ROOMS                                  [View All →]   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Room ID      Type      Players  Pot    Started  Status    │ │
│  │ r-abc123     1v1       2/2      200    2m ago   playing   │ │
│  │ r-def456     bracket-4 3/4      300    1m ago   waiting   │ │
│  │ tour-xyz789  tour-64   58/64    5,800  -        scheduled │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  📈 TOKEN ECONOMY (24h)                                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Purchased: 145,000  Burned: 28,400  Net: +116,600 tokens  │ │
│  │ Avg per user: 94 tokens                                    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  🚨 ALERTS                                                       │
│  • Tournament "Saturday Mega" — 58/64 (เริ่มใน 12 นาที)         │
│  • User "Player99" — 10 wins in a row (suspicious)              │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 หน้าจัดการ User

**Features:**
- ค้นหา user (by ID, username, email, phone)
- ดู profile + match history + token transactions
- **แก้ token balance** (manual adjust พร้อม reason)
- Ban / suspend / warn
- ดู IP / device history (anti-fraud)
- Manual MMR adjust

```
┌─────────────────────────────────────────────────────┐
│  USER: dew_player                           🟢 Online │
├─────────────────────────────────────────────────────┤
│  ID: usr-abc123    Phone: +66-xx-xxx-1234           │
│  MMR: 1,450        Total Matches: 142                │
│  Tokens: 2,340     Spent: ฿1,250 (4 packages)       │
│                                                      │
│  [Adjust Tokens] [Ban User] [View Logs]              │
│                                                      │
│  📋 RECENT MATCHES (last 10)                         │
│  Date     Type       Opp      Result   Token Δ      │
│  Today    1v1        bot      WIN      +160         │
│  Today    1v1        Bob      LOSS     -100         │
│  ...                                                 │
│                                                      │
│  💰 TOKEN TRANSACTIONS (last 20)                     │
│  Date     Type       Amount   Ref       Balance     │
│  Today    win        +160     match-123 2,340       │
│  Today    entry      -100     match-123 2,180       │
│  Today    purchase   +1,200   pkg-silver 2,280      │
│  ...                                                 │
└─────────────────────────────────────────────────────┘
```

### 5.3 หน้า Live Rooms

```
┌─────────────────────────────────────────────────────────┐
│  LIVE ROOMS                          🔄 Auto-refresh: 3s │
├─────────────────────────────────────────────────────────┤
│  Filter: [All] [1v1] [Bracket-4] [Bracket-8] [Tour-64]   │
│                                                          │
│  🟢 r-abc123  1v1                            [Watch] [⚙] │
│     Players: dew_player(1450) vs Player2(1430)          │
│     Pot: 200 tokens · Started 2m ago · Round 3/5         │
│                                                          │
│  🟡 r-def456  Bracket-4                     [Watch] [⚙] │
│     Players: 3/4 (waiting for 1 more)                    │
│     Pot: 300 tokens · Wait 60s before bot fill          │
│     [Spawn Bot Now] ←                                   │
│                                                          │
│  🟢 r-ghi789  Tournament-64                 [Watch] [⚙] │
│     Round: QF (4 matches in progress)                    │
│     Remaining: 8 players · Pot: 6,400                    │
│                                                          │
│  🔵 tour-sat-week52  Tournament-64 (scheduled)          │
│     Start: Sat 19:00 (in 4h 32m)                         │
│     Tickets sold: 58/64 (90%)                            │
│     [View] [Force Start] [Cancel]                        │
└─────────────────────────────────────────────────────────┘
```

**Per-room actions:**
- Watch (spectate live)
- Spawn bot manually
- Force end (refund all, with reason logged)
- Adjust win rate of specific bot

### 5.4 หน้าสร้าง Tournament

```
┌──────────────────────────────────────────────────────────┐
│  CREATE TOURNAMENT (64-player)                            │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  Title:        [Saturday Mega Cup ____________]            │
│  Description:  [Big weekly tournament ________]            │
│                                                            │
│  Schedule:                                                 │
│  Start Date:   [📅 2026-05-23]  Time: [19:00]            │
│  Ticket Sale:  [📅 2026-05-16 09:00] to [2026-05-23 18:30]│
│                                                            │
│  Economics:                                                │
│  Entry Fee:    [100] tokens per ticket                    │
│  Rake:         [25]%                                       │
│  Max Tickets:  [64]                                        │
│  Min Tickets:  [16] (else cancel + refund)                │
│                                                            │
│  Prize Distribution (auto-computed):                       │
│    Pot:        6,400 tokens                                │
│    After rake: 4,800 tokens                                │
│    Champion:   1,920 (40%)                                 │
│    Runner-up:  960  (20%)                                  │
│    Semi-final: 360 × 2 (7.5% each)                         │
│    Quarter:    120 × 4 (2.5% each)                         │
│  [Customize Distribution →]                                │
│                                                            │
│  Bot Configuration:                                        │
│  ☑ Auto-fill with bots if not full at start              │
│  Bot win rate: [50]% (vs players)                          │
│  Bot personality: [Mixed ▼]                                │
│                                                            │
│  Rules:                                                    │
│  ☑ Allow late join (until 5 min before start)            │
│  ☑ Refund if cancelled                                    │
│  ☐ Premium event (extra prize from house)                 │
│                                                            │
│  [Cancel]                              [Create Tournament] │
└──────────────────────────────────────────────────────────┘
```

### 5.5 หน้า Bot Management

```
┌──────────────────────────────────────────────────────────┐
│  BOT CONFIGURATION                                        │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  🌍 GLOBAL SETTINGS                                        │
│  ☑ Enable bot system                                      │
│  ☑ Auto-fill in matchmaking (after 30s timeout)          │
│  Default win rate: [55]% (vs typical player)              │
│                                                            │
│  👤 PER-USER ADJUSTMENT                                    │
│  ☑ New user bonus (first 5 matches): win rate [75]%      │
│  ☑ Loss streak protection: +[15]% after 3 losses         │
│  ☑ Comeback bonus (>7 days): +[15]%                       │
│  ☑ Big spender bonus (>฿1000): minimum [55]%             │
│                                                            │
│  🎭 DRAMA SETTINGS                                         │
│  ☑ Force close games in tournaments                       │
│  ☑ Boss bot in semi-final/final                          │
│  Boss bot win rate: [30]%                                  │
│                                                            │
│  🤖 BOT IDENTITY POOL                                      │
│  Total bots: 487 unique identities                         │
│  [Manage Identity Pool →] [Generate More →]               │
│                                                            │
│  📊 RECENT BOT ACTIVITY                                    │
│  Last 24h: 234 bot matches, 51% bot wins                  │
│  Player satisfaction proxy (continue play): 78%           │
│                                                            │
│  [Save] [Reset to Default]                                │
└──────────────────────────────────────────────────────────┘
```

### 5.6 Quick Actions Panel

Admin floating panel ทุกหน้า:
- **Spawn Bot Now** (เลือก room → spawn)
- **Grant Tokens** (เลือก user → จำนวน → reason)
- **Force End Match** (เลือก match → confirm + reason)
- **Send Notification** (broadcast หรือ targeted)
- **View Audit Log** (track action ของ admin ทุกคน)

---

## 6. Database Schema (Core Tables)

```sql
-- Users
CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  username      TEXT UNIQUE NOT NULL,
  email         TEXT UNIQUE,
  phone         TEXT UNIQUE,
  avatar        TEXT,
  mmr           INTEGER DEFAULT 1200,
  token_balance INTEGER DEFAULT 0,
  total_spent_thb INTEGER DEFAULT 0,
  total_matches INTEGER DEFAULT 0,
  total_wins    INTEGER DEFAULT 0,
  status        TEXT DEFAULT 'active', -- active/banned/suspended
  created_at    TIMESTAMPTZ DEFAULT now(),
  last_played_at TIMESTAMPTZ,
  is_bot        BOOLEAN DEFAULT false,
  bot_config    JSONB
);

-- Token Ledger (immutable)
CREATE TABLE token_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT REFERENCES users(id),
  type            TEXT NOT NULL, -- purchase/room_entry/match_win/etc.
  amount          INTEGER NOT NULL, -- + or -
  balance_before  INTEGER NOT NULL,
  balance_after   INTEGER NOT NULL,
  reference_type  TEXT, -- match/tournament/package/admin
  reference_id    TEXT,
  metadata        JSONB,
  created_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_token_tx_user ON token_transactions(user_id, created_at DESC);

-- Matches
CREATE TABLE matches (
  id              TEXT PRIMARY KEY,
  type            TEXT NOT NULL, -- 1v1/bracket-4/bracket-8/tournament-64
  parent_id       TEXT, -- bracket/tournament ID
  player1_id      TEXT REFERENCES users(id),
  player2_id      TEXT REFERENCES users(id),
  winner_id       TEXT REFERENCES users(id),
  score_p1        INTEGER,
  score_p2        INTEGER,
  rounds_data     JSONB, -- detailed zone/outcome log
  entry_fee       INTEGER,
  prize_amount    INTEGER,
  started_at      TIMESTAMPTZ,
  ended_at        TIMESTAMPTZ,
  duration_ms     INTEGER,
  has_bot         BOOLEAN DEFAULT false
);

-- Rooms (live state)
CREATE TABLE rooms (
  id              TEXT PRIMARY KEY,
  type            TEXT NOT NULL,
  entry_fee       INTEGER,
  status          TEXT, -- waiting/playing/ended/cancelled
  players         JSONB, -- array of {userId, joinedAt}
  pot             INTEGER DEFAULT 0,
  rake            INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  started_at      TIMESTAMPTZ,
  ended_at        TIMESTAMPTZ,
  parent_tournament_id TEXT
);

-- Tournaments
CREATE TABLE tournaments (
  id              TEXT PRIMARY KEY,
  title           TEXT NOT NULL,
  description     TEXT,
  type            TEXT DEFAULT 'knockout-64',
  status          TEXT, -- scheduled/registration/playing/ended/cancelled
  scheduled_start TIMESTAMPTZ NOT NULL,
  ticket_sale_start TIMESTAMPTZ,
  ticket_sale_end TIMESTAMPTZ,
  entry_fee       INTEGER NOT NULL,
  rake_rate       NUMERIC(4,3) DEFAULT 0.25,
  max_tickets     INTEGER DEFAULT 64,
  min_tickets     INTEGER DEFAULT 16,
  tickets_sold    INTEGER DEFAULT 0,
  prize_distribution JSONB,
  bot_fill_enabled BOOLEAN DEFAULT true,
  bot_win_rate    NUMERIC(4,3) DEFAULT 0.5,
  created_by_admin TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Tournament Tickets
CREATE TABLE tournament_tickets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id   TEXT REFERENCES tournaments(id),
  user_id         TEXT REFERENCES users(id),
  purchased_at    TIMESTAMPTZ DEFAULT now(),
  status          TEXT DEFAULT 'active', -- active/used/refunded
  seat_position   INTEGER, -- 1-64 (assigned at start)
  final_rank      INTEGER, -- after tournament ends
  prize_won       INTEGER DEFAULT 0,
  UNIQUE(tournament_id, user_id)
);

-- Admin Audit Log
CREATE TABLE admin_actions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id        TEXT NOT NULL,
  action_type     TEXT NOT NULL, -- spawn_bot/grant_tokens/ban_user/etc.
  target_type     TEXT, -- user/room/match/tournament
  target_id       TEXT,
  payload         JSONB,
  reason          TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Bot Identities Pool
CREATE TABLE bot_identities (
  id              TEXT PRIMARY KEY,
  username        TEXT UNIQUE NOT NULL,
  avatar          TEXT,
  mmr             INTEGER,
  fake_total_matches INTEGER,
  fake_win_rate   NUMERIC(4,3),
  personality     TEXT,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

---

## 7. API & WebSocket Events

### 7.1 REST API (Player)

```
POST   /api/auth/login                  Login (magic-link/OAuth)
GET    /api/me                          User profile
GET    /api/me/tokens                   Token balance + recent tx
POST   /api/tokens/purchase             Buy token package
POST   /api/rooms/1v1/join              Join 1v1 queue with entry fee
POST   /api/rooms/bracket-4/join        Join bracket-4 queue
POST   /api/rooms/bracket-8/join        Join bracket-8 queue
GET    /api/tournaments                 List upcoming tournaments
GET    /api/tournaments/:id             Tournament details
POST   /api/tournaments/:id/buy-ticket  Buy ticket
GET    /api/matches/history             Match history
GET    /api/leaderboard                 Top players
```

### 7.2 WebSocket Events

```ts
// Client → Server
{ type: "JOIN_QUEUE", roomType, entryFee }
{ type: "LEAVE_QUEUE" }
{ type: "JOIN_MATCH", matchId }
{ type: "LOCK_ZONE", matchId, zone }
{ type: "READY_NEXT_ROUND", matchId }
{ type: "FORFEIT", matchId }
{ type: "JOIN_TOURNAMENT", tournamentId } // when scheduled time arrives

// Server → Client
{ type: "QUEUE_STATUS", position, estimatedWaitSec }
{ type: "MATCH_FOUND", matchId, opponent }
{ type: "MATCH_START", matchId, players, role }
{ type: "ROUND_START", round, role, timerSec }
{ type: "OPPONENT_LOCKED" } // ไม่บอกว่าเลือกอะไร
{ type: "REVEAL", kickerZone, keeperZone, outcome, score }
{ type: "MATCH_END", winner, prize, newBalance }
{ type: "TOURNAMENT_UPDATE", round, bracket }
{ type: "TOKEN_UPDATE", balance, delta, reason }
{ type: "ERROR", code, message }
```

### 7.3 Admin API

```
POST   /admin/auth/login
GET    /admin/dashboard/stats           Today's overview
GET    /admin/rooms/live                Active rooms (realtime)
GET    /admin/users/search?q=           Search users
PATCH  /admin/users/:id/tokens          Adjust balance
PATCH  /admin/users/:id/status          Ban/suspend
GET    /admin/users/:id/transactions    Token history
POST   /admin/bots/spawn                Spawn bot to room
POST   /admin/bots/fill-tournament      Fill tour with bots
PATCH  /admin/bots/config               Update bot config
POST   /admin/tournaments               Create tournament
PATCH  /admin/tournaments/:id           Edit tournament
POST   /admin/tournaments/:id/start     Force start
POST   /admin/tournaments/:id/cancel    Cancel + refund
GET    /admin/audit-log                 View admin actions
```

---

## 8. Phase Roadmap

```
Week 1-2     Week 3-4     Week 5-6     Week 7-8     Week 9-10    Week 11-12
├────────────┼────────────┼────────────┼────────────┼────────────┼────────────┤
│ Phase 1    │ Phase 2    │ Phase 3    │ Phase 4    │ Phase 5    │ Phase 6    │
│ Foundation │ Online 1v1 │ Bracket    │ Tournament │ Admin      │ Launch     │
│ + Tokens   │ + Matching │ 4/8 + Bot  │ 64 + Bot   │ Dashboard  │ Prep       │
└────────────┴────────────┴────────────┴────────────┴────────────┴────────────┘
```

### Phase 1: Foundation + Token System (2 สัปดาห์)
- Backend infra (Cloudflare Workers + Supabase)
- Auth (magic-link/OAuth)
- Token system + transaction ledger
- Payment integration (Stripe/TrueMoney/PromptPay)
- User profile + wallet UI

**DoD:** User สมัคร → ซื้อ token package → balance อัพเดท

### Phase 2: Online 1v1 + Bot v1 (2 สัปดาห์)
- Matchmaking queue (MMR + token tier)
- Match Durable Object (server-authoritative)
- 1v1 game flow + reveal sync
- Bot v1 (fixed win rate + delay simulation)
- Entry fee deduction + winner payout + rake

**DoD:** 2 ผู้เล่นจริง (หรือ + bot) เล่น 1v1 ครบ flow + token ถูกหัก/แจกถูกต้อง

### Phase 3: Bracket 4/8 + Bot v2 (2 สัปดาห์)
- Bracket Durable Object
- Bracket UI (bracket view + progression)
- Round sync logic
- Bot v2 (adaptive win rate per player state)
- Multi-round prize distribution

**DoD:** Bracket 4 + 8 ครบ flow + prize แจกตามอันดับ

### Phase 4: Tournament 64 + Drama Bot (2 สัปดาห์)
- Tournament scheduler
- Ticket purchase + seat assignment
- Tournament Durable Object (manages 63 matches)
- Bot v3 (drama mode + boss bot in finals)
- Spectator mode

**DoD:** Tournament 64 จบ flow + แจก prize ครบ

### Phase 5: Admin Dashboard (2 สัปดาห์)
- Admin auth + role system
- Dashboard overview
- User management
- Live rooms monitoring
- Tournament creation UI
- Bot config panel
- Audit log

**DoD:** Admin ทำ daily ops ได้ครบ (สร้าง tour, spawn bot, จัดการ user)

### Phase 6: Launch Prep (2 สัปดาห์)
- Load testing (100+ concurrent matches)
- Anti-cheat hardening
- Analytics integration (PostHog)
- T&C + Privacy Policy (PDPA)
- App Store/Play Store submission
- Monitoring + alerting (Sentry)
- Soft launch กับ closed beta

**DoD:** Production-ready + crash rate <0.1% + ready to scale

---

## 9. Team & Cost

### 9.1 Team แนะนำ

| Role | จำนวน | งาน |
|---|---|---|
| **Backend Dev** | 1-2 | Cloudflare + Supabase + game logic |
| **Frontend Dev** | 1 | Next.js client (player + admin) |
| **Designer** | 0.5 (part-time) | UI/UX polish, asset, sound |
| **PM/QA** | 0.5 | Test, coordinate, customer support |
| **DevOps** | 0.25 | CI/CD, monitoring (ตอนใกล้ launch) |
| **รวม** | 2.5-3.5 คน | |

### 9.2 Timeline

- **1 dev คนเดียว**: ~5-6 เดือน
- **2 devs**: ~3 เดือน
- **Full team (3-4 คน)**: ~2 เดือน

### 9.3 Cost

| รายการ | One-time | Monthly |
|---|---|---|
| **Dev cost** (2 devs × 3 เดือน × ฿80k) | ฿480,000 | - |
| **Designer** (part-time 3 เดือน) | ฿60,000 | - |
| **Server (Cloudflare + Supabase)** | - | ฿500-2,000 |
| **Payment gateway** (Stripe 3% + TrueMoney) | - | ตาม volume |
| **Monitoring (Sentry)** | - | ฿0-700 |
| **Domain + email** | ฿1,200/ปี | ฿100 |
| **Legal (T&C, privacy)** | ฿20,000 | - |
| **App Store** | $99 + $25 | - |
| **รวม (MVP launch)** | **~฿570,000** | **฿600-2,800/เดือน** |

---

## 10. Risk & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **กฎหมายการพนัน** | สูง | Critical | ปรึกษาทนาย ก่อน launch — token ไม่ควรถอนเป็นเงินถ้าเป็น gambling |
| **App Store ban** | กลาง | High | ไม่ทำ deceptive bot, transparency ใน T&C |
| **Bot detect โดยผู้เล่น** | กลาง | Medium | Natural play 70%, realistic delays, identity pool |
| **Token economy ล้ม** (เงินเฟ้อ) | กลาง | High | Rake พอเหมาะ, monitor token velocity, sink mechanisms |
| **Cheating (replay attack)** | กลาง | High | Server-authoritative + WebSocket heartbeat |
| **Cost explode** | ต่ำ | Medium | Cloudflare limit + Supabase tier cap |
| **Payment fraud** | กลาง | Medium | Stripe Radar + manual review > ฿5,000 |
| **DDoS** | ต่ำ | Medium | Cloudflare WAF + rate limit |

---

## 11. Legal/Compliance Checklist

⚠️ **ต้องเคลียร์ก่อน launch:**

- [ ] **กฎหมายไทย** — token = "เกมทักษะ" (skill-based) หรือ "เกมเสี่ยงโชค" (gambling)?
  - ถ้า gambling → ต้องมีใบอนุญาต (ปกติทำไม่ได้สำหรับเอกชน)
  - **วิธีปลอดภัย**: ใช้ token เป็น virtual currency, **ไม่ให้ถอนเป็นเงินจริง**
- [ ] **PDPA** (พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล) compliance
- [ ] **T&C** — เปิดเผยว่ามี AI opponent
- [ ] **Privacy Policy** — data collection + retention
- [ ] **Age gate** — 18+ ถ้ามี real money (PDPA + Apple/Google)
- [ ] **Responsible play** — limit spending, self-exclusion option
- [ ] **App Store guideline** — 4.7 (เกมที่มี real money)

---

## 12. Open Questions (ต้องเคลียร์ก่อนเริ่ม)

1. **Token ถอนเงินสดได้ไหม?**
   - ✅ ถอนได้ → ต้องเคลียร์กฎหมาย gambling
   - ❌ ถอนไม่ได้ → ปลอดภัยกว่า, แต่ revenue model ต้องชัด
2. **Target user?** (มือใหม่/มืออาชีพ/casual)
3. **Geo target?** (ไทยเท่านั้น/SEA/global)
4. **Platform?** (Web/iOS/Android — เรียงลำดับความสำคัญ)
5. **First tournament prize**? — ใช้ของขวัญหรือ token
6. **Customer support model?** — chat in-app / email / line
7. **Marketing budget?** — affiliate / influencer / paid ads
8. **KYC?** — ถ้ามีถอนเงินต้องมี KYC

---

## 13. Recommended Approach

### MVP ขั้นแรก (2 เดือน)
- 1v1 + Bracket 4 เท่านั้น (ไม่มี tour 64 ก่อน)
- Token เป็น virtual currency (ไม่ถอน)
- Bot system พื้นฐาน
- Admin dashboard minimal (สำหรับ admin คนเดียวใช้)

### Phase 2 (เดือน 3-4)
- เพิ่ม Bracket 8 + Tournament 64
- Admin dashboard เต็มรูปแบบ
- Adaptive bot + drama mode
- Analytics + retention metrics

### Phase 3 (เดือน 5+)
- ถ้าผ่านขั้น legal → เปิดถอนเงิน
- VIP system + season pass
- Social features (friend, clan, chat)

---

*Document version: 1.0 — Product Plan for Penalty Shootout Online Token Economy*
