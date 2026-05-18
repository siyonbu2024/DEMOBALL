"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo } from "react";
import { TIMING } from "@/lib/timing";
import { GameButton } from "@/components/GameButton";
import type {
  BracketMatch,
  BracketSlot,
  BracketState,
} from "@/lib/types";
import { useMatchStore } from "@/store/match-store";

type FlowState =
  | { kind: "no-bracket" }
  | { kind: "user-up" }
  | { kind: "simulating"; match: BracketMatch }
  | { kind: "round-complete" }
  | { kind: "champion" };

function computeFlowState(
  bracket: BracketState | null,
  userId: string
): FlowState {
  if (!bracket) return { kind: "no-bracket" };

  const allResolved = bracket.matches.every((m) => m.winnerId !== null);
  if (allResolved) return { kind: "champion" };

  const userMatch = bracket.matches.find(
    (m) =>
      m.roundIndex === bracket.currentRoundIndex &&
      (m.player1Id === userId || m.player2Id === userId)
  );
  const userEliminated =
    bracket.participants.find((p) => p.isUser)?.eliminated ?? false;
  if (userMatch && userMatch.winnerId === null && !userEliminated) {
    return { kind: "user-up" };
  }

  // Pending bot matches in current round
  const pending = bracket.matches.find(
    (m) =>
      m.roundIndex === bracket.currentRoundIndex &&
      m.winnerId === null &&
      m.player1Id !== "" &&
      m.player2Id !== "" &&
      !(m.player1Id === userId || m.player2Id === userId)
  );
  if (pending) return { kind: "simulating", match: pending };

  return { kind: "round-complete" };
}

function roundLabel(roundIndex: number, size: 4 | 8 | 16 | 32): string {
  const totalRounds = Math.log2(size); // 4→2, 8→3, 16→4, 32→5
  const roundFromEnd = totalRounds - 1 - roundIndex;
  if (roundFromEnd === 0) return "รอบชิงชนะเลิศ";
  if (roundFromEnd === 1) return "รอบรองฯ";
  if (roundFromEnd === 2) return "รอบ 8 ทีม";
  if (roundFromEnd === 3) return "รอบ 16 ทีม";
  return `รอบ ${Math.pow(2, roundFromEnd)} ทีม`;
}

function groupByRound(matches: BracketMatch[]): BracketMatch[][] {
  const groups: BracketMatch[][] = [];
  for (const m of matches) {
    if (!groups[m.roundIndex]) groups[m.roundIndex] = [];
    groups[m.roundIndex].push(m);
  }
  return groups.map((g) => g.sort((a, b) => a.positionInRound - b.positionInRound));
}

export const BracketView = () => {
  const bracket = useMatchStore((s) => s.currentBracket);
  const userIdentity = useMatchStore((s) => s.userIdentity);
  const enterUserBracketMatch = useMatchStore((s) => s.enterUserBracketMatch);
  const simulateBracketMatch = useMatchStore((s) => s.simulateBracketMatch);
  const advanceBracketRound = useMatchStore((s) => s.advanceBracketRound);
  const startBracket = useMatchStore((s) => s.startBracket);
  const leaveBracket = useMatchStore((s) => s.leaveBracket);

  const userId = userIdentity.id;
  const flowState = useMemo(
    () => computeFlowState(bracket, userId),
    [bracket, userId]
  );

  // Stable key so the effect re-runs only on meaningful flow change
  const flowKey =
    flowState.kind === "simulating"
      ? `simulating:${flowState.match.roundIndex}-${flowState.match.positionInRound}`
      : flowState.kind;

  useEffect(() => {
    if (!bracket) return;

    if (flowState.kind === "user-up") {
      const t = setTimeout(
        enterUserBracketMatch,
        TIMING.bracketAdvanceDelay
      );
      return () => clearTimeout(t);
    }

    if (flowState.kind === "simulating") {
      const userEliminated =
        bracket.participants.find((p) => p.isUser)?.eliminated ?? false;
      const delay = userEliminated
        ? TIMING.bracketSimulationFastMs
        : TIMING.bracketSimulationPerMatch;
      const match = flowState.match;
      const t = setTimeout(() => {
        simulateBracketMatch({
          roundIndex: match.roundIndex,
          positionInRound: match.positionInRound,
        });
      }, delay);
      return () => clearTimeout(t);
    }

    if (flowState.kind === "round-complete") {
      const t = setTimeout(advanceBracketRound, TIMING.roundTransition);
      return () => clearTimeout(t);
    }
    // "champion" and "no-bracket" — no auto action
  }, [
    flowKey,
    bracket,
    enterUserBracketMatch,
    simulateBracketMatch,
    advanceBracketRound,
    flowState,
  ]);

  if (!bracket) {
    return (
      <div className="flex items-center justify-center flex-1 text-white/60">
        ไม่มี bracket
      </div>
    );
  }

  if (flowState.kind === "champion") {
    return (
      <ChampionView
        bracket={bracket}
        userId={userId}
        onPlayAgain={() => startBracket(bracket.size)}
        onLeave={leaveBracket}
      />
    );
  }

  return <BracketTreeView bracket={bracket} userId={userId} flowState={flowState} />;
};

function BracketTreeView({
  bracket,
  userId,
  flowState,
}: {
  bracket: BracketState;
  userId: string;
  flowState: FlowState;
}) {
  const grouped = groupByRound(bracket.matches);
  const userEliminated =
    bracket.participants.find((p) => p.isUser)?.eliminated ?? false;
  const simulatingKey =
    flowState.kind === "simulating"
      ? `${flowState.match.roundIndex}-${flowState.match.positionInRound}`
      : null;

  return (
    <div className="flex flex-col gap-5 px-5 py-5">
      <header className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">
          Bracket {bracket.size} คน
        </h2>
        <button
          onClick={() => useMatchStore.getState().leaveBracket()}
          className="text-xs text-white/70 active:scale-95 px-2 py-1"
        >
          ออกห้อง
        </button>
      </header>

      <div className="text-xs uppercase tracking-widest text-white/50 -mt-2">
        {userEliminated
          ? "ดูผลการแข่งต่อ…"
          : flowState.kind === "user-up"
          ? "ตาคุณกำลังจะเริ่ม…"
          : "กำลังประมวลผล…"}
      </div>

      <div className="flex flex-col gap-5">
        {grouped.map((roundMatches, roundIdx) => (
          <div key={roundIdx} className="flex flex-col gap-2">
            <div className="text-xs uppercase tracking-widest text-amber-300/80 font-bold">
              {roundLabel(roundIdx, bracket.size)}
            </div>
            <div className="flex flex-col gap-2">
              {roundMatches.map((m) => {
                const key = `${m.roundIndex}-${m.positionInRound}`;
                const isUserMatch =
                  m.player1Id === userId || m.player2Id === userId;
                const isCurrentRound =
                  m.roundIndex === bracket.currentRoundIndex;
                const isSimulating = simulatingKey === key;
                const isUserUpcoming =
                  isUserMatch &&
                  m.winnerId === null &&
                  isCurrentRound &&
                  flowState.kind === "user-up";
                return (
                  <MatchCard
                    key={key}
                    match={m}
                    bracket={bracket}
                    userId={userId}
                    isUserMatch={isUserMatch}
                    isSimulating={isSimulating}
                    isUserUpcoming={isUserUpcoming}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MatchCard({
  match,
  bracket,
  userId,
  isUserMatch,
  isSimulating,
  isUserUpcoming,
}: {
  match: BracketMatch;
  bracket: BracketState;
  userId: string;
  isUserMatch: boolean;
  isSimulating: boolean;
  isUserUpcoming: boolean;
}) {
  const slot1 = findSlot(bracket, match.player1Id);
  const slot2 = findSlot(bracket, match.player2Id);
  const resolved = match.winnerId !== null;
  const winnerIsP1 = match.winnerId === match.player1Id;
  const winnerIsP2 = match.winnerId === match.player2Id;

  return (
    <motion.div
      initial={false}
      animate={
        isUserUpcoming
          ? { boxShadow: "0 0 0 2px rgba(251,191,36,0.7)" }
          : isSimulating
          ? { boxShadow: "0 0 0 2px rgba(96,165,250,0.7)" }
          : isUserMatch
          ? { boxShadow: "0 0 0 2px rgba(251,191,36,0.4)" }
          : { boxShadow: "0 0 0 0px rgba(0,0,0,0)" }
      }
      transition={{ duration: 0.3 }}
      className="bg-white/5 rounded-md p-2.5"
    >
      <PlayerRow
        slot={slot1}
        score={match.score?.p1 ?? null}
        isUser={slot1?.identity.id === userId}
        isWinner={resolved && winnerIsP1}
        isLoser={resolved && winnerIsP2}
      />
      <div className="my-1 border-t border-white/5" />
      <PlayerRow
        slot={slot2}
        score={match.score?.p2 ?? null}
        isUser={slot2?.identity.id === userId}
        isWinner={resolved && winnerIsP2}
        isLoser={resolved && winnerIsP1}
      />
      {(isSimulating || isUserUpcoming) && (
        <div className="mt-1.5 text-[10px] uppercase tracking-wider text-center font-bold">
          {isSimulating ? (
            <span className="text-blue-300">
              <SpinnerDot /> กำลังเล่น…
            </span>
          ) : (
            <span className="text-amber-300">เริ่มเร็วๆ นี้</span>
          )}
        </div>
      )}
    </motion.div>
  );
}

function PlayerRow({
  slot,
  score,
  isUser,
  isWinner,
  isLoser,
}: {
  slot: BracketSlot | null;
  score: number | null;
  isUser: boolean;
  isWinner: boolean;
  isLoser: boolean;
}) {
  if (!slot) {
    return (
      <div className="flex items-center gap-2 text-white/40 text-sm h-8">
        <span className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 text-xs">
          ?
        </span>
        <span className="flex-1">รอผู้ชนะ</span>
        <span className="font-mono">—</span>
      </div>
    );
  }
  const eliminated = slot.eliminated;
  return (
    <div
      className={`flex items-center gap-2 h-8 ${
        isLoser || eliminated ? "opacity-50" : ""
      }`}
    >
      <span className="w-7 h-7 flex items-center justify-center text-base">
        {slot.identity.avatar}
      </span>
      <div className="flex-1 min-w-0 flex items-center gap-1.5">
        <span
          className={`font-bold truncate ${
            isWinner ? "text-emerald-200" : "text-white"
          } text-sm`}
        >
          {slot.identity.username}
        </span>
        {isUser && (
          <span className="text-[9px] uppercase tracking-wider px-1 py-0.5 bg-amber-500/40 text-amber-100 rounded font-bold">
            คุณ
          </span>
        )}
        {eliminated && !isWinner && <span className="text-rose-300 text-xs">✗</span>}
      </div>
      <AnimatePresence>
        {score !== null && (
          <motion.span
            key={`${slot.identity.id}-${score}`}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
            className={`font-mono font-bold tabular-nums ${
              isWinner ? "text-emerald-200" : "text-white/70"
            }`}
          >
            {score}
          </motion.span>
        )}
        {score === null && (
          <span key="dash" className="font-mono text-white/30">
            —
          </span>
        )}
      </AnimatePresence>
    </div>
  );
}

function findSlot(bracket: BracketState, id: string): BracketSlot | null {
  if (!id) return null;
  return bracket.participants.find((p) => p.identity.id === id) ?? null;
}

function SpinnerDot() {
  return (
    <motion.span
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      className="inline-block w-2.5 h-2.5 mr-1 align-middle"
    >
      ⚪
    </motion.span>
  );
}

function ChampionView({
  bracket,
  userId,
  onPlayAgain,
  onLeave,
}: {
  bracket: BracketState;
  userId: string;
  onPlayAgain: () => void;
  onLeave: () => void;
}) {
  const finalMatch = bracket.matches[bracket.matches.length - 1];
  const championId = finalMatch?.winnerId ?? null;
  const champion = bracket.participants.find(
    (p) => p.identity.id === championId
  );
  const userWon = championId === userId;
  const userSlot = bracket.participants.find((p) => p.isUser);
  const userEliminated = userSlot?.eliminated ?? false;

  // Where did user lose?
  let userLostRound: number | null = null;
  if (userEliminated) {
    const lostMatch = bracket.matches.find(
      (m) =>
        (m.player1Id === userId || m.player2Id === userId) &&
        m.winnerId !== null &&
        m.winnerId !== userId
    );
    if (lostMatch) userLostRound = lostMatch.roundIndex;
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-6 px-6 text-center">
      {userWon ? (
        <>
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 14 }}
            className="text-7xl"
          >
            🏆
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col gap-1"
          >
            <div className="text-5xl font-black text-amber-300">CHAMPION</div>
            <div className="text-white/80 text-sm uppercase tracking-widest">
              แชมป์ Bracket {bracket.size} คน
            </div>
          </motion.div>
        </>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-rose-300"
          >
            พ่ายแพ้ในรอบ{" "}
            {userLostRound !== null
              ? roundLabel(userLostRound, bracket.size)
              : "?"}
          </motion.div>
          {champion && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center gap-2 mt-2"
            >
              <div className="text-3xl">🏆</div>
              <div className="text-xs uppercase tracking-widest text-white/60">
                แชมป์
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 rounded-md">
                <span className="text-2xl">{champion.identity.avatar}</span>
                <span className="font-bold text-amber-200">
                  {champion.identity.username}
                </span>
              </div>
            </motion.div>
          )}
        </>
      )}

      <div className="flex flex-col gap-3 w-full max-w-xs mt-2">
        {userWon && (
          <GameButton onClick={onPlayAgain} size="lg" className="w-full">
            🔄 เล่นอีกรอบ
          </GameButton>
        )}
        <GameButton onClick={onLeave} className="w-full">
          กลับไปยังห้อง
        </GameButton>
      </div>
    </div>
  );
}
