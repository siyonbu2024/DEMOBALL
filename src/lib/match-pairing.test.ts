import { describe, expect, it } from "vitest";
import { ALL_PERSONALITIES, OLD_TIGER } from "./ai-personalities";
import { BOT_POOL, getBotById } from "./bot-identities";
import {
  createBracketParticipants,
  createMatchOpponent,
  createMatchOpponentFor,
  jitteredThinkingMs,
  simulateBotMatch,
} from "./match-pairing";
import { TIMING } from "./timing";
import type { BracketSlot } from "./types";

describe("createMatchOpponent", () => {
  it("returns identity from BOT_POOL and a brain from ALL_PERSONALITIES", () => {
    const o = createMatchOpponent();
    expect(BOT_POOL.some((b) => b.id === o.identity.id)).toBe(true);
    expect(ALL_PERSONALITIES.some((p) => p.id === o.brain.id)).toBe(true);
  });
});

describe("createMatchOpponentFor", () => {
  it("uses the supplied identity verbatim", () => {
    const id = BOT_POOL[0];
    const o = createMatchOpponentFor(id);
    expect(o.identity).toBe(id);
  });
});

describe("createBracketParticipants", () => {
  it("returns 4 slots for size=4", () => {
    const u = getBotById("bangkok-boss")!;
    expect(createBracketParticipants(4, u)).toHaveLength(4);
  });

  it("returns 8 slots for size=8", () => {
    const u = getBotById("bangkok-boss")!;
    expect(createBracketParticipants(8, u)).toHaveLength(8);
  });

  it("contains exactly one user slot with brain=null", () => {
    const u = getBotById("bangkok-boss")!;
    const slots = createBracketParticipants(4, u);
    const userSlots = slots.filter((s) => s.isUser);
    expect(userSlots).toHaveLength(1);
    expect(userSlots[0].brain).toBeNull();
    expect(userSlots[0].identity).toBe(u);
  });

  it("non-user slots all have a brain assigned", () => {
    const u = getBotById("bangkok-boss")!;
    const slots = createBracketParticipants(8, u);
    const botSlots = slots.filter((s) => !s.isUser);
    expect(botSlots).toHaveLength(7);
    for (const s of botSlots) {
      expect(s.brain).not.toBeNull();
    }
  });

  it("all participant identities are unique", () => {
    const u = getBotById("bangkok-boss")!;
    const slots = createBracketParticipants(8, u);
    const ids = slots.map((s) => s.identity.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("simulateBotMatch", () => {
  function slotFor(botId: string): BracketSlot {
    return {
      identity: getBotById(botId)!,
      isUser: false,
      brain: OLD_TIGER,
      eliminated: false,
    };
  }

  it("returns one of the two players as winner", () => {
    const a = slotFor("bangkok-boss");
    const b = slotFor("noob-master-42");
    const r = simulateBotMatch(a, b);
    expect([a.identity.id, b.identity.id]).toContain(r.winnerId);
  });

  it("winner score is strictly greater than loser score", () => {
    const a = slotFor("bangkok-boss");
    const b = slotFor("noob-master-42");
    for (let i = 0; i < 50; i++) {
      const r = simulateBotMatch(a, b);
      const winnerWasP1 = r.winnerId === a.identity.id;
      const winnerScore = winnerWasP1 ? r.score.p1 : r.score.p2;
      const loserScore = winnerWasP1 ? r.score.p2 : r.score.p1;
      expect(winnerScore).toBeGreaterThan(loserScore);
    }
  });

  it("MMR favorite wins more than half the time but not all", () => {
    const fav: BracketSlot = {
      ...slotFor("bangkok-boss"),
      identity: { ...getBotById("bangkok-boss")!, mmr: 1800 },
    };
    const dog: BracketSlot = {
      ...slotFor("noob-master-42"),
      identity: { ...getBotById("noob-master-42")!, mmr: 800 },
    };
    let favWins = 0;
    const N = 500;
    for (let i = 0; i < N; i++) {
      const r = simulateBotMatch(fav, dog);
      if (r.winnerId === fav.identity.id) favWins++;
    }
    const winRate = favWins / N;
    expect(winRate).toBeGreaterThan(0.5);
    expect(winRate).toBeLessThan(0.75);
  });
});

describe("jitteredThinkingMs", () => {
  it("returns a value within [aiThinkingMin, aiThinkingMax] for any brain", () => {
    for (const brain of ALL_PERSONALITIES) {
      for (let i = 0; i < 50; i++) {
        const ms = jitteredThinkingMs(brain);
        expect(ms).toBeGreaterThanOrEqual(TIMING.aiThinkingMin);
        expect(ms).toBeLessThanOrEqual(TIMING.aiThinkingMax);
      }
    }
  });

  it("preserves personality bias: a slow-deciding brain averages slower than a quick one", () => {
    const slow = ALL_PERSONALITIES.find((p) => p.id === "the-analyst")!;
    const quick = ALL_PERSONALITIES.find((p) => p.id === "young-hothead")!;
    const N = 300;
    let slowSum = 0;
    let quickSum = 0;
    for (let i = 0; i < N; i++) {
      slowSum += jitteredThinkingMs(slow);
      quickSum += jitteredThinkingMs(quick);
    }
    expect(slowSum / N).toBeGreaterThan(quickSum / N);
  });
});
