import { describe, expect, test } from "bun:test";
import { boostTarget, easeRate, loopHeadroom } from "../src";

describe("marquee scroll boost", () => {
  test("target speed follows the scroll speed and direction, within ±4", () => {
    expect(boostTarget(0)).toBe(1);
    expect(boostTarget(5)).toBe(4);
    expect(boostTarget(-5)).toBe(-4);
    expect(boostTarget(0.5)).toBeCloseTo(2.5, 5);
  });
  test("the rate eases toward the target", () => {
    expect(Math.abs(easeRate(4, 1, 500) - 1)).toBeLessThan(0.2);
    const step = easeRate(1, 4, 16);
    expect(step).toBeGreaterThan(1);
    expect(step).toBeLessThan(4);
  });
  test("backwards playback has whole loops of room before the start (same frame)", () => {
    // A loop played backwards stops for good at time 0 (it was seen after a fast scroll up).
    const t = loopHeadroom(1234, 45_000);
    expect(t % 45_000).toBe(1234);
    expect(t).toBeGreaterThanOrEqual(45_000 * 1000);
  });
});
