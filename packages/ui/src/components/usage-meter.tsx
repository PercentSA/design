"use client";

import { useId, type ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import { cn } from "../lib/cn";
import { useStrings } from "../provider";
import { TimeText } from "./time-text";

export type UsagePart = { label: ReactNode; value: number; tone: "used" | "held" };

export type UsageMeterProps = {
  label: ReactNode;
  /** `null` (or NaN, Infinity): no data. With `parts`, the value is their sum. */
  value: number | null;
  max?: number;
  parts?: UsagePart[];
  limit?: { value: number; label?: ReactNode };
  /** Default: the percent of `max`, for example "42 %" (Western digits in both languages). */
  format?: (n: number) => string;
  /** When the value was read. */
  at?: Date;
  /** The value is old: the bar is muted and the data line warns. */
  stale?: boolean;
  hint?: ReactNode;
  className?: string;
};

const pct = (n: number, max: number) => Math.min(100, Math.max(0, (n / max) * 100));
// Diagonal stripes over a light fill: the held part differs by pattern, not only by color.
const STRIPES = { backgroundImage: "repeating-linear-gradient(135deg, var(--color-primary) 0 2px, transparent 2px 5px)" };

/** How much of a limit is in use: a bar with an optional limit line, stacked used and held parts, and an old-data state. */
export function UsageMeter({ label, value, max = 100, parts, limit, format, at, stale, hint, className }: UsageMeterProps) {
  const s = useStrings();
  const id = useId();
  const fmt = format ?? ((n: number) => `${Math.round((n / max) * 100)} %`);
  const total = parts ? parts.reduce((sum, p) => sum + p.value, 0) : value;
  const hasData = total !== null && Number.isFinite(total);
  const over = hasData && !!limit && total > limit.value;
  // Each segment is cut so that the segments together never pass the track.
  let room = 100;
  const segments = !hasData
    ? []
    : (parts ?? [{ label, value: total, tone: "used" as const }]).map((p) => {
        const w = Math.min(room, pct(p.value, max));
        room -= w;
        return { ...p, w };
      });
  return (
    <div className={cn("grid gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span id={id} className="text-fg-3">{label}</span>
        <span data-value className={cn("inline-flex items-center gap-1 font-medium tabular-nums", over ? "text-warning" : "text-fg")}>
          {over && (
            <span data-over className="inline-flex items-center gap-1 text-xs">
              <TriangleAlert aria-hidden className="size-3.5" />
              {s.aboveLimit}
            </span>
          )}
          {hasData ? <span dir="ltr">{fmt(total)}</span> : <span className="text-fg-3">{s.noData}</span>}
        </span>
      </div>
      <div
        data-track
        role="meter"
        aria-labelledby={id}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={hasData ? Math.min(total, max) : undefined}
        aria-valuetext={hasData ? fmt(total) : s.noData}
        className={cn("relative h-2 rounded-pill bg-fg/10", stale && "opacity-50")}
      >
        <div className="flex h-full overflow-hidden rounded-pill">
          {segments.map((p, i) => (
            <div
              key={i}
              data-fill
              style={{ inlineSize: `${p.w}%`, ...(p.tone === "held" ? STRIPES : null) }}
              className={cn("h-full", p.tone === "held" ? "bg-primary/40" : over ? "bg-warning" : "bg-primary")}
            />
          ))}
        </div>
        {limit && (
          <span data-limit aria-hidden style={{ insetInlineStart: `${pct(limit.value, max)}%` }} className="absolute -top-1 -bottom-1 w-0.5 bg-fg" />
        )}
      </div>
      {(limit?.label || parts) && (
        <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-fg-3">
          {parts?.map((p, i) => (
            <li key={i} className="inline-flex items-center gap-1.5">
              <span aria-hidden style={p.tone === "held" ? STRIPES : undefined} className={cn("size-2 rounded-sm", p.tone === "held" ? "bg-primary/40" : "bg-primary")} />
              {p.label} <span dir="ltr" className="tabular-nums">{fmt(p.value)}</span>
            </li>
          ))}
          {limit?.label && (
            <li className="inline-flex items-center gap-1.5">
              <span aria-hidden className="h-3 w-0.5 bg-fg" />
              {limit.label}
            </li>
          )}
        </ul>
      )}
      {(at || stale) && (
        <p data-line className={cn("text-xs", stale ? "text-warning" : "text-fg-3")}>
          {stale ? s.fromLastReport : s.updated}
          {at && <> <TimeText value={at} ago /></>}
        </p>
      )}
      {hint && <p className="text-xs text-fg-3">{hint}</p>}
    </div>
  );
}
