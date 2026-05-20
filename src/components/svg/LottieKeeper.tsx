"use client";

import { useEffect, useRef, useState } from "react";
import type { LottieRefCurrentProps } from "lottie-react";

/**
 * Lottie-driven keeper animation.
 *
 * Variants map to JSON files under /public:
 *   - "idle"      → /Keeper.json
 *   - "dive-left" → /Keeper_Dive_Left.json
 *   - "dive-right"→ /Keeper_Dive_Left.json (flipped horizontally)
 *
 * Component fills 100% of its parent — caller controls sizing via wrapper.
 */

export type KeeperAnim = "idle" | "dive-left" | "dive-right";

const SOURCE: Record<KeeperAnim, { src: string; flipX: boolean }> = {
  idle:         { src: "/Keeper.json",            flipX: false },
  "dive-left":  { src: "/Keeper_Dive_Left.json",  flipX: false },
  "dive-right": { src: "/Keeper_Dive_Left.json",  flipX: true },
};

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

export const LottieKeeper = ({
  variant = "idle",
  loop = variant === "idle",
  paused = false,
  onComplete,
  className = "",
}: Props) => {
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const [animationData, setAnimationData] = useState<unknown | null>(null);
  const [LottieComponent, setLottieComponent] = useState<React.ComponentType<{
    animationData: unknown;
    loop: boolean;
    autoplay: boolean;
    lottieRef: React.RefObject<LottieRefCurrentProps | null>;
    onComplete?: () => void;
    rendererSettings?: { preserveAspectRatio: string };
  }> | null>(null);

  const { src, flipX } = SOURCE[variant];

  // Dynamically import lottie-react + animation JSON on mount / variant change.
  useEffect(() => {
    let cancelled = false;
    setAnimationData(null);

    Promise.all([
      import("lottie-react"),
      loadJson(src),
    ])
      .then(([mod, json]) => {
        if (cancelled) return;
        setLottieComponent(() => mod.default);
        setAnimationData(json);
      })
      .catch((err) => {
        console.error(`Failed to load Lottie keeper (${src}):`, err);
      });

    return () => {
      cancelled = true;
    };
  }, [src]);

  useEffect(() => {
    if (!lottieRef.current) return;
    if (paused) lottieRef.current.pause();
    else lottieRef.current.play();
  }, [paused, animationData]);

  if (!LottieComponent || !animationData) {
    return (
      <div className={className} style={{ width: "100%", height: "100%" }} />
    );
  }

  return (
    <div
      className={className}
      style={{
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        transform: flipX ? "scaleX(-1)" : undefined,
      }}
      aria-hidden
    >
      <LottieComponent
        animationData={animationData}
        loop={loop}
        autoplay={!paused}
        lottieRef={lottieRef}
        onComplete={onComplete}
        rendererSettings={{ preserveAspectRatio: "xMidYMid meet" }}
      />
    </div>
  );
};
