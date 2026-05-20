import { PLAY_AREA } from "@/lib/zone-geometry";

/**
 * Penalty kicker character. Rendered as an SVG <image> referencing
 * /public/Shooter.svg so we get the full multi-color illustration without
 * inlining hundreds of <path>s.
 *
 * Default placement: just to the left of the ball, feet roughly at the ball line.
 * Width is in viewBox units (PLAY_AREA viewBox is 300 × 500). The SVG's natural
 * ratio is ~0.62 (219.59 / 353.05).
 */
interface Props {
  /** Optional pose. Currently illustrative — keeps API parallel to Keeper. */
  pose?: "idle" | "windup" | "follow-through";
  /** Override placement (defaults to behind/left of the ball). */
  x?: number;
  y?: number;
  /** Height in viewBox units. Width is derived from natural ratio. */
  height?: number;
}

const ASPECT = 219.59 / 353.05; // ~0.622

export const Shooter = ({
  pose = "idle",
  height = 165,
  x,
  y,
}: Props) => {
  const w = height * ASPECT;
  // Default: stand offset to the LEFT of the ball so the ball and the
  // character don't overlap. Right foot sits roughly under the ball.
  const ix = x ?? PLAY_AREA.ballStartX - w * 0.85;
  const iy = y ?? PLAY_AREA.height - height - 10;

  // Tiny pose tilt for follow-through (no body animation needed in demo).
  const rotate =
    pose === "windup" ? -6 : pose === "follow-through" ? 8 : 0;

  return (
    <g style={{ transform: `rotate(${rotate}deg)`, transformOrigin: `${ix + w / 2}px ${iy + height}px` }}>
      <image
        href="/Shooter.svg"
        x={ix}
        y={iy}
        width={w}
        height={height}
        preserveAspectRatio="xMidYMax meet"
      />
    </g>
  );
};
