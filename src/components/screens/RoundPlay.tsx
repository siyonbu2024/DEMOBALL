"use client";

import { useEffect } from "react";
import {
  aiPickZone,
  getNextKicker,
  getPlayerHistory,
} from "@/lib/game-logic";
import { jitteredThinkingMs } from "@/lib/match-pairing";
import { TIMING } from "@/lib/timing";
import { useMatchStore } from "@/store/match-store";
import { ScoreHeader } from "../ScoreHeader";
import { SlideKicker } from "../SlideKicker";
import { TapKeeper } from "../TapKeeper";

export const RoundPlay = () => {
  const matchState = useMatchStore((s) => s.matchState);
  const opponent = useMatchStore((s) => s.currentOpponent);
  const pendingKickerChoice = useMatchStore((s) => s.pendingKickerChoice);
  const pendingKeeperChoice = useMatchStore((s) => s.pendingKeeperChoice);
  const setKickerChoice = useMatchStore((s) => s.setKickerChoice);
  const setKeeperChoice = useMatchStore((s) => s.setKeeperChoice);
  const commitRound = useMatchStore((s) => s.commitRound);

  const humanIsKicker = getNextKicker(matchState) === "p1";

  useEffect(() => {
    if (!opponent) return;
    const brain = opponent.brain;

    if (
      humanIsKicker &&
      pendingKickerChoice !== null &&
      pendingKeeperChoice === null
    ) {
      const ms = jitteredThinkingMs(brain);
      const t = setTimeout(() => {
        const history = getPlayerHistory(matchState.rounds, "p1", "kicker");
        const z = aiPickZone("keeper", brain, history, Math.random);
        setKeeperChoice(z);
      }, ms);
      return () => clearTimeout(t);
    }

    if (!humanIsKicker && pendingKickerChoice === null) {
      const ms = jitteredThinkingMs(brain);
      const t = setTimeout(() => {
        const history = getPlayerHistory(matchState.rounds, "p1", "keeper");
        const z = aiPickZone("kicker", brain, history, Math.random);
        setKickerChoice(z);
      }, ms);
      return () => clearTimeout(t);
    }
  }, [
    opponent,
    humanIsKicker,
    pendingKickerChoice,
    pendingKeeperChoice,
    matchState.rounds,
    setKickerChoice,
    setKeeperChoice,
  ]);

  useEffect(() => {
    if (pendingKickerChoice !== null && pendingKeeperChoice !== null) {
      const t = setTimeout(commitRound, TIMING.commitBuffer);
      return () => clearTimeout(t);
    }
  }, [pendingKickerChoice, pendingKeeperChoice, commitRound]);

  return (
    <div className="flex flex-col flex-1">
      <ScoreHeader />
      <div className="text-center text-white/80 text-xs py-2 px-4">
        {humanIsKicker
          ? pendingKickerChoice === null
            ? "แตะช่องเป้าหมาย"
            : pendingKeeperChoice === null
            ? "คู่ต่อสู้กำลังเซฟ…"
            : "คู่ต่อสู้ล็อค!"
          : pendingKickerChoice === null
          ? "คู่ต่อสู้กำลังเล็ง…"
          : pendingKeeperChoice === null
          ? "ป้องกัน — แตะช่อง!"
          : "ล็อคแล้ว"}
      </div>
      <div className="flex-1 flex items-center justify-center px-3 pb-3">
        {humanIsKicker ? (
          <SlideKicker
            onLock={setKickerChoice}
            disabled={pendingKickerChoice !== null}
          />
        ) : (
          <TapKeeper
            onLock={setKeeperChoice}
            disabled={
              pendingKickerChoice === null || pendingKeeperChoice !== null
            }
          />
        )}
      </div>
    </div>
  );
};
