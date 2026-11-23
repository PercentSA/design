"use client";

import { useMemo } from "react";
import { Axes, cartesian, isolate, strongDir } from "./cartesian";
import { ChartFrame, useChart, useChartWidth, type ChartLimit, type ChartProps } from "./chart-frame";
import { ChartLegend, lookOf, Marker } from "./legend";
import { areaPath, extent, linePath, runs, stack, type Point } from "./scale";

type Curve = "linear" | "monotone";
type PointProps = {
  /** A dashed line at a value, with its label. Values at 90 % of it or more show in the warning colour. */
  limit?: ChartLimit;
  /** A click, or Enter on the chosen point, gets its x label and row index. */
  onSelectPoint?: (x: string, index: number) => void;
};

/** Values over x as lines. Series differ by grey, dash pattern and marker shape. */
export const LineChart = (props: ChartProps & { curve?: Curve; markers?: boolean } & PointProps) => <PointChart {...props} />;

/** Values over x as filled areas, side by side or `stacked`. */
export const AreaChart = (props: ChartProps & { curve?: Curve; stacked?: boolean } & PointProps) => <PointChart {...props} area />;

function PointChart({ curve = "linear", markers, area, stacked, height = 240, limit, onSelectPoint, ...props }: ChartProps & PointProps & { curve?: Curve; markers?: boolean; area?: boolean; stacked?: boolean }) {
  const c = useChart(props);
  const [ref, width] = useChartWidth();
  const looks = props.series.map((s, i) => lookOf(i, s.color, props.patterns));
  // Not inside the render function below: a pointer move then renders only the hover line and markers.
  // `looks` needs no dependency: it comes from props.series, which `c` follows.
  const { L, tops, drawn } = useMemo(() => {
    const spans = stacked ? stack(c.values) : c.values.map((vs) => vs.map((v): Point | null => (v === null ? null : [0, v])));
    const [min, max] = extent([...spans.flat(2), ...(limit ? [limit.value] : [])]);
    const L = cartesian({ width, height, labels: c.labels, min, max, format: c.fmt, mirror: c.mirror });
    const at = (sp: (Point | null)[], end: 0 | 1) => sp.map((p, i): Point | null => p && [L.band.center(i), L.value(p[end])]);
    const tops = spans.map((sp) => at(sp, 1));
    const lines = tops.map(runs);
    const drawn = (
      <g data-draw="">
        {area &&
          spans.map((sp, j) => {
            const bottoms = at(sp, 0);
            const d = runs(tops[j]!.map((p, i) => p && ([p, bottoms[i]!] as const)))
              .map((run) => areaPath(run.map(([t]) => t), run.map(([, b]) => b), curve))
              .join("");
            return <path key={j} d={d} fill={looks[j]!.color} fillOpacity={0.12} />;
          })}
        {lines.map((parts, j) => (
          <path
            key={j}
            d={parts.map((part) => linePath(part, curve)).join("")}
            fill="none"
            stroke={looks[j]!.color}
            strokeWidth={2}
            strokeDasharray={looks[j]!.dash}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
        {/* A point alone (one row, or between missing values) has no line: it gets a marker. */}
        {lines.map((parts, j) =>
          (markers ? tops[j]!.flatMap((p) => (p ? [p] : [])) : parts.flatMap((part) => (part.length === 1 ? part : []))).map(([x, y]) => (
            <Marker key={`${j}-${x}`} look={looks[j]!} x={x} y={y} size={3} />
          )),
        )}
      </g>
    );
    return { L, tops, drawn };
  }, [c, width, height, stacked, area, curve, markers, props.patterns, limit?.value]);
  const limitY = limit ? L.value(limit.value) : 0;
  return (
    <ChartFrame
      title={props.title}
      width={width}
      height={height}
      measure={ref}
      columns={c.columns}
      rows={c.rows}
      kind="line"
      colors={props.series.map((s) => s.color)}
      patterns={props.patterns}
      anchors={c.labels.map((_, i) => L.anchor(i, tops.flatMap((t) => (t[i] ? [t[i][1]] : []))))}
      hit={L.hit}
      onSelect={onSelectPoint && ((i) => onSelectPoint(c.labels[i]!, i))}
      warn={limit && ((i, j) => (c.values[j]![i] ?? -Infinity) >= limit.value * 0.9)}
      note={limit && <p>{limit.label}</p>}
      mirror={c.mirror}
      legend={props.series.length > 1 && <ChartLegend items={props.series} patterns={props.patterns} />}
      className={props.className}
    >
      {(active) => (
        <>
          <Axes c={L} />
          {limit && (
            <>
              <line x1={L.box.left} x2={L.box.right} y1={limitY} y2={limitY} className="stroke-fg-3" strokeDasharray="4 4" />
              {/* Under the line when there is no room above it (the limit is the top tick). */}
              <text
                x={c.mirror ? L.box.left + 4 : L.box.right - 4}
                y={limitY - 4 < 12 ? limitY + 4 : limitY - 4}
                dominantBaseline={limitY - 4 < 12 ? "hanging" : undefined}
                textAnchor={c.mirror ? "start" : "end"}
                strokeWidth={3}
                strokeLinejoin="round"
                // The label keeps its own word order; its direction is the one of its first strong letter.
                style={{ unicodeBidi: "plaintext", direction: strongDir(limit.label) }}
                // A halo in the surface colour keeps the label readable over the data line.
                className="fill-fg-2 stroke-[color:var(--p-chart-surface,var(--p-bg))] text-xs [paint-order:stroke]"
              >
                {isolate(limit.label)}
              </text>
            </>
          )}
          {active !== null && <line x1={L.band.center(active)} x2={L.band.center(active)} y1={L.box.top} y2={L.box.bottom} className="stroke-line-strong" />}
          {drawn}
          {active !== null && tops.map((t, j) => t[active] && <Marker key={j} look={looks[j]!} x={t[active][0]} y={t[active][1]} size={4.5} />)}
        </>
      )}
    </ChartFrame>
  );
}
