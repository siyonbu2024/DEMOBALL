# CLAUDE.md

> This file is read by Cursor and Claude Code at the start of every session.
> It defines project context, conventions, and constraints. Follow it.

## Project Context

A 4-day vertical-slice **demo** of a 1v1 penalty shootout game. Player picks one of 6 goal zones, AI keeper picks one — match if guessed = save, mismatch = goal. Best-of-5 with sudden-death tiebreak.

This is a **closing tool** for a client pitch — not a production app. The goal is to prove the **gesture feels good** and the **reveal moment is satisfying**. Everything else is secondary.

## Stack (do not deviate without asking)

- Next.js 16+ App Router + TypeScript strict mode
- Tailwind CSS + shadcn/ui (no custom CSS files)
- Framer Motion (gesture + animation)
- Zustand (game state — no Redux, no Context, no useReducer for global state)
- Howler.js (sound)
- Vitest (tests)
- Vercel (deploy)

## Architecture Rules (non-negotiable)

1. **Game logic in `src/lib/game-logic.ts` is PURE** — no React, no DOM, no side effects, no `Math.random()` inside testable functions (inject randomness as a parameter).
2. **Types in `src/lib/types.ts` are SOURCE OF TRUTH.** Update types first, then code. If a function needs a new shape, add the type before implementing.
3. **Tests in `*.test.ts` MUST PASS before commit.** Run `npm test` before pushing.
4. **No backend.** Everything client-side. No API routes, no DB, no fetch to external services for game logic.
5. **Mobile-first.** Every component must work and look right at 375px width. Test in Chrome DevTools mobile mode AND on a real iPhone.
6. **One concern per component.** UI components render and dispatch events; they don't compute game outcomes.

## Code Style

- TypeScript strict mode. **No `any`.** No `// @ts-ignore` without comment explaining why.
- Prefer pure functions for logic; arrow functions for components.
- Components: named exports, `PascalCase.tsx` filenames.
- Lib files: `kebab-case.ts`.
- Tailwind classes only — no inline `style={}` except for dynamic CSS variables (e.g., `--rotation`).
- `clsx` for conditional classes.
- Imports order: 1) react/next, 2) third-party, 3) `@/` aliases, 4) relative.

## Domain Glossary

| Term | Meaning |
|---|---|
| **Zone** | Number 1–6 representing a goal grid cell. 1-2-3 = top row L-C-R, 4-5-6 = bottom row L-C-R |
| **Kicker** | The player taking the shot |
| **Keeper** | The player defending the goal |
| **Round** | One full cycle: kicker locks zone → keeper locks zone → reveal → score |
| **Match** | Full game: 5 standard rounds each (10 rounds total) + sudden death if tied |
| **Outcome** | `'goal'` (kicker scores) or `'save'` (keeper blocks) |
| **Personality** | AI opponent's bias profile (zone preferences + memory) |

## Workflow Rules

- One feature per branch (`feat/slide-gesture`, `fix/reveal-timing`)
- Conventional commits (`feat:`, `fix:`, `chore:`, `test:`, `docs:`)
- Push triggers Vercel preview — share the preview URL when asking for feedback
- Test on **real iPhone Safari** before declaring "done" — simulator lies about gesture feel
- Tag stable points: `git tag day-1-done`, `git tag day-2-done` etc.

## What NOT to do

- ❌ Don't add backend services, databases, or auth
- ❌ Don't introduce new heavy dependencies (Three.js, Rive, P5, Phaser, Pixi)
- ❌ Don't break the pure-function rule for game logic
- ❌ Don't optimize prematurely — feel > perf for this demo
- ❌ Don't write `.css` files — use Tailwind only
- ❌ Don't generate placeholder UI without checking `DEMO-SPEC.md` first
- ❌ Don't expand scope beyond the demo spec without explicit approval

## When asked to do something out of scope

Push back. Ask if it's needed for the demo. Suggest deferring to production phase. Reference the "Out-of-scope guardrails" section of `README.md`.

## When asked to write tests

- Tests should describe behavior, not implementation
- Use `describe` for each function, `it` for each behavior
- Test the edge cases first (empty state, both pick same zone, sudden death)
- Don't test private helpers — test the public API

## When asked about animation

- Default to Framer Motion `<motion.div>` with `initial`, `animate`, `exit`
- Use `AnimatePresence` for mount/unmount animations
- Spring presets: `{ type: 'spring', stiffness: 300, damping: 25 }` for snappy
- Reveal duration: 1.5–3 seconds (no shorter, no longer)
- Always `transform`, never `width/height/top/left` (60fps requirement)

## When asked about gestures

- Use Framer Motion `drag` + `dragConstraints`
- Compute target zone from drag end position + velocity
- Provide visual preview during drag (trajectory line)
- Provide haptic on lock: `navigator.vibrate?.(20)`
- Provide audio on lock: short "click" sound

## When asked about sound

- Use Howler.js
- Preload all sounds on first interaction (browsers block autoplay)
- Sound effects: kick, save, goal, click, countdown-tick, win, lose
- Free SFX from freesound.org or zapsplat.com (CC0 preferred)
- Volume cap at 0.6 to prevent jumpscare on first play

## Definition of Done (per task)

- [ ] Tests pass (`npm test`)
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] Tested on iPhone Safari real device
- [ ] Tested on Android Chrome real device (or BrowserStack)
- [ ] Committed with conventional commit message
- [ ] Vercel preview deploys successfully
