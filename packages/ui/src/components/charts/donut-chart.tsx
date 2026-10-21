import type { ReactNode } from "react";
import { useDir, useLang, useStrings } from "../../provider";
import { formatNumber } from "../text";
import { ChartFrame, useChartWidth } from "./chart-frame";
import { ChartLegend, lookOf, useFill } from "./legend";
import { donutAngles, type Point } from "./scale";

const PAD = 0.75; // degrees left empty on each side of a slice, so slices stay apart on any background

/** Parts of a whole as a ring, with an optional centre `label` and `value` and a legend with percentages. */
export function DonutChart({
  data,
  title,
  label,
  value,
  height = 240,
  format,
  mirror,
  patterns,
  className,
}: {
  data: { label: string; value: number; color?: string }[];
  title: string;
  label?: ReactNode;
  value?: ReactNode;
  height?: number;
  format?: (n: number) => string;
  /** Slices run counter-clockwise. Default: true in RTL. */
  mirror?: boolean;
  /** false: slices differ by colour only (no hatches). Then the colours must differ enough. Default: true. */
  patterns?: boolean;
  className?: string;
}) {
  const lang = useLang();
  const s = useStrings();
  const rtl = useDir() === "rtl";
  const flip = mirror ?? rtl;
  const fmt = format ?? ((n: number) => formatNumber(n, lang));
  const [ref, width] = useChartWidth();
  const total = data.reduce((s, d) => s + Math.max(0, d.value), 0);
  const pct = (v: number) => formatNumber(total ? Math.max(0, v) / total : 0, lang, { style: "percent", maximumFractionDigits: 1 });
  const angles = donutAngles(data.map((d) => d.value));
  const { defs, fill } = useFill(data.map((d, i) => lookOf(i, d.color, patterns)));
  const [cx, cy, outer] = [width / 2, height / 2, Math.min(width, height) / 2 - 4];
  const inner = outer * 0.62;
  // Angle in degrees, clockwise from 12 o'clock (counter-clockwise when mirrored), to a point.
  const at = (deg: number, rad: number): Point => {
    const a = (deg * Math.PI) / 180;
    return [cx + (flip ? -1 : 1) * rad * Math.sin(a), cy - rad * Math.cos(a)];
  };
  const arc = (start: number, end: number) => {
    // shortcut: one slice of 100 % is drawn as 359.9°, an SVG arc cannot start and end at the same point.
    const [s, e] = end - start > 2 * PAD + 0.1 ? [start + PAD, Math.min(end - PAD, start + 359.9)] : [start, end];
    const big = e - s > 180 ? 1 : 0;
    const sweep = flip ? 0 : 1;
    const p = [at(s, outer), at(e, outer), at(e, inner), at(s, inner)].map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`);
    return `M${p[0]}A${outer},${outer} 0 ${big} ${sweep} ${p[1]}L${p[2]}A${inner},${inner} 0 ${big} ${1 - sweep} ${p[3]}Z`;
  };
  const hit = (x: number, y: number) => {
    const d = Math.hypot(x - cx, y - cy);
    if (d < inner || d > outer + 4) return null;
    const deg = ((Math.atan2((flip ? -1 : 1) * (x - cx), cy - y) * 180) / Math.PI + 360) % 360;
    const i = angles.findIndex((a) => deg >= a.start && deg < a.end);
    return i < 0 ? null : i;
  };
  const rows = data.map((d) => ({ label: d.label, values: [fmt(d.value)] }));
  return (
    <ChartFrame
      title={title}
      width={width}
      height={height}
      measure={ref}
      columns={[s.category, title]}
      rows={rows}
      kind="fill"
      colors={data.map((d) => d.color)}
      patterns={patterns}
      perRow
      anchors={angles.map((a) => at((a.start + a.end) / 2, outer))}
      hit={hit}
      mirror={flip}
      legend={<ChartLegend kind="fill" patterns={patterns} items={data.map((d) => ({ label: d.label, value: pct(d.value), color: d.color }))} />}
      overlay={
        (label || value) && (
          <>
            {value && <span className="text-2xl font-semibold text-fg tabular-nums">{value}</span>}
            {label && <span className="text-xs text-fg-3">{label}</span>}
          </>
        )
      }
      className={className}
    >
      {(active) => (
        <>
          {defs}
          <g data-draw="">
            {angles.map((a, i) => (
              <path
                key={i}
                data-slice=""
                d={arc(a.start, a.end)}
                fill={fill(i)}
                opacity={active === null || active === i ? 1 : 0.4}
                className="transition-opacity duration-(--p-duration-fast)"
              />
            ))}
          </g>
        </>
      )}
    </ChartFrame>
  );
}
