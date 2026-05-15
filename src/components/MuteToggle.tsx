"use client";

import { useMatchStore } from "@/store/match-store";

export const MuteToggle = () => {
  const isMuted = useMatchStore((s) => s.isMuted);
  const toggleMute = useMatchStore((s) => s.toggleMute);
  return (
    <button
      onClick={toggleMute}
      className="absolute top-2 right-2 z-50 w-9 h-9 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/40 active:scale-90 transition"
      aria-label={isMuted ? "เปิดเสียง" : "ปิดเสียง"}
    >
      <span className="text-base" aria-hidden>
        {isMuted ? "🔇" : "🔊"}
      </span>
    </button>
  );
};
