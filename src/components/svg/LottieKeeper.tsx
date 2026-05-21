"use client";

import { useEffect, useRef, useState } from "react";
import type { LottieRefCurrentProps } from "lottie-react";

/**
 * Lottie-driven keeper animation.
 *
 * Variants map to JSON files under /public:
 *   - "idle"        → /Keeper_Idle.json         (1200 × 670)
 *   - "dive-left"   → /Keeper_Dive_Left.json    (1200 × 670)
 *   - "dive-right"  → /Keeper_Dive_Left.json    + horizontal flip
 *   - "dive-center" → /Keeper_Dive_Center.json  (1200 × 670)
 *
 * All files share the same canvas size, so swapping variants no longer
 * shifts the character — we can render them with preserveAspectRatio
 * "meet" and a single shared aspect ratio.
 */

export type KeeperAnim = "idle" | "dive-left" | "dive-right" | "dive-center";

interface VariantSpec {
  src: string;
  flipX: boolean;
  /** Source canvas dimensions — used to set the wrapper's aspect ratio. */
  w: number;
  h: number;
}

const SOURCE: Record<KeeperAnim, VariantSpec> = {
  idle:          { src: "/Keeper_Idle.json",         flipX: false, w: 1200, h: 670 },
  "dive-left":   { src: "/Keeper_Dive_Left.json",    flipX: false, w: 1200, h: 670 },
  "dive-right":  { src: "/Keeper_Dive_Left.json",    flipX: true,  w: 1200, h: 670 },
  "dive-center": { src: "/Keeper_Dive_Center.json",  flipX: false, w: 1200, h: 670 },
};

/** All variants share the same canvas now, so one aspect ratio fits all. */
const STABLE_ASPECT = SOURCE.idle.w / SOURCE.idle.h;

interface Props {
  /** Which animation to play. */
  variant?: KeeperAnim;
  /** Whether the animation should loop (idle = yes, dive = no). */
  loop?: boolean;
  /** Pause the playhead — useful for previewing/debugging. */
  paused?: boolean;
  /** Recolor via CSS hue-rotate. "yellow" for the user side. */
  tint?: "yellow" | "none";
  /** Called once when the animation completes (one-shot mode). */
  onComplete?: () => void;
  className?: string;
}

// Module-level cache so each JSON is fetched once per session.
const cache = new Map<string, Promise<unknown>>();
function loadJson(src: string): Promise<unknown> {
  if (!cache.has(src)) {
    cache.set(
      src,
      fetch(src).then((r) => r.json()),
    );
  }
  return cache.get(src)!;
}

/**
 * Warm the cache for every variant. Called on first mount so switching
 * between idle ↔ dive has no fetch delay (which used to cause a brief
 * flicker of the placeholder div right before the dive started).
 */
let prewarmed = false;
function prewarmAllVariants(): void {
  if (prewarmed || typeof window === "undefined") return;
  prewarmed = true;
  for (const variant of Object.keys(SOURCE) as KeeperAnim[]) {
    void loadJson(SOURCE[variant].src);
  }
}

export const LottieKeeper = ({
  variant = "idle",
  loop = variant === "idle",
  paused = false,
  tint = "none",
  onComplete,
  className = "",
}: Props) => {
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  // Track which source is currently displayed (vs. the requested variant).
  // We only swap once the new JSON has loaded, so the previous animation
  // stays on screen instead of flashing a blank placeholder.
  const [displayed, setDisplayed] = useState<{
    src: string;
    data: unknown;
  } | null>(null);
  const [LottieComponent, setLottieComponent] = useState<React.ComponentType<{
    animationData: unknown;
    loop: boolean;
    autoplay: boolean;
    lottieRef: React.RefObject<LottieRefCurrentProps | null>;
    onComplete?: () => void;
    rendererSettings?: { preserveAspectRatio: string };
  }> | null>(null);

  const { src } = SOURCE[variant];

  // Warm all variants once so subsequent swaps are instant.
  useEffect(() => {
    prewarmAllVariants();
  }, []);

  // Load lottie-react + the current variant's JSON. Only commit to state
  // when both are ready, so we never show an empty wrapper between swaps.
  useEffect(() => {
    let cancelled = false;

    Promise.all([
      import("lottie-react"),
      loadJson(src),
    ])
      .then(([mod, json]) => {
        if (cancelled) return;
        setLottieComponent(() => mod.default);
        setDisplayed({ src, data: json });
      })
      .catch((err) => {
        console.error(`Failed to load Lottie keeper (${src}):`, err);
      });

    return () => {
      cancelled = true;
    };
  }, [src]);

  // While the new variant is still loading, keep showing the previous one
  // (it's already cached for any non-first variant due to prewarm).
  const animationData = displayed?.data ?? null;
  // Use the REQUESTED variant's spec, not whichever has the same src —
  // dive-left and dive-right share a JSON file, so finding-by-src would
  // always return dive-left and silently drop flipX.
  const displayedSpec = SOURCE[variant];

  useEffect(() => {
    if (!lottieRef.current) return;
    if (paused) lottieRef.current.pause();
    else lottieRef.current.play();
  }, [paused, animationData]);

  // All variants share the same canvas, so a single aspect-ratio box and
  // letterboxed "meet" rendering keep the character pixel-aligned across
  // a variant swap.
  // Source jersey is green. hue-rotate(-50deg) shifts it to yellow.
  const filter =
    tint === "yellow" ? "hue-rotate(-50deg) saturate(1.3)" : undefined;

  const sizingStyle: React.CSSProperties = {
    height: "100%",
    width: "auto",
    aspectRatio: `${STABLE_ASPECT}`,
    pointerEvents: "none",
    transform: displayedSpec.flipX ? "scaleX(-1)" : undefined,
    filter,
  };

  const preserveAspectRatio = "xMidYMid meet";

  if (!LottieComponent || !animationData) {
    return <div className={className} style={sizingStyle} />;
  }

  return (
    <div className={className} style={sizingStyle} aria-hidden>
      <LottieComponent
        animationData={animationData}
        loop={loop}
        autoplay={!paused}
        lottieRef={lottieRef}
        onComplete={onComplete}
        rendererSettings={{ preserveAspectRatio }}
      />
    </div>
  );
};
