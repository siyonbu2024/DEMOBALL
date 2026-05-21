/**
 * Three AI opponent personalities for the demo.
 *
 * Each personality has distinct kicker/keeper bias patterns + memory profile,
 * so the player feels they're playing against "someone" rather than randomness.
 *
 * Tuning notes:
 * - Bias values are relative weights, not probabilities
 * - Memory 0 = pure pattern (predictable). 1.0 = strongly counters opponent
 * - Thinking ms adds visible "considering" delay before reveal
 */

import type { AIPersonality } from "./types";

/**
 * เสือเฒ่า — The Old Tiger
 *
 * Veteran goalkeeper. Loves diving low. Predictable but hard to beat in his zones.
 * Low memory (sticks to instinct).
 */
export const OLD_TIGER: AIPersonality = {
  id: "old-tiger",
  name: "เสือเฒ่า",
  description: "ตำนานโกล • ชอบกันมุมล่าง • อ่านยาก",
  avatar: "🐯",
  kickerBias: {
    1: 1.5, // top-left
    2: 0.5,
    3: 1.5, // top-right
    4: 1.0,
    5: 0.5,
    6: 1.0,
  },
  keeperBias: {
    1: 0.3,
    2: 0.3,
    3: 0.3,
    4: 2.5, // bottom-left favored
    5: 2.0, // bottom-center
    6: 2.5, // bottom-right favored
  },
  memory: 0.2,
  thinkingMs: 800,
};

/**
 * หนุ่มไฟแรง — Young Hothead
 *
 * Power striker. Aims high and central. Easily baited. Fast decisions, low memory.
 */
export const YOUNG_HOTHEAD: AIPersonality = {
  id: "young-hothead",
  name: "หนุ่มไฟแรง",
  description: "นักเตะดาวรุ่ง • ยิงแรง ชอบมุมบน • ใจร้อน",
  avatar: "🔥",
  kickerBias: {
    1: 2.0,
    2: 3.0, // top-center favorite
    3: 2.0,
    4: 0.5,
    5: 0.8,
    6: 0.5,
  },
  keeperBias: {
    1: 1.5,
    2: 2.0, // jumps high-center often
    3: 1.5,
    4: 0.5,
    5: 0.5,
    6: 0.5,
  },
  memory: 0.1,
  thinkingMs: 400,
};

/**
 * นักวิเคราะห์ — The Analyst
 *
 * Reads patterns. High memory. Adapts to opponent. Slower to decide.
 * Hardest opponent — should feel "they know what I'm doing".
 */
export const THE_ANALYST: AIPersonality = {
  id: "the-analyst",
  name: "นักวิเคราะห์",
  description: "อ่านเกมเก่ง • ปรับตามคู่ต่อสู้ • ระดับเซียน",
  avatar: "🧠",
  kickerBias: {
    1: 1.0,
    2: 1.0,
    3: 1.0,
    4: 1.0,
    5: 1.0,
    6: 1.0,
  },
  keeperBias: {
    1: 1.0,
    2: 1.0,
    3: 1.0,
    4: 1.0,
    5: 1.0,
    6: 1.0,
  },
  memory: 0.9, // strongly counters opponent patterns
  thinkingMs: 1500,
};

export const ALL_PERSONALITIES: readonly AIPersonality[] = [
  OLD_TIGER,
  YOUNG_HOTHEAD,
  THE_ANALYST,
] as const;

export function getPersonalityById(id: string): AIPersonality | undefined {
  return ALL_PERSONALITIES.find((p) => p.id === id);
}
