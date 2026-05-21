"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { play } from "@/lib/sound";
import { TIMING } from "@/lib/timing";
import { ALL_ZONES, type Zone } from "@/lib/types";
import { PLAY_AREA, zoneRect } from "@/lib/zone-geometry";
import { Ball } from "./svg/Ball";
import { Goal } from "./svg/Goal";
import { Keeper } from "./svg/Keeper";
import { LottieKeeper } from "./svg/LottieKeeper";
import { LottieShooter } from "./svg/LottieShooter";
import { Pitch } from "./svg/Pitch";
import { Shooter } from "./svg/Shooter";

interface Props {
  onLock: (zone: Zone) => void;
  disabled?: boolean;
}

const TIMER_R = 22;
const TIMER_CIRC = 2 * Math.PI * TIMER_R;
const BALL_R = 21; // 14 * 1.5 = 21 (50% bigger)

/**
 * Tap-to-aim kicker — picks the zone the user tapped. Ball stays at the
 * penalty spot until the reveal animation takes over.
 */
export const SlideKicker = ({ onLock, disabled = false }: Props) => {
  const [lockedZone, setLockedZone] = useState<Zone | null>(null);

  // Auto-lock on timer expiration — default to centre-bottom (zone 5).
  useEffect(() => {
    if (disabled || lockedZone !== null) return;
    const t = setTimeout(() => {
      if (lockedZone === null) {
        const zone: Zone = 5;
        navigator.vibrate?.(20);
        play("click");
        setLockedZone(zone);
        onLock(zone);
      }
    }, TIMING.decisionTimer);
    return () => clearTimeout(t);
  }, [disabled, lockedZone, onLock]);

  const onTapZone = (z: Zone) => {
    if (disabled || lockedZone !== null) return;
    navigator.vibrate?.(20);
    play("click");
    setLockedZone(z);
    onLock(z);
  };

  const showLocked = lockedZone !== null;

  return (
    <div
      className="relative w-full select-none touch-none"
      style={{ aspectRatio: `${PLAY_AREA.width} / ${PLAY_AREA.height}` }}
    >
      <svg
        viewBox={`0 0 ${PLAY_AREA.width} ${PLAY_AREA.height}`}
        className="absolute inset-0 w-full h-full"
        style={{ shapeRendering: "crispEdges" }}
        aria-hidden
      >
        <Pitch />

        <Goal
          userHighlight={lockedZone}
          dim
          showLabels={!showLocked}
        />

        {/* Static keeper kept for reference but hidden — Lottie idle below
            renders the actual animated character on top. */}
        <g style={{ opacity: 0 }}>
          <Keeper divingTo={null} />
        </g>

        {/* Timer ring */}
        {!showLocked && !disabled && (
          <motion.circle
            cx={PLAY_AREA.ballStartX}
            cy={PLAY_AREA.ballStartY}
            r={TIMER_R}
            fill="none"
            stroke="#FFEDC1"
            strokeWidth={2}
            strokeDasharray={TIMER_CIRC}
            initial={{ strokeDashoffset: 0 }}
            animate={{ strokeDashoffset: TIMER_CIRC }}
            transition={{
              duration: TIMING.decisionTimer / 1000,
              ease: "linear",
            }}
            style={{
              transform: `rotate(-90deg)`,
              transformOrigin: `${PLAY_AREA.ballStartX}px ${PLAY_AREA.ballStartY}px`,
            }}
          />
        )}

        {/* Static SVG shooter hidden — Lottie overlay below renders the
            animated idle pose. Kept in tree for layout parity. */}
        <g style={{ opacity: 0 }}>
          <Shooter pose="idle" />
        </g>

        {/* Ball stays at start position — only flies during RevealOverlay */}
        <Ball cx={PLAY_AREA.ballStartX} cy={PLAY_AREA.ballStartY} r={BALL_R} />
      </svg>

      {/* Lottie shooter — idle, anchored at the ball position. Same height
          as the in-reveal shooter so the swap into RevealOverlay is seamless. */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: `${(PLAY_AREA.ballStartX / PLAY_AREA.width) * 100}%`,
          top: `${((PLAY_AREA.height - 10) / PLAY_AREA.height) * 100}%`,
          transform: "translate(-50%, -100%)",
          height: `${(180 / PLAY_AREA.height) * 100}%`,
          aspectRatio: `${252 / 388}`,
          zIndex: 4,
        }}
      >
        <LottieShooter variant="idle" side="user" />
      </div>

      {/* Lottie keeper — idle. Anchor sits ~25 viewBox units below the
          goal floor so the keeper feet land inside the pitch (gives the
          character a touch more room to breathe). */}
      <div
        className="absolute pointer-events-none flex justify-center"
        style={{
          left: "50%",
          top: `${((PLAY_AREA.goalHeight + 25) / PLAY_AREA.height) * 100}%`,
          transform: "translate(-50%, -100%)",
          height: `${(240 / PLAY_AREA.height) * 100}%`,
        }}
      >
        <LottieKeeper loop />
      </div>

      {/* Tappable zone overlay — tap a zone to kick */}
      {!showLocked && (
        <div className="absolute inset-0" style={{ top: 0, height: `${(PLAY_AREA.goalHeight / PLAY_AREA.height) * 100}%` }}>
          {ALL_ZONES.map((z) => {
            const r = zoneRect(z);
            const left = (r.x / PLAY_AREA.width) * 100;
            const top = (r.y / PLAY_AREA.goalHeight) * 100;
            const w = (r.width / PLAY_AREA.width) * 100;
            const h = (r.height / PLAY_AREA.goalHeight) * 100;
            return (
              <button
                key={z}
                onClick={() => onTapZone(z)}
                disabled={disabled}
                className="absolute transition-colors active:bg-white/10 hover:bg-white/5"
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                  width: `${w}%`,
                  height: `${h}%`,
                }}
                aria-label={`Kick to zone ${z}`}
              />
            );
          })}
        </div>
      )}

      {/* Helper text */}
      <div className="absolute inset-x-0 bottom-2 text-center text-xs text-white/60 pointer-events-none">
        {showLocked
          ? `ล็อค zone ${lockedZone}`
          : disabled
          ? ""
          : "แตะช่องเป้าหมาย"}
      </div>
    </div>
  );
};
