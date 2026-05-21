"use client";

import { useEffect, useRef, useState } from "react";
import type { LottieRefCurrentProps } from "lottie-react";

/**
 * Lottie-driven shooter animation. Source: /Shooter_Shooting.json (252×388,
 * 60fps, ~87 frames). Plays the windup → kick → follow-through arc.
 *
 * Fills 100% of its parent — caller controls size via the wrapper.
 */

interface Props {
  /** Loop the animation? Defaults to false (one-shot for the kick). */
  loop?: boolean;
  /** Pause the playhead — useful for previewing/debugging. */
  paused?: boolean;
  /** Called once the animation reaches its last frame. */
  onComplete?: () => void;
  className?: string;
}

const SRC = "/Shooter_Shooting.json";

let cachedPromise: Promise<unknown> | null = null;
function loadJson(): Promise<unknown> {
  if (!cachedPromise) {
    cachedPromise = fetch(SRC).then((r) => r.json());
  }
  return cachedPromise;
}

export const LottieShooter = ({
  loop = false,
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

  useEffect(() => {
    let cancelled = false;

    Promise.all([import("lottie-react"), loadJson()])
      .then(([mod, json]) => {
        if (cancelled) return;
        setLottieComponent(() => mod.default);
        setAnimationData(json);
      })
      .catch((err) => {
        console.error("Failed to load Lottie shooter:", err);
      });

    return () => {
      cancelled = true;
    };
  }, []);

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
      style={{ width: "100%", height: "100%", pointerEvents: "none" }}
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
