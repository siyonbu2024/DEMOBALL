"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { play } from "@/lib/sound";
import { TOURNAMENT_RAKE_RATE, type Tournament } from "@/lib/types";
import { useMatchStore } from "@/store/match-store";
import { TicketPurchaseModal } from "./TicketPurchaseModal";

export const TournamentBanner = () => {
  const tournaments = useMatchStore((s) => s.tournaments);
  const userTickets = useMatchStore((s) => s.userTickets);
  const [selected, setSelected] = useState<Tournament | null>(null);

  // Sort upcoming first
  const sorted = useMemo(
    () => [...tournaments].sort((a, b) => a.scheduledStart - b.scheduledStart),
    [tournaments],
  );

  const userOwns = (id: string) => userTickets.some((t) => t.tournamentId === id);

  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <div className="text-[10px] uppercase tracking-[0.3em] text-amber-300/90 font-bold flex items-center gap-1.5">
            <span>🏆</span>
            <span>Tournament</span>
          </div>
          <div className="text-[10px] text-white/40 font-bold">
            {sorted.length} กำลังเปิด
          </div>
        </div>

        <div
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {sorted.map((t) => (
            <TournamentCard
              key={t.id}
              tournament={t}
              owned={userOwns(t.id)}
              onTap={() => {
                play("click");
                setSelected(t);
              }}
            />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <TicketPurchaseModal
            tournament={selected}
            owned={userOwns(selected.id)}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

function TournamentCard({
  tournament: t,
  owned,
  onTap,
}: {
  tournament: Tournament;
  owned: boolean;
  onTap: () => void;
}) {
  const countdown = useCountdown(t.scheduledStart);
  const grossPot = t.entryFee * t.maxTickets;
  const prizePool = Math.floor(grossPot * (1 - TOURNAMENT_RAKE_RATE));
  const fillPct = Math.min(100, Math.round((t.ticketsSold / t.maxTickets) * 100));

  return (
    <motion.button
      onClick={onTap}
      whileTap={{ scale: 0.97 }}
      className={`relative shrink-0 w-[280px] snap-start text-left rounded-md overflow-hidden bg-gradient-to-br ${t.gradient} border ${t.accent} shadow-xl`}
    >
      {/* Sheen */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

      <div className="relative p-3.5">
        {/* Header row */}
        <div className="flex items-start gap-2 mb-2">
          <div className="text-2xl shrink-0 leading-none mt-0.5">{t.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span
                className={`text-[9px] uppercase tracking-widest font-black px-1.5 py-0.5 rounded ${t.tagColor}`}
              >
                {t.tag}
              </span>
              <span className="text-[9px] uppercase tracking-widest font-bold text-white/60">
                {t.size} ทีม
              </span>
            </div>
            <div className="text-base font-black text-white leading-tight truncate">
              {t.title}
            </div>
            <div className="text-[10px] text-white/55 truncate">
              {t.subtitle}
            </div>
          </div>
          {owned && (
            <div className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-emerald-400 text-emerald-950 rounded">
              ของฉัน
            </div>
          )}
        </div>

        {/* Countdown */}
        <div className="bg-black/30 rounded-lg p-2 mb-2 backdrop-blur">
          <div className="text-[9px] uppercase tracking-widest text-white/50 font-bold mb-0.5">
            เริ่มอีก
          </div>
          <Countdown countdown={countdown} />
        </div>

        {/* Prize + entry */}
        <div className="flex items-end justify-between mb-2">
          <div>
            <div className="text-[9px] uppercase tracking-widest text-white/50 font-bold leading-tight">
              เงินรางวัลรวม
            </div>
            <div className="text-lg font-black text-amber-300 tabular-nums leading-tight">
              {prizePool.toLocaleString()} 🪙
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] uppercase tracking-widest text-white/50 font-bold leading-tight">
              ค่าตั๋ว
            </div>
            <div className="text-lg font-black text-white tabular-nums leading-tight">
              {t.entryFee} 🪙
            </div>
          </div>
        </div>

        {/* Progress + CTA */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-[10px] text-white/60 tabular-nums">
                {t.ticketsSold}/{t.maxTickets}
              </span>
              <span className="text-[10px] text-white/40 tabular-nums">
                {fillPct}%
              </span>
            </div>
            <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${fillPct}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  fillPct >= 80
                    ? "bg-gradient-to-r from-rose-400 to-rose-500"
                    : fillPct >= 50
                    ? "bg-gradient-to-r from-amber-400 to-amber-500"
                    : "bg-gradient-to-r from-emerald-400 to-emerald-500"
                }`}
              />
            </div>
          </div>
          <div
            className={`text-[10px] font-black uppercase tracking-widest px-2 py-1.5 rounded-md ${
              owned
                ? "bg-emerald-400 text-emerald-950"
                : "bg-white text-slate-900"
            }`}
          >
            {owned ? "ดูตั๋ว" : "ซื้อตั๋ว"}
          </div>
        </div>
      </div>
    </motion.button>
  );
}

function Countdown({ countdown }: { countdown: CountdownParts }) {
  // Skip SSR — countdown values depend on Date.now() and would mismatch
  // between server and client. Render a placeholder until mounted.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <div className="flex items-baseline gap-1.5 tabular-nums">
        <TimeChunk value={0} label="ชม." />
        <TimeChunk value={0} label="นาที" />
        <TimeChunk value={0} label="วิ" />
      </div>
    );
  }
  if (countdown.expired) {
    return (
      <div className="text-rose-300 font-black text-base tracking-tight">
        🔴 เริ่มแล้ว
      </div>
    );
  }
  const showDays = countdown.days > 0;
  return (
    <div className="flex items-baseline gap-1.5 tabular-nums">
      {showDays && (
        <TimeChunk value={countdown.days} label="วัน" />
      )}
      <TimeChunk value={countdown.hours} label="ชม." />
      <TimeChunk value={countdown.minutes} label="นาที" />
      {!showDays && <TimeChunk value={countdown.seconds} label="วิ" />}
    </div>
  );
}

function TimeChunk({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-baseline gap-0.5">
      <span className="text-xl font-black text-white leading-none">
        {value.toString().padStart(2, "0")}
      </span>
      <span className="text-[9px] text-white/50 font-bold">{label}</span>
    </div>
  );
}

interface CountdownParts {
  expired: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function useCountdown(target: number): CountdownParts {
  // Start at target itself so SSR and the first client render produce the
  // same {0, 0, 0, 0} state. The interval below kicks in on mount and
  // replaces it with the real countdown.
  const [now, setNow] = useState(target);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = target - now;
  if (diff <= 0) {
    return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  const totalSec = Math.floor(diff / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return { expired: false, days, hours, minutes, seconds };
}
