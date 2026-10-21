import { useId, type ReactNode } from "react";
import { cn } from "../../lib/cn";

// Every grey has at least 3:1 on the page (WCAG 1.4.11); line-strong is too faint for data.
const GREYS = ["var(--p-fg)", "var(--p-fg-2)", "var(--p-fg-3)"];
const DASHES = [undefined, "6 4", "2 3", "10 3 2 3"];
const MARKERS = ["circle", "square", "triangle", "diamond"] as const;
// Five fills (solid, 45°, −45°, 0°, 90° hatch), index (i + ⌊i/5⌋) % 5; dash and marker index i % 4. Then 9 series differ
// with the 3 greys and 15 series with 5 brand colours (--p-chart-1…5), in fill and in dash + marker (tested).
const HATCH = [undefined, 45, -45, 0, 90];

export type Look = { color: string; dash?: string; marker: (typeof MARKERS)[number]; hatch?: number };

/**
 * How series `i` looks: the brand colour `--p-chart-(i % 5 + 1)` (default a grey) plus a dash pattern, marker shape and fill,
 * so colour is never the only difference. `patterns: false` drops dashes and hatches (markers stay).
 */
export const lookOf = (i: number, color?: string, patterns = true): Look => ({
  color: color ?? `var(--p-chart-${(i % 5) + 1}, ${GREYS[i % 3]})`,
  dash: patterns ? DASHES[i % 4] : undefined,
  marker: MARKERS[i % 4]!,
  hatch: patterns ? HATCH[(i + Math.floor(i / 5)) % 5] : undefined,
});

export function Marker({ look, x, y, size = 4 }: { look: Look; x: number; y: number; size?: number }) {
  const s = size;
  if (look.marker === "circle") return <circle cx={x} cy={y} r={s} fill={look.color} />;
  if (look.marker === "square") return <rect x={x - s} y={y - s} width={s * 2} height={s * 2} fill={look.color} />;
  const d = look.marker === "triangle" ? `M${x},${y - s * 1.2}L${x + s * 1.2},${y + s}L${x - s * 1.2},${y + s}Z` : `M${x},${y - s * 1.3}L${x + s * 1.3},${y}L${x},${y + s * 1.3}L${x - s * 1.3},${y}Z`;
  return <path d={d} fill={look.color} />;
}

/** SVG fill for a look: the colour, or a hatch pattern (put `defs` inside the same SVG). */
export function useFill(looks: Look[]) {
  const id = useId().replace(/[^\w-]/g, "");
  return {
    defs: (
      <defs>
        {looks.map(
          (l, i) =>
            l.hatch !== undefined && (
              <pattern key={i} id={`${id}-${i}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform={`rotate(${l.hatch})`}>
                <rect width="6" height="6" fill={l.color} opacity="0.3" />
                <rect width="3" height="6" fill={l.color} />
              </pattern>
            ),
        )}
      </defs>
    ),
    fill: (i: number) => (looks[i]!.hatch === undefined ? looks[i]!.color : `url(#${id}-${i})`),
  };
}

/** A small sample of a series: its line (dash + marker) or its fill. */
export function Swatch({ i, color, kind, patterns }: { i: number; color?: string; kind: "line" | "fill"; patterns?: boolean }) {
  const look = lookOf(i, color, patterns);
  const { defs, fill } = useFill([look]);
  return kind === "line" ? (
    <svg aria-hidden="true" width="20" height="10" className="shrink-0 overflow-visible">
      <line x1="0" y1="5" x2="20" y2="5" stroke={look.color} strokeWidth="2" strokeDasharray={look.dash} />
      <Marker look={look} x={10} y={5} size={3} />
    </svg>
  ) : (
    <svg aria-hidden="true" width="10" height="10" className="shrink-0">
      {defs}
      <rect width="10" height="10" rx="2" fill={fill(0)} />
    </svg>
  );
}

/** Names the series of a chart. Item `i` gets the look of series `i`; `value` adds a number after the name. */
export function ChartLegend({
  items,
  kind = "line",
  patterns,
  className,
}: {
  items: { label: ReactNode; value?: ReactNode; color?: string }[];
  kind?: "line" | "fill";
  /** false: no dashes or hatches (match the chart's `patterns`). */
  patterns?: boolean;
  className?: string;
}) {
  return (
    <ul className={cn("flex flex-wrap gap-x-4 gap-y-1 text-xs text-fg-2", className)}>
      {items.map((item, i) => (
        <li key={i} className="flex items-center gap-2">
          <Swatch i={i} color={item.color} kind={kind} patterns={patterns} />
          {item.label}
          {item.value !== undefined && <span className="text-fg tabular-nums">{item.value}</span>}
        </li>
      ))}
    </ul>
  );
}
