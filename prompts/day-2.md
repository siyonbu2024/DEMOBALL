# Day 2 — Slide Gesture + Reveal Animation

**Goal:** Replace Day 1 buttons with a real slide gesture for the kicker, animated reveal with ball flight + keeper dive. The game should now FEEL like a penalty shootout, not a number picker.

**This is the most important day.** If the gesture doesn't feel right by EOD, push to Day 3 — don't move on.

**Tag at end of day:** `git tag day-2-done`

---

## Pre-flight

- [ ] `git checkout -b feat/day-2-gesture-animation`
- [ ] Pull latest from main if needed
- [ ] Open Day 1 demo on phone — confirm baseline still works

---

## Task 2.1 — SlideKicker component (~2 hours, hardest task of day)

**Branch:** `feat/slide-kicker`

**Context for prompt:** Read `CLAUDE.md` "When asked about gestures" section before writing.

**Prompt:**

> Create `src/components/SlideKicker.tsx`. Behavior:
>
> 1. Render a soccer ball (SVG circle, size 80px) at the bottom-center of a 300x500 play area
> 2. Above the ball, render a goal grid (6 zones, 3x2) — visible but ghosted
> 3. User can drag the ball with `useDrag` from Framer Motion (or `<motion.div drag />`)
> 4. While dragging, render a curved trajectory line from ball position to projected target zone
> 5. Compute target zone from final drag position:
>    - Y position: top half = zones 1-3, bottom half = zones 4-6
>    - X position: left third = 1/4, middle = 2/5, right = 3/6
> 6. On drag end (or after 5s timer expires), call `onLock(zone)` prop
> 7. Show timer ring around the ball (countdown 5s)
> 8. On lock: vibrate (`navigator.vibrate?.(20)`), highlight selected zone in green, show ball at zone position
>
> Props: `onLock: (zone: Zone) => void`, `disabled?: boolean`
>
> No business logic — pure UI component.

**Critical: test on real iPhone after first implementation.** Likely you'll need 2-3 iterations. Iterate quickly.

Common issues to check:
- [ ] Page scrolls during drag (fix: `touch-action: none` on container)
- [ ] Drag is laggy (fix: ensure transforms only, no layout)
- [ ] Target zone feels wrong (fix: tune the threshold zones)
- [ ] Timer doesn't reset between rounds (fix: key prop on component)

---

## Task 2.2 — TapKeeper component (~30 min)

**Prompt:**

> Create `src/components/TapKeeper.tsx`. Behavior:
>
> 1. Render goal grid 6 zones (3x2), large tap targets, full width
> 2. Each zone has a number 1-6 with a subtle glove icon
> 3. Tap a zone → call `onLock(zone)` prop, highlight in blue
> 4. Show 5s countdown timer at the top
> 5. After lock OR timeout, disable further taps
>
> Same prop signature as SlideKicker: `onLock: (zone: Zone) => void`, `disabled?: boolean`.

---

## Task 2.3 — Wire SlideKicker + TapKeeper into RoundPlay (~30 min)

**Prompt:**

> Refactor `src/components/screens/RoundPlay.tsx` to use `<SlideKicker />` when the human is kicking and `<TapKeeper />` when the human is keeping. Replace the placeholder buttons. The AI's choice flow stays the same.

Verify on phone:
- [ ] Can drag ball to kick
- [ ] Can tap zone to defend
- [ ] Round still completes correctly

---

## Task 2.4 — Reveal animation (~2 hours)

**Prompt:**

> Replace `src/components/screens/RevealOverlay.tsx` with a Framer Motion animation:
>
> Phase A (0–500ms): Both choices revealed simultaneously — keeper's choice highlighted in blue, kicker's in red
> Phase B (500–1500ms): Ball flies from kick spot to kicker's chosen zone (curved arc using `animate.path` or motion variants)
> Phase C (700–1500ms, parallel with ball): Keeper character dives toward keeper's chosen zone (slide animation)
> Phase D (1500–2500ms): Either ball hits net (goal — net ripple SVG anim) OR keeper catches it (save — scale-up freeze frame)
> Phase E (2500–3000ms): Big "GOAL!" or "SAVE!" text with spring animation
>
> Total duration: 2.5–3 seconds. Auto-advance to round-result on complete.
>
> Use simple SVG shapes for now (no characters yet — just colored shapes representing ball, keeper, goal).
> Use Framer Motion `<motion>` + `AnimatePresence` + spring transitions per CLAUDE.md.

**A/B test the timing:** Try 2.0s, 2.5s, 3.0s with 3 friends. Pick the one that feels best. Document the choice.

---

## Task 2.5 — Score UI animation (~30 min)

**Prompt:**

> In the persistent score header, when score updates: animate the changed number with a spring scale + color flash (green for the player who scored). Use Framer Motion. Must work without re-rendering the whole header.

---

## Task 2.6 — Deploy + iterate on phone (~1 hour)

```bash
git push
# Open preview on iPhone Safari
# Play 5 full matches
# Notice: does the gesture feel accurate? Does the reveal feel satisfying? Is the timing right?
# Document 3 specific frictions
# Fix the top 1
# Repeat
```

**This iteration loop is more important than any single feature.** Spend the time.

---

## End-of-Day 2 checklist

- [ ] Slide gesture works smoothly on iPhone Safari (no scroll, no lag)
- [ ] Trajectory preview shows during drag
- [ ] Lock has haptic feedback
- [ ] Reveal animation runs 2.0–3.0s and feels suspenseful
- [ ] Score animation provides clear feedback
- [ ] Tested on Android Chrome too
- [ ] Tagged + pushed
- [ ] **Recorded a quick Loom of one match** — review it; does it sell the demo?

---

## If you're behind schedule

Drop in this order:
1. Score UI animation (smallest impact)
2. Keeper dive animation (can be a static slide)
3. Trajectory preview during drag (still works without)

Never drop:
- Slide gesture (the core proof)
- Reveal moment (the core proof)
