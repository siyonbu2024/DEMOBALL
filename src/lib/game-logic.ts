/**
 * Pure game logic for penalty shootout.
 *
 * RULES:
 * - No React, no DOM, no side effects
 * - No `Math.random()` — randomness is injected via RandomSource parameter
 * - All functions are deterministic given inputs
 * - All functions are testable in isolation
 */

import {
  type AIPersonality,
  type MatchState,
  type Player,
  type RandomSource,
  type Role,
  type Round,
  type RoundOutcome,
  type Score,
  type Zone,
  type ZoneBias,
  ALL_ZONES,
  MATCH_CONFIG,
  otherPlayer,
} from "./types";

// ────────────────────────────────────────────────────────────────────────
// Initial state
// ────────────────────────────────────────────────────────────────────────

export function createInitialMatchState(): MatchState {
  return {
    rounds: [],
    score: { p1: 0, p2: 0 },
    winner: null,
    inSuddenDeath: false,
  };
}

// ────────────────────────────────────────────────────────────────────────
// Round resolution
// ────────────────────────────────────────────────────────────────────────

/**
 * Returns 'save' if keeper guessed kicker's zone correctly, otherwise 'goal'.
 */
export function resolveRound(
  kickerChoice: Zone,
  keeperChoice: Zone
): RoundOutcome {
  return kickerChoice === keeperChoice ? "save" : "goal";
}

/**
 * Returns updated score after a round.
 * Goal = kicker scores; Save = keeper (the other player) scores.
 */
export function updateScore(
  score: Score,
  outcome: RoundOutcome,
  kicker: Player
): Score {
  if (outcome === "goal") {
    return { ...score, [kicker]: score[kicker] + 1 };
  }
  const keeper = otherPlayer(kicker);
  return { ...score, [keeper]: score[keeper] + 1 };
}

// ────────────────────────────────────────────────────────────────────────
// Match flow
// ────────────────────────────────────────────────────────────────────────

/**
 * Determines who kicks the next round.
 * P1 kicks even-indexed rounds (0, 2, 4...), P2 kicks odd-indexed.
 */
export function getNextKicker(state: MatchState): Player {
  return state.rounds.length % 2 === 0 ? "p1" : "p2";
}

/**
 * Applies a completed round to match state and returns new state.
 * Computes new score, sudden-death status, and winner if match is over.
 */
export function applyRound(
  state: MatchState,
  kickerChoice: Zone,
  keeperChoice: Zone,
  now: number = Date.now()
): MatchState {
  if (state.winner !== null) {
    throw new Error("Cannot apply round to a finished match");
  }

  const kicker = getNextKicker(state);
  const outcome = resolveRound(kickerChoice, keeperChoice);
  const newScore = updateScore(state.score, outcome, kicker);

  const round: Round = {
    index: state.rounds.length,
    kicker,
    kickerChoice,
    keeperChoice,
    outcome,
    timestamp: now,
  };

  const newRounds = [...state.rounds, round];
  const inSuddenDeath = newRounds.length > MATCH_CONFIG.STANDARD_ROUNDS;
  const winner = computeWinner(newRounds, newScore);

  return {
    rounds: newRounds,
    score: newScore,
    winner,
    inSuddenDeath: winner === null && inSuddenDeath,
  };
}

/**
 * Returns winner if match has been decided, else null.
 *
 * Match ends when:
 * - After 10 standard rounds AND scores are not equal, OR
 * - In sudden death AND a complete pair is played AND scores are not equal, OR
 * - Score lead becomes mathematically insurmountable before 10 rounds
 */
export function computeWinner(
  rounds: Round[],
  score: Score
): Player | null {
  const roundsPlayed = rounds.length;

  // Early termination: if remaining rounds can't close the gap
  if (roundsPlayed < MATCH_CONFIG.STANDARD_ROUNDS) {
    const remainingRounds = MATCH_CONFIG.STANDARD_ROUNDS - roundsPlayed;
    // Each remaining pair gives 1 attempt to each player
    const p1RemainingKicks = Math.ceil(
      remainingRounds / 2 + (rounds.length % 2 === 0 ? 0 : -0.5)
    );
    const p2RemainingKicks = remainingRounds - p1RemainingKicks;
    // Max possible final score for each
    const p1Max = score.p1 + p1RemainingKicks;
    const p2Max = score.p2 + p2RemainingKicks;
    if (p1Max < score.p2) return "p2";
    if (p2Max < score.p1) return "p1";
    return null;
  }

  // After 10 rounds: if not tied, decided
  if (roundsPlayed === MATCH_CONFIG.STANDARD_ROUNDS) {
    if (score.p1 !== score.p2) {
      return score.p1 > score.p2 ? "p1" : "p2";
    }
    return null;
  }

  // Sudden death: decided after each complete pair
  const suddenDeathRounds = roundsPlayed - MATCH_CONFIG.STANDARD_ROUNDS;
  if (suddenDeathRounds % 2 === 0 && score.p1 !== score.p2) {
    return score.p1 > score.p2 ? "p1" : "p2";
  }

  return null;
}

export function isMatchOver(state: MatchState): boolean {
  return state.winner !== null;
}

// ────────────────────────────────────────────────────────────────────────
// AI opponent
// ────────────────────────────────────────────────────────────────────────

/**
 * Picks a zone for the AI based on personality + opponent history.
 *
 * @param role - Whether AI is currently kicking or keeping
 * @param personality - The AI's behavior profile
 * @param opponentHistory - Recent zones the opponent has chosen (most recent last)
 * @param random - Injected random source [0, 1) for determinism in tests
 */
export function aiPickZone(
  role: Role,
  personality: AIPersonality,
  opponentHistory: Zone[],
  random: RandomSource
): Zone {
  const baseBias =
    role === "kicker" ? personality.kickerBias : personality.keeperBias;

  // Start with copy of base bias
  const weights: ZoneBias = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  for (const zone of ALL_ZONES) {
    weights[zone] = baseBias[zone];
  }

  // Mix in memory-based adjustment from opponent's recent history
  if (personality.memory > 0 && opponentHistory.length > 0) {
    const recentHistory = opponentHistory.slice(-3);
    const counts: ZoneBias = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    for (const z of recentHistory) {
      counts[z] += 1;
    }

    for (const zone of ALL_ZONES) {
      // Keeper: weight TOWARD zones opponent has kicked recently
      // Kicker: weight AWAY from zones opponent has defended recently
      const memoryWeight =
        role === "keeper"
          ? counts[zone]
          : recentHistory.length - counts[zone];
      weights[zone] += memoryWeight * personality.memory;
    }
  }

  return weightedRandom(weights, random);
}

/** Picks a zone weighted by the given weights. Pure given `random`. */
export function weightedRandom(weights: ZoneBias, random: RandomSource): Zone {
  const total = ALL_ZONES.reduce((sum, z) => sum + weights[z], 0);
  if (total <= 0) {
    // Fallback: uniform random
    return ALL_ZONES[Math.floor(random() * ALL_ZONES.length)] as Zone;
  }

  let r = random() * total;
  for (const zone of ALL_ZONES) {
    r -= weights[zone];
    if (r <= 0) return zone;
  }
  // Floating point fallback
  return 5;
}

// ────────────────────────────────────────────────────────────────────────
// Selectors (derived state for UI)
// ────────────────────────────────────────────────────────────────────────

export function getPlayerHistory(
  rounds: Round[],
  player: Player,
  asRole: Role
): Zone[] {
  return rounds
    .filter((r) =>
      asRole === "kicker" ? r.kicker === player : r.kicker !== player
    )
    .map((r) => (asRole === "kicker" ? r.kickerChoice : r.keeperChoice));
}

export function getCurrentRoundIndex(state: MatchState): number {
  return state.rounds.length;
}

export function getRoundsRemaining(state: MatchState): number {
  if (state.inSuddenDeath) return Infinity;
  return Math.max(0, MATCH_CONFIG.STANDARD_ROUNDS - state.rounds.length);
}
