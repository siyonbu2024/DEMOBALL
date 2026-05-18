"use client";

import { motion } from "framer-motion";
import { getBotById, type BotIdentity } from "@/lib/bot-identities";
import { GameButton } from "@/components/GameButton";
import { BET_TIERS, RAKE_RATE_1V1 } from "@/lib/types";
import { play } from "@/lib/sound";
import { useMatchStore } from "@/store/match-store";

export const Room1v1 = () => {
  const enterScreen = useMatchStore((s) => s.enterScreen);
  const startQuickMatch1v1 = useMatchStore((s) => s.startQuickMatch1v1);
  const startSpecificMatch1v1 = useMatchStore((s) => s.startSpecificMatch1v1);
  const roomAssignments = useMatchStore((s) => s.roomAssignments);
  const currentOpponent = useMatchStore((s) => s.currentOpponent);
  const currentBracket = useMatchStore((s) => s.currentBracket);
  const tokenBalance = useMatchStore((s) => s.tokenBalance);
  const selectedBetTier = useMatchStore((s) => s.selectedBetTier);
  const setBetTier = useMatchStore((s) => s.setBetTier);

  const players = roomAssignments["1v1"]
    .map((id) => getBotById(id))
    .filter((b): b is BotIdentity => !!b);

  const isBotBusy = (botId: string) => {
    if (currentOpponent?.identity.id === botId) return true;
    if (currentBracket?.participants.some((p) => p.identity.id === botId))
      return true;
    return false;
  };

  const bet = selectedBetTier ?? 0;
  const hasEnough = bet === 0 || tokenBalance >= bet;
  const pot = bet * 2;
  const rake = Math.floor(pot * RAKE_RATE_1V1);
  const prize = pot - rake;

  const onPickTier = (tier: number) => {
    play("click");
    setBetTier(tier);
  };

  const onQuickMatch = () => {
    if (!hasEnough) {
      enterScreen("wallet");
      return;
    }
    startQuickMatch1v1();
  };

  const onChallenge = (botId: string) => {
    if (!hasEnough) {
      enterScreen("wallet");
      return;
    }
    startSpecificMatch1v1(botId);
  };

  return (
    <div className="flex flex-col gap-4 px-5 py-5 overflow-y-auto">
      <header className="flex items-center gap-3">
        <button
          onClick={() => enterScreen("home")}
          className="text-2xl text-white/80 active:scale-95 transition px-2"
          aria-label="กลับ"
        >
          ←
        </button>
        <h2 className="text-xl font-bold text-white">ห้อง 1v1</h2>
        <div className="ml-auto flex items-center gap-1 bg-amber-500/15 border border-amber-400/30 rounded-full px-2 py-0.5">
          <span className="text-sm">🪙</span>
          <span className="text-xs font-black text-amber-200 tabular-nums">
            {tokenBalance.toLocaleString()}
          </span>
        </div>
      </header>

      {/* Bet tier picker */}
      <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-950/40 border border-emerald-400/25 rounded-md p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] uppercase tracking-[0.3em] text-emerald-300 font-bold">
            เลือกเดิมพัน
          </div>
          <div className="text-[10px] text-white/40">
            หัก {Math.round(RAKE_RATE_1V1 * 100)}% เข้าระบบ
          </div>
        </div>

        <div className="grid grid-cols-5 gap-1.5 mb-3">
          {BET_TIERS.map((tier) => {
            const active = selectedBetTier === tier;
            const insufficient = tokenBalance < tier;
            return (
              <motion.button
                key={tier}
                whileTap={{ scale: 0.94 }}
                onClick={() => onPickTier(tier)}
                disabled={insufficient}
                className={`relative py-2 rounded-lg font-black text-xs tabular-nums transition ${
                  active
                    ? "bg-gradient-to-b from-amber-400 to-amber-600 text-amber-950 ring-2 ring-amber-200 shadow-lg shadow-amber-900/40"
                    : insufficient
                    ? "bg-white/5 text-white/25 cursor-not-allowed"
                    : "bg-white/10 text-white active:bg-white/15"
                }`}
              >
                {tier >= 1000 ? `${tier / 1000}k` : tier}
              </motion.button>
            );
          })}
        </div>

        {/* Pot preview */}
        <div className="flex items-center justify-between bg-black/25 rounded-lg px-3 py-2">
          <div className="text-[10px] text-white/60">
            <div>เดิมพันของคู่: {bet} × 2</div>
            <div className="text-white/40">= pot {pot}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-white/60 uppercase tracking-widest">
              ชนะรับ
            </div>
            <div className="text-base font-black text-amber-300 tabular-nums">
              +{prize} 🪙
            </div>
          </div>
        </div>

        {!hasEnough && (
          <div className="mt-2 text-center text-[11px] text-rose-300 font-bold">
            ⚠️ token ไม่พอ — แตะ "หาคู่เร็ว" เพื่อไปเติม
          </div>
        )}
      </div>

      <GameButton onClick={onQuickMatch} size="lg" className="w-full">
        {hasEnough ? "⚔️ หาคู่เร็ว" : "💰 เติม Token"}
      </GameButton>

      <div className="text-xs uppercase tracking-widest text-white/50 mt-1 flex items-center gap-2">
        <span>Players online</span>
        <span className="text-emerald-300 tabular-nums font-bold">
          {players.length}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {players.map((bot) => {
          const busy = isBotBusy(bot.id);
          return (
            <div
              key={bot.id}
              className={`flex items-center gap-3 p-3 bg-white/5 rounded-md ${
                busy ? "opacity-50" : ""
              }`}
            >
              <span className="text-2xl">{bot.avatar}</span>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white truncate flex items-center gap-1.5">
                  {bot.username}
                  {bot.flag && <span className="text-xs">{bot.flag}</span>}
                </div>
                <div className="text-white/60 text-xs tabular-nums">
                  MMR {bot.mmr} · {Math.round(bot.winRate * 100)}% WR ·{" "}
                  {bot.totalMatches}
                </div>
              </div>
              {busy ? (
                <span className="text-[10px] uppercase tracking-wider px-2 py-1 bg-amber-500/30 text-amber-200 rounded-full font-bold">
                  กำลังแข่ง
                </span>
              ) : (
                <GameButton
                  onClick={() => onChallenge(bot.id)}
                  className="w-20"
                >
                  เชิญแข่ง
                </GameButton>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
