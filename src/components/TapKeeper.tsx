"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { play } from "@/lib/sound";
import { TIMING } from "@shared/timing";
import { ALL_ZONES, type Zone } from "@shared/types";
import { PLAY_AREA, zoneRect } from "@shared/zone-geometry";
import { Goal } from "./svg/Goal";
import { Keeper } from "./svg/Keeper";
import { LottieKeeper } from "./svg/LottieKeeper";
import { LottieShooter } from "./svg/LottieShooter";
import { Pitch } from "./svg/Pitch";

interface Props {
  onLock: (zone: Zone) => void;
  disabled?: boolean;
  /**
   * When set, the keeper visually dives to this zone.
   * This is intentionally decoupled from the player's locked choice —
   * the keeper should only move AFTER the reveal, not when the player taps.
   */
  revealZone?: Zone | null;
}

const TIMER_R = 22;
const TIMER_CIRC = 2 * Math.PI * TIMER_R;

/**
 * Tap-grid keeper. Six big zone targets over the goal SVG. Tapping picks
 * the zone the keeper will dive toward. Same prop interface as SlideKicker.
 *
 * Keeper stays in idle pose while the player is choosing.
 * Keeper only dives when `revealZone` is provided (i.e. after reveal phase).
 */
export const TapKeeper = ({ onLock, disabled = false, revealZone = null }: Props) => {
  const [lockedZone, setLockedZone] = useState<Zone | null>(null);

  // Reset locked choice each time the player becomes active (disabled: true → false)
  useEffect(() => {
    if (!disabled) {
      setLockedZone(null);
    }
  }, [disabled]);

  useEffect(() => {
    if (disabled || lockedZone !== null) return;
    const t = setTimeout(() => {
      if (lockedZone === null) {
        // Default to zone 5 (bottom-centre) if user doesn't pick — most neutral
        const z: Zone = 5;
        navigator.vibrate?.(20);
        play("click");
        setLockedZone(z);
        onLock(z);
      }
    }, TIMING.decisionTimer);
    return () => clearTimeout(t);
  }, [disabled, lockedZone, onLock]);

  const onTap = (z: Zone) => {
    if (disabled || lockedZone !== null) return;
    navigator.vibrate?.(20);
    play("click");
    setLockedZone(z);
    onLock(z);
  };

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

        <Goal userHighlight={lockedZone} dim showLabels={lockedZone === null} />

        {/* Static SVG keeper — only visible when diving (revealZone set).
            Idle pose is drawn by the Lottie overlay below. */}
        {revealZone !== null && (
          <Keeper divingTo={revealZone} pose={undefined} />
        )}

        {/* Timer ring at top of pitch */}
        {!disabled && lockedZone === null && (
          <motion.circle
            cx={PLAY_AREA.width / 2}
            cy={PLAY_AREA.goalHeight + 60}
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
              transformOrigin: `${PLAY_AREA.width / 2}px ${PLAY_AREA.goalHeight + 60}px`,
            }}
          />
        )}
      </svg>

      {/* Lottie keeper — idle. Anchor sits ~25 viewBox units below the
          goal floor so the feet land slightly inside the pitch. */}
      {revealZone === null && (
        <div
          className="absolute pointer-events-none flex justify-center"
          style={{
            left: "50%",
            top: `${((PLAY_AREA.goalHeight + 25) / PLAY_AREA.height) * 100}%`,
            transform: "translate(-50%, -100%)",
            height: `${(240 / PLAY_AREA.height) * 100}%`,
            zIndex: 5,
          }}
        >
          <LottieKeeper loop />
        </div>
      )}

      {/* Opponent shooter — uses the _enemy JSON so the kit reads as
          the opposing side. */}
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
        <LottieShooter variant="idle" side="enemy" />
      </div>

      {/* Tappable zone overlay (positioned in % over the SVG) */}
      <div className="absolute inset-0">
        {ALL_ZONES.map((z) => {
          const r = zoneRect(z);
          const left = (r.x / PLAY_AREA.width) * 100;
          const top = (r.y / PLAY_AREA.height) * 100;
          const w = (r.width / PLAY_AREA.width) * 100;
          const h = (r.height / PLAY_AREA.height) * 100;
          const isLocked = lockedZone === z;
          return (
            <button
              key={z}
              onClick={() => onTap(z)}
              disabled={disabled || lockedZone !== null}
              className={`absolute font-mono font-bold transition ${
                isLocked
                  ? "ring-4 ring-blue-400/80 bg-blue-500/20"
                  : "active:bg-white/10"
              }`}
              style={{
                left: `${left}%`,
                top: `${top}%`,
                width: `${w}%`,
                height: `${h}%`,
              }}
              aria-label={`Defend zone ${z}`}
            />
          );
        })}
      </div>

      <div className="absolute inset-x-0 bottom-2 text-center text-xs text-white/60 pointer-events-none">
        {lockedZone !== null
          ? `ล็อค zone ${lockedZone}`
          : disabled
          ? ""
          : "แตะช่องที่จะป้องกัน"}
      </div>
    </div>
  );
};
