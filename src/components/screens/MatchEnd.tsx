"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { play } from "@/lib/sound";
import { TIMING } from "@shared/timing";
import { GameButton } from "@/components/GameButton";
import { RAKE_RATE_1V1 } from "@shared/types";
import { useMatchStore } from "@/store/match-store";

export const MatchEnd = () => {
  const matchState = useMatchStore((s) => s.matchState);
  const opponent = useMatchStore((s) => s.currentOpponent);
  const ctx = useMatchStore((s) => s.currentMatchContext);
  const replayMatch = useMatchStore((s) => s.replayMatch);
  const exitMatch = useMatchStore((s) => s.exitMatch);
  const leaveBracket = useMatchStore((s) => s.leaveBracket);
  const youWin = matchState.winner === "p1";

  useEffect(() => {
    play(youWin ? "cheer" : "ohh");
  }, [youWin]);

  const isOneVone =
    ctx?.type === "quick-1v1" || ctx?.type === "specific-1v1";
  const isBracket = ctx?.type === "bracket";

  const has1v1Bet = isOneVone && ctx && "entryFee" in ctx && ctx.entryFee > 0;
  const entryFee = has1v1Bet && ctx && "entryFee" in ctx ? ctx.entryFee : 0;
  const pot = has1v1Bet && ctx && "pot" in ctx ? ctx.pot : 0;
  const prize = has1v1Bet ? pot - Math.floor(pot * RAKE_RATE_1V1) : 0;
  const tokenDelta = youWin ? prize - entryFee : -entryFee;

  return (
    <div className="flex flex-col items-center flex-1 gap-5 px-5 py-6 text-center overflow-y-auto">
      <div className="flex flex-col gap-1 mt-2">
        <div className="text-sm uppercase tracking-[0.4em] text-white/60">
          Match end
        </div>
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 280,
            damping: 14,
            delay: TIMING.matchEndEntrance / 1000 - 1.5,
          }}
          className={`text-7xl font-black tracking-tight drop-shadow-[0_3px_0_rgba(0,0,0,0.45)] ${
            youWin ? "text-emerald-300" : "text-rose-300"
          }`}
        >
          {youWin ? "WIN" : "LOSE"}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: TIMING.matchEndScoreReveal / 1000 }}
        className="text-xl font-bold tabular-nums text-white"
      >
        คุณ {matchState.score.p1} – {matchState.score.p2}{" "}
        <span className="opacity-90">
          {opponent?.identity.avatar} {opponent?.identity.username}
        </span>
      </motion.div>

      {has1v1Bet && (
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 320,
            damping: 18,
            delay: (TIMING.matchEndScoreReveal + 300) / 1000,
          }}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-md border ${
            youWin
              ? "bg-emerald-500/15 border-emerald-400/40"
              : "bg-rose-500/15 border-rose-400/40"
          }`}
        >
          <span className="text-2xl">🪙</span>
          <div className="text-left">
            <div className="text-[10px] uppercase tracking-widest text-white/60 font-bold leading-tight">
              {youWin ? "Token ที่ได้รับ" : "Token ที่เสีย"}
            </div>
            <div
              className={`text-xl font-black tabular-nums leading-tight ${
                tokenDelta > 0
                  ? "text-emerald-300"
                  : tokenDelta < 0
                  ? "text-rose-300"
                  : "text-white"
              }`}
            >
              {tokenDelta > 0 ? "+" : ""}
              {tokenDelta.toLocaleString()}
            </div>
          </div>
          {youWin && (
            <div className="text-[10px] text-white/40 ml-1 leading-tight">
              pot {pot}
              <br />
              -rake {Math.floor(pot * RAKE_RATE_1V1)}
            </div>
          )}
        </motion.div>
      )}

      <RoundSummary />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: TIMING.matchEndCTADelay / 1000 }}
        className="flex flex-col gap-3 w-full max-w-xs mt-auto pb-2"
      >
        {isOneVone && (
          <>
            <GameButton onClick={replayMatch} size="lg" className="w-full">
              🔄 เล่นอีกครั้ง
            </GameButton>
            <div className="flex gap-2">
              <GameButton onClick={exitMatch} className="flex-1">
                กลับห้อง
              </GameButton>
              <ShareButton />
            </div>
          </>
        )}
        {isBracket && youWin && (
          <>
            <GameButton onClick={exitMatch} size="lg" className="w-full">
              ดู bracket ต่อ
            </GameButton>
            <ShareButton />
          </>
        )}
        {isBracket && !youWin && (
          <GameButton onClick={leaveBracket} size="lg" className="w-full">
            ออกจากห้อง
          </GameButton>
        )}
      </motion.div>
    </div>
  );
};

function RoundSummary() {
  const rounds = useMatchStore((s) => s.matchState.rounds);
  if (rounds.length === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1 }}
      className="flex flex-wrap justify-center gap-1.5 mt-1 max-w-[280px]"
    >
      {rounds.map((r, idx) => {
        const youKicked = r.kicker === "p1";
        const youScored =
          (youKicked && r.outcome === "goal") ||
          (!youKicked && r.outcome === "save");
        return (
          <motion.div
            key={idx}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: 1 + (idx * TIMING.summaryStagger) / 1000,
              type: "spring",
              stiffness: 400,
              damping: 18,
            }}
            className={`flex flex-col items-center justify-center w-7 h-9 rounded-md text-[9px] font-bold leading-tight ${
              youScored
                ? "bg-emerald-500/30 text-emerald-100 ring-1 ring-emerald-400/60"
                : "bg-rose-500/30 text-rose-100 ring-1 ring-rose-400/60"
            }`}
            title={`Round ${idx + 1} — ${
              youKicked ? "you kicked" : "AI kicked"
            } — ${r.outcome}`}
          >
            <span>{youKicked ? "K" : "A"}</span>
            <span className="tabular-nums">{idx + 1}</span>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

function ShareButton() {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), TIMING.toastDuration);
    return () => clearTimeout(t);
  }, [copied]);

  const onShare = async () => {
    try {
      const url =
        typeof window !== "undefined"
          ? window.location.href
          : "https://football-demo.vercel.app";
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      }
      setCopied(true);
    } catch {
      // Clipboard blocked — show toast anyway so the gesture feels successful
      setCopied(true);
    }
  };

  return (
    <>
      <GameButton onClick={onShare} className="flex-1">
        แชร์
      </GameButton>
      {copied && (
        <div className="fixed inset-x-0 bottom-8 flex justify-center pointer-events-none z-50">
          <div className="px-5 py-3 bg-black/80 text-white rounded-md text-sm shadow-lg">
            คัดลอกลิงก์แล้ว
          </div>
        </div>
      )}
    </>
  );
}
