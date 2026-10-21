import { bandScale, linearScale, nearest, niceTicks, type Point } from "./scale";

// shortcut: a width estimate for 12 px text (tabular digits ≈ 0.6 em); measure the text if long labels clip.
const CHAR = 7;
const longest = (texts: string[]) => texts.reduce((n, t) => Math.max(n, t.length), 1) * CHAR;

/**
 * Plot box and scales of a chart with a value axis and a category axis. The value axis always includes 0.
 * `swap` puts the categories down the side (horizontal bars). `mirror` runs the across axis right to left.
 */
export function cartesian(o: { width: number; height: number; labels: string[]; min: number; max: number; format: (n: number) => string; mirror: boolean; swap?: boolean }) {
  const ticks = niceTicks(Math.min(0, o.min), Math.max(0, o.max));
  const tickText = ticks.map(o.format);
  const sideW = Math.min(o.width * 0.4, longest(o.swap ? o.labels : tickText) + 12);
  const box = { top: 8, bottom: o.height - 24, left: o.mirror ? 8 : sideW, right: o.width - (o.mirror ? sideW : 8) };
  const across: [number, number] = o.mirror ? [box.right, box.left] : [box.left, box.right];
  const value = linearScale([ticks[0]!, ticks.at(-1)!], o.swap ? across : [box.bottom, box.top]);
  const band = bandScale(o.labels.length, o.swap ? [box.top, box.bottom] : across);
  const centers = o.labels.map((_, i) => band.center(i));
  return {
    ...o,
    box,
    ticks,
    tickText,
    value,
    band,
    hit: (x: number, y: number) => nearest(centers, o.swap ? y : x),
    /** Tooltip anchor of row i: at the far end of its values (`ends` = value positions; none when all are missing). */
    anchor: (i: number, ends: number[]): Point => {
      if (!ends.length) ends = [value(0)];
      if (!o.swap) return [band.center(i), Math.min(...ends)];
      return [o.mirror ? Math.min(...ends) : Math.max(...ends), band.center(i)];
    },
  };
}

export type Cartesian = ReturnType<typeof cartesian>;

/** Gridlines (`line`, the zero line `line-strong`), value labels and category labels (`fg-3`, tabular digits). */
export function Axes({ c }: { c: Cartesian }) {
  const { box, ticks, tickText, value, band, labels, swap, mirror } = c;
  const values = ticks.map((t, i) => [value(t), tickText[i]!] as const);
  const cats = labels.map((l, i) => [band.center(i), l] as const);
  const side = swap ? cats : values;
  const bottom = swap ? values : cats;
  const gap = Math.abs((bottom[1]?.[0] ?? Infinity) - (bottom[0]?.[0] ?? 0));
  // Show every k-th bottom label so they never overlap.
  const every = Math.max(1, Math.ceil((longest(bottom.map(([, t]) => t)) + 8) / gap));
  return (
    <g className="fill-fg-3 text-xs tabular-nums">
      {ticks.map((t) => {
        const p = value(t);
        const cls = t === 0 ? "stroke-line-strong" : "stroke-line";
        return swap ? <line key={t} x1={p} x2={p} y1={box.top} y2={box.bottom} className={cls} /> : <line key={t} x1={box.left} x2={box.right} y1={p} y2={p} className={cls} />;
      })}
      {side.map(([p, t], i) => (
        <text key={i} x={mirror ? box.right + 8 : box.left - 8} y={p} textAnchor={mirror ? "start" : "end"} dominantBaseline="middle">
          {t}
        </text>
      ))}
      {bottom.map(
        ([p, t], i) =>
          i % every === 0 && (
            <text key={i} x={p} y={box.bottom + 16} textAnchor="middle">
              {t}
            </text>
          ),
      )}
    </g>
  );
}
