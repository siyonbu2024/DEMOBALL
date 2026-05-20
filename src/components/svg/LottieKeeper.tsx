"use client";

import { useEffect, useRef, useState } from "react";
import type { LottieRefCurrentProps } from "lottie-react";

/**
 * Lottie-driven keeper animation.
 *
 * Variants map to JSON files under /public:
 *   - "idle"      → /Keeper.json            (383 × 335)
 *   - "dive-left" → /Keeper_Dive_Left.json  (924 × 335)
 *   - "dive-right"→ /Keeper_Dive_Left.json  + horizontal flip
 *
 * Important: dive frames are ~2.4× wider than idle because the character
 * travels across the canvas. The component fills the parent's HEIGHT and
 * grows its own width via aspect-ratio — this way the character stays the
 * same physical size when swapping idle → dive (caller anchors by height).
 */

export type KeeperAnim = "idle" | "dive-left" | "dive-right";

interface VariantSpec {
  src: string;
  flipX: boolean;
  /** Source canvas dimensions — used to set the wrapper's aspect ratio. */
  w: number;
  h: number;
}

const SOURCE: Record<KeeperAnim, VariantSpec> = {
  idle:         { src: "/Keeper.json",            flipX: false, w: 383, h: 335 },
  "dive-left":  { src: "/Keeper_Dive_Left.json",  flipX: false, w: 924, h: 335 },
  "dive-right": { src: "/Keeper_Dive_Left.json",  flipX: true,  w: 924, h: 335 },
};

/**
 * Every variant renders into a wrapper with this aspect ratio (idle's
 * shape). Dive's wider canvas gets cropped via Lottie's `slice` setting,
 * so the character stays at the same on-screen position when switching
 * idle ↔ dive — no horizontal teleport.
 */
const STABLE_ASPECT = SOURCE.idle.w / SOURCE.idle.h;

interface Props {
  /** Which animation to play. */
  variant?: KeeperAnim;
  /** Whether the animation should loop (idle = yes, dive = no). */
  loop?: boolean;
  /** Pause the playhead — useful for previewing/debugging. */
  paused?: boolean;
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
  const showingSrc = displayed?.src ?? src;
  const animationData = displayed?.data ?? null;
  // If we're displaying an older variant, use ITS aspect — otherwise the
  // wrapper would have already snapped to the new aspect and stretched the
  // outgoing animation.
  const displayedSpec = (Object.entries(SOURCE) as [KeeperAnim, VariantSpec][])
    .find(([, spec]) => spec.src === showingSrc)?.[1] ?? SOURCE[variant];

  useEffect(() => {
    if (!lottieRef.current) return;
    if (paused) lottieRef.current.pause();
    else lottieRef.current.play();
  }, [paused, animationData]);

  // Sizing: every variant fits into the same STABLE_ASPECT box (idle's
  // ratio). Dive's wider canvas is cropped by Lottie's slice setting (see
  // rendererSettings below). overflow:hidden guards against sub-pixel
  // bleed at certain resolutions.
  const sizingStyle: React.CSSProperties = {
    height: "100%",
    width: "auto",
    aspectRatio: `${STABLE_ASPECT}`,
    overflow: "hidden",
    pointerEvents: "none",
    transform: displayedSpec.flipX ? "scaleX(-1)" : undefined,
  };

  // For dive (wide canvas with character anchored at the left), keep the
  // LEFT slice visible. For flipped right-side dive the CSS mirror swaps
  // sides, so we anchor to xMax instead.
  const preserveAspectRatio = displayedSpec.flipX
    ? "xMaxYMid slice"
    : "xMinYMid slice";

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
