/**
 * Disguised bot profiles. The user sees these as "other players online".
 * The actual gameplay brain (AIPersonality) is bound separately in match-pairing.
 *
 * Naming guardrails:
 * - No real public figures (athletes, politicians, celebrities) or close allusions
 * - No gambling-adjacent terms
 * - No profanity, even playful
 * - No region-mocking
 * - Low MMR doesn't require derogatory names
 * - Mix of Thai script + Thai romanized + gamer + casual generic
 */

export interface BotIdentity {
  id: string;
  username: string;
  /** Emoji avatar */
  avatar: string;
  /** Matchmaking rating, 800-1800 */
  mmr: number;
  /** Display-only win rate, 0.35-0.75 */
  winRate: number;
  /** Display-only total matches played */
  totalMatches: number;
  /** Optional country flag emoji */
  flag?: string;
}

export const BOT_POOL: readonly BotIdentity[] = [
  // Thai-romanized regional (8)
  { id: "snipe-siam", username: "SnipeSiam", avatar: "🎯", mmr: 1250, winRate: 0.52, totalMatches: 340, flag: "🇹🇭" },
  { id: "bangkok-boss", username: "BangkokBoss", avatar: "👑", mmr: 1620, winRate: 0.68, totalMatches: 1200, flag: "🇹🇭" },
  { id: "chiangmai-king", username: "ChiangMaiKing", avatar: "🦁", mmr: 1580, winRate: 0.66, totalMatches: 980, flag: "🇹🇭" },
  { id: "phuket-rider", username: "PhuketRider", avatar: "🌊", mmr: 1200, winRate: 0.50, totalMatches: 280, flag: "🇹🇭" },
  { id: "khonkaen-kid", username: "KhonKaenKid", avatar: "⭐", mmr: 1050, winRate: 0.46, totalMatches: 180, flag: "🇹🇭" },
  { id: "huahin-hero", username: "HuaHinHero", avatar: "🦸", mmr: 1350, winRate: 0.56, totalMatches: 520, flag: "🇹🇭" },
  { id: "pattaya-pro", username: "PattayaPro", avatar: "🥇", mmr: 1480, winRate: 0.62, totalMatches: 720, flag: "🇹🇭" },
  { id: "nongkhai-ninja", username: "NongkhaiNinja", avatar: "🥷", mmr: 1180, winRate: 0.49, totalMatches: 240, flag: "🇹🇭" },

  // Gamer style (8)
  { id: "predator-x", username: "xX_Predator_Xx", avatar: "🐺", mmr: 1300, winRate: 0.55, totalMatches: 410 },
  { id: "pro-goalie", username: "ProGoalie_88", avatar: "🧤", mmr: 1700, winRate: 0.72, totalMatches: 1450 },
  { id: "noscope-th", username: "NoScope_TH", avatar: "💥", mmr: 1230, winRate: 0.51, totalMatches: 310, flag: "🇹🇭" },
  { id: "legend-killer", username: "LegendKiller", avatar: "⚔️", mmr: 1750, winRate: 0.74, totalMatches: 1820 },
  { id: "quickdraw99", username: "Quickdraw99", avatar: "⚡", mmr: 1290, winRate: 0.53, totalMatches: 380 },
  { id: "veteran-og", username: "Veteran_OG", avatar: "🏅", mmr: 1640, winRate: 0.69, totalMatches: 1380 },
  { id: "silent-striker", username: "SilentStriker", avatar: "👤", mmr: 1320, winRate: 0.56, totalMatches: 460 },
  { id: "pixel-punch", username: "PixelPunch", avatar: "👾", mmr: 1080, winRate: 0.47, totalMatches: 200 },

  // Thai script (8)
  { id: "muemai", username: "มือใหม่จัดให้", avatar: "🌱", mmr: 880, winRate: 0.38, totalMatches: 80, flag: "🇹🇭" },
  { id: "maew-99", username: "แมวเหมียว99", avatar: "🐱", mmr: 1020, winRate: 0.44, totalMatches: 150, flag: "🇹🇭" },
  { id: "mee-noi", username: "หมีน้อย", avatar: "🐻", mmr: 920, winRate: 0.41, totalMatches: 110, flag: "🇹🇭" },
  { id: "khon-rak-ball", username: "คนรักบอล", avatar: "⚽", mmr: 1220, winRate: 0.50, totalMatches: 290, flag: "🇹🇭" },
  { id: "dek-sien", username: "เด็กเซียน", avatar: "🧠", mmr: 1380, winRate: 0.58, totalMatches: 580, flag: "🇹🇭" },
  { id: "lung-pra-cham", username: "ลุงประจำสนาม", avatar: "🎓", mmr: 1550, winRate: 0.64, totalMatches: 890, flag: "🇹🇭" },
  { id: "nak-tae-ngao", username: "นักเตะเงา", avatar: "👻", mmr: 1670, winRate: 0.70, totalMatches: 1300, flag: "🇹🇭" },
  { id: "dao-tae", username: "ดาวเตะ", avatar: "🌟", mmr: 1310, winRate: 0.55, totalMatches: 430, flag: "🇹🇭" },

  // Casual generic (6)
  { id: "noob-master-42", username: "NoobMaster42", avatar: "🆕", mmr: 1100, winRate: 0.47, totalMatches: 220 },
  { id: "just-for-fun", username: "JustForFun", avatar: "🎮", mmr: 990, winRate: 0.43, totalMatches: 130 },
  { id: "random-dude", username: "RandomDude", avatar: "🎲", mmr: 1180, winRate: 0.49, totalMatches: 260 },
  { id: "i-love-cats", username: "iLoveCats", avatar: "🐈", mmr: 870, winRate: 0.39, totalMatches: 90 },
  { id: "coffee-addict", username: "CoffeeAddict", avatar: "☕", mmr: 1240, winRate: 0.51, totalMatches: 320 },
  { id: "weekend-warrior", username: "WeekendWarrior", avatar: "🏖️", mmr: 1430, winRate: 0.60, totalMatches: 650 },

  // Extra (2) — needed for 32-player bracket
  { id: "iron-gloves", username: "IronGloves", avatar: "🥊", mmr: 1360, winRate: 0.57, totalMatches: 500 },
  { id: "flash-shot", username: "FlashShot", avatar: "🔥", mmr: 1190, winRate: 0.50, totalMatches: 270 },
];

export function getRandomBots(
  count: number,
  mmrRange?: [number, number]
): BotIdentity[] {
  let pool = BOT_POOL.slice();
  if (mmrRange) {
    const [min, max] = mmrRange;
    pool = pool.filter((b) => b.mmr >= min && b.mmr <= max);
  }
  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}

export function getBotById(id: string): BotIdentity | undefined {
  return BOT_POOL.find((b) => b.id === id);
}
