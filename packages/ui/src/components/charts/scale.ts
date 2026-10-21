// Pure chart maths: scales, ticks, paths, stacks and donut angles. No React, no DOM.

export type Point = [number, number];

/** About `count` round tick values (1, 2 or 5 × 10ⁿ apart) that cover min..max. */
export function niceTicks(min: number, max: number, count = 5): number[] {
  if (max === min) max = min + 1;
  const raw = (max - min) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].find((m) => m * mag >= raw)! * mag;
  // The small epsilons stop float noise (0.30000000000000004 / 0.1) from adding a tick.
  const first = Math.floor(min / step + 1e-9);
  const last = Math.ceil(max / step - 1e-9);
  const ticks: number[] = [];
  for (let i = first; i <= last; i++) ticks.push(Number((i * step).toPrecision(12)));
  return ticks;
}

/** Maps domain d0..d1 to range r0..r1. A reversed range (r0 > r1) mirrors the axis. */
export const linearScale =
  ([d0, d1]: [number, number], [r0, r1]: [number, number]) =>
  (v: number) =>
    d1 === d0 ? r0 : r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);

/** `n` equal bands from r0 to r1 (a reversed range runs right to left); `gap` = share of a band left empty. */
export function bandScale(n: number, [r0, r1]: [number, number], gap = 0.3) {
  const step = (r1 - r0) / Math.max(n, 1);
  return { step, width: Math.abs(step) * (1 - gap), center: (i: number) => r0 + step * (i + 0.5) };
}

/** Smallest and largest value, skipping null. A loop: spreading ~150k values into Math.min overflows the stack. */
export function extent(values: Iterable<number | null>): [number, number] {
  let min = Infinity;
  let max = -Infinity;
  for (const v of values) {
    if (v === null) continue;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return [min, max];
}

/** Runs of consecutive non-null items: a missing value (null) breaks a line or an area. */
export function runs<T>(items: (T | null)[]): T[][] {
  const out: T[][] = [];
  let run: T[] = [];
  for (const item of items) {
    if (item !== null) run.push(item);
    else if (run.length) {
      out.push(run);
      run = [];
    }
  }
  if (run.length) out.push(run);
  return out;
}

/** Index of the value closest to `v`, or null for an empty list. */
export function nearest(values: number[], v: number): number | null {
  let best: number | null = null;
  values.forEach((x, i) => {
    if (best === null || Math.abs(x - v) < Math.abs(values[best]! - v)) best = i;
  });
  return best;
}

const r = (n: number) => Math.round(n * 100) / 100;

/** SVG path through the points. "monotone" never overshoots between points (Steffen, like d3 curveMonotoneX). */
export function linePath(points: Point[], curve: "linear" | "monotone" = "linear") {
  if (points.length === 0) return "";
  const [[x0, y0]] = points as [Point];
  if (curve === "linear" || points.length < 3) return `M${r(x0)},${r(y0)}` + points.slice(1).map(([x, y]) => `L${r(x)},${r(y)}`).join("");
  const n = points.length;
  const h = points.slice(1).map(([x], i) => x - points[i]![0]);
  const d = points.slice(1).map(([, y], i) => (y - points[i]![1]) / h[i]!);
  const m = points.map((_, i) => {
    if (i === 0 || i === n - 1) return NaN;
    const p = (d[i - 1]! * h[i]! + d[i]! * h[i - 1]!) / (h[i - 1]! + h[i]!);
    return (Math.sign(d[i - 1]!) + Math.sign(d[i]!)) * Math.min(Math.abs(d[i - 1]!), Math.abs(d[i]!), 0.5 * Math.abs(p)) || 0;
  });
  m[0] = (3 * d[0]! - m[1]!) / 2;
  m[n - 1] = (3 * d[n - 2]! - m[n - 2]!) / 2;
  let path = `M${r(x0)},${r(y0)}`;
  for (let i = 0; i < n - 1; i++) {
    const [xa, ya] = points[i]!;
    const [xb, yb] = points[i + 1]!;
    const t = h[i]! / 3;
    path += `C${r(xa + t)},${r(ya + t * m[i]!)},${r(xb - t)},${r(yb - t * m[i + 1]!)},${r(xb)},${r(yb)}`;
  }
  return path;
}

/** Closed area between a top line and a bottom line (same x values). */
export const areaPath = (top: Point[], bottom: Point[], curve: "linear" | "monotone" = "linear") =>
  linePath(top, curve) + linePath([...bottom].reverse(), curve).replace(/^M/, "L") + "Z";

/** Stacks series (values[series][index]) into [start, end] pairs. Negative values stack downwards from 0; a missing value (null) stays null. */
export function stack(values: number[][]): Point[][];
export function stack(values: (number | null)[][]): (Point | null)[][];
export function stack(values: (number | null)[][]): (Point | null)[][] {
  const up: number[] = [];
  const down: number[] = [];
  return values.map((vs) =>
    vs.map((v, i) => {
      if (v === null) return null;
      const base = v < 0 ? down : up;
      const start = base[i] ?? 0;
      base[i] = start + v;
      return [start, start + v];
    }),
  );
}

/** Start and end angle (degrees, clockwise from 12 o'clock) of each slice. Negative values count as 0. */
export function donutAngles(values: number[]) {
  const total = values.reduce((s, v) => s + Math.max(0, v), 0);
  let at = 0;
  return values.map((v) => {
    const start = at;
    at += total ? (Math.max(0, v) / total) * 360 : 0;
    return { start, end: at };
  });
}
