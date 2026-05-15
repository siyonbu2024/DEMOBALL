/**
 * Sound system. All assets are lazy-loaded on first user gesture so iOS
 * Safari unlocks the audio context. If a file is missing from
 * `public/sounds/`, that sound silently no-ops — the demo plays without
 * audio assets.
 *
 * The user can drop CC0 mp3s into `public/sounds/` after deploy and the
 * sounds will activate on next page load.
 */

import { Howl } from "howler";

export type SoundName =
  | "whistle"
  | "tick"
  | "click"
  | "whoosh"
  | "swish"
  | "punch"
  | "cheer"
  | "ohh";

const SOURCES: Record<SoundName, string> = {
  whistle: "/sounds/whistle.mp3",
  tick: "/sounds/tick.mp3",
  click: "/sounds/click.mp3",
  whoosh: "/sounds/whoosh.mp3",
  swish: "/sounds/swish.mp3",
  punch: "/sounds/punch.mp3",
  cheer: "/sounds/cheer.mp3",
  ohh: "/sounds/ohh.mp3",
};

const VOLUME_CAP = 0.6;

const sounds = new Map<SoundName, Howl>();
let initialized = false;
let muted = false;

export function preloadAll(): void {
  if (typeof window === "undefined") return;
  if (initialized) return;
  initialized = true;
  for (const [name, src] of Object.entries(SOURCES) as [SoundName, string][]) {
    try {
      const h = new Howl({
        src: [src],
        volume: VOLUME_CAP,
        preload: true,
        onloaderror: () => {
          // Asset missing — drop the entry so play() no-ops cleanly.
          sounds.delete(name);
        },
      });
      sounds.set(name, h);
    } catch {
      // Constructor failures are also acceptable — proceed without this sound.
    }
  }
}

export function play(name: SoundName, volume = VOLUME_CAP): void {
  if (muted) return;
  if (typeof window === "undefined") return;
  if (!initialized) preloadAll();
  const h = sounds.get(name);
  if (!h) return;
  try {
    h.volume(Math.min(VOLUME_CAP, volume));
    h.play();
  } catch {
    // Play failures (no audio context, etc.) are non-critical.
  }
}

export function setMuted(value: boolean): void {
  muted = value;
  if (value) {
    sounds.forEach((h) => {
      try {
        h.stop();
      } catch {
        // Ignore stop failures
      }
    });
  }
}

export function isMutedExternally(): boolean {
  return muted;
}
