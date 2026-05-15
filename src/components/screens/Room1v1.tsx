"use client";

import { getBotById, type BotIdentity } from "@/lib/bot-identities";
import { GameButton } from "@/components/GameButton";
import { useMatchStore } from "@/store/match-store";

export const Room1v1 = () => {
  const enterScreen = useMatchStore((s) => s.enterScreen);
  const startQuickMatch1v1 = useMatchStore((s) => s.startQuickMatch1v1);
  const startSpecificMatch1v1 = useMatchStore((s) => s.startSpecificMatch1v1);
  const roomAssignments = useMatchStore((s) => s.roomAssignments);
  const currentOpponent = useMatchStore((s) => s.currentOpponent);
  const currentBracket = useMatchStore((s) => s.currentBracket);

  const players = roomAssignments["1v1"]
    .map((id) => getBotById(id))
    .filter((b): b is BotIdentity => !!b);

  const isBotBusy = (botId: string) => {
    if (currentOpponent?.identity.id === botId) return true;
    if (currentBracket?.participants.some((p) => p.identity.id === botId))
      return true;
    return false;
  };

  return (
    <div className="flex flex-col gap-4 px-5 py-5">
      <header className="flex items-center gap-3">
        <button
          onClick={() => enterScreen("home")}
          className="text-2xl text-white/80 active:scale-95 transition px-2"
          aria-label="กลับ"
        >
          ←
        </button>
        <h2 className="text-xl font-bold text-white">ห้อง 1v1</h2>
        <span className="ml-auto text-xs text-emerald-300 font-bold tabular-nums">
          {players.length} ออนไลน์
        </span>
      </header>

      <GameButton onClick={startQuickMatch1v1} size="lg" className="w-full">
        ⚔️ หาคู่เร็ว
      </GameButton>

      <div className="text-xs uppercase tracking-widest text-white/50 mt-2">
        Players online
      </div>

      <div className="flex flex-col gap-2">
        {players.map((bot) => {
          const busy = isBotBusy(bot.id);
          return (
            <div
              key={bot.id}
              className={`flex items-center gap-3 p-3 bg-white/5 rounded-xl ${
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
                  onClick={() => startSpecificMatch1v1(bot.id)}
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
