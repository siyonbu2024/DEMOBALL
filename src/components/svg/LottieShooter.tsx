"use client";

import { useEffect, useRef, useState } from "react";
import type { LottieRefCurrentProps } from "lottie-react";

/**
 * Lottie-driven shooter animation.
 *
 * Each variant has a separate JSON per side. The two "_enemy" files differ
 * from the user-side originals only in kit colour, so swapping the source
 * is how we distinguish friend vs opponent (CSS filter recolouring didn't
 * read well on the image-based Lotties).
 *
 *   side="user"   variant="idle"     → /Shooter_Idle.json
 *   side="user"   variant="shooting" → /Shooter_Shooting.json
 *   side="enemy"  variant="idle"     → /Shooter_Idle_enemy.json
 *   side="enemy"  variant="shooting" → /Shooter_Shooting_enemy.json
 *
 * Component fills 100 % of its parent — caller controls size via wrapper.
 */

export type ShooterAnim = "idle" | "shooting";
export type ShooterSide = "user" | "enemy";

const SOURCE: Record<ShooterSide, Record<ShooterAnim, string>> = {
  user: {
    idle:     "/Shooter_Idle.json",
    shooting: "/Shooter_Shooting.json",
  },
  enemy: {
    idle:     "/Shooter_Idle_enemy.json",
    shooting: "/Shooter_Shooting_enemy.json",
  },
};

const cache = new Map<string, Promise<unknown>>();
function loadJson(src: string): Promise<unknown> {
  if (!cache.has(src)) {
    cache.set(src, fetch(src).then((r) => r.json()));
  }
  return cache.get(src)!;
}

/** Prewarm every kit × variant once on first mount. */
let prewarmed = false;
function prewarmAllVariants(): void {
  if (prewarmed || typeof window === "undefined") return;
  prewarmed = true;
  for (const side of Object.keys(SOURCE) as ShooterSide[]) {
    for (const v of Object.keys(SOURCE[side]) as ShooterAnim[]) {
      void loadJson(SOURCE[side][v]);
    }
  }
}

interface Props {
  variant?: ShooterAnim;
  side?: ShooterSide;
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
  side = "user",
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

  const src = SOURCE[side][variant];

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
