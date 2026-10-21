import { Axes, cartesian } from "./cartesian";
import { ChartFrame, useChart, useChartWidth, type ChartProps } from "./chart-frame";
import { ChartLegend, lookOf, useFill } from "./legend";
import { extent, stack, type Point } from "./scale";

/** Bars per x value: `vertical` columns or `horizontal` rows, grouped or `stacked`. Series after the first are hatched. */
export function BarChart({
  layout = "vertical",
  stacked,
  height = 240,
  ...props
}: ChartProps & { layout?: "vertical" | "horizontal"; stacked?: boolean }) {
  const c = useChart(props);
  const [ref, width] = useChartWidth();
  const swap = layout === "horizontal";
  const spans = stacked ? stack(c.values) : c.values.map((vs) => vs.map((v): Point | null => (v === null ? null : [0, v])));
  const [min, max] = extent(spans.flat(2));
  const L = cartesian({ width, height, labels: c.labels, min, max, format: c.fmt, mirror: c.mirror, swap });
  const { defs, fill } = useFill(props.series.map((s, i) => lookOf(i, s.color, props.patterns)));
  const per = stacked ? 1 : Math.max(1, props.series.length);
  const size = L.band.width / per;
  const step = Math.abs(L.band.step);

  // Bar j of row i; grouped bars sit side by side in series order from the start side.
  const rect = (i: number, j: number, [a, b]: Point) => {
    const mid = L.band.center(i) + (stacked ? 0 : (j - (per - 1) / 2) * size * Math.sign(L.band.step));
    const [v0, v1] = [L.value(a), L.value(b)];
    const along = { pos: mid - size / 2 + (per > 1 ? 1 : 0), len: size - (per > 1 ? 2 : 0) };
    const across = { pos: Math.min(v0, v1), len: Math.abs(v1 - v0) };
    return swap ? { x: across.pos, width: across.len, y: along.pos, height: along.len } : { x: along.pos, width: along.len, y: across.pos, height: across.len };
  };

  // Built here, not in the render function below: a pointer move then does not render every bar again.
  const bars = <g data-draw="">{spans.map((sp, j) => sp.map((p, i) => p && <rect key={`${j}-${i}`} data-bar="" {...rect(i, j, p)} fill={fill(j)} />))}</g>;

  return (
    <ChartFrame
      title={props.title}
      width={width}
      height={height}
      measure={ref}
      columns={c.columns}
      rows={c.rows}
      kind="fill"
      colors={props.series.map((s) => s.color)}
      patterns={props.patterns}
      anchors={c.labels.map((_, i) => L.anchor(i, spans.flatMap((sp) => (sp[i] ? [L.value(sp[i][1])] : []))))}
      hit={L.hit}
      mirror={c.mirror}
      vertical={swap}
      legend={props.series.length > 1 && <ChartLegend items={props.series} kind="fill" patterns={props.patterns} />}
      className={props.className}
    >
      {(active) => (
        <>
          {defs}
          {active !== null &&
            (swap ? (
              <rect x={L.box.left} width={L.box.right - L.box.left} y={L.band.center(active) - step / 2} height={step} className="fill-surface-2" />
            ) : (
              <rect x={L.band.center(active) - step / 2} width={step} y={L.box.top} height={L.box.bottom - L.box.top} className="fill-surface-2" />
            ))}
          <Axes c={L} />
          {bars}
        </>
      )}
    </ChartFrame>
  );
}
