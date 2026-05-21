/**
 * WebSocket message protocol shared between the Next.js client and the
 * Cloudflare Worker. Discriminated unions on `type` so a single switch
 * statement handles every case on either side.
 *
 * Add a new event:
 *   1. Add the literal type to ClientToServerType / ServerToClientType.
 *   2. Add the matching payload interface.
 *   3. Add it to the ClientToServer / ServerToClient union.
 *   4. Both sides recompile and exhaustively check.
 */

import type {
  BracketMatch,
  MatchHistoryEntry,
  Player,
  RoundOutcome,
  Score,
  TokenTxType,
  Zone,
} from "./types";

// ────────────────────────────────────────────────────────────────────────
// Identities exchanged over the wire
// ────────────────────────────────────────────────────────────────────────

/** Lightweight identity payload — server scrubs anything client doesn't
 *  need to know (e.g. raw MMR isn't shipped during reveal). */
export interface NetIdentity {
  id: string;
  username: string;
  avatar: string;
  mmr: number;
  isBot: boolean;
}

/** A snapshot of the user's bracket slot the client can render directly. */
export interface NetBracketSlot {
  identity: NetIdentity;
  eliminated: boolean;
}

export type RoomType = "1v1" | "bracket-4" | "bracket-8";

export type Role = "kicker" | "keeper";

// ────────────────────────────────────────────────────────────────────────
// Client → Server
// ────────────────────────────────────────────────────────────────────────

export type ClientToServerType =
  | "JOIN_QUEUE"
  | "LEAVE_QUEUE"
  | "JOIN_MATCH"
  | "LOCK_ZONE"
  | "READY_NEXT"
  | "FORFEIT"
  | "JOIN_TOURNAMENT"
  | "PURCHASE_TICKET"
  | "PING";

export interface JoinQueueMsg {
  type: "JOIN_QUEUE";
  roomType: RoomType;
  /** Token amount the user is willing to bet (used for tier-matched pairing). */
  betTier: number;
}

export interface LeaveQueueMsg {
  type: "LEAVE_QUEUE";
}

/** Used to reconnect to an in-progress match after a refresh / network blip. */
export interface JoinMatchMsg {
  type: "JOIN_MATCH";
  matchId: string;
}

export interface LockZoneMsg {
  type: "LOCK_ZONE";
  matchId: string;
  zone: Zone;
}

/** Acknowledges the round-end UI, so the server knows it's safe to
 *  advance to the next round. */
export interface ReadyNextMsg {
  type: "READY_NEXT";
  matchId: string;
}

export interface ForfeitMsg {
  type: "FORFEIT";
  matchId: string;
}

/** Sent when a scheduled tournament's start time arrives and the user
 *  wants to enter the bracket they hold a ticket for. */
export interface JoinTournamentMsg {
  type: "JOIN_TOURNAMENT";
  tournamentId: string;
}

export interface PurchaseTicketMsg {
  type: "PURCHASE_TICKET";
  tournamentId: string;
}

export interface PingMsg {
  type: "PING";
  /** Client-side timestamp; the server echoes it in PONG for RTT calc. */
  t: number;
}

export type ClientToServer =
  | JoinQueueMsg
  | LeaveQueueMsg
  | JoinMatchMsg
  | LockZoneMsg
  | ReadyNextMsg
  | ForfeitMsg
  | JoinTournamentMsg
  | PurchaseTicketMsg
  | PingMsg;

// ────────────────────────────────────────────────────────────────────────
// Server → Client
// ────────────────────────────────────────────────────────────────────────

export type ServerToClientType =
  | "QUEUE_STATUS"
  | "MATCH_FOUND"
  | "ROUND_START"
  | "OPPONENT_LOCKED"
  | "REVEAL"
  | "MATCH_END"
  | "BRACKET_UPDATE"
  | "TOURNAMENT_UPDATE"
  | "TICKET_STATUS"
  | "TOKEN_UPDATE"
  | "PONG"
  | "ERROR";

export interface QueueStatusMsg {
  type: "QUEUE_STATUS";
  position: number;
  /** Approximation. -1 if unknown. */
  estimatedWaitSec: number;
}

export interface MatchFoundMsg {
  type: "MATCH_FOUND";
  matchId: string;
  opponent: NetIdentity;
  /** Which seat the user is in this match — drives kicker/keeper UI choice. */
  yourRoleFirstRound: Role;
  /** Tournament / bracket / quick match — drives navigation back on end. */
  source: "1v1" | "bracket-4" | "bracket-8" | "tournament-64";
}

export interface RoundStartMsg {
  type: "ROUND_START";
  matchId: string;
  /** 1-indexed round number (e.g. RD 3/10). */
  round: number;
  role: Role;
  /** Hard deadline for LOCK_ZONE in ms; server auto-picks if missed. */
  timerSec: number;
}

/** Sent the moment the opponent locks a zone. Crucially, we DO NOT
 *  reveal which zone — that comes in REVEAL after both have locked. */
export interface OpponentLockedMsg {
  type: "OPPONENT_LOCKED";
  matchId: string;
}

export interface RevealMsg {
  type: "REVEAL";
  matchId: string;
  round: number;
  kickerZone: Zone;
  keeperZone: Zone;
  outcome: RoundOutcome;
  score: Score;
  /** Server-authoritative — drives the round-history badges. */
  kickerPlayer: Player;
}

export interface MatchEndMsg {
  type: "MATCH_END";
  matchId: string;
  winnerId: string | null;
  /** Tokens credited to this user (post-rake; 0 if loser). */
  prize: number;
  /** Tokens debited from this user as the entry fee (already deducted
   *  pre-match; included here for the wallet UI to reconcile). */
  entryFee: number;
  newBalance: number;
  /** Convenience for MatchHistoryScreen — server-computed. */
  historyEntry: MatchHistoryEntry;
}

export interface BracketUpdateMsg {
  type: "BRACKET_UPDATE";
  /** The bracket lobby + matches structure. */
  size: 4 | 8;
  matches: BracketMatch[];
  participants: NetBracketSlot[];
  currentRoundIndex: number;
  /** The user's next opponent in the current round, or null if eliminated. */
  userOpponentForCurrentMatch: NetBracketSlot | null;
}

export interface TournamentUpdateMsg {
  type: "TOURNAMENT_UPDATE";
  tournamentId: string;
  size: 16 | 32 | 64;
  /** All matches with results so far; client diffs against its cache. */
  matches: BracketMatch[];
  currentRoundIndex: number;
}

export interface TicketStatusMsg {
  type: "TICKET_STATUS";
  tournamentId: string;
  ticketsSold: number;
  /** True if the user themselves now owns a ticket. */
  userHoldsTicket: boolean;
}

export interface TokenUpdateMsg {
  type: "TOKEN_UPDATE";
  balance: number;
  /** Positive = credit, negative = debit. 0 for refresh-only events. */
  delta: number;
  txType: TokenTxType;
  description: string;
  /** Optional reference into another resource (match-id / tournament-id). */
  referenceId?: string;
}

export interface PongMsg {
  type: "PONG";
  /** Echo of the client-supplied timestamp. */
  t: number;
}

/** Generic error envelope. Use a code so the client can localise the message. */
export interface ErrorMsg {
  type: "ERROR";
  code:
    | "AUTH_REQUIRED"
    | "AUTH_INVALID"
    | "ROOM_FULL"
    | "ALREADY_IN_QUEUE"
    | "ALREADY_IN_MATCH"
    | "INSUFFICIENT_TOKENS"
    | "TICKET_SOLD_OUT"
    | "TICKET_ALREADY_OWNED"
    | "MATCH_NOT_FOUND"
    | "INTERNAL";
  message: string;
}

export type ServerToClient =
  | QueueStatusMsg
  | MatchFoundMsg
  | RoundStartMsg
  | OpponentLockedMsg
  | RevealMsg
  | MatchEndMsg
  | BracketUpdateMsg
  | TournamentUpdateMsg
  | TicketStatusMsg
  | TokenUpdateMsg
  | PongMsg
  | ErrorMsg;

// ────────────────────────────────────────────────────────────────────────
// Type helpers
// ────────────────────────────────────────────────────────────────────────

/** Exhaustiveness check — use in a default branch:
 *    default: assertNever(msg)
 *  TypeScript will then error if a new variant is added without handling. */
export function assertNever(x: never): never {
  throw new Error(`Unhandled message variant: ${JSON.stringify(x)}`);
}

/** Convenience type for `msg.type` lookups when reducing on the client. */
export type ServerToClientByType = {
  [K in ServerToClient["type"]]: Extract<ServerToClient, { type: K }>;
};
export type ClientToServerByType = {
  [K in ClientToServer["type"]]: Extract<ClientToServer, { type: K }>;
};
