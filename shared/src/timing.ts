/**
 * Centralized animation timing. All values in ms.
 * Edit here, see effect everywhere. NEVER hardcode ms in components.
 */
export const TIMING = {
  // Round flow
  roundIntro: 1500,
  decisionTimer: 5000,
  decisionTimerWarning: 2000,
  aiThinkingMin: 600,
  aiThinkingMax: 1800,

  // Reveal sub-phases (offsets from reveal t=0)
  revealChoicesShown: 0,
  revealCharacterWindup: 200,
  revealBallFlightStart: 500,
  revealKeeperDiveStart: 600,
  revealImpactMoment: 1400,
  revealOutcomeBurst: 1600,
  revealScoreUpdate: 2000,
  revealTotal: 2700,

  // Pacing
  roundEndHold: 800,
  roundTransition: 300,
  /** Buffer between both choices set and round commit, so the lock feels deliberate. */
  commitBuffer: 250,

  // Match end
  matchEndDramaticPause: 1000,
  matchEndEntrance: 1500,
  matchEndScoreReveal: 800,
  matchEndCTADelay: 2500,

  // VFX
  goalNetRipple: 400,
  goalConfetti: 1500,
  goalScreenFlash: 100,
  saveSlowMo: 200,
  saveBurstScale: 600,

  // UI micro
  zoneLockFlash: 200,
  zoneTapResponse: 100,
  scoreNumberSpring: 600,
  pageTransition: 300,
  summaryStagger: 100,

  // Lobby
  matchmakingDuration: 1800,
  bracketSimulationPerMatch: 2000,
  /** Faster sim cadence used when the user has been eliminated (less suspense needed). */
  bracketSimulationFastMs: 1000,
  bracketAdvanceDelay: 1200,
  onlineCountDriftInterval: 5000,
  toastDuration: 1800,
} as const;

export const SPRING = {
  snappy: { type: "spring", stiffness: 300, damping: 25 },
  soft: { type: "spring", stiffness: 200, damping: 30 },
  bouncy: { type: "spring", stiffness: 400, damping: 15 },
} as const;

export const EASING = {
  outExpo: [0.22, 1, 0.36, 1] as const,
  inOutQuad: [0.45, 0, 0.55, 1] as const,
  ballFlight: [0.25, 0.46, 0.45, 0.94] as const,
} as const;
