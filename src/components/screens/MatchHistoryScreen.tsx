"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import type { MatchHistoryEntry } from "@shared/types";
import { useMatchStore } from "@/store/match-store";

type Filter = "all" | "win" | "loss";

export const MatchHistoryScreen = () => {
  const enterScreen = useMatchStore((s) => s.enterScreen);
  const history = useMatchStore((s) => s.matchHistory);
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(
    () =>
      filter === "all"
        ? history
        : history.filter((m) => m.result === filter),
    [history, filter],
  );

  const stats = useMemo(() => {
    const wins = history.filter((m) => m.result === "win").length;
    const losses = history.length - wins;
    const winRate = history.length === 0 ? 0 : Math.round((wins / history.length) * 100);
    const netTokens = history.reduce((s, m) => s + m.netTokens, 0);
    return { wins, losses, winRate, netTokens, total: history.length };
  }, [history]);

  return (
    <div className="flex flex-col flex-1 px-4 py-4 overflow-y-auto">
      {/* Header */}
      <header className="flex items-center gap-3 mb-3">
        <button
          onClick={() => enterScreen("home")}
          className="text-2xl text-white/80 active:scale-95 transition px-2"
          aria-label="กลับ"
        >
          ←
        </button>
        <h2 className="text-xl font-bold text-white">ประวัติการเล่น</h2>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <StatBox label="แข่ง" value={stats.total} accent="text-white" />
        <StatBox label="ชนะ" value={stats.wins} accent="text-emerald-300" />
        <StatBox label="แพ้" value={stats.losses} accent="text-rose-300" />
        <StatBox label="WR" value={`${stats.winRate}%`} accent="text-amber-300" />
      </div>

      {/* Net tokens card */}
      <div
        className={`p-3 rounded-md mb-4 border ${
          stats.netTokens >= 0
            ? "bg-emerald-500/10 border-emerald-400/30"
            : "bg-rose-500/10 border-rose-400/30"
        }`}
      >
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-white/60 font-bold uppercase tracking-widest">
            กำไร/ขาดทุนสุทธิ
          </span>
          <span
            className={`text-2xl font-black tabular-nums ${
              stats.netTokens >= 0 ? "text-emerald-300" : "text-rose-300"
            }`}
          >
            {stats.netTokens >= 0 ? "+" : ""}
            {stats.netTokens.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-black/30 rounded-md mb-4">
        <FilterTab active={filter === "all"} onClick={() => setFilter("all")} label="ทั้งหมด" />
        <FilterTab active={filter === "win"} onClick={() => setFilter("win")} label="ชนะ" />
        <FilterTab active={filter === "loss"} onClick={() => setFilter("loss")} label="แพ้" />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center text-white/40 py-12 text-sm">
          {history.length === 0 ? (
            <>
              <div className="text-4xl mb-2">⚽</div>
              ยังไม่มีประวัติการแข่ง
              <br />
              <span className="text-xs text-white/30">เริ่มเล่นกันเลย!</span>
            </>
          ) : (
            "ไม่มีข้อมูลตามตัวกรอง"
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2 pb-4">
          {filtered.map((m, idx) => (
            <MatchRow key={m.id} match={m} index={idx} />
          ))}
        </div>
      )}
    </div>
  );
};

function StatBox({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent: string;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-md px-2 py-2.5 text-center">
      <div className={`text-lg font-black tabular-nums leading-tight ${accent}`}>{value}</div>
      <div className="text-[9px] uppercase tracking-widest text-white/40 font-bold">
        {label}
      </div>
    </div>
  );
}

function FilterTab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${
        active
          ? "bg-emerald-500/25 text-emerald-200 ring-1 ring-emerald-400/40"
          : "text-white/50 active:bg-white/5"
      }`}
    >
      {label}
    </button>
  );
}

function MatchRow({ match, index }: { match: MatchHistoryEntry; index: number }) {
  const isWin = match.result === "win";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
      className={`flex items-center gap-3 p-3 rounded-md border ${
        isWin
          ? "bg-emerald-500/10 border-emerald-400/25"
          : "bg-rose-500/10 border-rose-400/25"
      }`}
    >
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center text-base font-black ${
          isWin
            ? "bg-emerald-500/30 text-emerald-200 ring-1 ring-emerald-400/40"
            : "bg-rose-500/30 text-rose-200 ring-1 ring-rose-400/40"
        }`}
      >
        {isWin ? "W" : "L"}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-base">{match.opponentAvatar}</span>
          <span className="text-sm font-bold text-white truncate">{match.opponentName}</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-white/50">
          <span className="px-1.5 py-px bg-white/10 rounded font-bold uppercase tracking-widest">
            {matchTypeLabel(match.type)}
          </span>
          <span>{formatRelative(match.timestamp)}</span>
        </div>
      </div>

      <div className="text-right shrink-0">
        <div className="font-black text-white tabular-nums">
          {match.scoreYou} – {match.scoreOpp}
        </div>
        <div
          className={`text-[11px] font-bold tabular-nums ${
            match.netTokens > 0
              ? "text-emerald-300"
              : match.netTokens < 0
              ? "text-rose-300"
              : "text-white/40"
          }`}
        >
          {match.netTokens > 0 ? "+" : ""}
          {match.netTokens.toLocaleString()} 🪙
        </div>
      </div>
    </motion.div>
  );
}

function matchTypeLabel(t: MatchHistoryEntry["type"]): string {
  switch (t) {
    case "1v1": return "1v1";
    case "bracket-4": return "BR4";
    case "bracket-8": return "BR8";
    case "bracket-16": return "BR16";
    case "bracket-32": return "BR32";
  }
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "เมื่อสักครู่";
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ชม.ที่แล้ว`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} วันที่แล้ว`;
  const d = new Date(ts);
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}
