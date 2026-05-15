"use client";

interface Props {
  /** Ball center x (in viewBox units). */
  cx: number;
  /** Ball center y (in viewBox units). */
  cy: number;
  /** Visual radius. Default 14. */
  r?: number;
}

/**
 * Soccer ball using Ball.svg graphic.
 * Positioned so (cx, cy) is the center of the ball.
 */
export const Ball = ({ cx, cy, r = 14 }: Props) => {
  const size = r * 2;
  return (
    <image
      href="/Ball.svg"
      x={cx - r}
      y={cy - r}
      width={size}
      height={size}
    />
  );
};
