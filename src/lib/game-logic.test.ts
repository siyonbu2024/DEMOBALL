/**
 * Tests for game-logic.ts.
 *
 * Tests are organized by function and document expected behavior.
 * Each test should be readable as a spec sentence.
 */

import { describe, expect, it } from "vitest";
import {
  aiPickZone,
  applyRound,
  computeWinner,
  createInitialMatchState,
  getNextKicker,
  getPlayerHistory,
  isMatchOver,
  resolveRound,
  updateScore,
  weightedRandom,
} from "./game-logic";
import type { AIPersonality, Round, Score, Zone } from "./types";

// ────────────────────────────────────────────────────────────────────────
// Test helpers
// ────────────────────────────────────────────────────────────────────────

/** Deterministic random source for tests — always returns 0.5 */
const fixedRandom = () => 0.5;

/** Cycles through values for deterministic but varied test behavior */
function cyclingRandom(values: number[]): () => number {
  let i = 0;
  return () => {
    const v = values[i % values.length];
    i++;
    return v;
  };
}

const testPersonality: AIPersonality = {
  id: "test",
  name: "Test Bot",
  description: "Uniform bias for testing",
  avatar: "🤖",
  kickerBias: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 },
  keeperBias: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 },
  memory: 0,
  thinkingMs: 0,
};

// ────────────────────────────────────────────────────────────────────────
// resolveRound
// ────────────────────────────────────────────────────────────────────────

describe("resolveRound", () => {
  it("returns 'save' when keeper guesses kicker's zone", () => {
    expect(resolveRound(1, 1)).toBe("save");
    expect(resolveRound(5, 5)).toBe("save");
  });

  it("returns 'goal' when keeper picks a different zone", () => {
    expect(resolveRound(1, 2)).toBe("goal");
    expect(resolveRound(6, 1)).toBe("goal");
    expect(resolveRound(3, 4)).toBe("goal");
  });
});

// ────────────────────────────────────────────────────────────────────────
// updateScore
// ────────────────────────────────────────────────────────────────────────

describe("updateScore", () => {
  it("awards point to kicker on goal", () => {
    expect(updateScore({ p1: 0, p2: 0 }, "goal", "p1")).toEqual({
      p1: 1,
      p2: 0,
    });
    expect(updateScore({ p1: 2, p2: 1 }, "goal", "p2")).toEqual({
      p1: 2,
      p2: 2,
    });
  });

  it("awards point to keeper (not kicker) on save", () => {
    expect(updateScore({ p1: 0, p2: 0 }, "save", "p1")).toEqual({
      p1: 0,
      p2: 1,
    });
    expect(updateScore({ p1: 3, p2: 2 }, "save", "p2")).toEqual({
      p1: 4,
      p2: 2,
    });
  });

  it("does not mutate the original score object", () => {
    const original: Score = { p1: 0, p2: 0 };
    updateScore(original, "goal", "p1");
    expect(original).toEqual({ p1: 0, p2: 0 });
  });
});

// ────────────────────────────────────────────────────────────────────────
// getNextKicker
// ────────────────────────────────────────────────────────────────────────

describe("getNextKicker", () => {
  it("starts with p1 on round 0", () => {
    expect(getNextKicker(createInitialMatchState())).toBe("p1");
  });

  it("alternates kicker each round", () => {
    let state = createInitialMatchState();
    const sequence: ("p1" | "p2")[] = [];
    for (let i = 0; i < 6; i++) {
      sequence.push(getNextKicker(state));
      state = applyRound(state, 1, 2); // always goal
    }
    expect(sequence).toEqual(["p1", "p2", "p1", "p2", "p1", "p2"]);
  });
});

// ────────────────────────────────────────────────────────────────────────
// applyRound
// ────────────────────────────────────────────────────────────────────────

describe("applyRound", () => {
  it("appends a new round to history", () => {
    const state = applyRound(createInitialMatchState(), 1, 2);
    expect(state.rounds).toHaveLength(1);
    expect(state.rounds[0]).toMatchObject({
      index: 0,
      kicker: "p1",
      kickerChoice: 1,
      keeperChoice: 2,
      outcome: "goal",
    });
  });

  it("updates score correctly across multiple rounds", () => {
    let state = createInitialMatchState();
    state = applyRound(state, 1, 2); // p1 kicks, goal → p1 = 1
    state = applyRound(state, 3, 3); // p2 kicks, save → p1 = 2
    state = applyRound(state, 5, 6); // p1 kicks, goal → p1 = 3
    expect(state.score).toEqual({ p1: 3, p2: 0 });
  });

  it("throws when applying to a finished match", () => {
    let state = createInitialMatchState();
    // Both players score 9 rounds straight (alternating kickers)
    // Then on round 10 (p2's last kick), keeper saves → p1 wins 6-4
    for (let i = 0; i < 9; i++) {
      state = applyRound(state, 1, 2); // goal (different zones)
    }
    // Round 10: p2 kicks, keeper saves
    state = applyRound(state, 1, 1);
    expect(state.winner).toBe("p1");
    expect(() => applyRound(state, 1, 2)).toThrow();
  });
});

// ────────────────────────────────────────────────────────────────────────
// computeWinner / isMatchOver
// ────────────────────────────────────────────────────────────────────────

describe("computeWinner", () => {
  it("returns null while match is ongoing", () => {
    expect(computeWinner([], { p1: 0, p2: 0 })).toBeNull();
    expect(computeWinner(makeRounds(3), { p1: 2, p2: 1 })).toBeNull();
  });

  it("returns winner after 10 rounds when not tied", () => {
    expect(computeWinner(makeRounds(10), { p1: 4, p2: 3 })).toBe("p1");
    expect(computeWinner(makeRounds(10), { p1: 2, p2: 5 })).toBe("p2");
  });

  it("returns null after 10 rounds if tied (sudden death)", () => {
    expect(computeWinner(makeRounds(10), { p1: 3, p2: 3 })).toBeNull();
  });

  it("returns winner in sudden death after a complete pair", () => {
    expect(computeWinner(makeRounds(12), { p1: 4, p2: 3 })).toBe("p1");
    expect(computeWinner(makeRounds(12), { p1: 4, p2: 5 })).toBe("p2");
  });

  it("returns null after odd number of sudden-death rounds", () => {
    expect(computeWinner(makeRounds(11), { p1: 4, p2: 3 })).toBeNull();
  });

  it("ends early when lead is mathematically insurmountable", () => {
    // After 8 rounds (4 each), p1 = 5, p2 = 0. Only 2 rounds remain.
    // p2 can score at most 1 more (1 kick left); p1 score is locked at 5.
    // Actually: p2 kicks last 2 rounds? Let's recompute.
    // Rounds 0-7 played. p1 kicked rounds 0,2,4,6 (4 times). p2 kicked 1,3,5,7 (4 times).
    // Remaining rounds 8, 9: round 8 = p1 kick, round 9 = p2 kick. Each has 1 more kick.
    // p2 max final = 0 + 1 = 1. p1 = 5. p2 cannot catch up.
    expect(computeWinner(makeRounds(8), { p1: 5, p2: 0 })).toBe("p1");
  });
});

describe("isMatchOver", () => {
  it("is true once winner is set", () => {
    let state = createInitialMatchState();
    expect(isMatchOver(state)).toBe(false);
    // Manually craft a finished state
    state = { ...state, winner: "p1" };
    expect(isMatchOver(state)).toBe(true);
  });
});

// ────────────────────────────────────────────────────────────────────────
// aiPickZone
// ────────────────────────────────────────────────────────────────────────

describe("aiPickZone", () => {
  it("respects strong base bias when memory is 0", () => {
    const biased: AIPersonality = {
      ...testPersonality,
      kickerBias: { 1: 1000, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
    };
    // With strong bias toward zone 1, should always pick 1
    for (let i = 0; i < 10; i++) {
      const choice = aiPickZone("kicker", biased, [], () => i / 10);
      expect(choice).toBe(1);
    }
  });

  it("uses memory to counter opponent patterns when keeper", () => {
    const memoryBot: AIPersonality = {
      ...testPersonality,
      keeperBias: { 1: 0.1, 2: 0.1, 3: 0.1, 4: 0.1, 5: 0.1, 6: 0.1 },
      memory: 100, // very high memory weight
    };
    // Opponent has kicked zone 3 three times in a row
    const opponentHistory: Zone[] = [3, 3, 3];
    // Keeper should very likely pick 3
    const choice = aiPickZone(
      "keeper",
      memoryBot,
      opponentHistory,
      fixedRandom
    );
    expect(choice).toBe(3);
  });

  it("returns a valid zone", () => {
    const choice = aiPickZone("kicker", testPersonality, [], fixedRandom);
    expect([1, 2, 3, 4, 5, 6]).toContain(choice);
  });
});

describe("weightedRandom", () => {
  it("falls back to uniform when all weights are zero", () => {
    const result = weightedRandom(
      { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
      () => 0
    );
    expect([1, 2, 3, 4, 5, 6]).toContain(result);
  });

  it("respects weight distribution", () => {
    const weights = { 1: 100, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    expect(weightedRandom(weights, () => 0.5)).toBe(1);
  });
});

// ────────────────────────────────────────────────────────────────────────
// getPlayerHistory
// ────────────────────────────────────────────────────────────────────────

describe("getPlayerHistory", () => {
  it("returns kicker choices for a player when asked as kicker", () => {
    let state = createInitialMatchState();
    state = applyRound(state, 1, 2); // p1 kicks 1
    state = applyRound(state, 3, 4); // p2 kicks 3
    state = applyRound(state, 5, 5); // p1 kicks 5 (saved)

    expect(getPlayerHistory(state.rounds, "p1", "kicker")).toEqual([1, 5]);
    expect(getPlayerHistory(state.rounds, "p2", "kicker")).toEqual([3]);
  });

  it("returns keeper choices for a player when asked as keeper", () => {
    let state = createInitialMatchState();
    state = applyRound(state, 1, 2); // p2 keeps with 2
    state = applyRound(state, 3, 4); // p1 keeps with 4

    expect(getPlayerHistory(state.rounds, "p1", "keeper")).toEqual([4]);
    expect(getPlayerHistory(state.rounds, "p2", "keeper")).toEqual([2]);
  });
});

// ────────────────────────────────────────────────────────────────────────
// helpers
// ────────────────────────────────────────────────────────────────────────

function makeRounds(n: number): Round[] {
  const rounds: Round[] = [];
  for (let i = 0; i < n; i++) {
    rounds.push({
      index: i,
      kicker: i % 2 === 0 ? "p1" : "p2",
      kickerChoice: 1,
      keeperChoice: 2,
      outcome: "goal",
      timestamp: i,
    });
  }
  return rounds;
}
