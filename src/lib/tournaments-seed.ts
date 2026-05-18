import type { Tournament } from "./types";

/**
 * Cosmetic tournament schedule for the demo.
 *
 * We compute `scheduledStart` relative to "now" so the countdown timers
 * always show realistic numbers regardless of when the demo is opened.
 */

function nextSlot(hoursFromNow: number): number {
  return Date.now() + hoursFromNow * 60 * 60 * 1000;
}

export function seedTournaments(): Tournament[] {
  return [
    {
      id: "tour-tonight-mega",
      title: "Mega Cup คืนนี้",
      subtitle: "64 ทีม • รางวัลใหญ่ที่สุด",
      size: 64,
      entryFee: 100,
      scheduledStart: nextSlot(2.5),
      maxTickets: 64,
      ticketsSold: 41,
      status: "registration",
      gradient: "from-rose-700 via-rose-800 to-rose-950",
      accent: "border-rose-400/50",
      icon: "🔥",
      tag: "MEGA",
      tagColor: "bg-rose-500/40 text-rose-100",
    },
    {
      id: "tour-weekend-grand",
      title: "Grand Tournament",
      subtitle: "32 ทีม • Saturday Showdown",
      size: 32,
      entryFee: 250,
      scheduledStart: nextSlot(28),
      maxTickets: 32,
      ticketsSold: 18,
      status: "registration",
      gradient: "from-amber-600 via-amber-800 to-orange-950",
      accent: "border-amber-400/50",
      icon: "🏆",
      tag: "GRAND",
      tagColor: "bg-amber-500/40 text-amber-100",
    },
    {
      id: "tour-quick-16",
      title: "Quick Sixteen",
      subtitle: "16 ทีม • เริ่มเร็ว ๆ นี้",
      size: 16,
      entryFee: 50,
      scheduledStart: nextSlot(0.75),
      maxTickets: 16,
      ticketsSold: 11,
      status: "registration",
      gradient: "from-emerald-700 via-emerald-800 to-emerald-950",
      accent: "border-emerald-400/50",
      icon: "⚡",
      tag: "FAST",
      tagColor: "bg-emerald-500/40 text-emerald-100",
    },
    {
      id: "tour-week-monster",
      title: "Monster of the Week",
      subtitle: "64 ทีม • รางวัลพิเศษ",
      size: 64,
      entryFee: 500,
      scheduledStart: nextSlot(72),
      maxTickets: 64,
      ticketsSold: 9,
      status: "registration",
      gradient: "from-purple-700 via-purple-800 to-purple-950",
      accent: "border-purple-400/50",
      icon: "🐲",
      tag: "ULTRA",
      tagColor: "bg-purple-500/40 text-purple-100",
    },
  ];
}
