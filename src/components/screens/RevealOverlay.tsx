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
import { LottieKeeper, type KeeperAnim } from "../svg/LottieKeeper";
import { LottieShooter } from "../svg/LottieShooter";
import { Pitch } from "../svg/Pitch";
import { Shooter } from "../svg/Shooter";

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
  return (
    <RevealStage
      kicker={last.kickerChoice}
      keeper={last.keeperChoice}
      isGoal={last.outcome === "goal"}
      userIsKicker={last.kicker === "p1"}
    />
  );
};

function RevealStage({
  kicker,
  keeper,
  isGoal,
  userIsKicker,
}: {
  kicker: Zone;
  keeper: Zone;
  isGoal: boolean;
  userIsKicker: boolean;
}) {
  const [activeKeeper, setActiveKeeper] = useState<Zone | null>(null);
  const [activePose, setActivePose] = useState<"idle" | "caught" | "beaten">("idle");
  const [shooterPose, setShooterPose] = useState<"idle" | "windup" | "follow-through">("idle");
  /** Idle until tKeeper, then flips to the appropriate dive variant. */
  const [keeperAnim, setKeeperAnim] = useState<KeeperAnim>("idle");

  const targetK = zoneCenter(kicker);

  // Horizontal landing (% of play area width).
  const diveTargetLeftPct =
    keeper === 1 || keeper === 4 ? 28
    : keeper === 3 || keeper === 6 ? 72
    : 50;

  // Vertical landing. Top-row zones (1/2/3) → keeper jumps so the
  // bottom of the wrapper sits at the top-row's lower edge (y=120 + offset).
  // Bottom-row zones (4/5/6) → wrapper bottom rests slightly below the
  // goal floor so the feet read as inside the pitch.
  // KEEPER_ANCHOR_OFFSET matches the SlideKicker/TapKeeper idle baseline.
  const KEEPER_ANCHOR_OFFSET = 25;
  const isTopRowZone = keeper === 1 || keeper === 2 || keeper === 3;
  const diveTargetTopPct =
    ((isTopRowZone
      ? PLAY_AREA.goalHeight / 2
      : PLAY_AREA.goalHeight) +
      KEEPER_ANCHOR_OFFSET) /
    PLAY_AREA.height *
    100;

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
      // Map the keeper's chosen zone to a dive variant:
      //   left column (1, 4)  → dive-left
      //   centre column (2,5) → dive-center
      //   right column (3, 6) → dive-right
      const next: KeeperAnim =
        keeper === 1 || keeper === 4
          ? "dive-left"
          : keeper === 3 || keeper === 6
          ? "dive-right"
          : "dive-center";
      setKeeperAnim(next);
    }, TIMING.revealKeeperDiveStart);
    return () => clearTimeout(t);
  }, [keeper, isGoal]);

  useEffect(() => {
    const t1 = setTimeout(
      () => setShooterPose("windup"),
      TIMING.revealCharacterWindup,
    );
    const t2 = setTimeout(
      () => setShooterPose("follow-through"),
      TIMING.revealBallFlightStart,
    );
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

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

            {/* User's pick is always blue, opponent's is red — independent
                of which role the user played this round. */}
            <Goal
              userHighlight={userIsKicker ? kicker : keeper}
              opponentHighlight={userIsKicker ? keeper : kicker}
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

            {/* Static SVG keeper hidden — Lottie overlay below drives both
                idle and dive. Kept in tree for layout parity. */}
            <g style={{ opacity: 0 }}>
              <Keeper divingTo={activeKeeper} pose={activePose} />
            </g>

            {/* Static SVG shooter hidden — Lottie overlay below plays the
                full shooting animation. Kept in tree for layout parity. */}
            <g style={{ opacity: 0 }}>
              <Shooter pose={shooterPose} />
            </g>

          </svg>

          {/* Keeper — idle Lottie before tKeeper, swaps to dive variant on
              dive. Same canvas size across all variants, so the swap is
              seamless. Wrapper also slides toward the chosen zone. */}
          <motion.div
            className="absolute pointer-events-none flex justify-center"
            style={{
              // 240 viewBox units → keeper character (which occupies the
              // bottom ~50 % of the 1200×670 Lottie canvas) ends up roughly
              // 120 SVG units tall — about one goal-zone of height.
              height: `${(240 / PLAY_AREA.height) * 100}%`,
              zIndex: 5,
            }}
            initial={{
              left: "50%",
              top: `${((PLAY_AREA.goalHeight + KEEPER_ANCHOR_OFFSET) / PLAY_AREA.height) * 100}%`,
              x: "-50%",
              y: "-100%",
            }}
            animate={{
              left: keeperAnim === "idle" ? "50%" : `${diveTargetLeftPct}%`,
              top:
                keeperAnim === "idle"
                  ? `${((PLAY_AREA.goalHeight + KEEPER_ANCHOR_OFFSET) / PLAY_AREA.height) * 100}%`
                  : `${diveTargetTopPct}%`,
              x: "-50%",
              y: "-100%",
            }}
            transition={{
              duration:
                (TIMING.revealImpactMoment - TIMING.revealKeeperDiveStart) /
                1000,
              ease: EASING.outExpo,
            }}
          >
            <LottieKeeper
              variant={keeperAnim}
              loop={keeperAnim === "idle"}
            />
          </motion.div>

          {/* Lottie shooter — plays the full windup→kick→follow-through arc.
              Mirrors for right-column kicks and steps forward slightly
              during the windup so the kick has a sense of momentum. */}
          <motion.div
            className="absolute pointer-events-none"
            style={{
              left: `${(PLAY_AREA.ballStartX / PLAY_AREA.width) * 100}%`,
              height: `${(180 / PLAY_AREA.height) * 100}%`,
              aspectRatio: `${252 / 388}`,
              zIndex: 4,
            }}
            initial={{
              top: `${((PLAY_AREA.height - 10) / PLAY_AREA.height) * 100}%`,
              x: "-50%",
              y: "-100%",
            }}
            animate={{
              // Move 35 viewBox units forward (toward the goal) by the
              // moment the ball leaves the foot.
              top: `${((PLAY_AREA.height - 10 - 35) / PLAY_AREA.height) * 100}%`,
              x: "-50%",
              y: "-100%",
            }}
            transition={{
              delay: TIMING.revealCharacterWindup / 1000,
              duration:
                (TIMING.revealImpactMoment - TIMING.revealCharacterWindup) /
                1000,
              ease: EASING.outExpo,
            }}
          >
            <LottieShooter
              variant="shooting"
              side={userIsKicker ? "user" : "enemy"}
              flipX={kicker === 3 || kicker === 6}
            />
          </motion.div>

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
        {userIsKicker
          ? `คุณยิง zone ${kicker} · คู่ต่อสู้เซฟ zone ${keeper}`
          : `คู่ต่อสู้ยิง zone ${kicker} · คุณเซฟ zone ${keeper}`}
      </div>
    </div>
  );
}


