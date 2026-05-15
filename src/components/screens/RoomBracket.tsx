"use client";

import { useEffect, useState } from "react";
import { getBotById, type BotIdentity } from "@/lib/bot-identities";
import { GameButton } from "@/components/GameButton";
import { useMatchStore } from "@/store/match-store";

const BRACKET_COUNTDOWN_SEC = 180;

interface Props {
  size: 4 | 8 | 16 | 32;
  title: string;
  subtitle: string;
  /** Which roomAssignments bucket to source players from. */
  bucket: "4v4" | "8v8" | "16v16" | "32v32";
}

/**
 * Shared body for the 4-bracket and 8-bracket lobby rooms. Sub-phase B ships the
 * room with a CTA into the bracket flow + cosmetic countdown + leaderboard preview.
 * Sub-phase C builds the actual BracketView screen.
 */
export const RoomBracket = ({ size, title, subtitle, bucket }: Props) => {
  const enterScreen = useMatchStore((s) => s.enterScreen);
  const startBracket = useMatchStore((s) => s.startBracket);
  const roomAssignments = useMatchStore((s) => s.roomAssignments);
  const currentBracket = useMatchStore((s) => s.currentBracket);

  const players = roomAssignments[bucket]
    .map((id) => getBotById(id))
    .filter((b): b is BotIdentity => !!b)
    .sort((a, b) => b.mmr - a.mmr);

  const [remaining, setRemaining] = useState(BRACKET_COUNTDOWN_SEC);
  useEffect(() => {
    const id = setInterval(
      () => setRemaining((r) => (r <= 0 ? BRACKET_COUNTDOWN_SEC : r - 1)),
      1000
    );
    return () => clearInterval(id);
  }, []);
  const m = Math.floor(remaining / 60);
  const s = (remaining % 60).toString().padStart(2, "0");

  const isBotBusy = (botId: string) =>
    currentBracket?.participants.some((p) => p.identity.id === botId) ?? false;

  const top5 = players.slice(0, 5);

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
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <span className="ml-auto text-xs text-emerald-300 font-bold tabular-nums">
          {players.length} ออนไลน์
        </span>
      </header>

      <p className="text-sm text-white/70 -mt-1">{subtitle}</p>

      <GameButton onClick={() => startBracket(size)} size="lg" className="w-full">
        🏆 เข้าร่วม Bracket
      </GameButton>

      <div className="text-center text-xs text-white/60 tabular-nums">
        Bracket ถัดไปเริ่มในอีก{" "}
        <span className="font-bold text-amber-300">{m}:{s}</span>
      </div>

      <div className="text-xs uppercase tracking-widest text-white/50 mt-2">
        เซียนของห้อง
      </div>

      <div className="flex flex-col gap-2">
        {top5.map((bot, idx) => {
          const busy = isBotBusy(bot.id);
          const medal = idx === 0 ? "🏆" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : null;
          return (
            <div
              key={bot.id}
              className={`flex items-center gap-3 p-3 bg-white/5 rounded-xl ${
                busy ? "opacity-50" : ""
              }`}
            >
              <span className="text-base font-bold text-white/40 w-5 tabular-nums">
                {idx + 1}
              </span>
              <span className="text-2xl">{bot.avatar}</span>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white truncate">
                  {bot.username}
                </div>
                <div className="text-white/60 text-xs tabular-nums">
                  MMR {bot.mmr} · {Math.round(bot.winRate * 100)}% WR
                </div>
              </div>
              {busy ? (
                <span className="text-[10px] uppercase tracking-wider px-2 py-1 bg-amber-500/30 text-amber-200 rounded-full font-bold">
                  กำลังแข่ง
                </span>
              ) : (
                medal && <span className="text-xl">{medal}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
