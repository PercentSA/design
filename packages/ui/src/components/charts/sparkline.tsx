import { cn } from "../../lib/cn";
import { useDir } from "../../provider";
import { extent, linearScale, linePath } from "./scale";

const W = 100;

/**
 * A small line without axes (KPI cards). Decorative and hidden from screen readers unless it has a `title`.
 * It stretches to the width of its box; the line keeps its thickness. Colour: currentColor (default the brand's chart-1, else fg-2).
 */
export function Sparkline({ values, title, height = 32, mirror, className }: { values: number[]; title?: string; height?: number; mirror?: boolean; className?: string }) {
  const rtl = useDir() === "rtl";
  const [min, max] = extent(values);
  const x = linearScale([0, Math.max(1, values.length - 1)], (mirror ?? rtl) ? [W, 0] : [0, W]);
  const y = linearScale(min === max ? [min - 1, max + 1] : [min, max], [height - 2, 2]);
  return (
    <svg
      viewBox={`0 0 ${W} ${height}`}
      preserveAspectRatio="none"
      width="100%"
      height={height}
      className={cn("block overflow-visible text-[color:var(--p-chart-1,var(--p-fg-2))]", className)}
      {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true })}
    >
      <path
        // One value has no line: a zero-length segment with round caps draws a dot (not stretched, thanks to the non-scaling stroke).
        d={values.length === 1 ? `M${x(0)},${y(values[0]!)}h0` : linePath(values.map((v, i) => [x(i), y(v)]))}
        fill="none"
        stroke="currentColor"
        strokeWidth={values.length === 1 ? 4 : 1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
