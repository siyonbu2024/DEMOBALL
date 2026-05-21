"use client";

import { motion } from "framer-motion";
import type { Zone } from "@shared/types";
import { zoneCenter } from "@shared/zone-geometry";
import { PLAY_AREA } from "@shared/zone-geometry";

interface Props {
  /** If set, the keeper dives toward this zone. Null = idle at center. */
  divingTo?: Zone | null;
  /** Position of keeper body anchor (defaults to goal-line center). */
  cx?: number;
  cy?: number;
  /** "idle" | "caught" | "beaten" | undefined */
  pose?: "idle" | "caught" | "beaten";
}

/**
 * Animated SVG Keeper. Uses framer-motion for reliable animation.
 * - divingTo = null  → stays at center (idle)
 * - divingTo = Zone  → animates toward that zone
 */
export const Keeper = ({
  divingTo = null,
  cx = PLAY_AREA.width / 2,
  cy = PLAY_AREA.goalHeight,
  pose,
}: Props) => {
  const target = divingTo ? zoneCenter(divingTo) : null;

  // Keeper leaps 65% of the way to the target zone
  const reach = 0.65;
  const moveX = target ? (target.x - cx) * reach : 0;
  const moveY = target ? (target.y - cy) * reach : 0;

  // Pose offset
  const bodyDy = pose === "caught" ? -5 : pose === "beaten" ? 15 : 0;

  const width = 140;
  const height = width * (334 / 382);

  return (
    <motion.g
      animate={{
        x: moveX,
        y: moveY + bodyDy,
      }}
      transition={{
        duration: 0.35,
        ease: [0.2, 0.8, 0.2, 1],
      }}
    >
      <image
        href="/KEEPER.svg"
        x={cx - width / 2}
        y={cy - height + 10}
        width={width}
        height={height}
      />
    </motion.g>
  );
};
