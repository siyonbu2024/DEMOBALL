import { describe, expect, it } from "vitest";
import {
  PLAY_AREA,
  zoneCenter,
  zoneFromDragOffset,
  zoneFromTarget,
  zoneRect,
} from "./zone-geometry";

describe("zoneFromTarget", () => {
  it("maps top-left quadrant to zone 1", () => {
    expect(zoneFromTarget(50, 60)).toBe(1);
  });

  it("maps top-center to zone 2", () => {
    expect(zoneFromTarget(150, 60)).toBe(2);
  });

  it("maps top-right to zone 3", () => {
    expect(zoneFromTarget(250, 60)).toBe(3);
  });

  it("maps bottom-left to zone 4", () => {
    expect(zoneFromTarget(50, 180)).toBe(4);
  });

  it("maps bottom-center to zone 5", () => {
    expect(zoneFromTarget(150, 180)).toBe(5);
  });

  it("maps bottom-right to zone 6", () => {
    expect(zoneFromTarget(250, 180)).toBe(6);
  });

  it("clamps targets above the goal to the top row", () => {
    expect(zoneFromTarget(150, -200)).toBe(2);
  });

  it("clamps targets below the goal to the bottom row", () => {
    expect(zoneFromTarget(150, 500)).toBe(5);
  });

  it("clamps targets left of the goal to the left column", () => {
    expect(zoneFromTarget(-100, 60)).toBe(1);
  });

  it("clamps targets right of the goal to the right column", () => {
    expect(zoneFromTarget(500, 180)).toBe(6);
  });
});

describe("zoneFromDragOffset", () => {
  it("returns zone 5 (bottom-center) for no drag", () => {
    // ball starts in the run-up area (below the goal); a tiny no-op drag
    // clamps to the closest goal cell, which is the bottom-center zone 5.
    expect(zoneFromDragOffset(0, 0)).toBe(5);
  });

  it("dragging up-and-left lands in zone 1", () => {
    expect(zoneFromDragOffset(-100, -400)).toBe(1);
  });

  it("dragging straight up lands in zone 2", () => {
    expect(zoneFromDragOffset(0, -400)).toBe(2);
  });

  it("dragging up-and-right lands in zone 3", () => {
    expect(zoneFromDragOffset(100, -400)).toBe(3);
  });

  it("dragging mildly up + left lands in zone 4", () => {
    expect(zoneFromDragOffset(-100, -250)).toBe(4);
  });

  it("dragging mildly up center lands in zone 5", () => {
    expect(zoneFromDragOffset(0, -250)).toBe(5);
  });

  it("dragging mildly up + right lands in zone 6", () => {
    expect(zoneFromDragOffset(100, -250)).toBe(6);
  });
});

describe("zoneCenter", () => {
  it("zone 2 center is (150, 60)", () => {
    expect(zoneCenter(2)).toEqual({ x: 150, y: 60 });
  });

  it("zone 5 center is (150, 180)", () => {
    expect(zoneCenter(5)).toEqual({ x: 150, y: 180 });
  });

  it("zone 1 center is (50, 60)", () => {
    expect(zoneCenter(1)).toEqual({ x: 50, y: 60 });
  });

  it("zone 6 center is (250, 180)", () => {
    expect(zoneCenter(6)).toEqual({ x: 250, y: 180 });
  });
});

describe("zoneRect", () => {
  it("zone 1 covers top-left 100x120", () => {
    expect(zoneRect(1)).toEqual({ x: 0, y: 0, width: 100, height: 120 });
  });

  it("zone 6 covers bottom-right 100x120", () => {
    expect(zoneRect(6)).toEqual({ x: 200, y: 120, width: 100, height: 120 });
  });
});

describe("PLAY_AREA", () => {
  it("ball starts within the run-up area, below the goal", () => {
    expect(PLAY_AREA.ballStartY).toBeGreaterThan(PLAY_AREA.goalHeight);
    expect(PLAY_AREA.ballStartX).toBeGreaterThanOrEqual(0);
    expect(PLAY_AREA.ballStartX).toBeLessThanOrEqual(PLAY_AREA.width);
  });
});
