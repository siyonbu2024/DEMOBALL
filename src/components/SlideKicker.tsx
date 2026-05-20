"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { play } from "@/lib/sound";
import { TIMING } from "@/lib/timing";
import { ALL_ZONES, type Zone } from "@/lib/types";
import { PLAY_AREA, zoneCenter, zoneFromDragOffset, zoneRect } from "@/lib/zone-geometry";
import { Ball } from "./svg/Ball";
import { Goal } from "./svg/Goal";
import { Keeper } from "./svg/Keeper";
import { LottieKeeper } from "./svg/LottieKeeper";
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
 * Slide-to-aim OR tap-to-aim kicker.
 * Drag the ball toward a zone, OR tap a zone directly to lock.
 */
export const SlideKicker = ({ onLock, disabled = false }: Props) => {
  const playRef = useRef<HTMLDivElement>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [previewZone, setPreviewZone] = useState<Zone | null>(null);
  const [lockedZone, setLockedZone] = useState<Zone | null>(null);

  // Convert pixel-space drag offset to viewBox units, then derive zone.
  const computeZoneFromPx = (pxX: number, pxY: number): Zone => {
    const rect = playRef.current?.getBoundingClientRect();
    const scaleX = rect ? PLAY_AREA.width / rect.width : 1;
    const scaleY = rect ? PLAY_AREA.height / rect.height : 1;
    return zoneFromDragOffset(pxX * scaleX, pxY * scaleY);
  };

  // Auto-lock on timer expiration
  useEffect(() => {
    if (disabled || lockedZone !== null) return;
    const t = setTimeout(() => {
      if (lockedZone === null) {
        const zone = previewZone ?? 5;
        navigator.vibrate?.(20);
        play("click");
        setLockedZone(zone);
        onLock(zone);
      }
    }, TIMING.decisionTimer);
    return () => clearTimeout(t);
  }, [disabled, lockedZone, previewZone, onLock]);

  const onDragMove = (
    _: unknown,
    info: { offset: { x: number; y: number } }
  ) => {
    setDragOffset(info.offset);
    setPreviewZone(computeZoneFromPx(info.offset.x, info.offset.y));
  };

  const onDragEnd = (
    _: unknown,
    info: { offset: { x: number; y: number } }
  ) => {
    if (lockedZone !== null) return;
    const zone = computeZoneFromPx(info.offset.x, info.offset.y);
    navigator.vibrate?.(20);
    play("click");
    setLockedZone(zone);
    setPreviewZone(zone);
    setDragOffset({ x: 0, y: 0 });
    onLock(zone);
  };

  // Tap a zone directly (alternative to dragging)
  const onTapZone = (z: Zone) => {
    if (disabled || lockedZone !== null) return;
    navigator.vibrate?.(20);
    play("click");
    setLockedZone(z);
    setPreviewZone(z);
    setDragOffset({ x: 0, y: 0 });
    onLock(z);
  };

  const showLocked = lockedZone !== null;
  const lockedCenter = showLocked ? zoneCenter(lockedZone!) : null;

  // Trajectory in viewBox units, derived from pixel offset
  const rect = playRef.current?.getBoundingClientRect();
  const trajX =
    PLAY_AREA.ballStartX +
    (rect ? (dragOffset.x * PLAY_AREA.width) / rect.width : 0);
  const trajY =
    PLAY_AREA.ballStartY +
    (rect ? (dragOffset.y * PLAY_AREA.height) / rect.height : 0);

  return (
    <div
      ref={playRef}
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
          kickerHighlight={lockedZone ?? previewZone}
          dim
          showLabels={!showLocked}
        />

        {/* Static keeper kept for reference but hidden — Lottie idle below
            renders the actual animated character on top. */}
        <g style={{ opacity: 0 }}>
          <Keeper divingTo={null} />
        </g>

        {/* Trajectory while dragging */}
        {!showLocked && (dragOffset.x !== 0 || dragOffset.y !== 0) && (
          <line
            x1={PLAY_AREA.ballStartX}
            y1={PLAY_AREA.ballStartY}
            x2={trajX}
            y2={trajY}
            stroke="#FFEDC1"
            strokeWidth={2}
            strokeDasharray="6 4"
            opacity={0.6}
          />
        )}

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

        {/* Shooter character standing behind/beside the ball */}
        <Shooter pose="idle" />

        {/* Ball stays at start position — only flies during RevealOverlay */}
        <Ball cx={PLAY_AREA.ballStartX} cy={PLAY_AREA.ballStartY} r={BALL_R} />
      </svg>

      {/* Lottie keeper — idle, anchored to goal floor */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: "50%",
          top: `${(PLAY_AREA.goalHeight / PLAY_AREA.height) * 100}%`,
          transform: "translate(-50%, -100%)",
          width: `${(120 / PLAY_AREA.width) * 100}%`,
          aspectRatio: "1 / 1",
        }}
      >
        <LottieKeeper loop />
      </div>

      {/* Tappable zone overlay — tap a zone to kick directly */}
      {!showLocked && (
        <div className="absolute inset-0" style={{ top: 0, height: `${(PLAY_AREA.goalHeight / PLAY_AREA.height) * 100}%` }}>
          {ALL_ZONES.map((z) => {
            const r = zoneRect(z);
            const left = (r.x / PLAY_AREA.width) * 100;
            const top = (r.y / PLAY_AREA.goalHeight) * 100;
            const w = (r.width / PLAY_AREA.width) * 100;
            const h = (r.height / PLAY_AREA.goalHeight) * 100;
            const isPreview = previewZone === z;
            return (
              <button
                key={z}
                onClick={() => onTapZone(z)}
                disabled={disabled}
                className={`absolute transition-colors ${
                  isPreview ? "bg-white/15" : "active:bg-white/10 hover:bg-white/5"
                }`}
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

      {/* Draggable ball overlay (only before lock — SVG ball stays at start after lock) */}
      {!showLocked && (
        <motion.div
          drag={!disabled}
          dragMomentum={false}
          dragElastic={0.15}
          onDrag={onDragMove}
          onDragEnd={onDragEnd}
          whileTap={{ scale: 1.1 }}
          className="absolute will-change-transform"
          style={{
            left: `${(PLAY_AREA.ballStartX / PLAY_AREA.width) * 100}%`,
            top: `${(PLAY_AREA.ballStartY / PLAY_AREA.height) * 100}%`,
            translateX: "-50%",
            translateY: "-50%",
            cursor: disabled ? "not-allowed" : "grab",
            touchAction: "none",
            zIndex: 10,
          }}
        >
          <svg width={BALL_R * 2} height={BALL_R * 2} viewBox={`${-BALL_R} ${-BALL_R} ${BALL_R * 2} ${BALL_R * 2}`} aria-hidden>
            <Ball cx={0} cy={0} r={BALL_R} />
          </svg>
        </motion.div>
      )}

      {/* Helper text */}
      <div className="absolute inset-x-0 bottom-2 text-center text-xs text-white/60 pointer-events-none">
        {showLocked
          ? `ล็อค zone ${lockedZone}`
          : disabled
          ? ""
          : "ลากบอล หรือ แตะช่องเป้าหมาย"}
      </div>
    </div>
  );
};
