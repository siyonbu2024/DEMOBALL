# Demo Spec — Penalty Shootout (Solo vs AI)

**Status:** Active
**Target:** 4 days
**Deliverable:** Vercel preview link + Loom walkthrough

---

## Goal

A closing tool for the client pitch. Prove three things:

1. The slide gesture **feels good** to use
2. The reveal moment is **satisfying** (timing, animation, sound)
3. The 6-zone grid is the **right grain** for choice (not too easy, not too hard)

If the demo proves these three, the production engagement is much more likely to close. Everything else is decoration.

## Scope

### In
- Single page web app, mobile browser (Safari iOS + Chrome Android)
- 1v1 vs AI keeper (no human multiplayer)
- 3 selectable AI personalities (different bias patterns)
- Best-of-5 standard rounds + sudden death if tied
- Slide-gesture kicker UI with trajectory preview
- Tap-grid keeper UI
- Animated reveal (ball flight + keeper dive + outcome VFX)
- Sound effects + haptic feedback
- Score display, win/lose screen, replay button
- Vercel preview deploy with QR code

### Out
- ❌ Authentication / accounts
- ❌ Database / persistence beyond session
- ❌ Real multiplayer / matchmaking / sockets
- ❌ Tournament bracket
- ❌ Admin dashboard
- ❌ Rive / professional animation assets (Framer Motion only)
- ❌ Native mobile wrappers
- ❌ Multi-language (TH only for demo)

## User Flow

```
[Land]
  ↓
[Tap "เริ่มเล่น"]
  ↓
[Choose AI opponent — 3 cards: เสือเฒ่า / หนุ่มไฟแรง / นักวิเคราะห์]
  ↓
[Match: 10 rounds alternating roles]
  ↓ (each round)
  ├── If you kick:
  │     [Bottom: ball with timer ring]
  │     [Drag ball toward zone]
  │     [Release → lock]
  │     [AI thinks (1s) → reveal]
  │     [Animation: ball flight + keeper dive]
  │     [Outcome: GOAL or SAVE]
  │     [Score bump]
  └── If AI kicks:
        [Top: goal grid 6 zones]
        [Tap zone to defend]
        [Lock → reveal]
        [Same animation, opposite POV]
        [Outcome + score]
  ↓ (after 10 rounds, if tied → sudden death continues)
  ↓
[Result screen — WIN/LOSE big text + final score]
  ↓
[Buttons: "เล่นอีกครั้ง" + "แชร์"]
```

## Acceptance Criteria

- [ ] Match completes in **≤ 3 minutes** average on mobile
- [ ] Slide gesture accuracy: target zone matches user intent **≥ 90%** of attempts (test with 5 friends)
- [ ] Reveal animation: **1.5s minimum, 3s maximum**
- [ ] **60fps** on iPhone 12 and newer (use Safari devtools to verify)
- [ ] All game logic functions covered by **unit tests** in `game-logic.test.ts`
- [ ] Vercel build succeeds with **zero TypeScript errors**
- [ ] Works on **iOS Safari 16+** and **Chrome 110+** (Android)
- [ ] Total bundle JS size **≤ 250 KB** gzipped (no Three.js, etc.)
- [ ] First contentful paint **≤ 2s** on 4G

## Visual Direction (placeholder)

- Color palette: deep green pitch + crisp white lines + bold accent (red/yellow for VFX)
- Typography: bold sans-serif (Inter or Bai Jamjuree for Thai)
- Style: minimal/geometric — flat shapes, no realism
- Inspiration: Ketchapp games, Ballz, Stickman Soccer (clean, juicy, mobile-native)
- Goal grid: rounded squares with thick borders, large numbers
- Avoid: photorealism, complex stadium scenes, FIFA-like UI

## Sound Direction

- Whistle (round start)
- Soft tick (countdown)
- Click (lock zone)
- Whoosh (ball flight)
- Net swish (goal)
- Glove punch (save)
- Crowd cheer (win)
- Crowd ohh (lose)

All free assets from freesound.org or zapsplat.com (CC0).

## Technical Constraints

- All logic deterministic given seed — pass random source as parameter for testability
- No `Math.random()` in `game-logic.ts` (test reliability)
- No remote API calls during gameplay (works offline after first load)
- Service worker NOT required for demo

## Risks (track during build)

| Risk | Severity | Mitigation |
|---|---|---|
| iOS Safari gesture quirks (touch-action, scroll lock) | High | Test on real device daily |
| Reveal animation feels too slow OR too fast | High | A/B test timing 1.5s vs 2s vs 2.5s with 3 testers |
| AI feels random (not "playing against me") | High | Add personality patterns + visible "thinking" indicator |
| Bundle size bloat from Framer Motion | Medium | Use `motion()` factory with code-splitting; avoid full library import |
| Sound autoplay blocked by browser | Medium | Initialize Howler on first user tap |

## Definition of Demo Done

- [ ] Acceptance criteria all met
- [ ] Loom recorded (90s, on real iPhone)
- [ ] Preview URL shareable + QR code generated
- [ ] One-paragraph follow-up doc drafted (what was proved + open questions)
- [ ] Tagged `git tag demo-v1`
- [ ] Posted preview URL to client
