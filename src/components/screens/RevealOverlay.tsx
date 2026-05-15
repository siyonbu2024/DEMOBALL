"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { play } from "@/lib/sound";
import { EASING, TIMING } from "@/lib/timing";
import type { Zone } from "@/lib/types";
import { PLAY_AREA, zoneCenter } from "@/lib/zone-geometry";
import { useMatchStore } from "@/store/match-store";
import { ScoreHeader } from "../ScoreHeader";
import { Goal } from "../svg/Goal";
import { Keeper } from "../svg/Keeper";
import { Pitch } from "../svg/Pitch";

export const RevealOverlay = () => {
  const matchState = useMatchStore((s) => s.matchState);
  const finishReveal = useMatchStore((s) => s.finishReveal);
  const last = matchState.rounds[matchState.rounds.length - 1];

  useEffect(() => {
    if (!last) return;
    const isGoal = last.outcome === "goal";
    const tWhoosh = setTimeout(
      () => play("whoosh"),
      TIMING.revealBallFlightStart
    );
    const tImpact = setTimeout(
      () => play(isGoal ? "swish" : "punch"),
      TIMING.revealImpactMoment
    );
    const tDone = setTimeout(finishReveal, TIMING.revealTotal);
    return () => {
      clearTimeout(tWhoosh);
      clearTimeout(tImpact);
      clearTimeout(tDone);
    };
  }, [finishReveal, last]);

  if (!last) return null;
  return <RevealStage kicker={last.kickerChoice} keeper={last.keeperChoice} isGoal={last.outcome === "goal"} />;
};

function RevealStage({
  kicker,
  keeper,
  isGoal,
}: {
  kicker: Zone;
  keeper: Zone;
  isGoal: boolean;
}) {
  const [activeKeeper, setActiveKeeper] = useState<Zone | null>(null);
  const [activePose, setActivePose] = useState<"idle" | "caught" | "beaten">("idle");

  const targetK = zoneCenter(kicker);

  // Times in seconds (Framer takes seconds for delay/duration)
  const tBall = TIMING.revealBallFlightStart / 1000;
  const tBallEnd = TIMING.revealImpactMoment / 1000;
  const tKeeper = TIMING.revealKeeperDiveStart / 1000;
  const tBurst = TIMING.revealOutcomeBurst / 1000;
  const tFlash = TIMING.revealImpactMoment / 1000;

  useEffect(() => {
    const t = setTimeout(() => {
      setActiveKeeper(keeper);
      setActivePose(isGoal ? "beaten" : "caught");
    }, TIMING.revealKeeperDiveStart);
    return () => clearTimeout(t);
  }, [keeper, isGoal]);

  return (
    <div className="flex flex-col flex-1">
      <ScoreHeader />
      <div className="flex-1 flex items-center justify-center px-3 py-2 relative">
        <div
          className="relative w-full"
          style={{
            aspectRatio: `${PLAY_AREA.width} / ${PLAY_AREA.height}`,
          }}
        >
          <svg
            viewBox={`0 0 ${PLAY_AREA.width} ${PLAY_AREA.height}`}
            className="absolute inset-0 w-full h-full"
            style={{ shapeRendering: "crispEdges" }}
            aria-hidden
          >
            <Pitch />

            {/* Goal with both choices highlighted */}
            <Goal
              kickerHighlight={kicker}
              keeperHighlight={keeper}
              showLabels={false}
            />

            {/* Goal flash on impact (goal only) */}
            {isGoal && (
              <motion.rect
                x={0}
                y={0}
                width={PLAY_AREA.goalWidth}
                height={PLAY_AREA.goalHeight}
                fill="#FFEDC1"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.5, 0] }}
                transition={{
                  delay: tFlash,
                  duration: TIMING.goalScreenFlash / 1000 * 4,
                }}
              />
            )}

            {/* Keeper dive */}
            <motion.g
              initial={{ opacity: 1 }}
              animate={{
                scale: [1, 1.06, 1],
              }}
              transition={{
                delay: tKeeper,
                duration: 0.4,
                ease: EASING.outExpo,
              }}
              style={{
                transformOrigin: `${PLAY_AREA.width / 2}px ${PLAY_AREA.goalHeight}px`,
              }}
            >
              <Keeper
                divingTo={activeKeeper}
                pose={activePose}
              />
            </motion.g>

          </svg>

          {/* Ball flight — DOM overlay so % positions match SVG viewBox exactly */}
          <motion.div
            className="absolute pointer-events-none"
            style={{
              width: `${(42 / PLAY_AREA.width) * 100}%`,
              aspectRatio: "1 / 1",
              translateX: "-50%",
              translateY: "-50%",
            }}
            initial={{
              left: `${(PLAY_AREA.ballStartX / PLAY_AREA.width) * 100}%`,
              top: `${(PLAY_AREA.ballStartY / PLAY_AREA.height) * 100}%`,
              scale: 1,
            }}
            animate={{
              left: `${(targetK.x / PLAY_AREA.width) * 100}%`,
              top: `${(targetK.y / PLAY_AREA.height) * 100}%`,
              scale: 0.75,
            }}
            transition={{
              delay: tBall,
              duration: tBallEnd - tBall,
              ease: EASING.outExpo,
            }}
          >
            <img src="/Ball.svg" className="w-full h-full" alt="" />
          </motion.div>

          {/* Outcome burst (DOM, not SVG, so font scales with parent) */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: tBurst,
              type: "spring",
              stiffness: 400,
              damping: 15,
            }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div
              className={`text-7xl font-black tracking-tight drop-shadow-[0_3px_0_rgba(0,0,0,0.45)] ${
                isGoal ? "text-emerald-300" : "text-rose-300"
              }`}
            >
              {isGoal ? "GOAL!" : "SAVE!"}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="text-center text-white/70 text-xs py-2 tabular-nums">
        คุณยิง zone {kicker} · ผู้รักษาเลือก zone {keeper}
      </div>
    </div>
  );
}
