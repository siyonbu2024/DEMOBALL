import { ALL_PERSONALITIES } from "./ai-personalities";
import { getRandomBots, type BotIdentity } from "./bot-identities";
import { TIMING } from "./timing";
import type { AIPersonality, BracketSlot } from "./types";

/** What the user perceives as their opponent: a disguised identity wired to a hidden brain. */
export interface MatchOpponent {
  identity: BotIdentity;
  brain: AIPersonality;
}

function pickRandomBrain(): AIPersonality {
  return ALL_PERSONALITIES[
    Math.floor(Math.random() * ALL_PERSONALITIES.length)
  ];
}

export function createMatchOpponentFor(identity: BotIdentity): MatchOpponent {
  return { identity, brain: pickRandomBrain() };
}

export function createMatchOpponent(): MatchOpponent {
  const identity = getRandomBots(1)[0];
  return createMatchOpponentFor(identity);
}

export function createBracketParticipants(
  size: 4 | 8 | 16 | 32,
  userIdentity: BotIdentity
): BracketSlot[] {
  // Pull bots, then drop any colliding with the user's id so we can fill (size-1)
  // unique slots even if the user's identity happens to share an id with a bot.
  const candidates = getRandomBots(size).filter(
    (b) => b.id !== userIdentity.id
  );
  const bots = candidates.slice(0, size - 1);
  const userSlot: BracketSlot = {
    identity: userIdentity,
    isUser: true,
    brain: null,
    eliminated: false,
  };
  const botSlots: BracketSlot[] = bots.map((identity) => ({
    identity,
    isUser: false,
    brain: pickRandomBrain(),
    eliminated: false,
  }));
  const all = [userSlot, ...botSlots];
  // Fisher-Yates shuffle so user's bracket position varies match-to-match
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all;
}

/**
 * Returns a thinking delay in [TIMING.aiThinkingMin, TIMING.aiThinkingMax],
 * centered on brain.thinkingMs with ±400ms uniform jitter and clamped to range.
 *
 * Preserves the personality's behavioral signal (slow vs quick deciders) without
 * exposing personality identities to the UI.
 */
export function jitteredThinkingMs(brain: AIPersonality): number {
  const center = brain.thinkingMs;
  const jitter = (Math.random() - 0.5) * 800;
  const raw = center + jitter;
  return Math.max(
    TIMING.aiThinkingMin,
    Math.min(TIMING.aiThinkingMax, raw)
  );
}

/**
 * Simulates a bot-vs-bot match for off-screen bracket play.
 * Winner is weighted by displayed MMR ratio, capped at 60% favorite (so upsets happen).
 * Score is plausible (4-2, 5-3, 5-4 sd) — not the full 10-round game state.
 */
export function simulateBotMatch(
  p1: BracketSlot,
  p2: BracketSlot,
  random: () => number = Math.random
): { winnerId: string; score: { p1: number; p2: number } } {
  const totalMmr = p1.identity.mmr + p2.identity.mmr;
  const p1Prob = totalMmr > 0 ? p1.identity.mmr / totalMmr : 0.5;
  // Cap so even a heavy favorite is only ~60%
  const adjustedP1Prob = Math.max(0.4, Math.min(0.6, p1Prob));
  const p1Wins = random() < adjustedP1Prob;

  const isSuddenDeath = random() < 0.2;
  let winnerScore: number;
  let loserScore: number;
  if (isSuddenDeath) {
    winnerScore = 5;
    loserScore = 4;
  } else {
    winnerScore = 4 + Math.floor(random() * 2); // 4 or 5
    loserScore = Math.floor(random() * winnerScore);
  }

  return p1Wins
    ? { winnerId: p1.identity.id, score: { p1: winnerScore, p2: loserScore } }
    : { winnerId: p2.identity.id, score: { p1: loserScore, p2: winnerScore } };
}
