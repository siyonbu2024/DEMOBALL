# Deployments

## Production — `demo-v1` 🎉

| Field | Value |
|---|---|
| **Public URL** | **https://football-demo.vercel.app** |
| Tag | `demo-v1` |
| Commit | `3b28380` (`feat(sound): howler integration + mute toggle + match-end polish`) |
| Vercel scope | `stamp44101gmailcoms-projects` |
| Vercel project | `football-demo` |
| GitHub repo | https://github.com/stamp44101/football-demo |

## What's in the demo

| Area | Status |
|---|---|
| Slide-gesture kicker | ✅ Drag ball, trajectory preview, haptic + sound on lock, 5s timer |
| Tap-grid keeper | ✅ Big tap targets over goal SVG, keeper visual that dives |
| Animated reveal | ✅ 5-stage Framer Motion timeline (windup → ball flight → keeper dive → impact → outcome burst). Total 2.7s |
| AI personality | ✅ 3 hidden brains (bias + memory + jittered thinking time) wired into disguised opponents |
| Lobby + 4 rooms | ✅ Home with online counts, drift, mini-avatar previews |
| 1v1 quick + specific match | ✅ Matchmaking screen + opponent reveal |
| Bracket 4/8 | ✅ Visual tree, off-screen bot simulations, champion flow + trophy |
| Sound | ✅ Howler integration, mute toggle, lazy-loaded — silently no-ops if `.mp3`s missing |
| Mute toggle | ✅ Top-right speaker icon |
| Match-end polish | ✅ WIN/LOSE spring entrance, round-by-round mini-grid summary, Share button (clipboard copy + toast) |

## Sound assets

`public/sounds/` ships with `README.md` only. Drop these CC0 mp3s in to activate audio:
`whistle.mp3`, `tick.mp3`, `click.mp3`, `whoosh.mp3`, `swish.mp3`, `punch.mp3`, `cheer.mp3`, `ohh.mp3`. App silently no-ops on missing files.

## Auto-deploy on push

Wired ✓. Push to `main` → auto-deploys to production. Push to any feature branch → auto-deploys a preview Vercel posts on the commit.

Manual deploy:
```bash
vercel             # deploy preview
vercel --prod      # deploy production
```

## Status

- Public alias **HTTP 200** ✓
- Deployment URL `*-stamp44101gmailcoms-projects.vercel.app` → 401 (Vercel Deployment Protection — default; share the named alias)

## Tags shipped

| Tag | Description |
|---|---|
| `phase-1-done` | Zustand store + phase router + button-grid round loop |
| `subphase-a-done` | Centralized timing + bot disguise infrastructure |
| `subphase-b-done` | Home lobby + room screens + matchmaking |
| `subphase-c-done` | Full bracket system with simulation + champion flow |
| `phase-2-done` | Slide-to-aim kicker + tap keeper + animated 5-stage reveal |
| **`demo-v1`** | **Sound + match-end polish — shippable demo** |

## Known caveats

- iPhone Safari real-device verification is the operator's gate (gesture feel, animation timing). Local tests + build are green; iPhone is the final judge.
- Audio files not bundled — drop `.mp3`s into `public/sounds/` to activate sound. Demo plays silently without them, no errors.
- Bracket UI is a vertical list grouped by round (cleaner on 375px width than a literal bracket tree).
