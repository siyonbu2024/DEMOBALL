"use client";

import { PLAY_AREA } from "@/lib/zone-geometry";

export const Pitch = () => {
  const pY = PLAY_AREA.goalHeight;
  const pH = PLAY_AREA.height - pY;
  const pW = PLAY_AREA.width;
  const stripeH = 26;
  const numStripes = Math.ceil(pH / stripeH) + 1;

  return (
    <g>
      <defs>
        <linearGradient id="p-cam-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="rgba(0,0,0,0.32)" />
          <stop offset="50%"  stopColor="rgba(0,0,0,0.08)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.0)" />
        </linearGradient>
      </defs>

      {/* Grass stripes */}
      {Array.from({ length: numStripes }, (_, i) => (
        <rect key={i} x={0} y={pY + i * stripeH} width={pW} height={stripeH}
          fill={i % 2 === 0 ? "#1b6b2f" : "#1f7e38"} />
      ))}

      {/* Goal-line shadow */}
      <rect x={0} y={pY} width={pW} height={10} fill="rgba(0,0,0,0.35)" />

      {/* Penalty area */}
      <rect x={pW / 2 - 95} y={pY} width={190} height={78}
        fill="none" stroke="#ffffff" strokeWidth={2.5} opacity={0.85}
        shapeRendering="crispEdges" />

      {/* Penalty arc */}
      <path d={`M ${pW / 2 - 52} ${pY + 78} A 58 58 0 0 0 ${pW / 2 + 52} ${pY + 78}`}
        fill="none" stroke="#ffffff" strokeWidth={2.5} opacity={0.85}
        shapeRendering="geometricPrecision" />

      {/* Goal line */}
      <line x1={0} y1={pY} x2={pW} y2={pY}
        stroke="#ffffff" strokeWidth={3} opacity={0.8} shapeRendering="crispEdges" />

      {/* Penalty spot */}
      <circle cx={pW / 2} cy={PLAY_AREA.ballStartY - 28} r={4.5}
        fill="#ffffff" opacity={0.9} shapeRendering="geometricPrecision" />

      {/* Depth gradient */}
      <rect x={0} y={pY} width={pW} height={pH} fill="url(#p-cam-grad)" />
    </g>
  );
};
