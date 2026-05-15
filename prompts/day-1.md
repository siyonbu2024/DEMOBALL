# Day 1 — Foundation + Round Loop (no animation yet)

**Goal:** End the day with a working round-by-round game playable in the browser. No animation, no sound, no polish — just: pick zone, see result, score updates, match ends.

**Tag at end of day:** `git tag day-1-done`

---

## Pre-flight (do this first)

- [ ] Read `CLAUDE.md` and `DEMO-SPEC.md` — confirm you understand the scope
- [ ] Verify foundation works:
  ```bash
  npm test           # game-logic.test.ts must pass
  npm run dev        # boots Next.js
  ```
- [ ] Open Cursor / Claude Code in the project root

---

## Task 1.1 — Zustand store for game state (~30 min)

**Branch:** `feat/store`

**Prompt to paste in Cursor/Claude:**

> Create `src/store/match-store.ts` using Zustand. The store wraps `MatchState` from `src/lib/types.ts` and exposes:
>
> - State: `matchState: MatchState`, `phase: GamePhase`, `selectedPersonality: AIPersonality | null`, `pendingKickerChoice: Zone | null`, `pendingKeeperChoice: Zone | null`
> - Actions:
>   - `selectPersonality(personality)` → sets selectedPersonality, transitions phase to 'round-intro'
>   - `setKickerChoice(zone)` → sets pendingKickerChoice
>   - `setKeeperChoice(zone)` → sets pendingKeeperChoice
>   - `commitRound()` → if both choices present, calls `applyRound`, resets pending choices, transitions phase to 'reveal'
>   - `nextRound()` → if match not over, sets phase to 'round-intro'; else 'match-end'
>   - `restart()` → resets to initial state, phase = 'opponent-pick'
>
> Rules:
> - Use `applyRound` from `src/lib/game-logic.ts` — do not duplicate logic
> - Do not import React in this file
> - Add JSDoc comments to each action

After it generates, manually verify:
- [ ] No imports from React/Next
- [ ] All actions are pure (no async, no setTimeout)
- [ ] Type-safe (no `any`)

---

## Task 1.2 — Phase router component (~30 min)

**Prompt:**

> Create `src/components/MatchScreen.tsx`. It reads `phase` from the match store and renders the appropriate sub-screen:
>
> - `menu` → `<MenuScreen />` with a single "เริ่มเล่น" button that transitions to `opponent-pick`
> - `opponent-pick` → `<OpponentPicker />` showing 3 cards from `ALL_PERSONALITIES`
> - `round-intro` → `<RoundIntro />` showing "Round N — You/AI kicks" for 1.5s then auto-advances
> - `kicker-aim` | `keeper-pick` → `<RoundPlay />` (placeholder for now)
> - `reveal` → `<RevealOverlay />` (placeholder)
> - `round-result` → `<RoundResult />` (placeholder)
> - `match-end` → `<MatchEnd />` showing winner + "เล่นอีกครั้ง"
>
> All sub-components in `src/components/screens/`. Each is a separate file. Use Tailwind only. Mobile-first (max-w-sm centered on desktop).

Verify:
- [ ] Each file under 80 lines
- [ ] No business logic in components — only render + dispatch

---

## Task 1.3 — RoundPlay with placeholder buttons (~45 min)

This is the simplest possible interactive — just buttons, no gestures yet.

**Prompt:**

> Implement `src/components/screens/RoundPlay.tsx`. Behavior:
>
> 1. Read store: phase, current kicker (use `getNextKicker(matchState)`), pendingKickerChoice, pendingKeeperChoice
> 2. If human player is the kicker: show 6 numbered buttons (1-6) in a 3x2 grid. Tap → `setKickerChoice(zone)`. After choice, show "Waiting for AI..." for personality.thinkingMs, then call `aiPickZone('keeper', personality, opponentHistory, Math.random)` and `setKeeperChoice`. When both set, call `commitRound`.
> 3. If AI is the kicker: AI picks zone after thinkingMs, then human picks keeper zone via the same 6-button grid. Same commitRound flow.
> 4. Use `useEffect` for the AI timing.
>
> Use Tailwind. Buttons should be large (min 64px touch target), high-contrast, with clear "1, 2, 3" labels. Highlight locked choice in green.

Verify on phone:
- [ ] Can complete a full match (10 rounds + maybe sudden death)
- [ ] Score updates correctly
- [ ] Match end screen appears with correct winner

---

## Task 1.4 — RevealOverlay (text-only for Day 1) (~30 min)

**Prompt:**

> Implement `src/components/screens/RevealOverlay.tsx`. Display the last round's result:
>
> - Big text: "GOAL!" (green) or "SAVE!" (red)
> - Below: "Kicker: Zone X" and "Keeper: Zone Y"
> - After 2 seconds, transition phase to 'round-result' or 'match-end'
>
> Use a simple fade-in via Tailwind classes (no Framer Motion yet — that's Day 2).

---

## Task 1.5 — Deploy + record (~15 min)

```bash
git push                                       # auto-deploys to Vercel
# Open the preview URL on your iPhone
# Play 1 full match
# If it works end-to-end → tag
git tag day-1-done
git push --tags
```

---

## End-of-Day 1 checklist

- [ ] Can play a full match start to finish in the browser
- [ ] Score is correct, winner is correct
- [ ] All 3 AI personalities are selectable and behave differently
- [ ] Tested on real iPhone — works
- [ ] All tests pass (`npm test`)
- [ ] Committed + tagged + pushed
- [ ] Vercel preview link works

**If any checkbox is unchecked, finish it before starting Day 2.** Do not stack incomplete tasks.

---

## Things you might be tempted to do — DON'T (yet)

- ❌ Add Framer Motion gestures (Day 2)
- ❌ Add sound effects (Day 4)
- ❌ Polish the UI (later)
- ❌ Add more AI personalities
- ❌ Add a settings screen

Save them for the right day. Day 1 is about proving the round loop works.
