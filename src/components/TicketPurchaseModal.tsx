"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { play } from "@/lib/sound";
import { TIMING } from "@/lib/timing";
import { TOURNAMENT_RAKE_RATE, type Tournament } from "@/lib/types";
import { useMatchStore } from "@/store/match-store";
import { GameButton } from "./GameButton";

interface Props {
  tournament: Tournament;
  owned: boolean;
  onClose: () => void;
}

export const TicketPurchaseModal = ({ tournament: t, owned, onClose }: Props) => {
  const balance = useMatchStore((s) => s.tokenBalance);
  const purchaseTicket = useMatchStore((s) => s.purchaseTicket);
  const enterScreen = useMatchStore((s) => s.enterScreen);

  const [toast, setToast] = useState<string | null>(null);
  const [purchased, setPurchased] = useState(owned);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), TIMING.toastDuration);
    return () => clearTimeout(id);
  }, [toast]);

  const grossPot = t.entryFee * t.maxTickets;
  const prizePool = Math.floor(grossPot * (1 - TOURNAMENT_RAKE_RATE));

  // Prize distribution preview
  const prizes = computePrizes(prizePool, t.size);

  const insufficient = balance < t.entryFee;
  const soldOut = t.ticketsSold >= t.maxTickets;

  const onBuy = () => {
    if (purchased) return;
    if (insufficient) {
      onClose();
      enterScreen("wallet");
      return;
    }
    const result = purchaseTicket(t.id);
    if (!result.ok) {
      setToast(reasonLabel(result.reason));
      return;
    }
    setPurchased(true);
    play("cheer");
    setToast("ซื้อตั๋วสำเร็จ! รอเริ่มแข่งได้เลย");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-sm bg-gradient-to-b ${t.gradient} border-t-2 ${t.accent} rounded-t-3xl shadow-2xl overflow-hidden`}
      >
        {/* Grab handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 bg-white/30 rounded-full" />
        </div>

        <div className="px-5 pt-2 pb-5 max-h-[85vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-start gap-3 mb-4">
            <div className="text-4xl">{t.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span
                  className={`text-[9px] uppercase tracking-widest font-black px-1.5 py-0.5 rounded ${t.tagColor}`}
                >
                  {t.tag}
                </span>
                <span className="text-[9px] uppercase tracking-widest text-white/60 font-bold">
                  {t.size} ทีม • Knockout
                </span>
              </div>
              <h2 className="text-xl font-black text-white leading-tight">
                {t.title}
              </h2>
              <div className="text-xs text-white/60">{t.subtitle}</div>
            </div>
          </div>

          {/* Schedule */}
          <div className="bg-black/30 rounded-xl p-3 mb-3 backdrop-blur">
            <div className="text-[10px] uppercase tracking-widest text-white/50 font-bold mb-1">
              กำหนดเริ่มแข่ง
            </div>
            <div className="text-base font-black text-white tabular-nums">
              {formatFullDate(t.scheduledStart)}
            </div>
            <div className="text-xs text-amber-200 font-bold mt-0.5">
              ⏰ {formatRelative(t.scheduledStart)}
            </div>
          </div>

          {/* Pot stats */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <StatPill label="ค่าตั๋ว" value={`${t.entryFee.toLocaleString()} 🪙`} />
            <StatPill
              label="รางวัลรวม"
              value={`${prizePool.toLocaleString()} 🪙`}
              accent="text-amber-300"
            />
            <StatPill
              label="ตั๋วขายแล้ว"
              value={`${t.ticketsSold}/${t.maxTickets}`}
            />
            <StatPill
              label="หัก rake"
              value={`${Math.round(TOURNAMENT_RAKE_RATE * 100)}%`}
            />
          </div>

          {/* Prize distribution */}
          <div className="bg-black/30 rounded-xl p-3 mb-3 backdrop-blur">
            <div className="text-[10px] uppercase tracking-widest text-white/50 font-bold mb-2">
              การแบ่งรางวัล (โดยประมาณ)
            </div>
            <div className="flex flex-col gap-1">
              {prizes.map((p) => (
                <div
                  key={p.label}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-white/80">
                    {p.medal} {p.label}
                  </span>
                  <span className="font-bold tabular-nums text-amber-200">
                    {p.amount.toLocaleString()} 🪙
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Rules */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-4">
            <div className="text-[10px] uppercase tracking-widest text-white/50 font-bold mb-2">
              กติกาสั้นๆ
            </div>
            <ul className="text-[11px] text-white/70 space-y-1 leading-relaxed">
              <li>• Knockout {Math.log2(t.size)} รอบ — แพ้ตก ชนะไปต่อ</li>
              <li>• ต้องเข้าเล่นภายใน 5 นาทีก่อนเริ่ม</li>
              <li>• No-show จะถูกแทนด้วยบอท (ตั๋วไม่คืน)</li>
              <li>• ตั๋วซื้อแล้วไม่สามารถคืนได้</li>
            </ul>
          </div>

          {/* Balance + CTA */}
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="text-white/60">ยอด token ของคุณ</span>
            <span
              className={`font-black tabular-nums ${
                insufficient && !purchased ? "text-rose-300" : "text-amber-200"
              }`}
            >
              {balance.toLocaleString()} 🪙
            </span>
          </div>

          <div className="flex gap-2">
            <GameButton onClick={onClose} className="flex-1">
              ปิด
            </GameButton>
            <GameButton
              onClick={onBuy}
              size="lg"
              className="flex-[2]"
              disabled={purchased || soldOut}
            >
              {purchased
                ? "✓ มีตั๋วแล้ว"
                : soldOut
                ? "ตั๋วหมด"
                : insufficient
                ? "💰 เติม Token"
                : `ซื้อตั๋ว ${t.entryFee} 🪙`}
            </GameButton>
          </div>
        </div>

        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute left-0 right-0 bottom-2 flex justify-center pointer-events-none"
          >
            <div className="px-4 py-2 bg-black/85 text-white text-xs rounded-lg border border-white/20 shadow-xl">
              {toast}
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

function StatPill({
  label,
  value,
  accent = "text-white",
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="bg-black/25 rounded-lg px-3 py-2">
      <div className="text-[9px] uppercase tracking-widest text-white/45 font-bold leading-tight">
        {label}
      </div>
      <div className={`text-sm font-black tabular-nums leading-tight ${accent}`}>
        {value}
      </div>
    </div>
  );
}

function computePrizes(
  prizePool: number,
  size: 4 | 8 | 16 | 32 | 64,
): { medal: string; label: string; amount: number }[] {
  // Distribution roughly mirrors the spec in PRODUCT-PLAN.md.
  if (size === 4) {
    return [
      { medal: "🏆", label: "อันดับ 1", amount: Math.floor(prizePool * 0.7) },
      { medal: "🥈", label: "อันดับ 2", amount: prizePool - Math.floor(prizePool * 0.7) },
    ];
  }
  if (size === 8) {
    return [
      { medal: "🏆", label: "แชมป์", amount: Math.floor(prizePool * 0.6) },
      { medal: "🥈", label: "รองแชมป์", amount: Math.floor(prizePool * 0.25) },
      { medal: "🥉", label: "รอบรอง (x2)", amount: Math.floor(prizePool * 0.075) },
    ];
  }
  // 16 / 32 / 64 share the same shape
  return [
    { medal: "🏆", label: "แชมป์", amount: Math.floor(prizePool * 0.4) },
    { medal: "🥈", label: "รองแชมป์", amount: Math.floor(prizePool * 0.2) },
    { medal: "🥉", label: "รอบรอง (x2)", amount: Math.floor(prizePool * 0.075) },
    { medal: "🎖️", label: "ก่อนรองฯ (x4)", amount: Math.floor(prizePool * 0.025) },
  ];
}

function reasonLabel(reason: string | undefined): string {
  switch (reason) {
    case "already-purchased": return "คุณมีตั๋วแล้ว";
    case "sold-out": return "ตั๋วขายหมดแล้ว";
    case "insufficient-tokens": return "Token ไม่พอ";
    default: return "ไม่สำเร็จ";
  }
}

function formatFullDate(ts: number): string {
  const d = new Date(ts);
  const date = d.toLocaleDateString("th-TH", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const time = d.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} • ${time} น.`;
}

function formatRelative(ts: number): string {
  const diff = ts - Date.now();
  if (diff <= 0) return "เริ่มแล้ว";
  const totalMin = Math.floor(diff / 60000);
  if (totalMin < 60) return `อีก ${totalMin} นาที`;
  const hrs = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  if (hrs < 24) return `อีก ${hrs} ชม. ${mins} นาที`;
  const days = Math.floor(hrs / 24);
  return `อีก ${days} วัน ${hrs % 24} ชม.`;
}
