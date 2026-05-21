"use client";

import { motion, AnimatePresence } from "framer-motion";
import { TIMING } from "@shared/timing";
import { useMatchStore } from "@/store/match-store";
import type { RoundOutcome } from "@shared/types";

type SlotStatus = RoundOutcome | "pending";

const RoundDot = ({ status, index }: { status: SlotStatus; index: number }) => (
  <motion.div
    className={[
      "w-6 h-6 rounded-full flex items-center justify-center text-xs relative overflow-hidden",
      status === "pending"
        ? "bg-gradient-to-b from-zinc-700 to-zinc-800 border border-zinc-600/60 shadow-inner"
        : status === "goal"
        ? "bg-gradient-to-b from-emerald-400 to-emerald-600 border border-emerald-300/60 shadow-[0_0_6px_rgba(52,211,153,0.5)]"
        : "bg-gradient-to-b from-red-500 to-red-700 border border-red-400/60 shadow-[0_0_6px_rgba(239,68,68,0.4)]",
    ].join(" ")}
    initial={status !== "pending" ? { scale: 0.3 } : false}
    animate={{ scale: 1 }}
    transition={{ type: "spring", stiffness: 450, damping: 18, delay: index * 0.04 }}
  >
    {/* gloss sheen */}
    <div className="absolute inset-x-0 top-0 h-1/2 bg-white/20 rounded-t-full pointer-events-none" />
    <AnimatePresence mode="wait">
      {status === "goal" && (
        <motion.span
          key="ball"
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
          className="relative z-10 leading-none text-[13px]"
        >
          ⚽
        </motion.span>
      )}
      {status === "save" && (
        <motion.span
          key="save"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          className="relative z-10 text-white font-black text-[11px] leading-none"
        >
          ✕
        </motion.span>
      )}
    </AnimatePresence>
  </motion.div>
);

export const ScoreHeader = () => {
  const matchState = useMatchStore((s) => s.matchState);
  const opponent = useMatchStore((s) => s.currentOpponent);
  const round = matchState.rounds.length + 1;
  const isSD = round > 10;
  const roundLabel = isSD ? "SUDDEN DEATH" : `RD ${Math.min(round, 10)} / 10`;

  const p1Kicks: SlotStatus[] = Array.from({ length: 5 }, (_, i) => {
    const kick = matchState.rounds.filter((r) => r.kicker === "p1")[i];
    if (!kick) return "pending";
    return kick.outcome;
  });

  const p2Kicks: SlotStatus[] = Array.from({ length: 5 }, (_, i) => {
    const kick = matchState.rounds.filter((r) => r.kicker === "p2")[i];
    if (!kick) return "pending";
    return kick.outcome;
  });

  return (
    <div className="w-full shadow-2xl" style={{ background: "linear-gradient(180deg, #0d0d0d 0%, #1a1a1a 50%, #111111 100%)" }}>

      {/* ── Red gloss banner ── */}
      <div className="relative overflow-hidden flex items-center justify-center py-[5px]"
        style={{ background: "linear-gradient(180deg, #b91c1c 0%, #ef4444 45%, #b91c1c 100%)" }}>
        {/* top gloss */}
        <div className="absolute inset-x-0 top-0 h-1/2 bg-white/15 pointer-events-none" />
        {/* side vignette */}
        <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/30 to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/30 to-transparent pointer-events-none" />
        <span className="relative text-[10px] font-black tracking-[0.3em] text-white uppercase drop-shadow-md">
          ⚽ &nbsp;PENALTY SHOOTOUT
        </span>
      </div>

      {/* ── Main score row ── */}
      <div className="flex items-center px-3 pt-2.5 pb-1 gap-2">

        {/* Home team badge */}
        <div className="flex-1 flex flex-col items-center gap-1">
          <div className="relative">
            {/* glow ring */}
            <div className="absolute inset-0 rounded-full blur-sm opacity-60"
              style={{ background: "radial-gradient(circle, #34d399, transparent 70%)" }} />
            <div className="relative w-10 h-10 rounded-full flex items-center justify-center text-xl border-2 border-emerald-400/70 overflow-hidden shadow-lg"
              style={{ background: "linear-gradient(145deg, #065f46, #10b981)" }}>
              <div className="absolute inset-x-0 top-0 h-1/2 bg-white/20 pointer-events-none" />
              <span className="relative z-10">🧑</span>
            </div>
          </div>
          <span className="text-[9px] font-black tracking-widest uppercase text-white/90 drop-shadow">
            คุณ
          </span>
        </div>

        {/* Score block */}
        <div className="flex flex-col items-center gap-1">
          {/* LED-style score */}
          <div className="flex items-center gap-1 rounded-md border border-zinc-700/80 px-3 py-1 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)]"
            style={{ background: "linear-gradient(180deg, #050505, #111)" }}>
            <motion.span
              key={`p1-${matchState.score.p1}`}
              initial={{ scale: 1.9, color: "#6ee7b7" }}
              animate={{ scale: 1, color: "#ffffff" }}
              transition={{
                duration: TIMING.scoreNumberSpring / 1000,
                type: "spring",
                stiffness: 350,
                damping: 14,
              }}
              className="font-mono font-black text-3xl tabular-nums w-7 text-center leading-none drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]"
            >
              {matchState.score.p1}
            </motion.span>
            <span className="text-zinc-600 font-black text-xl leading-none pb-0.5 select-none">:</span>
            <motion.span
              key={`p2-${matchState.score.p2}`}
              initial={{ scale: 1.9, color: "#fda4af" }}
              animate={{ scale: 1, color: "#ffffff" }}
              transition={{
                duration: TIMING.scoreNumberSpring / 1000,
                type: "spring",
                stiffness: 350,
                damping: 14,
              }}
              className="font-mono font-black text-3xl tabular-nums w-7 text-center leading-none drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]"
            >
              {matchState.score.p2}
            </motion.span>
          </div>
          {/* Round pill */}
          <div className="rounded-sm px-2 py-0.5 border border-yellow-500/40"
            style={{ background: "linear-gradient(90deg, #78350f55, #92400e99, #78350f55)" }}>
            <span className="text-[9px] font-black tracking-[0.2em] uppercase text-yellow-400 drop-shadow">
              {roundLabel}
            </span>
          </div>
        </div>

        {/* Away team badge */}
        <div className="flex-1 flex flex-col items-center gap-1">
          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-sm opacity-60"
              style={{ background: "radial-gradient(circle, #fb7185, transparent 70%)" }} />
            <div className="relative w-10 h-10 rounded-full flex items-center justify-center text-xl border-2 border-rose-400/70 overflow-hidden shadow-lg"
              style={{ background: "linear-gradient(145deg, #881337, #f43f5e)" }}>
              <div className="absolute inset-x-0 top-0 h-1/2 bg-white/20 pointer-events-none" />
              <span className="relative z-10">{opponent?.identity.avatar ?? "🤖"}</span>
            </div>
          </div>
          <span className="text-[9px] font-black tracking-widest uppercase text-white/90 drop-shadow truncate max-w-[80px]">
            {opponent?.identity.username ?? "AI"}
          </span>
        </div>

      </div>

      {/* ── Round tracker ── */}
      <div className="flex items-center justify-center pt-1.5 pb-2.5 px-3 gap-0"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        {/* P1 kick dots */}
        <div className="flex gap-1.5 flex-1 justify-end pr-3">
          {p1Kicks.map((status, i) => (
            <RoundDot key={i} status={status} index={i} />
          ))}
        </div>
        {/* Divider */}
        <div className="w-px h-6 rounded-full"
          style={{ background: "linear-gradient(180deg, transparent, #555, transparent)" }} />
        {/* P2 kick dots */}
        <div className="flex gap-1.5 flex-1 justify-start pl-3">
          {p2Kicks.map((status, i) => (
            <RoundDot key={i} status={status} index={i} />
          ))}
        </div>
      </div>

    </div>
  );
};
