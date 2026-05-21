"use client";

import { ALL_ZONES, type Zone } from "@shared/types";
import { PLAY_AREA, zoneRect } from "@shared/zone-geometry";

const POST = 9;

interface Props {
  /** Zone the local user picked — always rendered in BLUE. */
  userHighlight?: Zone | null;
  /** Zone the opponent picked — always rendered in RED. */
  opponentHighlight?: Zone | null;
  dim?: boolean;
  showLabels?: boolean;
}

export const Goal = ({
  userHighlight = null,
  opponentHighlight = null,
  dim = false,
  showLabels = true,
}: Props) => {
  const GL = PLAY_AREA.goalLeft;
  const GT = PLAY_AREA.goalTop;
  const GW = PLAY_AREA.goalWidth;
  const GH = PLAY_AREA.goalHeight;

  return (
    <g>
      <defs>
        {/* Dark interior gradient */}
        <linearGradient id="g-interior" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#060b10" />
          <stop offset="100%" stopColor="#0f1e2c" />
        </linearGradient>

        {/* Net cross-hatch */}
        <pattern id="g-net" x="0" y="0" width="13" height="13" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0"  x2="13" y2="13" stroke="rgba(200,215,230,0.18)" strokeWidth="0.75" />
          <line x1="13" y1="0" x2="0"  y2="13" stroke="rgba(200,215,230,0.18)" strokeWidth="0.75" />
        </pattern>

        {/* Net reinforcement grid */}
        <pattern id="g-net-grid" x="0" y="0" width="26" height="26" patternUnits="userSpaceOnUse">
          <line x1="0" y1="13" x2="26" y2="13" stroke="rgba(200,215,230,0.09)" strokeWidth="0.6" />
          <line x1="13" y1="0" x2="13" y2="26" stroke="rgba(200,215,230,0.09)" strokeWidth="0.6" />
        </pattern>

        {/* Depth vignette */}
        <radialGradient id="g-vignette" cx="50%" cy="35%" r="70%">
          <stop offset="0%"   stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.55)" />
        </radialGradient>

        {/* Left post: highlight → shadow */}
        <linearGradient id="g-post-l" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#ffffff" />
          <stop offset="55%"  stopColor="#dce0e4" />
          <stop offset="100%" stopColor="#8c959e" />
        </linearGradient>

        {/* Right post: shadow → highlight */}
        <linearGradient id="g-post-r" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#8c959e" />
          <stop offset="45%"  stopColor="#dce0e4" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>

        {/* Crossbar: top-lit */}
        <linearGradient id="g-cross" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#ffffff" />
          <stop offset="55%"  stopColor="#dce0e4" />
          <stop offset="100%" stopColor="#8c959e" />
        </linearGradient>

        {/* Net clip */}
        <clipPath id="g-net-clip">
          <rect x={GL + POST} y={GT + POST} width={GW - POST * 2} height={GH - POST} />
        </clipPath>
      </defs>

      {/* Dark interior */}
      <rect x={GL} y={GT} width={GW} height={GH} fill="url(#g-interior)" />

      {/* Net texture */}
      <rect x={GL + POST} y={GT + POST}
        width={GW - POST * 2} height={GH - POST}
        fill="url(#g-net)" clipPath="url(#g-net-clip)" />
      <rect x={GL + POST} y={GT + POST}
        width={GW - POST * 2} height={GH - POST}
        fill="url(#g-net-grid)" clipPath="url(#g-net-clip)" />

      {/* Depth vignette */}
      <rect x={GL} y={GT} width={GW} height={GH} fill="url(#g-vignette)" />

      {/* Zone overlays — user side BLUE, opponent side RED */}
      {ALL_ZONES.map((z) => {
        const r = zoneRect(z);
        const isUser = userHighlight === z;
        const isOpponent = opponentHighlight === z;
        const highlighted = isUser || isOpponent;
        const fill = isUser
          ? "rgba(40,120,255,0.42)"
          : isOpponent
          ? "rgba(255,60,60,0.42)"
          : dim
          ? "rgba(0,0,0,0)"
          : "rgba(255,255,255,0.04)";
        const stroke = isUser
          ? "#2878ff"
          : isOpponent
          ? "#ff4040"
          : "rgba(255,255,255,0.25)";
        return (
          <g key={z}>
            <rect
              x={r.x + POST / 2} y={r.y + POST / 2}
              width={r.width - POST} height={r.height - POST / 2}
              fill={fill} stroke={stroke}
              strokeWidth={highlighted ? 2.5 : 1.5}
              strokeDasharray={highlighted ? "none" : "5 3"}
            />
            {showLabels && (
              <text
                x={r.x + r.width / 2} y={r.y + r.height / 2 + 9}
                textAnchor="middle" fontFamily="system-ui, sans-serif"
                fontWeight="800" fontSize={22}
                fill={highlighted ? "#ffffff" : "rgba(255,255,255,0.5)"}
              >
                {z}
              </text>
            )}
          </g>
        );
      })}

      {/* Inner shadow lines */}
      <rect x={GL + POST}           y={GT + POST} width={3} height={GH - POST} fill="rgba(0,0,0,0.28)" />
      <rect x={GL + GW - POST - 3}  y={GT + POST} width={3} height={GH - POST} fill="rgba(0,0,0,0.28)" />
      <rect x={GL + POST} y={GT + POST} width={GW - POST * 2} height={3}       fill="rgba(0,0,0,0.22)" />

      {/* Crossbar */}
      <rect x={GL}             y={GT} width={GW}   height={POST} fill="url(#g-cross)" />
      {/* Left post */}
      <rect x={GL}             y={GT} width={POST}  height={GH}  fill="url(#g-post-l)" />
      {/* Right post */}
      <rect x={GL + GW - POST} y={GT} width={POST}  height={GH}  fill="url(#g-post-r)" />

      {/* Post outer gleam */}
      <rect x={GL}            y={GT} width={1.5} height={GH} fill="rgba(255,255,255,0.6)" />
      <rect x={GL + GW - 1.5} y={GT} width={1.5} height={GH} fill="rgba(255,255,255,0.6)" />
      <rect x={GL} y={GT} width={GW} height={1.5}             fill="rgba(255,255,255,0.6)" />
    </g>
  );
};
