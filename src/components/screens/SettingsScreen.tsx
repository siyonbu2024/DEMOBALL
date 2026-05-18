"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { play } from "@/lib/sound";
import { useMatchStore } from "@/store/match-store";

const AVATARS = ["🙂", "😎", "🤠", "🥷", "👻", "🤖", "👾", "🦊", "🐱", "🐯", "🦁", "🐼", "🐸", "🐲", "🦄"];

export const SettingsScreen = () => {
  const enterScreen = useMatchStore((s) => s.enterScreen);
  const isMuted = useMatchStore((s) => s.isMuted);
  const toggleMute = useMatchStore((s) => s.toggleMute);
  const vibrationEnabled = useMatchStore((s) => s.vibrationEnabled);
  const toggleVibration = useMatchStore((s) => s.toggleVibration);
  const user = useMatchStore((s) => s.userIdentity);
  const setUsername = useMatchStore((s) => s.setUsername);
  const setAvatar = useMatchStore((s) => s.setAvatar);

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user.username);
  const [pickerOpen, setPickerOpen] = useState(false);

  const onSaveName = () => {
    setUsername(nameInput);
    setEditingName(false);
    play("click");
  };

  return (
    <div className="flex flex-col flex-1 px-4 py-4 overflow-y-auto">
      {/* Header */}
      <header className="flex items-center gap-3 mb-4">
        <button
          onClick={() => enterScreen("home")}
          className="text-2xl text-white/80 active:scale-95 transition px-2"
          aria-label="กลับ"
        >
          ←
        </button>
        <h2 className="text-xl font-bold text-white">ตั้งค่า</h2>
      </header>

      {/* Profile card */}
      <SectionLabel>โปรไฟล์</SectionLabel>
      <div className="flex flex-col gap-2 mb-4">
        <SettingRow>
          <button
            onClick={() => setPickerOpen((v) => !v)}
            className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-800 flex items-center justify-center text-2xl ring-2 ring-emerald-400/60 shadow-lg active:scale-95 transition"
            aria-label="เปลี่ยน avatar"
          >
            {user.avatar}
          </button>
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  maxLength={16}
                  className="flex-1 bg-black/30 px-3 py-1.5 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                  autoFocus
                />
                <button
                  onClick={onSaveName}
                  className="text-xs font-bold px-3 py-1.5 bg-emerald-500/25 text-emerald-200 rounded ring-1 ring-emerald-400/40"
                >
                  บันทึก
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setNameInput(user.username);
                  setEditingName(true);
                }}
                className="w-full text-left active:opacity-60"
              >
                <div className="font-bold text-white">{user.username}</div>
                <div className="text-[10px] text-white/50">แตะเพื่อแก้ไขชื่อ • MMR {user.mmr}</div>
              </button>
            )}
          </div>
        </SettingRow>

        {pickerOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="grid grid-cols-5 gap-2 p-3 rounded-xl bg-white/5 border border-white/10"
          >
            {AVATARS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  setAvatar(emoji);
                  setPickerOpen(false);
                  play("click");
                }}
                className={`text-2xl py-2 rounded-lg active:scale-90 transition ${
                  user.avatar === emoji
                    ? "bg-emerald-500/30 ring-2 ring-emerald-400/60"
                    : "bg-black/20 hover:bg-white/5"
                }`}
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {/* Audio + haptic */}
      <SectionLabel>เสียง & สั่น</SectionLabel>
      <div className="flex flex-col gap-2 mb-4">
        <ToggleRow
          icon="🔊"
          label="เสียงเอฟเฟกต์"
          sublabel="คลิก, ยิง, เซฟ, ฯลฯ"
          value={!isMuted}
          onChange={toggleMute}
        />
        <ToggleRow
          icon="📳"
          label="สั่น (Haptic)"
          sublabel="สั่นเบาๆ เมื่อกดล็อค"
          value={vibrationEnabled}
          onChange={toggleVibration}
        />
      </div>

      {/* About */}
      <SectionLabel>เกี่ยวกับ</SectionLabel>
      <div className="flex flex-col gap-2 mb-6">
        <InfoRow label="เวอร์ชั่น" value="1.0.0 (demo)" />
        <InfoRow label="Build" value="2026.05.19" />
        <LinkRow label="📜 เงื่อนไขการใช้งาน" />
        <LinkRow label="🔒 นโยบายความเป็นส่วนตัว" />
        <LinkRow label="💬 ติดต่อทีมงาน" />
      </div>

      <p className="text-[10px] text-white/30 text-center mt-auto leading-relaxed pb-4">
        Penalty Shootout Demo — สำหรับ pitch ลูกค้า
        <br />© 2026 Football Demo
      </p>
    </div>
  );
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-bold px-1 mb-2">
      {children}
    </div>
  );
}

function SettingRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
      {children}
    </div>
  );
}

function ToggleRow({
  icon,
  label,
  sublabel,
  value,
  onChange,
}: {
  icon: string;
  label: string;
  sublabel?: string;
  value: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl active:bg-white/10 transition text-left"
    >
      <div className="text-xl w-7 text-center">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-white">{label}</div>
        {sublabel && <div className="text-[10px] text-white/50">{sublabel}</div>}
      </div>
      <div
        className={`relative w-11 h-6 rounded-full transition-colors ${
          value ? "bg-emerald-500" : "bg-white/15"
        }`}
      >
        <motion.div
          animate={{ x: value ? 22 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow"
        />
      </div>
    </button>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl">
      <span className="text-sm text-white/70">{label}</span>
      <span className="text-sm font-bold text-white tabular-nums">{value}</span>
    </div>
  );
}

function LinkRow({ label }: { label: string }) {
  return (
    <button className="flex items-center justify-between px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl active:bg-white/10 transition">
      <span className="text-sm text-white">{label}</span>
      <span className="text-white/30 text-lg">›</span>
    </button>
  );
}
