# Day 4 — Sound, Final Polish, Demo Prep

**Goal:** Add sound, fix the long tail of bugs, prepare presentation materials. By EOD: Loom is recorded, preview link + QR code is ready, follow-up doc is drafted.

**Tag at end of day:** `git tag demo-v1`

---

## Pre-flight

- [ ] Day 3 demo is recordable on Loom
- [ ] List 5 specific frictions noticed during Day 3 testing — fix them today

---

## Task 4.1 — Sound integration (~2 hours)

**Source SFX:** freesound.org or zapsplat.com (CC0 only). You need:
- `whistle.mp3` — round start
- `tick.mp3` — countdown tick (last 3s)
- `click.mp3` — zone lock
- `whoosh.mp3` — ball flight
- `swish.mp3` — net rustle (goal)
- `punch.mp3` — keeper save
- `cheer.mp3` — match win
- `ohh.mp3` — match lose

Place in `public/sounds/`.

**Prompt:**

> Create `src/lib/sound.ts` using Howler.js:
>
> - Lazy-load all sounds on first user interaction (browsers block autoplay)
> - Export `play(name: SoundName, volume?: number)` function
> - Export `preloadAll()` for first-tap initialization
> - Volume cap at 0.6
> - Add a mute toggle stored in Zustand
>
> Then wire sounds into existing components:
> - SlideKicker: `click` on lock, `tick` during last 3s of countdown
> - TapKeeper: same
> - RevealOverlay: `whoosh` during ball flight, `swish` on goal, `punch` on save
> - MatchEnd: `cheer` on win, `ohh` on lose
> - RoundIntro: `whistle`

Verify on iPhone — sound MUST trigger after first tap (autoplay policy).

---

## Task 4.2 — Mute toggle (~20 min)

**Prompt:**

> Add a small speaker icon button in the top-right corner of every screen. Tap toggles `isMuted` in Zustand store. When muted, sound functions early-return.

---

## Task 4.3 — End screen polish (~45 min)

**Prompt:**

> Polish `<MatchEnd />`:
> - Big "WIN" / "LOSE" text with shimmer animation
> - Final score in large numbers
> - Trophy emoji or icon based on result
> - Two buttons: "เล่นอีกครั้ง" (primary) and "เปลี่ยนคู่ต่อสู้" (secondary)
> - Add a "แชร์" button that copies the preview URL to clipboard with a toast confirmation
> - Show match summary: round-by-round mini-grid (10 cells, green = goal, red = save, with kicker indicator)

---

## Task 4.4 — Bug bash (~2 hours)

Test every flow on iPhone Safari + Android Chrome. Common bugs to check:

- [ ] Match restart doesn't carry over previous state
- [ ] Sudden death works correctly past 10 rounds
- [ ] Score updates immediately on round end
- [ ] AI thinking timer doesn't fire after unmount
- [ ] Drag gesture doesn't trigger page scroll
- [ ] Sounds don't double-fire
- [ ] Clipboard copy works on iOS (requires user gesture)
- [ ] Preview URL works in incognito mode
- [ ] No console errors during a full match

For every bug found:
1. Reproduce with steps
2. Branch `fix/<bug>`
3. Fix
4. Verify
5. Commit + push

---

## Task 4.5 — Loading screen + first paint (~30 min)

**Prompt:**

> Add a loading screen that:
> - Shows on first visit while sounds preload
> - Has a single "เริ่มเล่น" button (so we can register first user gesture for audio + haptic)
> - Includes a subtle ball-bounce animation
> - Once tapped, transitions to opponent picker

This solves the "audio doesn't play" problem on iOS.

---

## Task 4.6 — Performance check (~30 min)

```bash
# Build for prod
npm run build
# Check bundle size
ls -lh .next/static/chunks/

# Lighthouse on Vercel preview
# Open Chrome DevTools → Lighthouse → Mobile
# Target: Performance ≥ 85, no critical issues
```

If bundle size > 250KB gzipped:
- Check if Framer Motion is fully imported (use `motion()` factory)
- Check if Howler is loading all sounds at boot (lazy load)
- Check if SVGs are optimized (use SVGO)

---

## Task 4.7 — Loom recording (~30 min)

Setup:
- Phone in landscape OR portrait (decide based on what looks better)
- Use Loom mobile app or screen recording + voiceover
- Audio: airpods, quiet room

Script (90 seconds):
1. (0–10s) "นี่คือ demo ของเกม penalty shootout ที่ใช้เวลาทำ 4 วันด้วย AI agent"
2. (10–25s) Open menu → opponent picker → choose personality
3. (25–55s) Play 2-3 rounds — show kicker gesture, keeper tap, reveal moment
4. (55–75s) Show match end + replay
5. (75–90s) "ยังเป็น MVP — production จะมี Rive animation, multiplayer, tournament. ลองเล่นได้ที่ลิงก์ด้านล่าง"

Upload to Loom, get share link.

---

## Task 4.8 — QR code + share materials (~20 min)

```bash
# Generate QR code from preview URL
# Use https://qr-code-generator.com or `qrencode` CLI
qrencode -o demo-qr.png "https://your-preview-url.vercel.app"
```

Create a one-pager PDF or image with:
- Demo title
- QR code (large)
- Preview URL
- Loom link
- Brief description

---

## Task 4.9 — Follow-up doc (~30 min)

Draft a brief doc to send the client with the demo:

```markdown
# Penalty Shootout Demo — Follow-up

## What we proved
- Slide gesture works smoothly on mobile (tested on iPhone 12, 14, S22)
- Reveal moment timing of ~2.3s feels suspenseful and satisfying
- 6-zone grid is the right grain for choice (not too easy, not too hard)
- AI personalities create distinct play feel

## What we learned
- [list 3 things from testing]

## Open questions for production
- [restate the 3 critical questions from main PRD: 4v4 vs ทีมละ 4, monetization, theme]

## Recommended next phase
- Confirm answers to open questions → kick off production phase per main PRD
- Begin Rive animator sourcing in parallel
```

---

## Task 4.10 — Tag + send (~15 min)

```bash
git tag demo-v1
git push --tags

# Send to client:
# - Loom link
# - Preview URL + QR code image
# - Follow-up doc (PDF or markdown)
```

---

## End-of-Day 4 checklist

- [ ] Sound works on iPhone (with audio gesture handled)
- [ ] Mute toggle present
- [ ] Match summary on end screen
- [ ] Lighthouse Performance ≥ 85
- [ ] Loom recorded and uploaded
- [ ] QR code generated
- [ ] Follow-up doc drafted
- [ ] Tagged `demo-v1`
- [ ] Sent to client

---

## Post-demo retrospective (the next day)

When the client confirms or rejects, write a short retro:

- What worked in the AI-agent workflow?
- What slowed you down?
- What would you do differently next demo?
- What should be added to `CLAUDE.md` permanently?

This is how the workflow improves over time. Each project should make the next one faster.
