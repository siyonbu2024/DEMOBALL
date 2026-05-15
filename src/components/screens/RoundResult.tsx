"use client";

import { useEffect } from "react";
import { TIMING } from "@/lib/timing";
import { useMatchStore } from "@/store/match-store";

export const RoundResult = () => {
  const nextRound = useMatchStore((s) => s.nextRound);

  useEffect(() => {
    const t = setTimeout(nextRound, TIMING.roundEndHold);
    return () => clearTimeout(t);
  }, [nextRound]);

  return (
    <div className="flex flex-col items-center justify-center flex-1">
      <div className="text-white/40 text-sm uppercase tracking-widest">
        Next round…
      </div>
    </div>
  );
};
