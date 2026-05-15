"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { TIMING } from "@/lib/timing";
import { useMatchStore } from "@/store/match-store";

const REVEAL_OPP_AT_MS = 400;

export const MatchmakingScreen = () => {
  const opponent = useMatchStore((s) => s.currentOpponent);
  const finishMatchmaking = useMatchStore((s) => s.finishMatchmaking);
  const userIdentity = useMatchStore((s) => s.userIdentity);

  useEffect(() => {
    const t = setTimeout(finishMatchmaking, TIMING.matchmakingDuration);
    return () => clearTimeout(t);
  }, [finishMatchmaking]);

  const opponentRevealDelaySec =
    Math.max(0, TIMING.matchmakingDuration - REVEAL_OPP_AT_MS) / 1000;

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-0 px-6 relative overflow-hidden">
      {/* Pulsing radar rings */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-emerald-500/20"
          style={{ width: 80, height: 80 }}
          animate={{ scale: [1, 4], opacity: [0.5, 0] }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            delay: i * 0.8,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Searching state */}
      <AnimatePresence mode="wait">
        {!opponent ? (
          <motion.div
            key="searching"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6"
          >
            {/* Spinning ball */}
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl scale-150" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
                className="text-6xl relative z-10"
              >
                ⚽
              </motion.div>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className="text-white font-black text-lg tracking-wide">
                กำลังหาคู่ต่อสู้
              </div>
              <div className="flex gap-1 mt-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.25 }}
                  />
                ))}
              </div>
            </div>

            <div className="px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/40 text-xs font-mono tracking-widest">
              SEARCHING…
            </div>
          </motion.div>
        ) : (
          /* VS reveal */
          <motion.div
            key="vs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-6 w-full"
          >
            <div className="text-[10px] uppercase tracking-[0.4em] text-emerald-400/80 font-bold">
              พบคู่ต่อสู้แล้ว!
            </div>

            <div className="flex items-center justify-center gap-4 w-full">
              {/* Player card */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: opponentRevealDelaySec, type: "spring", stiffness: 260, damping: 22 }}
                className="flex flex-col items-center gap-2 flex-1"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-emerald-900/60 border border-emerald-500/40 flex items-center justify-center text-3xl shadow-lg shadow-emerald-900/50">
                  {userIdentity.avatar}
                </div>
                <div className="text-white font-black text-sm text-center leading-tight">
                  {userIdentity.username}
                </div>
                <div className="text-emerald-300/70 text-xs tabular-nums">
                  MMR {userIdentity.mmr}
                </div>
              </motion.div>

              {/* VS badge */}
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: opponentRevealDelaySec + 0.1, type: "spring", stiffness: 400, damping: 18 }}
                className="flex flex-col items-center gap-1 shrink-0"
              >
                <div
                  className="text-2xl font-black text-red-400 leading-none"
                  style={{ textShadow: "0 0 16px rgba(239,68,68,0.7)" }}
                >
                  VS
                </div>
                <div className="w-px h-8 bg-gradient-to-b from-white/20 to-transparent" />
              </motion.div>

              {/* Opponent card */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: opponentRevealDelaySec, type: "spring", stiffness: 260, damping: 22 }}
                className="flex flex-col items-center gap-2 flex-1"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500/30 to-red-900/60 border border-red-500/40 flex items-center justify-center text-3xl shadow-lg shadow-red-900/50">
                  {opponent.identity.avatar}
                </div>
                <div className="text-white font-black text-sm text-center leading-tight flex items-center gap-1">
                  {opponent.identity.username}
                  {opponent.identity.flag && (
                    <span className="text-xs">{opponent.identity.flag}</span>
                  )}
                </div>
                <div className="text-red-300/70 text-xs tabular-nums">
                  MMR {opponent.identity.mmr}
                </div>
              </motion.div>
            </div>

            {/* Match banner */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: opponentRevealDelaySec + 0.2 }}
              className="w-full py-2 rounded-xl bg-gradient-to-r from-red-700/50 via-red-600/60 to-red-700/50 border border-red-500/30 text-center"
            >
              <div className="text-white font-black text-sm tracking-widest uppercase">
                ⚽ Match Starting ⚽
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
