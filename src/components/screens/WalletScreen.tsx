"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { GameButton } from "@/components/GameButton";
import { play } from "@/lib/sound";
import { TIMING } from "@shared/timing";
import { TOKEN_PACKAGES, type TokenPackage, type TokenTxType } from "@shared/types";
import { useMatchStore } from "@/store/match-store";

type Tab = "deposit" | "withdraw" | "history";

export const WalletScreen = () => {
  const enterScreen = useMatchStore((s) => s.enterScreen);
  const balance = useMatchStore((s) => s.tokenBalance);
  const txs = useMatchStore((s) => s.tokenTransactions);
  const depositToken = useMatchStore((s) => s.depositToken);
  const withdrawToken = useMatchStore((s) => s.withdrawToken);

  const [tab, setTab] = useState<Tab>("deposit");
  const [toast, setToast] = useState<string | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), TIMING.toastDuration);
  };

  const onBuyPackage = (pkg: TokenPackage) => {
    play("click");
    const total = pkg.tokens + pkg.bonus;
    depositToken(total, `ซื้อแพ็ก ${pkg.id} (+${total} tokens)`);
    showToast(`เติม ${total.toLocaleString()} tokens สำเร็จ`);
  };

  const onWithdraw = () => {
    const amount = parseInt(withdrawAmount, 10);
    if (Number.isNaN(amount) || amount <= 0) {
      showToast("กรุณาใส่จำนวนที่ถูกต้อง");
      return;
    }
    if (amount > balance) {
      showToast("ยอด token ไม่พอ");
      return;
    }
    if (amount < 100) {
      showToast("ขั้นต่ำในการถอน 100 tokens");
      return;
    }
    play("click");
    withdrawToken(amount, `ถอนออก ${amount} tokens (demo)`);
    setWithdrawAmount("");
    showToast(`ส่งคำขอถอน ${amount.toLocaleString()} tokens แล้ว`);
  };

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
        <h2 className="text-xl font-bold text-white">กระเป๋า Token</h2>
      </header>

      {/* Balance card */}
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 22 }}
        className="relative overflow-hidden rounded-md p-5 bg-gradient-to-br from-amber-500 via-amber-600 to-orange-700 border border-amber-300/40 shadow-xl shadow-amber-900/40 mb-4"
      >
        <div className="absolute inset-0 opacity-20 bg-gradient-to-tr from-yellow-300 to-transparent" />
        <div className="relative">
          <div className="text-[10px] uppercase tracking-[0.4em] text-amber-100/90 font-bold mb-1">
            ยอดคงเหลือ
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-white drop-shadow tabular-nums">
              {balance.toLocaleString()}
            </span>
            <span className="text-amber-100 font-bold">TOKEN</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-100/80">
            <span>🪙</span>
            <span>1 token ≈ ฿0.35 (อัตราอ้างอิงเท่านั้น)</span>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-black/30 rounded-md mb-4">
        <TabBtn active={tab === "deposit"} onClick={() => setTab("deposit")} label="เติม" />
        <TabBtn active={tab === "withdraw"} onClick={() => setTab("withdraw")} label="ถอน" />
        <TabBtn active={tab === "history"} onClick={() => setTab("history")} label="ประวัติ" />
      </div>

      {/* Content */}
      {tab === "deposit" && (
        <div className="flex flex-col gap-2">
          {TOKEN_PACKAGES.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} onBuy={() => onBuyPackage(pkg)} />
          ))}
          <p className="text-[10px] text-white/40 text-center mt-2 leading-relaxed">
            * Demo mode — การเติม token ไม่ได้คิดเงินจริง
          </p>
        </div>
      )}

      {tab === "withdraw" && (
        <div className="flex flex-col gap-3">
          <div className="p-4 rounded-md bg-white/5 border border-white/10">
            <label className="text-xs text-white/60 mb-2 block">จำนวน Token ที่ต้องการถอน</label>
            <div className="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2 mb-3">
              <span className="text-amber-300 text-xl">🪙</span>
              <input
                type="number"
                inputMode="numeric"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="ขั้นต่ำ 100"
                className="flex-1 bg-transparent text-white text-lg tabular-nums focus:outline-none placeholder:text-white/30"
              />
              <button
                onClick={() => setWithdrawAmount(String(balance))}
                className="text-[10px] uppercase font-bold text-amber-300 tracking-wider px-2 py-1 bg-amber-500/15 rounded"
              >
                Max
              </button>
            </div>
            <div className="text-[11px] text-white/50 mb-3 space-y-0.5">
              <div>• ขั้นต่ำในการถอน: 100 tokens</div>
              <div>• ค่าธรรมเนียม: ฟรี (demo)</div>
              <div>• ระยะเวลา: 1-3 วันทำการ</div>
            </div>
            <GameButton onClick={onWithdraw} size="lg" className="w-full">
              💸 ถอนออก
            </GameButton>
          </div>
          <p className="text-[10px] text-white/40 text-center leading-relaxed">
            * Demo mode — การถอน token ไม่ได้โอนเงินจริง
          </p>
        </div>
      )}

      {tab === "history" && <TransactionList txs={txs} />}

      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed inset-x-0 bottom-8 flex justify-center pointer-events-none z-50"
        >
          <div className="px-5 py-3 bg-black/85 text-white rounded-md text-sm shadow-2xl border border-white/10">
            {toast}
          </div>
        </motion.div>
      )}
    </div>
  );
};

function TabBtn({
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

function PackageCard({ pkg, onBuy }: { pkg: TokenPackage; onBuy: () => void }) {
  const total = pkg.tokens + pkg.bonus;
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onBuy}
      className={`relative flex items-center gap-3 p-3 rounded-md text-left transition overflow-hidden ${
        pkg.highlight
          ? "bg-gradient-to-r from-emerald-900/80 to-emerald-950/80 border border-emerald-400/50 shadow-lg shadow-emerald-900/40"
          : "bg-white/5 border border-white/10"
      }`}
    >
      {pkg.highlight && (
        <div className="absolute top-1 right-2 text-[9px] font-black px-1.5 py-0.5 bg-emerald-400 text-emerald-950 rounded uppercase tracking-widest">
          คุ้ม
        </div>
      )}
      <div className="text-3xl">🪙</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-black text-amber-300 tabular-nums">
            {pkg.tokens.toLocaleString()}
          </span>
          {pkg.bonus > 0 && (
            <span className="text-xs font-bold text-emerald-300 tabular-nums">
              +{pkg.bonus}
            </span>
          )}
          <span className="text-[10px] text-white/50 ml-0.5">tokens</span>
        </div>
        <div className="text-[10px] text-white/50 mt-0.5">
          รับทั้งหมด {total.toLocaleString()} tokens
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-base font-black text-white tabular-nums">
          ฿{pkg.priceThb.toLocaleString()}
        </div>
      </div>
    </motion.button>
  );
}

function TransactionList({ txs }: { txs: ReturnType<typeof useMatchStore.getState>["tokenTransactions"] }) {
  const grouped = useMemo(() => groupByDay(txs), [txs]);
  if (txs.length === 0) {
    return (
      <div className="text-center text-white/40 py-12 text-sm">
        ยังไม่มีรายการธุรกรรม
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3 pb-4">
      {grouped.map(({ label, items }) => (
        <div key={label}>
          <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1 px-1">
            {label}
          </div>
          <div className="flex flex-col gap-1">
            {items.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center gap-3 px-3 py-2.5 bg-white/5 rounded-lg"
              >
                <div className="text-xl">{txIcon(tx.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{tx.description}</div>
                  <div className="text-[10px] text-white/40">{formatTime(tx.timestamp)}</div>
                </div>
                <div
                  className={`text-sm font-bold tabular-nums ${
                    tx.amount > 0 ? "text-emerald-300" : "text-rose-300"
                  }`}
                >
                  {tx.amount > 0 ? "+" : ""}
                  {tx.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function txIcon(type: TokenTxType): string {
  switch (type) {
    case "deposit": return "💰";
    case "withdraw": return "💸";
    case "match_entry": return "⚽";
    case "match_win": return "🏆";
    case "refund": return "↩️";
    case "promo": return "🎁";
  }
}

function groupByDay(
  txs: ReturnType<typeof useMatchStore.getState>["tokenTransactions"],
) {
  const groups: Record<string, typeof txs> = {};
  for (const tx of txs) {
    const key = dayLabel(tx.timestamp);
    if (!groups[key]) groups[key] = [];
    groups[key].push(tx);
  }
  return Object.entries(groups).map(([label, items]) => ({ label, items }));
}

function dayLabel(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const isToday =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  if (isToday) return "วันนี้";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();
  if (isYesterday) return "เมื่อวาน";
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}
