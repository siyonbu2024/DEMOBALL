"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Sprite-sheet driven Keeper character — DIVE animation.
 *
 * Sprite sheet at `/public/Keeper_dive_2_sprite.png` (2000×2000, 10×10 grid).
 *
 *   Row 0 (10 frames): keeper flying horizontally — early dive
 *   Row 1 (10 frames): continued dive, tumble, flip
 *   Row 2 ( 8 frames): recovery + standing
 *   Rows 3-9: empty canvas
 *
 * Total 28 explicit frames. Empty cells are skipped via DIVE_FRAMES below.
 */

const SHEET = {
  src: "/Keeper_dive_2_sprite.png",
  /** Authored grid: 10 columns × 10 rows (square cells, but only first 3 rows are filled). */
  cols: 10,
  rows: 10,
  /** Source dimensions — used to compute the actual cell aspect ratio. */
  pixelWidth: 2000,
  pixelHeight: 2000,
} as const;

/** Cells are square (200×200) → aspect = 1. */
const CELL_ASPECT =
  SHEET.pixelHeight / SHEET.rows /
  (SHEET.pixelWidth / SHEET.cols);

/**
 * Explicit (row, col) sequence for the dive.
 * Sheet is a 10×10 grid; only the first 3 rows are filled.
 */
const DIVE_FRAMES: Array<{ row: number; col: number }> = [
  // Row 0 — early flight (10 frames)
  ...Array.from({ length: 10 }, (_, i) => ({ row: 0, col: i })),
  // Row 1 — continued dive + tumble (10 frames)
  ...Array.from({ length: 10 }, (_, i) => ({ row: 1, col: i })),
  // Row 2 — recovery + stand (8 frames)
  ...Array.from({ length: 8 }, (_, i) => ({ row: 2, col: i })),
];

interface Props {
  /** Display width. Number = px. String = any CSS value (e.g. "100%"). */
  width?: number | string;
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

  // Support both numeric (px) and string (e.g. "100%") widths.
  const cssWidth = typeof width === "number" ? `${width}px` : width;
  // For numeric widths we can compute height directly; otherwise rely on
  // CSS aspect-ratio so the element scales with the container.
  const computedStyle: React.CSSProperties =
    typeof width === "number"
      ? { width: cssWidth, height: `${width * CELL_ASPECT}px` }
      : { width: cssWidth, aspectRatio: `${1} / ${CELL_ASPECT}` };

  return (
    <div
      className={className}
      style={{
        ...computedStyle,
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
