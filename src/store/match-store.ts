import { create } from "zustand";
import {
  applyRound,
  createInitialMatchState,
  getNextKicker,
  isMatchOver,
} from "@shared/game-logic";
import {
  BOT_POOL,
  getBotById,
  type BotIdentity,
} from "@shared/bot-identities";
import {
  createBracketParticipants,
  createMatchOpponent,
  createMatchOpponentFor,
  simulateBotMatch,
  type MatchOpponent,
} from "@shared/match-pairing";
import { preloadAll, setMuted as soundSetMuted } from "@/lib/sound";
import type {
  BracketMatch,
  BracketSlot,
  BracketState,
  GamePhase,
  MatchContext,
  MatchHistoryEntry,
  MatchState,
  Screen,
  TokenTransaction,
  TokenTxType,
  Tournament,
  TournamentTicket,
  Zone,
} from "@shared/types";
import { RAKE_RATE_1V1 } from "@shared/types";
import { seedTournaments } from "@shared/tournaments-seed";

type RoomKey = "1v1" | "4v4" | "8v8" | "16v16" | "32v32";

interface MatchStoreState {
  /** Top-level routing: which screen of the app the user is on. */
  currentScreen: Screen;
  /** In-match phase — only meaningful while currentScreen === 'in-match'. */
  phase: GamePhase;
  /** User's persistent identity (shown in lobby + bracket as themselves). */
  userIdentity: BotIdentity;
  /** Opponent for the current match (null between matches). */
  currentOpponent: MatchOpponent | null;
  /** Bracket state if currently in a bracket flow, else null. */
  currentBracket: BracketState | null;
  /** Discriminated context driving match-end routing (replay vs return). */
  currentMatchContext: MatchContext | null;
  /** Current match's pure logic state. */
  matchState: MatchState;
  pendingKickerChoice: Zone | null;
  pendingKeeperChoice: Zone | null;
  /** Bots assigned to each room for this session. Bot ids only. */
  roomAssignments: Record<RoomKey, string[]>;
  /** Sound mute toggle. */
  isMuted: boolean;
  /** Haptic vibration toggle. */
  vibrationEnabled: boolean;
  /** Persistent token wallet (demo: starts at 1000). */
  tokenBalance: number;
  /** Immutable token transaction ledger (newest first). */
  tokenTransactions: TokenTransaction[];
  /** Past match results (newest first). */
  matchHistory: MatchHistoryEntry[];
  /** Selected bet tier for next 1v1, or null. */
  selectedBetTier: number | null;
  /** Upcoming/live tournaments shown in the lobby banner. */
  tournaments: Tournament[];
  /** Tickets the user has purchased. */
  userTickets: TournamentTicket[];
}

interface MatchStoreActions {
  /** Toggle sound mute. Also stops any in-flight sounds when set to true. */
  toggleMute: () => void;
  /** Toggle haptic vibration. */
  toggleVibration: () => void;
  /** Update display name (capped at 16 chars). */
  setUsername: (name: string) => void;
  /** Update avatar emoji. */
  setAvatar: (avatar: string) => void;
  /** Add token from a package purchase. Logs transaction. */
  depositToken: (amount: number, description: string) => void;
  /** Withdraw token (demo: just logs, no real payout). */
  withdrawToken: (amount: number, description: string) => void;
  /** Set or clear the selected bet tier for next 1v1. */
  setBetTier: (tier: number | null) => void;
  /** Buy ticket for tournament. Deducts entry fee + logs tx + increments ticketsSold. */
  purchaseTicket: (tournamentId: string) => { ok: boolean; reason?: string };
  /** Lazy-init the audio context. Safe to call from any user-gesture handler. */
  initAudio: () => void;
  enterScreen: (screen: Screen) => void;
  /** Idempotent: distributes the 30 bots across rooms once per session. */
  initializeRoomAssignments: () => void;
  /** Move 1–2 bots between rooms, preserving total count + uniqueness. */
  driftRoomAssignments: () => void;
  startQuickMatch1v1: () => void;
  startSpecificMatch1v1: (botId: string) => void;
  /** Mock no-op for explicit refund flows (e.g. cancel matchmaking). */
  refundCurrent1v1Entry: () => void;
  startBracket: (size: 4 | 8 | 16 | 32) => void;
  /** matchmaking → in-match. Called by MatchmakingScreen after its anticipation window. */
  finishMatchmaking: () => void;
  /** Bracket-view → in-match against user's current-round opponent. */
  enterUserBracketMatch: () => void;
  /** Resolve one bot-vs-bot match in the bracket using simulateBotMatch. */
  simulateBracketMatch: (key: { roundIndex: number; positionInRound: number }) => void;
  /** Move bracket to next round and recompute user's next opponent. No-op if current round not fully resolved. */
  advanceBracketRound: () => void;
  /** Leave bracket and return to the originating room (room-4v4 or room-8v8). */
  leaveBracket: () => void;
  enterRound: () => void;
  setKickerChoice: (zone: Zone) => void;
  setKeeperChoice: (zone: Zone) => void;
  /** Both choices required. Applies round, clears pending, → reveal. No-op if either missing. */
  commitRound: () => void;
  finishReveal: () => void;
  nextRound: () => void;
  /** From match-end (1v1 only). Starts a new match keeping the same context. */
  replayMatch: () => void;
  /** From match-end. Routes back to room (1v1) or bracket-view (bracket) per matchContext. */
  exitMatch: () => void;
}

export type MatchStore = MatchStoreState & MatchStoreActions;

const USER_IDENTITY: BotIdentity = {
  id: "user",
  username: "คุณ",
  avatar: "🙂",
  mmr: 1200,
  winRate: 0.5,
  totalMatches: 0,
};

export function getInitialMatchStoreState(): MatchStoreState {
  return {
    currentScreen: "home",
    phase: "round-intro",
    userIdentity: { ...USER_IDENTITY },
    currentOpponent: null,
    currentBracket: null,
    currentMatchContext: null,
    matchState: createInitialMatchState(),
    pendingKickerChoice: null,
    pendingKeeperChoice: null,
    roomAssignments: { "1v1": [], "4v4": [], "8v8": [], "16v16": [], "32v32": [] },
    isMuted: false,
    vibrationEnabled: true,
    tokenBalance: 1000,
    tokenTransactions: [
      {
        id: "seed-1",
        type: "promo",
        amount: 1000,
        balanceAfter: 1000,
        description: "เครดิตเริ่มต้น (demo)",
        timestamp: Date.now(),
      },
    ],
    matchHistory: [],
    selectedBetTier: 100,
    tournaments: seedTournaments(),
    userTickets: [],
  };
}

function makeTokenTx(
  type: TokenTxType,
  amount: number,
  balanceAfter: number,
  description: string,
): TokenTransaction {
  return {
    id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    amount,
    balanceAfter,
    description,
    timestamp: Date.now(),
  };
}

// ────────────────────────────────────────────────────────────────────────
// Bracket helpers (pure)
// ────────────────────────────────────────────────────────────────────────

function buildInitialBracketMatches(
  participants: BracketSlot[],
  size: 4 | 8 | 16 | 32
): BracketMatch[] {
  const matches: BracketMatch[] = [];
  // Round 0: pair adjacent participants
  for (let i = 0; i < size / 2; i++) {
    matches.push({
      roundIndex: 0,
      positionInRound: i,
      player1Id: participants[i * 2].identity.id,
      player2Id: participants[i * 2 + 1].identity.id,
      winnerId: null,
      score: null,
    });
  }
  // Subsequent rounds with TBD placeholder ids ("")
  let prevRoundCount = size / 2;
  let round = 1;
  while (prevRoundCount > 1) {
    const thisRoundCount = prevRoundCount / 2;
    for (let i = 0; i < thisRoundCount; i++) {
      matches.push({
        roundIndex: round,
        positionInRound: i,
        player1Id: "",
        player2Id: "",
        winnerId: null,
        score: null,
      });
    }
    prevRoundCount = thisRoundCount;
    round++;
  }
  return matches;
}

function propagateWinner(
  matches: BracketMatch[],
  fromRound: number,
  fromPos: number,
  winnerId: string
): BracketMatch[] {
  const nextRound = fromRound + 1;
  const nextPos = Math.floor(fromPos / 2);
  const idx = matches.findIndex(
    (m) => m.roundIndex === nextRound && m.positionInRound === nextPos
  );
  if (idx === -1) return matches; // final; no next match
  const isP1Slot = fromPos % 2 === 0;
  return matches.map((m, i) =>
    i === idx
      ? { ...m, [isP1Slot ? "player1Id" : "player2Id"]: winnerId }
      : m
  );
}

function findUserMatchInRound(
  matches: BracketMatch[],
  roundIndex: number,
  userId: string
): BracketMatch | undefined {
  return matches.find(
    (m) =>
      m.roundIndex === roundIndex &&
      (m.player1Id === userId || m.player2Id === userId)
  );
}

// ────────────────────────────────────────────────────────────────────────
// Misc helpers
// ────────────────────────────────────────────────────────────────────────

function generateBucketSizes(): Record<RoomKey, number> {
  // 1v1 / 4v4 / 8v8 share the real bot pool; 16v16 and 32v32 are cosmetic counts only
  const oneVone    = 10 + Math.floor(Math.random() * 5);  // 10–14
  const fourVfour  =  6 + Math.floor(Math.random() * 4);  //  6–9
  const eightVeight = BOT_POOL.length - oneVone - fourVfour; // remainder
  const sixteenV   = 10 + Math.floor(Math.random() * 6);  // 10–15 (cosmetic)
  const thirtyTwoV = 18 + Math.floor(Math.random() * 8);  // 18–25 (cosmetic)
  return { "1v1": oneVone, "4v4": fourVfour, "8v8": eightVeight, "16v16": sixteenV, "32v32": thirtyTwoV };
}

function shuffled<T>(arr: readonly T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function freshMatch(opp: MatchOpponent, ctx: MatchContext): Partial<MatchStoreState> {
  return {
    currentOpponent: opp,
    currentMatchContext: ctx,
    matchState: createInitialMatchState(),
    pendingKickerChoice: null,
    pendingKeeperChoice: null,
    currentScreen: "matchmaking",
    phase: "round-intro",
  };
}

// ────────────────────────────────────────────────────────────────────────
// Store
// ────────────────────────────────────────────────────────────────────────

export const useMatchStore = create<MatchStore>((set, get) => ({
  ...getInitialMatchStoreState(),

  toggleMute: () => {
    const next = !get().isMuted;
    soundSetMuted(next);
    set({ isMuted: next });
  },

  toggleVibration: () => set({ vibrationEnabled: !get().vibrationEnabled }),

  setUsername: (name) => {
    const trimmed = name.trim().slice(0, 16) || "คุณ";
    set({ userIdentity: { ...get().userIdentity, username: trimmed } });
  },

  setAvatar: (avatar) => {
    set({ userIdentity: { ...get().userIdentity, avatar } });
  },

  depositToken: (amount, description) => {
    if (amount <= 0) return;
    const newBalance = get().tokenBalance + amount;
    const tx = makeTokenTx("deposit", amount, newBalance, description);
    set({
      tokenBalance: newBalance,
      tokenTransactions: [tx, ...get().tokenTransactions].slice(0, 200),
    });
  },

  withdrawToken: (amount, description) => {
    if (amount <= 0) return;
    if (amount > get().tokenBalance) return;
    const newBalance = get().tokenBalance - amount;
    const tx = makeTokenTx("withdraw", -amount, newBalance, description);
    set({
      tokenBalance: newBalance,
      tokenTransactions: [tx, ...get().tokenTransactions].slice(0, 200),
    });
  },

  setBetTier: (tier) => set({ selectedBetTier: tier }),

  purchaseTicket: (tournamentId) => {
    const state = get();
    const t = state.tournaments.find((x) => x.id === tournamentId);
    if (!t) return { ok: false, reason: "not-found" };
    if (state.userTickets.some((x) => x.tournamentId === tournamentId)) {
      return { ok: false, reason: "already-purchased" };
    }
    if (t.ticketsSold >= t.maxTickets) {
      return { ok: false, reason: "sold-out" };
    }
    if (state.tokenBalance < t.entryFee) {
      return { ok: false, reason: "insufficient-tokens" };
    }
    const newBalance = state.tokenBalance - t.entryFee;
    const tx = makeTokenTx(
      "match_entry",
      -t.entryFee,
      newBalance,
      `ซื้อตั๋ว ${t.title}`,
    );
    set({
      tokenBalance: newBalance,
      tokenTransactions: [tx, ...state.tokenTransactions].slice(0, 200),
      tournaments: state.tournaments.map((x) =>
        x.id === tournamentId ? { ...x, ticketsSold: x.ticketsSold + 1 } : x,
      ),
      userTickets: [
        { tournamentId, purchasedAt: Date.now() },
        ...state.userTickets,
      ],
    });
    return { ok: true };
  },

  refundCurrent1v1Entry: () => {
    const ctx = get().currentMatchContext;
    if (!ctx || (ctx.type !== "quick-1v1" && ctx.type !== "specific-1v1")) return;
    if (ctx.entryFee <= 0) return;
    const newBalance = get().tokenBalance + ctx.entryFee;
    const tx = makeTokenTx("refund", ctx.entryFee, newBalance, "ยกเลิกการแข่ง — คืน token");
    set({
      tokenBalance: newBalance,
      tokenTransactions: [tx, ...get().tokenTransactions].slice(0, 200),
    });
  },

  initAudio: () => {
    preloadAll();
  },

  enterScreen: (screen) => {
    preloadAll();
    set({ currentScreen: screen });
  },

  initializeRoomAssignments: () => {
    const ra = get().roomAssignments;
    const total = ra["1v1"].length + ra["4v4"].length + ra["8v8"].length;
    if (total > 0) return;
    const sizes = generateBucketSizes();
    const ids = shuffled(BOT_POOL.map((b) => b.id));
    let cursor = 0;
    const oneVone = ids.slice(cursor, cursor + sizes["1v1"]);
    cursor += sizes["1v1"];
    const fourVfour = ids.slice(cursor, cursor + sizes["4v4"]);
    cursor += sizes["4v4"];
    const eightVeight = ids.slice(cursor, cursor + sizes["8v8"]);
    // 16v16 and 32v32: re-use shuffled bots for display (cosmetic only)
    const sixteenV = shuffled(ids).slice(0, sizes["16v16"]);
    const thirtyTwoV = shuffled(ids).slice(0, sizes["32v32"]);
    set({
      roomAssignments: { "1v1": oneVone, "4v4": fourVfour, "8v8": eightVeight, "16v16": sixteenV, "32v32": thirtyTwoV },
    });
  },

  driftRoomAssignments: () => {
    const ra = get().roomAssignments;
    const buckets: Record<RoomKey, string[]> = {
      "1v1": [...ra["1v1"]],
      "4v4": [...ra["4v4"]],
      "8v8": [...ra["8v8"]],
      "16v16": [...ra["16v16"]],
      "32v32": [...ra["32v32"]],
    };
    // Only drift the real bot-pool rooms; 16v16/32v32 are cosmetic counts only
    const rooms: RoomKey[] = ["1v1", "4v4", "8v8"];
    const moveCount = Math.random() < 0.5 ? 1 : 2;
    for (let i = 0; i < moveCount; i++) {
      const sources = rooms.filter((r) => buckets[r].length > 1);
      if (sources.length === 0) break;
      const source = sources[Math.floor(Math.random() * sources.length)];
      const dests = rooms.filter((r) => r !== source);
      const dest = dests[Math.floor(Math.random() * dests.length)];
      const idx = Math.floor(Math.random() * buckets[source].length);
      const [botId] = buckets[source].splice(idx, 1);
      buckets[dest].push(botId);
    }
    set({ roomAssignments: buckets });
  },

  startQuickMatch1v1: () => {
    const tier = get().selectedBetTier ?? 0;
    if (tier > 0 && get().tokenBalance < tier) return;
    const opp = createMatchOpponent();
    const pot = tier * 2;
    let nextBalance = get().tokenBalance;
    let nextTxs = get().tokenTransactions;
    if (tier > 0) {
      nextBalance -= tier;
      nextTxs = [
        makeTokenTx("match_entry", -tier, nextBalance, `เข้าห้อง 1v1 (เดิมพัน ${tier})`),
        ...nextTxs,
      ].slice(0, 200);
    }
    set({
      ...freshMatch(opp, { type: "quick-1v1", entryFee: tier, pot }),
      currentBracket: null,
      tokenBalance: nextBalance,
      tokenTransactions: nextTxs,
    });
  },

  startSpecificMatch1v1: (botId) => {
    const id = getBotById(botId);
    if (!id) return;
    const tier = get().selectedBetTier ?? 0;
    if (tier > 0 && get().tokenBalance < tier) return;
    const opp = createMatchOpponentFor(id);
    const pot = tier * 2;
    let nextBalance = get().tokenBalance;
    let nextTxs = get().tokenTransactions;
    if (tier > 0) {
      nextBalance -= tier;
      nextTxs = [
        makeTokenTx("match_entry", -tier, nextBalance, `เชิญแข่ง 1v1 (เดิมพัน ${tier})`),
        ...nextTxs,
      ].slice(0, 200);
    }
    set({
      ...freshMatch(opp, { type: "specific-1v1", opponentBotId: botId, entryFee: tier, pot }),
      currentBracket: null,
      tokenBalance: nextBalance,
      tokenTransactions: nextTxs,
    });
  },

  startBracket: (size: 4 | 8 | 16 | 32) => {
    const participants = createBracketParticipants(size, get().userIdentity);
    const matches = buildInitialBracketMatches(participants, size);
    const userId = get().userIdentity.id;
    const userMatch = findUserMatchInRound(matches, 0, userId);
    const userOpp = userMatch
      ? participants.find(
          (p) =>
            p.identity.id ===
            (userMatch.player1Id === userId
              ? userMatch.player2Id
              : userMatch.player1Id)
        ) ?? null
      : null;
    set({
      currentBracket: {
        size,
        participants,
        currentRoundIndex: 0,
        matches,
        userOpponentForCurrentMatch: userOpp,
      },
      currentMatchContext: { type: "bracket", size, bracketRoundIndex: 0 },
      currentScreen: "bracket-view",
      currentOpponent: null,
      matchState: createInitialMatchState(),
      pendingKickerChoice: null,
      pendingKeeperChoice: null,
      phase: "round-intro",
    });
  },

  enterUserBracketMatch: () => {
    const bracket = get().currentBracket;
    if (!bracket) return;
    const userId = get().userIdentity.id;
    const userMatch = findUserMatchInRound(
      bracket.matches,
      bracket.currentRoundIndex,
      userId
    );
    if (!userMatch || userMatch.winnerId !== null) return;
    const oppId =
      userMatch.player1Id === userId
        ? userMatch.player2Id
        : userMatch.player1Id;
    const oppSlot = bracket.participants.find((p) => p.identity.id === oppId);
    if (!oppSlot || !oppSlot.brain) return;
    const opp: MatchOpponent = {
      identity: oppSlot.identity,
      brain: oppSlot.brain,
    };
    set({
      currentOpponent: opp,
      currentBracket: { ...bracket, userOpponentForCurrentMatch: oppSlot },
      currentScreen: "in-match",
      phase: "round-intro",
      matchState: createInitialMatchState(),
      pendingKickerChoice: null,
      pendingKeeperChoice: null,
    });
  },

  simulateBracketMatch: ({ roundIndex, positionInRound }) => {
    const bracket = get().currentBracket;
    if (!bracket) return;
    const idx = bracket.matches.findIndex(
      (m) =>
        m.roundIndex === roundIndex && m.positionInRound === positionInRound
    );
    if (idx === -1) return;
    const m = bracket.matches[idx];
    if (m.winnerId !== null) return;
    if (m.player1Id === "" || m.player2Id === "") return; // TBD
    const p1 = bracket.participants.find((p) => p.identity.id === m.player1Id);
    const p2 = bracket.participants.find((p) => p.identity.id === m.player2Id);
    if (!p1 || !p2) return;
    const result = simulateBotMatch(p1, p2);
    let newMatches = bracket.matches.map((mm, i) =>
      i === idx
        ? { ...mm, winnerId: result.winnerId, score: result.score }
        : mm
    );
    newMatches = propagateWinner(
      newMatches,
      m.roundIndex,
      m.positionInRound,
      result.winnerId
    );
    const loserId =
      result.winnerId === p1.identity.id ? p2.identity.id : p1.identity.id;
    const newParticipants = bracket.participants.map((p) =>
      p.identity.id === loserId ? { ...p, eliminated: true } : p
    );
    set({
      currentBracket: {
        ...bracket,
        matches: newMatches,
        participants: newParticipants,
      },
    });
  },

  advanceBracketRound: () => {
    const bracket = get().currentBracket;
    if (!bracket) return;
    const allCurrentResolved = bracket.matches
      .filter((m) => m.roundIndex === bracket.currentRoundIndex)
      .every((m) => m.winnerId !== null);
    if (!allCurrentResolved) return;
    const newRoundIndex = bracket.currentRoundIndex + 1;
    // No round to advance to (already at final)?
    const hasNextRound = bracket.matches.some(
      (m) => m.roundIndex === newRoundIndex
    );
    if (!hasNextRound) return;
    const userId = get().userIdentity.id;
    const userMatch = findUserMatchInRound(
      bracket.matches,
      newRoundIndex,
      userId
    );
    const userOpp = userMatch
      ? bracket.participants.find(
          (p) =>
            p.identity.id ===
            (userMatch.player1Id === userId
              ? userMatch.player2Id
              : userMatch.player1Id)
        ) ?? null
      : null;
    set({
      currentBracket: {
        ...bracket,
        currentRoundIndex: newRoundIndex,
        userOpponentForCurrentMatch: userOpp,
      },
      currentMatchContext: {
        type: "bracket",
        size: bracket.size,
        bracketRoundIndex: newRoundIndex,
      },
    });
  },

  leaveBracket: () => {
    const size = get().currentBracket?.size;
    const target: Screen =
      size === 32 ? "room-32v32" :
      size === 16 ? "room-16v16" :
      size === 8  ? "room-8v8"  : "room-4v4";
    set({
      currentScreen: target,
      currentBracket: null,
      currentMatchContext: null,
      currentOpponent: null,
    });
  },

  finishMatchmaking: () => set({ currentScreen: "in-match" }),

  enterRound: () => {
    const kicker = getNextKicker(get().matchState);
    set({ phase: kicker === "p1" ? "kicker-aim" : "keeper-pick" });
  },

  setKickerChoice: (zone) => set({ pendingKickerChoice: zone }),
  setKeeperChoice: (zone) => set({ pendingKeeperChoice: zone }),

  commitRound: () => {
    const { matchState, pendingKickerChoice, pendingKeeperChoice } = get();
    if (pendingKickerChoice === null || pendingKeeperChoice === null) return;
    const next = applyRound(
      matchState,
      pendingKickerChoice,
      pendingKeeperChoice
    );
    set({
      matchState: next,
      pendingKickerChoice: null,
      pendingKeeperChoice: null,
      phase: "reveal",
    });
  },

  finishReveal: () => {
    const state = get();
    if (!isMatchOver(state.matchState)) {
      set({ phase: "round-result" });
      return;
    }
    // Match over — if bracket context, record the user's match in bracket before transitioning
    if (
      state.currentMatchContext?.type === "bracket" &&
      state.currentBracket
    ) {
      recordUserBracketMatchInternal(set, get);
    }
    // 1v1 contexts: payout + history entry
    if (
      state.currentMatchContext?.type === "quick-1v1" ||
      state.currentMatchContext?.type === "specific-1v1"
    ) {
      record1v1MatchEnd(set, get);
    }
    set({ phase: "match-end" });
  },

  nextRound: () => set({ phase: "round-intro" }),

  replayMatch: () => {
    const ctx = get().currentMatchContext;
    if (!ctx) return;
    if (ctx.type !== "quick-1v1" && ctx.type !== "specific-1v1") return;

    const tier = ctx.entryFee;
    if (tier > 0 && get().tokenBalance < tier) {
      // Not enough tokens — fall back to home so player can top up.
      set({ currentScreen: "wallet", currentOpponent: null, currentMatchContext: null });
      return;
    }
    let nextBalance = get().tokenBalance;
    let nextTxs = get().tokenTransactions;
    if (tier > 0) {
      nextBalance -= tier;
      nextTxs = [
        makeTokenTx("match_entry", -tier, nextBalance, `เล่นอีกครั้ง 1v1 (เดิมพัน ${tier})`),
        ...nextTxs,
      ].slice(0, 200);
    }

    if (ctx.type === "quick-1v1") {
      const opp = createMatchOpponent();
      set({
        ...freshMatch(opp, { type: "quick-1v1", entryFee: tier, pot: tier * 2 }),
        currentBracket: null,
        tokenBalance: nextBalance,
        tokenTransactions: nextTxs,
      });
      return;
    }
    // specific-1v1
    const id = getBotById(ctx.opponentBotId);
    if (!id) return;
    const opp = createMatchOpponentFor(id);
    set({
      ...freshMatch(opp, {
        type: "specific-1v1",
        opponentBotId: ctx.opponentBotId,
        entryFee: tier,
        pot: tier * 2,
      }),
      currentBracket: null,
      tokenBalance: nextBalance,
      tokenTransactions: nextTxs,
    });
  },

  exitMatch: () => {
    const ctx = get().currentMatchContext;
    if (!ctx) {
      set({ currentScreen: "home", currentOpponent: null });
      return;
    }
    if (ctx.type === "quick-1v1" || ctx.type === "specific-1v1") {
      set({
        currentScreen: "room-1v1",
        currentMatchContext: null,
        currentOpponent: null,
      });
      return;
    }
    if (ctx.type === "bracket") {
      set({ currentScreen: "bracket-view", currentOpponent: null });
      return;
    }
  },
}));

/** Records the user's just-finished bracket match. Mutates store inline. */
function recordUserBracketMatchInternal(
  set: (partial: Partial<MatchStore>) => void,
  get: () => MatchStore
) {
  const state = get();
  const bracket = state.currentBracket;
  if (!bracket) return;
  const userId = state.userIdentity.id;
  const idx = bracket.matches.findIndex(
    (m) =>
      m.roundIndex === bracket.currentRoundIndex &&
      (m.player1Id === userId || m.player2Id === userId)
  );
  if (idx === -1) return;
  const m = bracket.matches[idx];
  if (m.winnerId !== null) return; // already recorded
  // The user is ALWAYS game-side p1 (MATCH_CONFIG.STARTING_KICKER); the bracket's
  // player1/player2 slots are independent and may put user on either side.
  const userScore = state.matchState.score.p1;
  const oppScore = state.matchState.score.p2;
  const userWon = userScore > oppScore;
  const userIsBracketP1 = m.player1Id === userId;
  const winnerId = userWon
    ? userId
    : userIsBracketP1
    ? m.player2Id
    : m.player1Id;
  const updatedMatch: BracketMatch = {
    ...m,
    winnerId,
    score: userIsBracketP1
      ? { p1: userScore, p2: oppScore }
      : { p1: oppScore, p2: userScore },
  };
  let newMatches = bracket.matches.map((mm, i) => (i === idx ? updatedMatch : mm));
  newMatches = propagateWinner(
    newMatches,
    m.roundIndex,
    m.positionInRound,
    winnerId
  );
  const newParticipants = userWon
    ? bracket.participants
    : bracket.participants.map((p) =>
        p.isUser ? { ...p, eliminated: true } : p
      );
  set({
    currentBracket: {
      ...bracket,
      matches: newMatches,
      participants: newParticipants,
    },
  });
}

/** Pay out 1v1 winner + log token transaction + record history. */
function record1v1MatchEnd(
  set: (partial: Partial<MatchStore>) => void,
  get: () => MatchStore,
) {
  const state = get();
  const ctx = state.currentMatchContext;
  if (!ctx) return;
  if (ctx.type !== "quick-1v1" && ctx.type !== "specific-1v1") return;

  const opp = state.currentOpponent;
  if (!opp) return;

  const userScore = state.matchState.score.p1;
  const oppScore = state.matchState.score.p2;
  const userWon = userScore > oppScore;
  const entryFee = ctx.entryFee;
  const pot = ctx.pot;
  const rake = Math.floor(pot * RAKE_RATE_1V1);
  const prize = userWon ? pot - rake : 0;
  const netTokens = prize - entryFee;

  let newBalance = state.tokenBalance;
  let newTxs = state.tokenTransactions;
  if (userWon && prize > 0) {
    newBalance += prize;
    newTxs = [
      makeTokenTx(
        "match_win",
        prize,
        newBalance,
        `ชนะ 1v1 vs ${opp.identity.username} (รับ ${prize})`,
      ),
      ...newTxs,
    ].slice(0, 200);
  }

  const historyEntry: MatchHistoryEntry = {
    id: `match-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: "1v1",
    opponentName: opp.identity.username,
    opponentAvatar: opp.identity.avatar,
    result: userWon ? "win" : "loss",
    scoreYou: userScore,
    scoreOpp: oppScore,
    entryFee,
    prize,
    netTokens,
    timestamp: Date.now(),
  };

  set({
    tokenBalance: newBalance,
    tokenTransactions: newTxs,
    matchHistory: [historyEntry, ...state.matchHistory].slice(0, 100),
  });
}
