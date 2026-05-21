import { describe, expect, it } from "vitest";
import { BOT_POOL, getBotById, getRandomBots } from "./bot-identities";

describe("BOT_POOL", () => {
  it("has 32 entries", () => {
    expect(BOT_POOL).toHaveLength(32);
  });

  it("all ids are unique", () => {
    const ids = BOT_POOL.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all usernames are unique", () => {
    const names = BOT_POOL.map((b) => b.username);
    expect(new Set(names).size).toBe(names.length);
  });

  it("MMRs are within [800, 1800]", () => {
    for (const b of BOT_POOL) {
      expect(b.mmr).toBeGreaterThanOrEqual(800);
      expect(b.mmr).toBeLessThanOrEqual(1800);
    }
  });

  it("winRates are within [0.35, 0.75]", () => {
    for (const b of BOT_POOL) {
      expect(b.winRate).toBeGreaterThanOrEqual(0.35);
      expect(b.winRate).toBeLessThanOrEqual(0.75);
    }
  });

  it("totalMatches are within [50, 2000]", () => {
    for (const b of BOT_POOL) {
      expect(b.totalMatches).toBeGreaterThanOrEqual(50);
      expect(b.totalMatches).toBeLessThanOrEqual(2000);
    }
  });

  it("top-MMR cohort has higher avg winRate than bottom-MMR cohort", () => {
    const sorted = [...BOT_POOL].sort((a, b) => a.mmr - b.mmr);
    const bottomAvg =
      sorted.slice(0, 5).reduce((s, b) => s + b.winRate, 0) / 5;
    const topAvg =
      sorted.slice(-5).reduce((s, b) => s + b.winRate, 0) / 5;
    expect(topAvg).toBeGreaterThan(bottomAvg);
  });
});

describe("getRandomBots", () => {
  it("returns the requested count when within pool size", () => {
    expect(getRandomBots(8)).toHaveLength(8);
  });

  it("returns unique bots within a single result", () => {
    const result = getRandomBots(10);
    const ids = result.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("clamps to pool size when count exceeds pool", () => {
    expect(getRandomBots(100)).toHaveLength(BOT_POOL.length);
  });

  it("filters by mmrRange when provided", () => {
    const result = getRandomBots(20, [1500, 1800]);
    for (const b of result) {
      expect(b.mmr).toBeGreaterThanOrEqual(1500);
      expect(b.mmr).toBeLessThanOrEqual(1800);
    }
  });
});

describe("getBotById", () => {
  it("returns the bot when id exists", () => {
    expect(getBotById("bangkok-boss")?.username).toBe("BangkokBoss");
  });

  it("returns undefined when id is missing", () => {
    expect(getBotById("__nonexistent__")).toBeUndefined();
  });
});
