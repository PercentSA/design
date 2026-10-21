import { SLASH_RUN } from "./slash";

/** Ease-out cubic from `from` to `to`; t is 0..1. Whole numbers. */
export const counterValue = (t: number, from: number, to: number) => {
  const k = 1 - (1 - Math.min(1, Math.max(0, t))) ** 3;
  return Math.round(from + (to - from) * k);
};

const clamp = (v: number, max: number) => Math.max(-max, Math.min(max, v));

/** Offset of a magnetic button toward the pointer; dx, dy = pointer minus button center. */
export const magnetOffset = (dx: number, dy: number, max = 6) => ({ x: clamp(dx * 0.25, max), y: clamp(dy * 0.25, max) });

/** Horizontal run of the % slash over a box of this aspect (width / height), in % of the width. */
export const slashRunPercent = (aspect: number) => Math.round((SLASH_RUN / aspect) * 10000) / 100;

/** Loop speed for a scroll speed in px/ms: faster in the scroll direction, backwards when scrolling up. */
export const boostTarget = (pxPerMs: number) => Math.min(4, Math.max(-4, 1 + pxPerMs * 3));

/** Move `rate` toward `target` (time constant 150 ms), so the loop slows back to normal in about 0.5 s. */
export const easeRate = (rate: number, target: number, dtMs: number) => target + (rate - target) * Math.exp(-dtMs / 150);

/** The same frame of a loop, `1000` loops later: backwards playback then never reaches time 0, where it would stop. */
export const loopHeadroom = (time: number, duration: number) => time + duration * 1000;
