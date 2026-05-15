# Sound assets

Drop CC0 mp3s here. The app silently no-ops on missing files — the demo
works without audio, sounds activate automatically once the files exist.

## Required files

| Filename | Trigger | Suggested feel |
|---|---|---|
| `whistle.mp3` | Round start (RoundIntro mount) | Sharp ref's whistle, ~0.3s |
| `tick.mp3` | (reserved for future countdown UX) | Short tick, ~0.05s |
| `click.mp3` | Zone lock (kick or defend) | Clicky percussive UI tick |
| `whoosh.mp3` | Ball flight start (reveal t≈500ms) | Air whoosh, ~0.5s |
| `swish.mp3` | Goal (reveal t≈1400ms) | Net rustle / swoosh |
| `punch.mp3` | Save (reveal t≈1400ms) | Glove punch / muffled thud |
| `cheer.mp3` | Match win (MatchEnd mount, user wins) | Crowd cheer, ~1.5s |
| `ohh.mp3` | Match lose (MatchEnd mount, user loses) | Crowd "oooh" |

## Sources

CC0 / public domain only. Recommended:

- https://freesound.org/ — search for "click", "whistle short", "crowd cheer cc0"
- https://zapsplat.com/ — free with attribution; check license per file
- https://opengameart.org/ — game-ready audio, mostly CC0

## Volume

App caps all playback at 0.6 to prevent jumpscare on first play. No need
to pre-normalize.

## Format

Plain mp3, mono ok, 22–44 kHz. Each file should be under 50KB to keep
the bundle lean.
