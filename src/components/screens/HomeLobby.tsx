"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { getBotById, type BotIdentity } from "@/lib/bot-identities";
import { TIMING } from "@/lib/timing";
import { useMatchStore } from "@/store/match-store";
import { TournamentBanner } from "../TournamentBanner";

export const HomeLobby = () => {
  const enterScreen = useMatchStore((s) => s.enterScreen);
  const initializeRoomAssignments = useMatchStore((s) => s.initializeRoomAssignments);
  const driftRoomAssignments = useMatchStore((s) => s.driftRoomAssignments);
  const roomAssignments = useMatchStore((s) => s.roomAssignments);
  const userIdentity = useMatchStore((s) => s.userIdentity);
  const tokenBalance = useMatchStore((s) => s.tokenBalance);
  const historyCount = useMatchStore((s) => s.matchHistory.length);

  useEffect(() => {
    initializeRoomAssignments();
  }, [initializeRoomAssignments]);

  useEffect(() => {
    const id = setInterval(driftRoomAssignments, TIMING.onlineCountDriftInterval);
    return () => clearInterval(id);
  }, [driftRoomAssignments]);

  return (
    <div className="flex flex-col gap-4 px-4 py-5">
      {/* Hero banner */}
      <div className="relative rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1f0a] via-[#0e2a10] to-[#061206]" />
        <div
          className="absolute inset-0 opacity-15 bg-cover bg-center"
          style={{ backgroundImage: "url('/BG_BALL.png')" }}
        />
        {/* Red top accent bar */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-600 via-red-400 to-red-600" />
        <div className="relative flex flex-col items-center py-6 gap-1.5">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.35em] text-yellow-300/90 font-bold">
            <span>⚽</span>
            <span>Penalty Shootout</span>
            <span>⚽</span>
          </div>
          <h1
            className="text-4xl font-black text-white tracking-tight"
            style={{ textShadow: "0 2px 16px rgba(0,0,0,0.8)" }}
          >
            เพนัลตี้ ดวล
          </h1>
          <div className="mt-1 px-3 py-0.5 rounded-full bg-red-600/80 text-white text-[10px] font-bold uppercase tracking-widest">
            LIVE
          </div>
        </div>
      </div>

      {/* Player card */}
      <motion.button
        onClick={() => enterScreen("settings")}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-white/10 to-white/5 border border-white/10 text-left active:bg-white/10 transition"
      >
        <div className="relative">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-800 flex items-center justify-center text-xl ring-2 ring-emerald-400/60 shadow-lg shadow-emerald-900/50">
            {userIdentity.avatar}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#0e1a0e]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white font-bold leading-tight">{userIdentity.username}</div>
          <div className="text-white/50 text-xs tabular-nums">MMR {userIdentity.mmr} · แตะเพื่อตั้งค่า</div>
        </div>
        <div className="text-white/30 text-xl">⚙️</div>
      </motion.button>

      {/* Tournament banner */}
      <TournamentBanner />

      {/* Quick actions: wallet + history */}
      <div className="grid grid-cols-2 gap-3 -mt-1">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => enterScreen("wallet")}
          className="relative overflow-hidden flex items-center gap-2.5 p-3 rounded-xl bg-gradient-to-br from-amber-600/80 to-orange-800/80 border border-amber-400/40 text-left shadow-lg shadow-amber-900/30"
        >
          <div className="text-2xl">🪙</div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-amber-100/80 font-bold">
              Token
            </div>
            <div className="text-base font-black text-white tabular-nums leading-tight">
              {tokenBalance.toLocaleString()}
            </div>
          </div>
          <div className="text-white/40 text-lg">›</div>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => enterScreen("match-history")}
          className="relative overflow-hidden flex items-center gap-2.5 p-3 rounded-xl bg-gradient-to-br from-slate-600/80 to-slate-800/80 border border-white/15 text-left shadow-lg"
        >
          <div className="text-2xl">📊</div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-white/60 font-bold">
              ประวัติ
            </div>
            <div className="text-base font-black text-white tabular-nums leading-tight">
              {historyCount} แมตช์
            </div>
          </div>
          <div className="text-white/40 text-lg">›</div>
        </motion.button>
      </div>

      {/* Mode label */}
      <div className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-bold px-1">
        เลือกโหมด
      </div>

      {/* Room cards */}
      <div className="flex flex-col gap-3">
        <RoomCard
          title="ห้อง 1v1"
          subtitle="พบคู่ต่อสู้ใน 5 วินาที"
          count={roomAssignments["1v1"].length}
          previewIds={roomAssignments["1v1"]}
          onTap={() => enterScreen("room-1v1")}
          gradient="from-emerald-900/80 to-emerald-950/80"
          accent="border-emerald-500/40"
          glow="shadow-emerald-900/60"
          badge="bg-emerald-500/20 text-emerald-300"
          icon="⚔️"
          tag="QUICK"
          tagColor="bg-emerald-500/30 text-emerald-200"
        />
        <RoomCard
          title="Bracket 4 คน"
          subtitle="เข้าแข่งกับ 3 คนอื่น • ผู้ชนะคือเซียน"
          count={roomAssignments["4v4"].length}
          previewIds={roomAssignments["4v4"]}
          onTap={() => enterScreen("room-4v4")}
          gradient="from-blue-900/80 to-blue-950/80"
          accent="border-blue-500/40"
          glow="shadow-blue-900/60"
          badge="bg-blue-500/20 text-blue-300"
          icon="🏆"
          tag="BRACKET"
          tagColor="bg-blue-500/30 text-blue-200"
        />
        <RoomCard
          title="Bracket 8 คน"
          subtitle="เข้าแข่งกับ 7 คนอื่น • ทัวร์ใหญ่กว่า"
          count={roomAssignments["8v8"].length}
          previewIds={roomAssignments["8v8"]}
          onTap={() => enterScreen("room-8v8")}
          gradient="from-purple-900/80 to-purple-950/80"
          accent="border-purple-500/40"
          glow="shadow-purple-900/60"
          badge="bg-purple-500/20 text-purple-300"
          icon="👑"
          tag="GRAND"
          tagColor="bg-purple-500/30 text-purple-200"
        />
        <RoomCard
          title="Bracket 16 คน"
          subtitle="5 รอบ • เซียนแห่งเซียน"
          count={roomAssignments["16v16"].length}
          previewIds={roomAssignments["16v16"]}
          onTap={() => enterScreen("room-16v16")}
          gradient="from-rose-900/80 to-rose-950/80"
          accent="border-rose-500/40"
          glow="shadow-rose-900/60"
          badge="bg-rose-500/20 text-rose-300"
          icon="🔥"
          tag="MEGA"
          tagColor="bg-rose-500/30 text-rose-200"
        />
        <RoomCard
          title="Bracket 32 คน"
          subtitle="แกรนด์ทัวร์นาเมนต์ • 6 รอบ"
          count={roomAssignments["32v32"].length}
          previewIds={roomAssignments["32v32"]}
          onTap={() => enterScreen("room-32v32")}
          gradient="from-amber-900/80 to-amber-950/80"
          accent="border-amber-500/40"
          glow="shadow-amber-900/60"
          badge="bg-amber-500/20 text-amber-300"
          icon="🏟️"
          tag="ULTRA"
          tagColor="bg-amber-500/30 text-amber-200"
        />
        <TourCard />
      </div>
    </div>
  );
};

function RoomCard({
  title,
  subtitle,
  count,
  previewIds,
  onTap,
  gradient,
  accent,
  glow,
  badge,
  icon,
  tag,
  tagColor,
}: {
  title: string;
  subtitle: string;
  count: number;
  previewIds: string[];
  onTap: () => void;
  gradient: string;
  accent: string;
  glow: string;
  badge: string;
  icon: string;
  tag: string;
  tagColor: string;
}) {
  const previews = useMemo(() => {
    const ids = previewIds.slice();
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    return ids
      .slice(0, 3)
      .map((id) => getBotById(id))
      .filter((b): b is BotIdentity => !!b);
  }, [previewIds]);

  return (
    <motion.button
      onClick={onTap}
      whileTap={{ scale: 0.97 }}
      className={`relative flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r ${gradient} border ${accent} shadow-lg ${glow} text-left overflow-hidden transition`}
    >
      {/* Subtle sheen */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      {/* Icon badge */}
      <div className="text-2xl w-11 h-11 flex items-center justify-center rounded-xl bg-black/30 shrink-0">
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-black text-white text-base leading-tight">{title}</span>
          <span className={`text-[9px] uppercase tracking-widest font-black px-1.5 py-0.5 rounded ${tagColor}`}>
            {tag}
          </span>
        </div>
        <div className="text-xs text-white/60 truncate">{subtitle}</div>
      </div>

      <div className="flex flex-col items-end gap-2 shrink-0">
        <div className={`text-xs font-bold tabular-nums px-2 py-0.5 rounded-full ${badge}`}>
          {count} online
        </div>
        <div className="flex -space-x-1.5">
          {previews.map((b, i) => (
            <span
              key={b.id}
              className="text-sm w-6 h-6 flex items-center justify-center bg-black/40 ring-1 ring-white/15 rounded-full"
              style={{ zIndex: 3 - i }}
            >
              {b.avatar}
            </span>
          ))}
        </div>
      </div>

      {/* Right arrow */}
      <div className="text-white/30 text-lg ml-1">›</div>
    </motion.button>
  );
}

function TourCard() {
  const [toast, setToast] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(false), TIMING.toastDuration);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <>
      <motion.button
        onClick={() => setToast(true)}
        whileTap={{ scale: 0.97 }}
        className="relative flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-amber-900/30 to-amber-950/30 border border-amber-500/20 text-left opacity-60 overflow-hidden"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="text-2xl w-11 h-11 flex items-center justify-center rounded-xl bg-black/30 shrink-0">
          🏅
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-black text-white text-base leading-tight">ทัวร์นาเมนต์</span>
          </div>
          <div className="text-xs text-white/50">เร็วๆ นี้</div>
        </div>
        <span className="text-[9px] uppercase tracking-wider px-2 py-1 bg-amber-500/30 text-amber-200 rounded font-black">
          SOON
        </span>
      </motion.button>

      {toast && (
        <div className="fixed inset-x-0 bottom-8 flex justify-center pointer-events-none z-50">
          <div className="px-5 py-3 bg-black/80 text-white rounded-xl text-sm shadow-lg border border-white/10">
            ทัวร์นาเมนต์จะเปิดเร็วๆ นี้
          </div>
        </div>
      )}
    </>
  );
}
