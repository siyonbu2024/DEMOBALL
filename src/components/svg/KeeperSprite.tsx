"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Sprite-sheet driven Keeper character — DIVE animation.
 *
 * Sprite sheet at `/public/Keeper_dive_spirte.png`.
 *
 * The sheet is laid out as an 8-column grid that runs left-to-right,
 * top-to-bottom. The dive plays through every authored cell in order:
 *
 *   Row 0 (8 frames): keeper leaves the ground, body horizontal
 *   Row 1 (8 frames): mid-flight continuation
 *   Row 2 (8 frames): tumble / roll on landing
 *   Row 3 (6 frames): pushing up from the ground
 *   Row 4 (2 frames): back on feet, neutral stance
 *
 * Total ~32 explicit frames. The empty grid cells (row 3 cols 6-7, row 4
 * cols 2-7) are skipped via an explicit frame list below.
 */

const SHEET = {
  src: "/Keeper_dive_spirte.png",
  /** Authored grid: 8 columns × 5 rows. */
  cols: 8,
  rows: 5,
  /** Source dimensions — used to compute the actual cell aspect ratio. */
  pixelWidth: 6912,
  pixelHeight: 3968,
} as const;

/** Each cell is wider than tall (864 × 793.6) → aspect height/width. */
const CELL_ASPECT =
  SHEET.pixelHeight / SHEET.rows /
  (SHEET.pixelWidth / SHEET.cols);

/**
 * Explicit (row, col) sequence for the dive.
 * Sheet has 8 cols × 5 rows of grid, but only the first 3 rows are filled
 * with art — the bottom two rows are empty canvas.
 */
const DIVE_FRAMES: Array<{ row: number; col: number }> = [
  // Row 0 — early flight
  ...Array.from({ length: 8 }, (_, i) => ({ row: 0, col: i })),
  // Row 1 — mid / late flight
  ...Array.from({ length: 8 }, (_, i) => ({ row: 1, col: i })),
  // Row 2 — tumble + recovery
  ...Array.from({ length: 8 }, (_, i) => ({ row: 2, col: i })),
];

interface Props {
  /** Display width in px (height matches the cell aspect ratio). */
  width?: number;
  /** Playback speed. 24 = cinematic, 30 = quick. */
  fps?: number;
  /** Mirror horizontally — drive a left-side dive from the same sheet. */
  flipX?: boolean;
  /** Loop the dive (useful for previewing). Defaults to one-shot. */
  loop?: boolean;
  /** Pause on a specific frame index instead of playing. */
  pausedFrame?: number;
  className?: string;
  /** Called once when the dive reaches its last frame (one-shot mode). */
  onComplete?: () => void;
}

export const KeeperSprite = ({
  width = 160,
  fps = 24,
  flipX = false,
  loop = false,
  pausedFrame,
  className = "",
  onComplete,
}: Props) => {
  const [frame, setFrame] = useState(0);
  const completedRef = useRef(false);

  // Reset when key inputs change
  useEffect(() => {
    setFrame(0);
    completedRef.current = false;
  }, [fps, loop, flipX]);

  useEffect(() => {
    if (pausedFrame !== undefined) return; // explicit frame — no interval
    const interval = 1000 / fps;
    const id = setInterval(() => {
      setFrame((f) => {
        const next = f + 1;
        if (next >= DIVE_FRAMES.length) {
          if (loop) return 0;
          if (!completedRef.current) {
            completedRef.current = true;
            onComplete?.();
          }
          return DIVE_FRAMES.length - 1;
        }
        return next;
      });
    }, interval);
    return () => clearInterval(id);
  }, [fps, loop, pausedFrame, onComplete]);

  const idx = pausedFrame !== undefined
    ? Math.max(0, Math.min(DIVE_FRAMES.length - 1, pausedFrame))
    : frame;
  const { row, col } = DIVE_FRAMES[idx];

  const height = width * CELL_ASPECT;

  return (
    <div
      className={className}
      style={{
        width,
        height,
        backgroundImage: `url(${SHEET.src})`,
        backgroundSize: `${SHEET.cols * 100}% ${SHEET.rows * 100}%`,
        backgroundPosition: `${(col / (SHEET.cols - 1)) * 100}% ${(row / (SHEET.rows - 1)) * 100}%`,
        backgroundRepeat: "no-repeat",
        transform: flipX ? "scaleX(-1)" : undefined,
        pointerEvents: "none",
      }}
      aria-hidden
    />
  );
};

/** Total number of frames in the dive sequence (handy for sliders/tests). */
export const KEEPER_DIVE_FRAME_COUNT = DIVE_FRAMES.length;
