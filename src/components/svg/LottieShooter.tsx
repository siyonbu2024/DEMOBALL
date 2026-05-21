"use client";

import { useEffect, useRef, useState } from "react";
import type { LottieRefCurrentProps } from "lottie-react";

/**
 * Lottie-driven shooter animation.
 *
 * Variants map to JSON files under /public:
 *   - "idle"     → /Shooter_Idle.json      (252 × 388) — loop
 *   - "shooting" → /Shooter_Shooting.json  (252 × 388) — one-shot
 *
 * Component fills 100% of its parent — caller controls size via wrapper.
 */

export type ShooterAnim = "idle" | "shooting";

const SOURCE: Record<ShooterAnim, { src: string }> = {
  idle:     { src: "/Shooter_Idle.json" },
  shooting: { src: "/Shooter_Shooting.json" },
};

const cache = new Map<string, Promise<unknown>>();
function loadJson(src: string): Promise<unknown> {
  if (!cache.has(src)) {
    cache.set(src, fetch(src).then((r) => r.json()));
  }
  return cache.get(src)!;
}

/** Prewarm all variants the first time any LottieShooter mounts. */
let prewarmed = false;
function prewarmAllVariants(): void {
  if (prewarmed || typeof window === "undefined") return;
  prewarmed = true;
  for (const variant of Object.keys(SOURCE) as ShooterAnim[]) {
    void loadJson(SOURCE[variant].src);
  }
}

interface Props {
  variant?: ShooterAnim;
  /** Loop the animation. Defaults: idle loops, shooting one-shots. */
  loop?: boolean;
  /** Pause the playhead. */
  paused?: boolean;
  /** Mirror horizontally — use for right-side shots. */
  flipX?: boolean;
  /** Called once the animation reaches its last frame (one-shot mode). */
  onComplete?: () => void;
  className?: string;
}

export const LottieShooter = ({
  variant = "idle",
  loop = variant === "idle",
  paused = false,
  flipX = false,
  onComplete,
  className = "",
}: Props) => {
  const lottieRef = useRef<LottieRefCurrentProps>(null);
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

  useEffect(() => {
    let cancelled = false;

    Promise.all([import("lottie-react"), loadJson(src)])
      .then(([mod, json]) => {
        if (cancelled) return;
        setLottieComponent(() => mod.default);
        setDisplayed({ src, data: json });
      })
      .catch((err) => {
        console.error(`Failed to load Lottie shooter (${src}):`, err);
      });

    return () => {
      cancelled = true;
    };
  }, [src]);

  useEffect(() => {
    if (!lottieRef.current) return;
    if (paused) lottieRef.current.pause();
    else lottieRef.current.play();
  }, [paused, displayed]);

  const animationData = displayed?.data ?? null;

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
        rendererSettings={{ preserveAspectRatio: "xMidYMax meet" }}
      />
    </div>
  );
};
