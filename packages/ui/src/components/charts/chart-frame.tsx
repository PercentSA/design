"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode, type Ref } from "react";
import { cn } from "../../lib/cn";
import { useDir, useLang, useStrings } from "../../provider";
import { formatNumber } from "../../lib/format-number";
import { LiveRegion } from "../utility";
import { Swatch } from "./legend";
import type { Point } from "./scale";

export type ChartSeries = { key: string; label: ReactNode; color?: string };

/** Props shared by LineChart, AreaChart and BarChart. */
export type ChartProps = {
  /** A missing value (absent, null or "") breaks the line, leaves out the bar and reads "—". */
  data: Record<string, number | string | null | undefined>[];
  /** Key of the x value (category or date label) in each row. */
  x: string;
  /** Header of the x column in the hidden data table. Default: the `x` key. */
  xLabel?: ReactNode;
  series: ChartSeries[];
  height?: number;
  format?: (n: number) => string;
  /** The accessible name and the caption of the hidden data table. */
  title: string;
  /** x axis from right to left. Default: true in RTL. */
  mirror?: boolean;
  /** false: series differ by colour and marker only (no dashes or hatches). Then the colours must differ enough. Default: true. */
  patterns?: boolean;
  className?: string;
};

const num = (v: unknown) => (v == null || v === "" ? null : typeof v === "number" ? v : Number(v) || 0);

/** Values (null = missing), labels, the formatter and the hidden-table rows of a series chart. Same object while the props stay the same. */
export function useChart({ data, x, xLabel, series, format, mirror }: ChartProps) {
  const lang = useLang();
  const rtl = useDir() === "rtl";
  return useMemo(() => {
    const fmt = format ?? ((n: number) => formatNumber(n, lang));
    const values = series.map((s) => data.map((row) => num(row[s.key])));
    const labels = data.map((row) => String(row[x] ?? ""));
    return {
      fmt,
      values,
      labels,
      mirror: mirror ?? rtl,
      columns: [xLabel ?? x, ...series.map((s) => s.label)],
      rows: labels.map((label, i) => ({ label, values: values.map((v) => (v[i] == null ? "—" : fmt(v[i]))) })),
    };
  }, [data, x, xLabel, series, format, mirror, lang, rtl]);
}

const SSR_WIDTH = 640;

/** Width of the element behind `ref`. The server and the first client render use 640 (the SVG scales), then ResizeObserver. */
export function useChartWidth() {
  const [width, setWidth] = useState(SSR_WIDTH);
  // A callback ref: the measured element comes and goes with the data (none while loading).
  const ref = useCallback((el: HTMLDivElement | null) => {
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => {
      const w = Math.round(e?.contentRect.width ?? 0);
      if (w > 0) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

type Row = { label: ReactNode; values: string[] };

/**
 * Shared frame of every chart: <figure> named by the title, one tab stop, tooltip, live region,
 * visually hidden data table, empty state and the draw-in on first view.
 */
export function ChartFrame({
  title,
  width,
  height,
  measure,
  columns,
  rows,
  kind,
  colors,
  patterns,
  perRow,
  anchors,
  hit,
  mirror,
  vertical,
  legend,
  overlay,
  className,
  children,
}: {
  title: string;
  width: number;
  height: number;
  measure: Ref<HTMLDivElement>;
  /** Table headers: the x header, then one per value column. */
  columns: ReactNode[];
  rows: Row[];
  kind: "line" | "fill";
  colors: (string | undefined)[];
  patterns?: boolean;
  /** The look belongs to the row (donut slices), not to the column (series). */
  perRow?: boolean;
  /** Where the tooltip points for each row (SVG units). */
  anchors: Point[];
  /** Row under an SVG point, for the pointer. */
  hit: (x: number, y: number) => number | null;
  mirror: boolean;
  /** Up/Down also move (rows run down the chart). */
  vertical?: boolean;
  legend?: ReactNode;
  /** Readable content over the middle of the plot (donut centre). */
  overlay?: ReactNode;
  className?: string;
  children: (active: number | null) => ReactNode;
}) {
  const s = useStrings();
  const svg = useRef<SVGSVGElement>(null);
  const [active, setActive] = useState<{ i: number; key: boolean } | null>(null);
  const n = rows.length;

  // Draw-in when the chart scrolls into view; never under reduced motion. Without JavaScript the chart is simply there.
  useEffect(() => {
    const el = svg.current?.querySelector<SVGGElement>("[data-draw]");
    if (!el || typeof IntersectionObserver === "undefined" || typeof el.animate !== "function") return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let first = true;
    const io = new IntersectionObserver(
      ([e]) => {
        const onScreenAtMount = first;
        first = false;
        if (!e?.isIntersecting) return;
        io.disconnect();
        // Already painted (server HTML or first render): hiding it to wipe in would blink.
        if (onScreenAtMount) return;
        const from = mirror ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)";
        el.animate({ clipPath: [from, "inset(0 0 0 0)"] }, { duration: 450, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" });
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- first view only, not again on a language switch
  }, []);

  const onKeyDown = (e: KeyboardEvent) => {
    const steps: Record<string, number> = { ArrowRight: mirror ? -1 : 1, ArrowLeft: mirror ? 1 : -1, ...(vertical ? { ArrowDown: 1, ArrowUp: -1 } : {}) };
    const step = steps[e.key];
    let i: number;
    if (step) i = active ? Math.min(n - 1, Math.max(0, active.i + step)) : step > 0 ? 0 : n - 1;
    else if (e.key === "Home") i = 0;
    else if (e.key === "End") i = n - 1;
    else if (e.key === "Escape" && active) i = -1;
    else return;
    e.preventDefault();
    setActive(i < 0 ? null : { i, key: true });
  };

  // Move (mouse, pen) and down (a tap on touch, which has no hover).
  const onPointer = (e: PointerEvent) => {
    const r = svg.current?.getBoundingClientRect();
    if (!r?.width) return;
    const i = hit(((e.clientX - r.left) * width) / r.width, ((e.clientY - r.top) * height) / r.height);
    // Same row: keep the same state, so a move inside a row does not render again.
    setActive((a) => (i === null ? null : a && a.i === i && !a.key ? a : { i, key: false }));
  };

  // The data can get shorter while a row is chosen.
  const cur = active && active.i < n ? { ...active, row: rows[active.i]! } : null;
  const look = (j: number) => (perRow && cur ? cur.i : j);

  return (
    <figure
      aria-label={title}
      tabIndex={n ? 0 : undefined}
      onKeyDown={n ? onKeyDown : undefined}
      onBlur={() => setActive(null)}
      className={cn("grid gap-3 rounded-field", className)}
    >
      {n === 0 ? (
        <div style={{ height }} className="grid place-items-center rounded-field border border-dashed border-line text-sm text-fg-3">
          {s.noResults}
        </div>
      ) : (
        <>
          <div
            ref={measure}
            className="relative"
            onPointerMove={onPointer}
            onPointerDown={onPointer}
            // A lifted finger also "leaves": keep the tapped values until the next tap or the focus goes.
            onPointerLeave={(e) => e.pointerType !== "touch" && setActive(null)}
          >
            {/* LTR inside the SVG so text-anchor means the same in both languages; positions are already mirrored. */}
            <div dir="ltr">
              <svg ref={svg} aria-hidden="true" width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="block overflow-visible">
                {children(cur?.i ?? null)}
              </svg>
            </div>
            {overlay && <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">{overlay}</div>}
            {cur && (
              <Tooltip at={anchors[cur.i]!} width={width} height={height}>
                <p className="font-medium text-fg">{cur.row.label}</p>
                {columns.slice(1).map((c, j) => (
                  <p key={j} className="flex items-center gap-2 text-fg-2">
                    <Swatch i={look(j)} color={colors[look(j)]} kind={kind} patterns={patterns} />
                    <span className="flex-1">{c}</span>
                    <span className="text-fg tabular-nums">{cur.row.values[j]}</span>
                  </p>
                ))}
              </Tooltip>
            )}
          </div>
          {legend}
          <LiveRegion>
            {cur?.key && (
              <>
                {cur.row.label}:{" "}
                {columns.slice(1).map((c, j) => (
                  <Fragment key={j}>
                    {j > 0 && ", "}
                    {c} {cur.row.values[j]}
                  </Fragment>
                ))}
              </>
            )}
          </LiveRegion>
          <table className="sr-only">
            <caption>{title}</caption>
            <thead>
              <tr>
                {columns.map((c, j) => (
                  <th key={j} scope="col">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <th scope="row">{r.label}</th>
                  {r.values.map((v, j) => (
                    <td key={j}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </figure>
  );
}

/** Beside the anchor, on the side with more room. Physical left/right: SVG coordinates are physical. */
function Tooltip({ at: [x, y], width, height, children }: { at: Point; width: number; height: number; children: ReactNode }) {
  const left = x > width / 2;
  const up = y > height / 2;
  return (
    <div
      data-tooltip=""
      aria-hidden="true"
      className="pointer-events-none absolute z-(--p-z-overlay) grid min-w-36 gap-1 rounded-field border border-line bg-surface-2 px-3 py-2 text-xs whitespace-nowrap shadow-overlay"
      style={{ left: left ? undefined : x + 12, right: left ? width - x + 12 : undefined, top: up ? undefined : y, bottom: up ? height - y : undefined }}
    >
      {children}
    </div>
  );
}
