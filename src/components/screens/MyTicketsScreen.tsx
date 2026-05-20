"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import type { Tournament, TournamentTicket } from "@/lib/types";
import { useMatchStore } from "@/store/match-store";

interface TicketRow {
  ticket: TournamentTicket;
  tournament: Tournament | null;
}

export const MyTicketsScreen = () => {
  const enterScreen = useMatchStore((s) => s.enterScreen);
  const userTickets = useMatchStore((s) => s.userTickets);
  const tournaments = useMatchStore((s) => s.tournaments);

  const rows = useMemo<TicketRow[]>(() => {
    const tMap = new Map(tournaments.map((t) => [t.id, t]));
    return userTickets
      .slice()
      .sort((a, b) => b.purchasedAt - a.purchasedAt)
      .map((ticket) => ({
        ticket,
        tournament: tMap.get(ticket.tournamentId) ?? null,
      }));
  }, [userTickets, tournaments]);

  return (
    <div className="flex flex-col flex-1 px-4 py-4">
      {/* Header */}
      <header className="flex items-center gap-3 mb-3">
        <button
          onClick={() => enterScreen("home")}
          className="text-2xl text-white/80 active:scale-95 transition px-2"
          aria-label="กลับ"
        >
          ←
        </button>
        <h2 className="text-xl font-bold text-white">ตั๋วของฉัน</h2>
        <span className="ml-auto text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/30">
          {rows.length} ใบ
        </span>
      </header>

      {rows.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12 text-white/40">
          <div className="text-5xl mb-3">🎟️</div>
          <div className="text-sm">ยังไม่มีตั๋วทัวร์นาเมนท์</div>
          <div className="text-xs text-white/30 mt-1">ซื้อจากแบนเนอร์ทัวร์ในหน้าหลัก</div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 pb-4">
          {rows.map((row, idx) => (
            <TicketCard key={`${row.ticket.tournamentId}-${row.ticket.purchasedAt}`} row={row} index={idx} />
          ))}
        </div>
      )}
    </div>
  );
};

function TicketCard({ row, index }: { row: TicketRow; index: number }) {
  const { ticket, tournament } = row;

  if (!tournament) {
    return (
      <div className="p-3 rounded-md bg-white/5 border border-white/10 text-white/50 text-sm">
        ตั๋ว (ไม่พบทัวร์นาเมนท์ #{ticket.tournamentId})
      </div>
    );
  }

  const startsIn = tournament.scheduledStart - Date.now();
  const startLabel = formatCountdown(startsIn);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3) }}
      className={`relative overflow-hidden rounded-md border-2 ${tournament.accent} bg-gradient-to-br ${tournament.gradient} shadow-lg`}
    >
      {/* Perforated edge */}
      <div className="absolute top-0 bottom-0 left-[68%] w-px border-l border-dashed border-white/30" />
      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#1E1D30]" />
      <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#1E1D30]" />

      <div className="flex items-stretch">
        {/* Left: tournament info */}
        <div className="flex-1 p-3 flex items-center gap-3 min-w-0">
          <div className="text-3xl w-12 h-12 rounded-md bg-black/30 flex items-center justify-center shrink-0">
            {tournament.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className={`text-[9px] uppercase tracking-widest font-black px-1.5 py-0.5 rounded ${tournament.tagColor}`}>
                {tournament.tag}
              </span>
              <span className="text-[10px] font-bold text-white/60 tabular-nums">
                {tournament.size} ทีม
              </span>
            </div>
            <div className="font-black text-white text-sm leading-tight truncate">
              {tournament.title}
            </div>
            <div className="text-[10px] text-white/60 truncate">{tournament.subtitle}</div>
          </div>
        </div>

        {/* Right: countdown */}
        <div className="w-24 shrink-0 flex flex-col items-center justify-center p-2 bg-black/25">
          <div className="text-[9px] font-bold uppercase tracking-widest text-white/50">
            เริ่มใน
          </div>
          <div className="text-sm font-black text-white tabular-nums leading-tight text-center">
            {startLabel}
          </div>
          <div className="mt-1 text-[9px] text-white/40 tabular-nums">
            ซื้อ {formatPurchased(ticket.purchasedAt)}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "เริ่มแล้ว";
  const totalMins = Math.floor(ms / 60000);
  const days = Math.floor(totalMins / (60 * 24));
  if (days >= 1) {
    const hrs = Math.floor((totalMins - days * 60 * 24) / 60);
    return `${days}d ${hrs}h`;
  }
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hrs >= 1) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

function formatPurchased(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "เมื่อสักครู่";
  if (mins < 60) return `${mins} น.`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ชม.`;
  const days = Math.floor(hrs / 24);
  return `${days} วัน`;
}
