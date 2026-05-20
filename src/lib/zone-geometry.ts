import type { Zone } from "./types";

/**
 * Pure geometry for the kicker play area. All units are within a fixed
 * design viewport — components scale via SVG viewBox or Tailwind aspect
 * classes, but the math stays predictable.
 *
 * Layout (viewBox 300 × 500):
 *
 *    0      100     200     300
 *    ┌───────┬───────┬───────┐
 *    │  Z1   │  Z2   │  Z3   │  goal top row (y 0..120)
 *    ├───────┼───────┼───────┤
 *    │  Z4   │  Z5   │  Z6   │  goal bottom row (y 120..240)
 *    ├───────┴───────┴───────┤
 *    │                       │  run-up area (y 240..500)
 *    │           ●           │  ball start (150, 460)
 *    └───────────────────────┘
 */
export const PLAY_AREA = {
  width: 300,
  height: 500,
  goalLeft: 0,
  goalTop: 0,
  goalWidth: 300,
  goalHeight: 240,
  ballStartX: 150,
  /**
   * Ball sits in the run-up area at a comfortable distance below the goal.
   * Goal occupies y 0..240; Shooter is offset to the left so the ball can
   * remain at its natural penalty-spot height without overlapping him.
   */
  ballStartY: 430,
} as const;

/**
 * Returns the zone whose rect contains (targetX, targetY), or the closest
 * zone when the position falls outside the goal grid (clamped).
 */
export function zoneFromTarget(
  targetX: number,
  targetY: number,
  goalLeft: number = PLAY_AREA.goalLeft,
  goalTop: number = PLAY_AREA.goalTop,
  goalWidth: number = PLAY_AREA.goalWidth,
  goalHeight: number = PLAY_AREA.goalHeight
): Zone {
  const localX = Math.max(0, Math.min(goalWidth - 1, targetX - goalLeft));
  const localY = Math.max(0, Math.min(goalHeight - 1, targetY - goalTop));
  const col = Math.max(0, Math.min(2, Math.floor((localX / goalWidth) * 3)));
  const row = localY < goalHeight / 2 ? 0 : 1;
  return (row * 3 + col + 1) as Zone;
}

/**
 * Convenience for gestures: ball starts at (ballStartX, ballStartY); drag
 * offset is relative to that origin. Returns the zone the drag ends in.
 */
export function zoneFromDragOffset(
  dragOffsetX: number,
  dragOffsetY: number
): Zone {
  return zoneFromTarget(
    PLAY_AREA.ballStartX + dragOffsetX,
    PLAY_AREA.ballStartY + dragOffsetY
  );
}

/** Returns the (x, y) center of a zone in the play area's coordinate system. */
export function zoneCenter(zone: Zone): { x: number; y: number } {
  const col = (zone - 1) % 3;
  const row = zone <= 3 ? 0 : 1;
  const cellW = PLAY_AREA.goalWidth / 3;
  const cellH = PLAY_AREA.goalHeight / 2;
  return {
    x: PLAY_AREA.goalLeft + (col + 0.5) * cellW,
    y: PLAY_AREA.goalTop + (row + 0.5) * cellH,
  };
}

/** Returns top-left corner of a zone (for highlight rect). */
export function zoneRect(zone: Zone): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const col = (zone - 1) % 3;
  const row = zone <= 3 ? 0 : 1;
  const cellW = PLAY_AREA.goalWidth / 3;
  const cellH = PLAY_AREA.goalHeight / 2;
  return {
    x: PLAY_AREA.goalLeft + col * cellW,
    y: PLAY_AREA.goalTop + row * cellH,
    width: cellW,
    height: cellH,
  };
}
