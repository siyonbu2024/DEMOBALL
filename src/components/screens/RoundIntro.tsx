"use client";

import { useEffect } from "react";
import { getCurrentRoundIndex, getNextKicker } from "@/lib/game-logic";
import { play } from "@/lib/sound";
import { TIMING } from "@/lib/timing";
import { useMatchStore } from "@/store/match-store";

export const RoundIntro = () => {
  const matchState = useMatchStore((s) => s.matchState);
  const enterRound = useMatchStore((s) => s.enterRound);

  const roundsPlayed = getCurrentRoundIndex(matchState);
  const isSuddenDeath = roundsPlayed >= 10;
  const youKick = getNextKicker(matchState) === "p1";

  useEffect(() => {
    play("whistle");
    const t = setTimeout(enterRound, TIMING.roundIntro);
    return () => clearTimeout(t);
  }, [enterRound]);

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-3">
      <div className="text-white/60 text-xs uppercase tracking-[0.3em]">
        {isSuddenDeath ? "Sudden Death" : `Round ${roundsPlayed + 1} / 10`}
      </div>
      <div className="text-4xl font-black text-white">
        {youKick ? "คุณยิง" : "ฝั่งคุณกัน"}
      </div>
    </div>
  );
};
