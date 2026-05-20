"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { TIMING } from "@/lib/timing";
import type { Screen } from "@/lib/types";
import { useMatchStore } from "@/store/match-store";

type TabKey = "rooms" | "tickets" | "tournament" | "profile";

const ROOM_SCREENS: Screen[] = [
  "home",
  "room-1v1",
  "room-4v4",
  "room-8v8",
  "room-16v16",
  "room-32v32",
];

const activeTabForScreen = (screen: Screen): TabKey | null => {
  if (ROOM_SCREENS.includes(screen)) return "rooms";
  if (screen === "my-tickets") return "tickets";
  if (screen === "settings") return "profile";
  return null;
};

export const BottomNav = () => {
  const currentScreen = useMatchStore((s) => s.currentScreen);
  const enterScreen = useMatchStore((s) => s.enterScreen);
  const ticketCount = useMatchStore((s) => s.userTickets.length);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(false), TIMING.toastDuration);
    return () => clearTimeout(t);
  }, [toast]);

  const active = activeTabForScreen(currentScreen);

  return (
    <>
      <div className="shrink-0 backdrop-blur-md bg-[#15141f]/90 border-t border-white/10 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="flex items-stretch justify-around px-2">
          <NavItem
            icon="⚔️"
            label="ห้องแข่งขัน"
            active={active === "rooms"}
            onTap={() => enterScreen("home")}
          />
          <NavItem
            icon="🎟️"
            label="ตั๋ว"
            active={active === "tickets"}
            badge={ticketCount > 0 ? ticketCount : undefined}
            onTap={() => enterScreen("my-tickets")}
          />
          <NavItem
            icon="🏅"
            label="ทัวร์นาเมนท์"
            active={active === "tournament"}
            disabled
            onTap={() => setToast(true)}
          />
          <NavItem
            icon="👤"
            label="โปรไฟล์"
            active={active === "profile"}
            onTap={() => enterScreen("settings")}
          />
        </div>
      </div>

      {toast && (
        <div className="fixed inset-x-0 bottom-24 flex justify-center pointer-events-none z-[60]">
          <div className="px-5 py-3 bg-black/85 text-white rounded-md text-sm shadow-lg border border-white/10">
            ทัวร์นาเมนท์จะเปิดเร็วๆ นี้
          </div>
        </div>
      )}
    </>
  );
};

function NavItem({
  icon,
  label,
  active,
  disabled,
  badge,
  onTap,
}: {
  icon: string;
  label: string;
  active: boolean;
  disabled?: boolean;
  badge?: number;
  onTap: () => void;
}) {
  return (
    <motion.button
      onClick={onTap}
      whileTap={{ scale: 0.92 }}
      className="relative flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-md"
    >
      {/* Active glow background */}
      {active && (
        <motion.div
          layoutId="bottomnav-active"
          className="absolute inset-x-1.5 inset-y-1 rounded-md bg-gradient-to-b from-emerald-500/20 to-emerald-500/5 border border-emerald-400/30 shadow-[0_0_12px_rgba(52,211,153,0.25)]"
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
        />
      )}
      <span
        className={[
          "relative text-xl leading-none transition",
          active ? "drop-shadow-[0_0_6px_rgba(52,211,153,0.6)]" : "",
          disabled && !active ? "opacity-50" : "",
        ].join(" ")}
        aria-hidden
      >
        {icon}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center tabular-nums leading-none ring-2 ring-[#15141f] shadow">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </span>
      <span
        className={[
          "relative text-[10px] font-black tracking-wider uppercase leading-none transition",
          active
            ? "text-emerald-300"
            : disabled
            ? "text-white/40"
            : "text-white/70",
        ].join(" ")}
      >
        {label}
      </span>
    </motion.button>
  );
}
