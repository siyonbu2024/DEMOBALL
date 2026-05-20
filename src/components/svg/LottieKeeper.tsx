"use client";

import { useEffect, useRef, useState } from "react";
import type { LottieRefCurrentProps } from "lottie-react";

/**
 * Lottie-driven keeper idle animation.
 *
 * Renders `/public/Keeper.json` via lottie-react. The component fills 100%
 * of its parent — caller controls sizing by sizing the wrapper div.
 *
 * Use this anywhere we want the keeper standing/breathing without a dive.
 */

interface Props {
  /** Whether the animation should loop (idle = yes). */
  loop?: boolean;
  /** Pause the playhead — useful for previewing/debugging. */
  paused?: boolean;
  className?: string;
}

export const LottieKeeper = ({
  loop = true,
  paused = false,
  className = "",
}: Props) => {
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const [animationData, setAnimationData] = useState<unknown | null>(null);
  const [LottieComponent, setLottieComponent] = useState<React.ComponentType<{
    animationData: unknown;
    loop: boolean;
    autoplay: boolean;
    lottieRef: React.RefObject<LottieRefCurrentProps | null>;
    rendererSettings?: { preserveAspectRatio: string };
  }> | null>(null);

  // Dynamically import lottie-react + animation JSON on mount.
  // Keeps the initial bundle lean — Lottie code only loads where used.
  useEffect(() => {
    let cancelled = false;

    Promise.all([
      import("lottie-react"),
      fetch("/Keeper.json").then((r) => r.json()),
    ])
      .then(([mod, json]) => {
        if (cancelled) return;
        setLottieComponent(() => mod.default);
        setAnimationData(json);
      })
      .catch((err) => {
        console.error("Failed to load Lottie keeper:", err);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!lottieRef.current) return;
    if (paused) lottieRef.current.pause();
    else lottieRef.current.play();
  }, [paused]);

  if (!LottieComponent || !animationData) {
    // Placeholder — caller sized us, just hold space.
    return <div className={className} style={{ width: "100%", height: "100%" }} />;
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
        rendererSettings={{ preserveAspectRatio: "xMidYMid meet" }}
      />
    </div>
  );
};
