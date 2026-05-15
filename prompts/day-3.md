# Day 3 — Visual Polish + VFX

**Goal:** Replace placeholder shapes with semi-finished visuals. Add VFX (confetti, screen shake, particle effects). The demo should now look like a "real game" not a tech prototype.

**Tag at end of day:** `git tag day-3-done`

---

## Pre-flight

- [ ] Day 2 demo plays smoothly on iPhone — confirmed
- [ ] Have placeholder visual assets ready (SVG illustrations, free icon packs)

---

## Task 3.1 — Style the goal + pitch (~1 hour)

**Prompt:**

> Replace the plain rectangle goal with an SVG illustration:
> - Goal posts: white, thick (8px)
> - Net: subtle grid pattern (low opacity)
> - 6 zones overlaid as semi-transparent rounded rectangles with thick borders
> - Background: green pitch with subtle grass texture (CSS gradient or SVG pattern)
> - Penalty spot: small white circle below
> - Keep it minimal — geometric, not photorealistic. Reference: Ketchapp games, low-poly aesthetic.

Verify on iPhone — must look crisp at 375px width.

---

## Task 3.2 — Replace ball with detailed SVG (~30 min)

**Prompt:**

> Replace the ball (currently a circle) with an SVG soccer ball — pentagon/hexagon pattern, white + black. Should rotate during flight (use `motion.svg` with `rotate: 360` over flight duration). Keep file < 5KB.

---

## Task 3.3 — Keeper character (~1.5 hours)

**Prompt:**

> Create a stylized keeper character as SVG:
> - Simple geometric shapes (circle head, rounded rectangle body)
> - 7 poses: idle, dive-1, dive-2, dive-3, dive-4, dive-5, dive-6 (one per zone target)
> - Single component `<Keeper pose={1-6 | "idle"} />`
> - Use Framer Motion to interpolate between poses (or just swap with crossfade)
>
> If too complex, fallback: gloves only (just hand-shaped SVGs that move to the chosen zone). Hands are enough to convey "diving".

This task often takes longer than expected. **If 90 minutes pass and it looks bad, pivot to gloves-only.**

---

## Task 3.4 — VFX: goal celebration (~45 min)

**Prompt:**

> When `outcome === 'goal'`:
> - Net ripple animation (path morph on net SVG)
> - Confetti burst (use `react-confetti` or simple SVG particles, ~30 particles)
> - Screen flash (white overlay 100ms)
> - Score number scale + color
>
> Keep total VFX duration ≤ 600ms so it doesn't drag.

---

## Task 3.5 — VFX: save celebration (~30 min)

**Prompt:**

> When `outcome === 'save'`:
> - Keeper catches ball (scale-up freeze + slight shake)
> - Brief slow-mo (0.2× speed for 200ms via `useTime` or transition delay)
> - "SAVED!" text bursts in (rotation + scale spring)
> - Score color flash for keeper
>
> Total ≤ 800ms.

---

## Task 3.6 — Opponent picker polish (~1 hour)

**Prompt:**

> Polish `<OpponentPicker />` (the personality selection screen):
> - Each card: large avatar emoji, name in bold Thai font, description below
> - Background gradient per personality (use a tasteful gradient, not garish)
> - Tap card → spring scale animation, then slide out + transition
> - Add a small "เปลี่ยนคู่ต่อสู้" button on the match end screen
>
> Use Bai Jamjuree or IBM Plex Sans Thai for Thai text (Google Fonts).

---

## Task 3.7 — Loading + transitions (~30 min)

**Prompt:**

> Add page-level loading skeleton (shadcn Skeleton component) for the initial mount. Add slide transitions between major phases (round-intro → kicker-aim, etc.) using AnimatePresence. Keep transitions < 300ms.

---

## Task 3.8 — Deploy + Loom (~30 min)

```bash
git push
# Open preview on iPhone
# Play 3 matches
# Record a 60-second Loom
# Watch the Loom — would you show this to a client?
```

If yes → tag day-3-done.
If no → identify the 1 ugliest thing, fix it tomorrow morning before Day 4 polish.

---

## End-of-Day 3 checklist

- [ ] Goal looks like a goal (not a rectangle)
- [ ] Ball is recognizable as a soccer ball
- [ ] Keeper visibly dives (or at least gloves move)
- [ ] Goal celebration feels satisfying
- [ ] Save celebration feels satisfying
- [ ] Opponent picker doesn't look like a wireframe
- [ ] Loom recording is shareable

---

## Visual polish tips

- **Less is more** — over-animating dilutes impact. Pick 3 hero moments.
- **Easing matters** — default `easeInOut` is fine; spring for satisfying snaps
- **Color discipline** — pick 4-5 colors, use them everywhere. Don't introduce new colors mid-build.
- **Whitespace** — give animations room to breathe
- **Test in sunlight** — does the contrast hold up outdoors on a phone?
