# Penalty Shootout Demo

A 4-day vertical-slice demo of a 1v1 penalty shootout game. See `DEMO-SPEC.md` for scope and `CLAUDE.md` for project rules.

## What's in here

```
CLAUDE.md                          ← project rules — read on every session
DEMO-SPEC.md                       ← focused 1-page spec for the demo
src/lib/types.ts                   ← domain types (source of truth)
src/lib/game-logic.ts              ← pure game functions (no React, no DOM)
src/lib/game-logic.test.ts         ← tests as executable spec
src/lib/ai-personalities.ts        ← 3 AI opponent profiles
prompts/day-1.md                   ← Day 1 task list + ready-to-paste prompts
prompts/day-2.md
prompts/day-3.md
prompts/day-4.md
app/                               ← Next.js App Router pages
```

## Local development

```bash
npm run dev        # boots Next.js at http://localhost:3000
npm test           # runs vitest in watch mode
npm run test:run   # runs vitest once (CI-style)
npm run lint       # eslint
npm run build      # production build
```

## Daily workflow (the loop)

For each day:

1. **Open `prompts/day-N.md`** — has the task list
2. **Create branch:** `git checkout -b feat/day-N-[feature]`
3. **Open Cursor/Claude Code** in the project — auto-reads `CLAUDE.md`
4. **Paste the day's prompts** — one task at a time, not all at once
5. **Review every diff** — especially game logic; reject if it violates `CLAUDE.md` rules
6. **Run tests:** `npm test` — must pass before commit
7. **Commit small:** `git commit -m "feat: implement slide gesture"`
8. **Push:** `git push` — Vercel auto-deploys preview
9. **Test on real iPhone** — open preview URL on phone, play through one full match
10. **End of day:** merge to `main`, tag `git tag day-N-done`

## The 3 things to optimize for

1. **Feel of slide gesture** — iterate on iPhone Safari relentlessly
2. **Reveal moment timing** — 1.5–3 seconds, no longer, no shorter
3. **AI opponent feels like a person** — not random; should have patterns

If demo doesn't deliver on these 3, it failed regardless of how polished it looks.

## Out-of-scope guardrails

If you (or an agent) feel the urge to add any of these — STOP:

- ❌ Authentication / accounts
- ❌ Database / persistence (use Zustand only)
- ❌ Realtime / multiplayer (vs AI only for demo)
- ❌ Tournament UI (separate next phase)
- ❌ Rive integration (use Framer Motion placeholder until art direction is confirmed)
- ❌ Admin dashboard
- ❌ Native app wrappers

These are for production phase, not the demo.

## When the demo is done

- ✅ Loom walkthrough (90 seconds, recorded on phone screen)
- ✅ Vercel preview link (with QR code for client to scan in-meeting)
- ✅ Brief follow-up doc: "What we proved + what we learned + recommended next steps"
- ✅ Tag `git tag demo-v1` so you can come back to this exact state

## When stuck

- Re-read `DEMO-SPEC.md` — does this task serve the spec?
- Re-read `CLAUDE.md` — am I violating a rule?
- Test on real phone — does it feel right?
- If still stuck: rollback to last green commit, try smaller scope.

---

This project was bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app) and uses the [App Router](https://nextjs.org/docs/app), Tailwind CSS, and TypeScript strict mode. Deploys via [Vercel](https://vercel.com/new).
