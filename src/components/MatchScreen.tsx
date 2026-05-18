"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { GamePhase, Screen } from "@/lib/types";
import { TIMING } from "@/lib/timing";
import { useMatchStore } from "@/store/match-store";
import { MuteToggle } from "./MuteToggle";
import { BracketView } from "./screens/BracketView";
import { HomeLobby } from "./screens/HomeLobby";
import { MatchEnd } from "./screens/MatchEnd";
import { MatchmakingScreen } from "./screens/MatchmakingScreen";
import { RevealOverlay } from "./screens/RevealOverlay";
import { RoundIntro } from "./screens/RoundIntro";
import { RoundPlay } from "./screens/RoundPlay";
import { RoundResult } from "./screens/RoundResult";
import { Room1v1 } from "./screens/Room1v1";
import { Room4v4 } from "./screens/Room4v4";
import { Room8v8 } from "./screens/Room8v8";
import { Room16v16 } from "./screens/Room16v16";
import { Room32v32 } from "./screens/Room32v32";
import { WalletScreen } from "./screens/WalletScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { MatchHistoryScreen } from "./screens/MatchHistoryScreen";

export const MatchScreen = () => {
  const currentScreen = useMatchStore((s) => s.currentScreen);

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-emerald-950 font-sans">
      <main className="w-full max-w-sm flex-1 flex flex-col bg-emerald-900 text-white relative overflow-hidden">
        <MuteToggle />
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: TIMING.pageTransition / 1000 }}
            className="flex-1 flex flex-col"
          >
            {renderScreen(currentScreen)}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

function renderScreen(screen: Screen) {
  switch (screen) {
    case "home":
      return <HomeLobby />;
    case "room-1v1":
      return <Room1v1 />;
    case "room-4v4":
      return <Room4v4 />;
    case "room-8v8":
      return <Room8v8 />;
    case "room-16v16":
      return <Room16v16 />;
    case "room-32v32":
      return <Room32v32 />;
    case "matchmaking":
      return <MatchmakingScreen />;
    case "bracket-view":
      return <BracketView />;
    case "in-match":
      return <InMatchView />;
    case "wallet":
      return <WalletScreen />;
    case "settings":
      return <SettingsScreen />;
    case "match-history":
      return <MatchHistoryScreen />;
  }
}

function InMatchView() {
  const phase = useMatchStore((s) => s.phase);
  return renderPhase(phase);
}

function renderPhase(phase: GamePhase) {
  switch (phase) {
    case "round-intro":
      return <RoundIntro />;
    case "kicker-aim":
    case "keeper-pick":
      return <RoundPlay />;
    case "reveal":
      return <RevealOverlay />;
    case "round-result":
      return <RoundResult />;
    case "match-end":
      return <MatchEnd />;
    case "menu":
    case "opponent-pick":
      // Legacy phases — replaced by Screen-level routing.
      return null;
  }
}

