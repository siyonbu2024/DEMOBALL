import { beforeEach, describe, expect, it } from "vitest";
import { BOT_POOL } from "@/lib/bot-identities";
import { getInitialMatchStoreState, useMatchStore } from "./match-store";

beforeEach(() => {
  useMatchStore.setState(getInitialMatchStoreState());
});

describe("match-store: initial state", () => {
  it("starts at home screen with empty match", () => {
    const s = useMatchStore.getState();
    expect(s.currentScreen).toBe("home");
    expect(s.matchState.rounds).toHaveLength(0);
    expect(s.currentOpponent).toBeNull();
    expect(s.currentBracket).toBeNull();
    expect(s.currentMatchContext).toBeNull();
  });

  it("seeds a userIdentity", () => {
    const s = useMatchStore.getState();
    expect(s.userIdentity.username).toBe("คุณ");
    expect(s.userIdentity.mmr).toBe(1200);
  });

  it("starts with empty roomAssignments", () => {
    const ra = useMatchStore.getState().roomAssignments;
    expect(ra["1v1"]).toHaveLength(0);
    expect(ra["4v4"]).toHaveLength(0);
    expect(ra["8v8"]).toHaveLength(0);
  });
});

describe("match-store: navigation", () => {
  it("enterScreen changes currentScreen", () => {
    useMatchStore.getState().enterScreen("room-1v1");
    expect(useMatchStore.getState().currentScreen).toBe("room-1v1");
  });
});

describe("match-store: room assignments", () => {
  it("initializeRoomAssignments distributes all 30 bots into 3 buckets", () => {
    useMatchStore.getState().initializeRoomAssignments();
    const ra = useMatchStore.getState().roomAssignments;
    const total = ra["1v1"].length + ra["4v4"].length + ra["8v8"].length;
    expect(total).toBe(BOT_POOL.length);
  });

  it("initializeRoomAssignments respects spec ranges per room", () => {
    useMatchStore.getState().initializeRoomAssignments();
    const ra = useMatchStore.getState().roomAssignments;
    expect(ra["1v1"].length).toBeGreaterThanOrEqual(12);
    expect(ra["1v1"].length).toBeLessThanOrEqual(35);
    expect(ra["4v4"].length).toBeGreaterThanOrEqual(8);
    expect(ra["4v4"].length).toBeLessThanOrEqual(20);
    expect(ra["8v8"].length).toBeGreaterThanOrEqual(5);
    expect(ra["8v8"].length).toBeLessThanOrEqual(15);
  });

  it("initializeRoomAssignments produces unique bot ids across all buckets", () => {
    useMatchStore.getState().initializeRoomAssignments();
    const ra = useMatchStore.getState().roomAssignments;
    const all = [...ra["1v1"], ...ra["4v4"], ...ra["8v8"]];
    expect(new Set(all).size).toBe(all.length);
  });

  it("initializeRoomAssignments is idempotent", () => {
    useMatchStore.getState().initializeRoomAssignments();
    const before = useMatchStore.getState().roomAssignments;
    useMatchStore.getState().initializeRoomAssignments();
    const after = useMatchStore.getState().roomAssignments;
    expect(after["1v1"]).toEqual(before["1v1"]);
    expect(after["4v4"]).toEqual(before["4v4"]);
    expect(after["8v8"]).toEqual(before["8v8"]);
  });

  it("driftRoomAssignments preserves total count and uniqueness", () => {
    useMatchStore.getState().initializeRoomAssignments();
    for (let i = 0; i < 20; i++) {
      useMatchStore.getState().driftRoomAssignments();
    }
    const ra = useMatchStore.getState().roomAssignments;
    const all = [...ra["1v1"], ...ra["4v4"], ...ra["8v8"]];
    expect(all).toHaveLength(BOT_POOL.length);
    expect(new Set(all).size).toBe(all.length);
  });

  it("driftRoomAssignments actually moves bots over time", () => {
    useMatchStore.getState().initializeRoomAssignments();
    const before = useMatchStore.getState().roomAssignments;
    let changed = false;
    for (let i = 0; i < 30 && !changed; i++) {
      useMatchStore.getState().driftRoomAssignments();
      const after = useMatchStore.getState().roomAssignments;
      if (
        after["1v1"].length !== before["1v1"].length ||
        after["4v4"].length !== before["4v4"].length ||
        after["8v8"].length !== before["8v8"].length
      ) {
        changed = true;
      }
    }
    expect(changed).toBe(true);
  });
});

describe("match-store: 1v1 flow goes through matchmaking", () => {
  it("startQuickMatch1v1 lands on matchmaking, not in-match", () => {
    useMatchStore.getState().startQuickMatch1v1();
    const s = useMatchStore.getState();
    expect(s.currentScreen).toBe("matchmaking");
    expect(s.currentOpponent).not.toBeNull();
    expect(s.currentMatchContext).toEqual({ type: "quick-1v1" });
  });

  it("startSpecificMatch1v1 lands on matchmaking with chosen bot", () => {
    const target = BOT_POOL[3];
    useMatchStore.getState().startSpecificMatch1v1(target.id);
    const s = useMatchStore.getState();
    expect(s.currentScreen).toBe("matchmaking");
    expect(s.currentOpponent?.identity.id).toBe(target.id);
  });

  it("startSpecificMatch1v1 with invalid id is a no-op", () => {
    useMatchStore.getState().startSpecificMatch1v1("__nope__");
    const s = useMatchStore.getState();
    expect(s.currentScreen).toBe("home");
    expect(s.currentOpponent).toBeNull();
  });

  it("finishMatchmaking transitions matchmaking → in-match", () => {
    useMatchStore.getState().startQuickMatch1v1();
    useMatchStore.getState().finishMatchmaking();
    const s = useMatchStore.getState();
    expect(s.currentScreen).toBe("in-match");
    expect(s.phase).toBe("round-intro");
  });
});

describe("match-store: round flow", () => {
  it("enterRound routes p1 to kicker-aim", () => {
    useMatchStore.getState().startQuickMatch1v1();
    useMatchStore.getState().finishMatchmaking();
    useMatchStore.getState().enterRound();
    expect(useMatchStore.getState().phase).toBe("kicker-aim");
  });

  it("enterRound routes p2 to keeper-pick after one round", () => {
    const s = useMatchStore.getState();
    s.startQuickMatch1v1();
    s.finishMatchmaking();
    s.setKickerChoice(1);
    s.setKeeperChoice(2);
    s.commitRound();
    s.enterRound();
    expect(useMatchStore.getState().phase).toBe("keeper-pick");
  });

  it("commitRound applies the round and clears pending", () => {
    const s = useMatchStore.getState();
    s.startQuickMatch1v1();
    s.finishMatchmaking();
    s.setKickerChoice(3);
    s.setKeeperChoice(4);
    s.commitRound();
    const after = useMatchStore.getState();
    expect(after.matchState.rounds).toHaveLength(1);
    expect(after.matchState.score).toEqual({ p1: 1, p2: 0 });
    expect(after.pendingKickerChoice).toBeNull();
    expect(after.pendingKeeperChoice).toBeNull();
    expect(after.phase).toBe("reveal");
  });

  it("commitRound is a no-op when either choice is missing", () => {
    const s = useMatchStore.getState();
    s.startQuickMatch1v1();
    s.finishMatchmaking();
    s.setKickerChoice(1);
    s.commitRound();
    const after = useMatchStore.getState();
    expect(after.matchState.rounds).toHaveLength(0);
    expect(after.phase).toBe("round-intro");
  });

  it("finishReveal goes to round-result while match continues", () => {
    const s = useMatchStore.getState();
    s.startQuickMatch1v1();
    s.finishMatchmaking();
    s.setKickerChoice(1);
    s.setKeeperChoice(2);
    s.commitRound();
    s.finishReveal();
    expect(useMatchStore.getState().phase).toBe("round-result");
  });

  it("finishReveal goes to match-end when winner is set", () => {
    useMatchStore.setState({
      matchState: {
        rounds: [],
        score: { p1: 6, p2: 4 },
        winner: "p1",
        inSuddenDeath: false,
      },
      phase: "reveal",
    });
    useMatchStore.getState().finishReveal();
    expect(useMatchStore.getState().phase).toBe("match-end");
  });

  it("nextRound returns to round-intro", () => {
    useMatchStore.setState({ phase: "round-result" });
    useMatchStore.getState().nextRound();
    expect(useMatchStore.getState().phase).toBe("round-intro");
  });
});

describe("match-store: replay / exit", () => {
  it("replayMatch from quick-1v1 starts a fresh match through matchmaking", () => {
    const s = useMatchStore.getState();
    s.startQuickMatch1v1();
    s.finishMatchmaking();
    s.setKickerChoice(1);
    s.setKeeperChoice(2);
    s.commitRound();
    expect(useMatchStore.getState().matchState.rounds).toHaveLength(1);
    s.replayMatch();
    const after = useMatchStore.getState();
    expect(after.matchState.rounds).toHaveLength(0);
    expect(after.currentMatchContext).toEqual({ type: "quick-1v1" });
    expect(after.currentOpponent).not.toBeNull();
    expect(after.currentScreen).toBe("matchmaking");
  });

  it("replayMatch from specific-1v1 keeps the same bot id", () => {
    const target = BOT_POOL[5];
    const s = useMatchStore.getState();
    s.startSpecificMatch1v1(target.id);
    s.finishMatchmaking();
    s.setKickerChoice(1);
    s.setKeeperChoice(1);
    s.commitRound();
    s.replayMatch();
    const after = useMatchStore.getState();
    expect(after.matchState.rounds).toHaveLength(0);
    expect(after.currentOpponent?.identity.id).toBe(target.id);
  });

  it("exitMatch from quick-1v1 returns to room-1v1 and clears opponent", () => {
    const s = useMatchStore.getState();
    s.startQuickMatch1v1();
    s.exitMatch();
    const after = useMatchStore.getState();
    expect(after.currentScreen).toBe("room-1v1");
    expect(after.currentOpponent).toBeNull();
    expect(after.currentMatchContext).toBeNull();
  });

  it("exitMatch with no context goes home", () => {
    useMatchStore.getState().exitMatch();
    expect(useMatchStore.getState().currentScreen).toBe("home");
  });
});

describe("match-store: bracket entry", () => {
  it("startBracket(4) creates 4 participants and goes to bracket-view", () => {
    useMatchStore.getState().startBracket(4);
    const s = useMatchStore.getState();
    expect(s.currentScreen).toBe("bracket-view");
    expect(s.currentBracket?.size).toBe(4);
    expect(s.currentBracket?.participants).toHaveLength(4);
    expect(
      s.currentBracket?.participants.filter((p) => p.isUser)
    ).toHaveLength(1);
    expect(s.currentMatchContext).toEqual({
      type: "bracket",
      size: 4,
      bracketRoundIndex: 0,
    });
  });

  it("startBracket(8) creates 8 participants", () => {
    useMatchStore.getState().startBracket(8);
    expect(useMatchStore.getState().currentBracket?.participants).toHaveLength(8);
  });

  it("exitMatch from bracket returns to bracket-view", () => {
    const s = useMatchStore.getState();
    s.startBracket(4);
    useMatchStore.setState({ currentScreen: "in-match" });
    s.exitMatch();
    expect(useMatchStore.getState().currentScreen).toBe("bracket-view");
  });
});

describe("match-store: bracket structure", () => {
  it("startBracket(4) builds 3 matches: 2 SF + 1 Final TBD", () => {
    useMatchStore.getState().startBracket(4);
    const matches = useMatchStore.getState().currentBracket!.matches;
    expect(matches).toHaveLength(3);
    expect(matches.filter((m) => m.roundIndex === 0)).toHaveLength(2);
    expect(matches.filter((m) => m.roundIndex === 1)).toHaveLength(1);
    const final = matches.find((m) => m.roundIndex === 1)!;
    expect(final.player1Id).toBe("");
    expect(final.player2Id).toBe("");
  });

  it("startBracket(8) builds 7 matches: 4 QF + 2 SF + 1 F", () => {
    useMatchStore.getState().startBracket(8);
    const matches = useMatchStore.getState().currentBracket!.matches;
    expect(matches).toHaveLength(7);
    expect(matches.filter((m) => m.roundIndex === 0)).toHaveLength(4);
    expect(matches.filter((m) => m.roundIndex === 1)).toHaveLength(2);
    expect(matches.filter((m) => m.roundIndex === 2)).toHaveLength(1);
  });

  it("startBracket sets userOpponentForCurrentMatch in round 0", () => {
    useMatchStore.getState().startBracket(4);
    const opp = useMatchStore.getState().currentBracket!.userOpponentForCurrentMatch;
    expect(opp).not.toBeNull();
    expect(opp!.isUser).toBe(false);
    expect(opp!.brain).not.toBeNull();
  });
});

describe("match-store: bracket flow", () => {
  it("enterUserBracketMatch transitions to in-match with correct opponent", () => {
    const s = useMatchStore.getState();
    s.startBracket(4);
    s.enterUserBracketMatch();
    const after = useMatchStore.getState();
    expect(after.currentScreen).toBe("in-match");
    expect(after.phase).toBe("round-intro");
    expect(after.currentOpponent).not.toBeNull();
    expect(after.currentOpponent!.identity.id).toBe(
      after.currentBracket!.userOpponentForCurrentMatch!.identity.id
    );
  });

  it("simulateBracketMatch resolves a bot-vs-bot match and marks loser eliminated", () => {
    const s = useMatchStore.getState();
    s.startBracket(4);
    // Find an R0 match that doesn't include user
    const userId = useMatchStore.getState().userIdentity.id;
    const botMatch = useMatchStore
      .getState()
      .currentBracket!.matches.find(
        (m) =>
          m.roundIndex === 0 && m.player1Id !== userId && m.player2Id !== userId
      );
    expect(botMatch).toBeDefined();
    s.simulateBracketMatch({
      roundIndex: botMatch!.roundIndex,
      positionInRound: botMatch!.positionInRound,
    });
    const updated = useMatchStore
      .getState()
      .currentBracket!.matches.find(
        (m) =>
          m.roundIndex === botMatch!.roundIndex &&
          m.positionInRound === botMatch!.positionInRound
      )!;
    expect(updated.winnerId).not.toBeNull();
    expect(updated.score).not.toBeNull();
    const loserId =
      updated.winnerId === botMatch!.player1Id
        ? botMatch!.player2Id
        : botMatch!.player1Id;
    const loserSlot = useMatchStore
      .getState()
      .currentBracket!.participants.find((p) => p.identity.id === loserId)!;
    expect(loserSlot.eliminated).toBe(true);
  });

  it("simulateBracketMatch propagates winner to next-round TBD slot", () => {
    const s = useMatchStore.getState();
    s.startBracket(4);
    // Resolve both R0 matches
    s.simulateBracketMatch({ roundIndex: 0, positionInRound: 0 });
    s.simulateBracketMatch({ roundIndex: 0, positionInRound: 1 });
    const final = useMatchStore
      .getState()
      .currentBracket!.matches.find((m) => m.roundIndex === 1)!;
    expect(final.player1Id).not.toBe("");
    expect(final.player2Id).not.toBe("");
  });

  it("advanceBracketRound is a no-op when not all current matches resolved", () => {
    const s = useMatchStore.getState();
    s.startBracket(4);
    // Only resolve one match
    s.simulateBracketMatch({ roundIndex: 0, positionInRound: 0 });
    s.advanceBracketRound();
    expect(useMatchStore.getState().currentBracket!.currentRoundIndex).toBe(0);
  });

  it("advanceBracketRound advances + recomputes user opponent", () => {
    const s = useMatchStore.getState();
    s.startBracket(4);
    s.enterUserBracketMatch();
    // User wins their R0 match via finishReveal (proper propagation path)
    useMatchStore.setState({
      matchState: {
        rounds: [],
        score: { p1: 5, p2: 3 },
        winner: "p1",
        inSuddenDeath: false,
      },
      phase: "reveal",
    });
    s.finishReveal();
    // Sim the other R0 match
    const otherMatch = useMatchStore
      .getState()
      .currentBracket!.matches.find(
        (m) => m.roundIndex === 0 && m.winnerId === null
      )!;
    s.simulateBracketMatch({
      roundIndex: 0,
      positionInRound: otherMatch.positionInRound,
    });
    s.advanceBracketRound();
    const after = useMatchStore.getState().currentBracket!;
    expect(after.currentRoundIndex).toBe(1);
    expect(after.userOpponentForCurrentMatch).not.toBeNull();
  });

  it("finishReveal in bracket context records user's match result", () => {
    const s = useMatchStore.getState();
    s.startBracket(4);
    s.enterUserBracketMatch();
    // Force a finished match state (user wins 5-2)
    useMatchStore.setState({
      matchState: {
        rounds: [],
        score: { p1: 5, p2: 2 },
        winner: "p1",
        inSuddenDeath: false,
      },
      phase: "reveal",
    });
    s.finishReveal();
    const after = useMatchStore.getState();
    expect(after.phase).toBe("match-end");
    const userId = after.userIdentity.id;
    const userMatch = after.currentBracket!.matches.find(
      (m) =>
        m.roundIndex === 0 && (m.player1Id === userId || m.player2Id === userId)
    )!;
    expect(userMatch.winnerId).toBe(userId);
    expect(userMatch.score).not.toBeNull();
  });

  it("finishReveal in bracket marks user eliminated when they lose", () => {
    const s = useMatchStore.getState();
    s.startBracket(4);
    s.enterUserBracketMatch();
    useMatchStore.setState({
      matchState: {
        rounds: [],
        score: { p1: 2, p2: 5 },
        winner: "p2",
        inSuddenDeath: false,
      },
      phase: "reveal",
    });
    s.finishReveal();
    const userSlot = useMatchStore
      .getState()
      .currentBracket!.participants.find((p) => p.isUser)!;
    expect(userSlot.eliminated).toBe(true);
  });

  it("leaveBracket clears bracket and routes to room-4v4", () => {
    const s = useMatchStore.getState();
    s.startBracket(4);
    s.leaveBracket();
    const after = useMatchStore.getState();
    expect(after.currentBracket).toBeNull();
    expect(after.currentScreen).toBe("room-4v4");
  });

  it("leaveBracket from 8-bracket routes to room-8v8", () => {
    const s = useMatchStore.getState();
    s.startBracket(8);
    s.leaveBracket();
    expect(useMatchStore.getState().currentScreen).toBe("room-8v8");
  });
});
