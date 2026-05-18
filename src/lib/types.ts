/**
 * Domain types for the penalty shootout demo.
 *
 * These are the SOURCE OF TRUTH. Update types here first, then code.
 * Game logic in game-logic.ts must conform to these shapes.
 */

import type { BotIdentity } from "./bot-identities";

// ────────────────────────────────────────────────────────────────────────
// Core game primitives
// ────────────────────────────────────────────────────────────────────────

/**
 * Goal grid zones, numbered 1-6.
 *
 *   ┌───┬───┬───┐
 *   │ 1 │ 2 │ 3 │   ← top row (left, center, right)
 *   ├───┼───┼───┤
 *   │ 4 │ 5 │ 6 │   ← bottom row
 *   └───┴───┴───┘
 */
export type Zone = 1 | 2 | 3 | 4 | 5 | 6;

export const ALL_ZONES: readonly Zone[] = [1, 2, 3, 4, 6] as const; // zone 5 (bottom-centre) removed

export type Player = "p1" | "p2";

export type Role = "kicker" | "keeper";

export type RoundOutcome = "goal" | "save";

// ────────────────────────────────────────────────────────────────────────
// Round and match state
// ────────────────────────────────────────────────────────────────────────

export interface Round {
  /** 0-indexed round number */
  index: number;
  /** Which player was the kicker this round */
  kicker: Player;
  kickerChoice: Zone;
  keeperChoice: Zone;
  outcome: RoundOutcome;
  /** Wall-clock timestamp for analytics/replay */
  timestamp: number;
}

export interface Score {
  p1: number;
  p2: number;
}

export interface MatchState {
  rounds: Round[];
  score: Score;
  /** Null while match is ongoing, else winner */
  winner: Player | null;
  /** True once we're past the standard 10 rounds and still tied */
  inSuddenDeath: boolean;
}

/** Match configuration constants. */
export const MATCH_CONFIG = {
  /** 5 rounds each = 10 total before sudden death */
  STANDARD_ROUNDS: 10,
  /** Player kicking first round */
  STARTING_KICKER: "p1" as Player,
} as const;

// ────────────────────────────────────────────────────────────────────────
// AI personalities
// ────────────────────────────────────────────────────────────────────────

/** Bias weights for each zone (higher = more likely to pick) */
export type ZoneBias = Record<Zone, number>;

export interface AIPersonality {
  id: string;
  name: string;
  /** Short description shown in opponent picker UI */
  description: string;
  /** Visual avatar emoji or icon name */
  avatar: string;
  /** Base preferences when this AI is the kicker */
  kickerBias: ZoneBias;
  /** Base preferences when this AI is the keeper */
  keeperBias: ZoneBias;
  /**
   * How much the AI weights opponent's recent history.
   * 0 = pure bias (predictable). 1 = strongly counters opponent patterns.
   */
  memory: number;
  /** Simulated "thinking time" in ms before reveal — adds personality */
  thinkingMs: number;
}

// ────────────────────────────────────────────────────────────────────────
// UI / interaction state
// ────────────────────────────────────────────────────────────────────────

export type GamePhase =
  | "menu"           // landing screen
  | "opponent-pick"  // choose AI personality
  | "round-intro"    // "Round N — You kick" / "AI kicks"
  | "kicker-aim"     // kicker is dragging
  | "keeper-pick"    // keeper is choosing
  | "reveal"         // animation playing
  | "round-result"   // brief "GOAL!" / "SAVE!" overlay
  | "match-end";     // win/lose screen

/** Random source — injected so game-logic stays pure and testable */
export type RandomSource = () => number;

// ────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────

export function otherPlayer(p: Player): Player {
  return p === "p1" ? "p2" : "p1";
}

export function isTopRow(z: Zone): boolean {
  return z <= 3;
}

export function isBottomRow(z: Zone): boolean {
  return z >= 4;
}

// ────────────────────────────────────────────────────────────────────────
// Lobby + bracket (added: lobby + bot disguise)
// ────────────────────────────────────────────────────────────────────────

export type RoomType = "1v1" | "4v4" | "8v8" | "tour";

export type Screen =
  | "home"
  | "room-1v1"
  | "room-4v4"
  | "room-8v8"
  | "room-16v16"
  | "room-32v32"
  | "matchmaking"
  | "bracket-view"
  | "in-match"
  | "wallet"
  | "settings"
  | "match-history";

export interface BracketSlot {
  identity: BotIdentity;
  isUser: boolean;
  /** null for the user; AI brain for bots */
  brain: AIPersonality | null;
  eliminated: boolean;
}

export interface BracketMatch {
  /** 0=QF / 1=SF / 2=F (8-bracket); 0=SF / 1=F (4-bracket) */
  roundIndex: number;
  positionInRound: number;
  player1Id: string;
  player2Id: string;
  winnerId: string | null;
  score: { p1: number; p2: number } | null;
}

export interface BracketState {
  size: 4 | 8 | 16 | 32;
  participants: BracketSlot[];
  currentRoundIndex: number;
  matches: BracketMatch[];
  userOpponentForCurrentMatch: BracketSlot | null;
}

/** Where a match was started from — used by match-end to route the user back. */
export type MatchContext =
  | { type: "quick-1v1"; entryFee: number; pot: number }
  | { type: "specific-1v1"; opponentBotId: string; entryFee: number; pot: number }
  | { type: "bracket"; size: 4 | 8 | 16 | 32; bracketRoundIndex: number };

// ────────────────────────────────────────────────────────────────────────
// Token / wallet
// ────────────────────────────────────────────────────────────────────────

/** Available bet tiers for 1v1 matches (in tokens). */
export const BET_TIERS: readonly number[] = [10, 50, 100, 500, 1000] as const;

/** 1v1 rake taken by the house (20%). */
export const RAKE_RATE_1V1 = 0.2;

export type TokenTxType =
  | "deposit"        // bought package
  | "withdraw"       // withdrew to bank
  | "match_entry"    // deducted to join match
  | "match_win"      // received as prize
  | "refund"         // refunded due to cancel
  | "promo";         // free bonus

export interface TokenTransaction {
  id: string;
  type: TokenTxType;
  amount: number;        // positive = credit, negative = debit
  balanceAfter: number;
  description: string;
  timestamp: number;
}

export interface MatchHistoryEntry {
  id: string;
  type: "1v1" | "bracket-4" | "bracket-8" | "bracket-16" | "bracket-32";
  opponentName: string;
  opponentAvatar: string;
  result: "win" | "loss";
  scoreYou: number;
  scoreOpp: number;
  entryFee: number;
  prize: number;          // 0 if loss
  netTokens: number;      // prize - entryFee
  timestamp: number;
}

export interface TokenPackage {
  id: string;
  tokens: number;
  bonus: number;
  priceThb: number;
  highlight?: boolean;
}

export const TOKEN_PACKAGES: readonly TokenPackage[] = [
  { id: "starter",  tokens: 100,   bonus: 0,    priceThb: 35 },
  { id: "bronze",   tokens: 500,   bonus: 50,   priceThb: 149 },
  { id: "silver",   tokens: 1200,  bonus: 200,  priceThb: 349, highlight: true },
  { id: "gold",     tokens: 3000,  bonus: 700,  priceThb: 799 },
  { id: "platinum", tokens: 8000,  bonus: 2500, priceThb: 1999 },
];
