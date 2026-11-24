"use client";

import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { useLinkComponent, useStrings } from "../provider";
import { Skeleton, StatusDot, type StatusDotStatus } from "./feedback";
import { Surface } from "./layout";
import { isEmptyValue, NotSet } from "./not-set";

export type RecordSummaryItem = {
  id: string;
  label: ReactNode;
  /** null or "" shows the "Not set" word. */
  value?: ReactNode;
  /** A dot and a word at value size, for a state (Live, Down). It wins over `value`. */
  status?: { tone: StatusDotStatus; label: ReactNode };
  hint?: ReactNode;
  /** The value is a link (customer, supplier, parent document). */
  href?: string;
  /** Show the whole value, not cut at 2 lines (a state sentence a person must read on a phone). */
  wrap?: boolean;
};

// Cells per row by the width of the strip itself (container queries, not the screen): 2 below 36rem (1 for a single
// cell), 3 from 36rem (all when 4 or fewer), all in one row from 56rem. Full class names, so Tailwind finds them.
const BASE = ["grid-cols-1", "grid-cols-1", "grid-cols-2", "grid-cols-2", "grid-cols-2", "grid-cols-2", "grid-cols-2"] as const;
const MID = ["", "@xl:grid-cols-1", "@xl:grid-cols-2", "@xl:grid-cols-3", "@xl:grid-cols-4", "@xl:grid-cols-3", "@xl:grid-cols-3"] as const;
const WIDE = ["", "@4xl:grid-cols-1", "@4xl:grid-cols-2", "@4xl:grid-cols-3", "@4xl:grid-cols-4", "@4xl:grid-cols-5", "@4xl:grid-cols-6"] as const;

// The bundler of the app replaces process.env.NODE_ENV; the package has no Node types.
declare const process: { env: { NODE_ENV?: string } } | undefined;

// 2 lines, then cut. On an inner element, so the focus ring of a link around it is not clipped.
const CLAMP = "line-clamp-2 break-words";


/**
 * The key facts of a record in one dense strip, for example under a record's header: 1 to 6 items (label, value, hint).
 * `media` sits at the start (a Thumbnail), above the cells on narrow strips. Long text is cut at 2 lines with the full
 * text in `title`, unless the item has `wrap`. `loading` shows a skeleton in place of each value.
 */
export function RecordSummary({
  items,
  media,
  loading,
  label,
  className,
}: {
  items: RecordSummaryItem[];
  media?: ReactNode;
  loading?: boolean;
  /** The accessible name of the strip. Default: "Summary". */
  label?: string;
  className?: string;
}) {
  const s = useStrings();
  const L = useLinkComponent();
  const n = Math.min(Math.max(items.length, 1), 6);
  if (items.length > 6 && typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
    console.warn(`RecordSummary: ${items.length} items. It is made for 1 to 6; use a RecordSection for more facts.`);
  }
  return (
    <Surface
      role="group"
      aria-label={label ?? s.recordSummary}
      aria-busy={loading || undefined}
      className={cn("@container overflow-hidden", className)}
    >
      {/* A container variant applies only inside the container: the row layout is on this child. */}
      <div className="flex flex-col @xl:flex-row">
      {media != null && <div className="flex items-center border-b border-line p-4 @xl:border-b-0 @xl:border-e">{media}</div>}
      {/* The trailing border of the last cells is pushed out of the Surface (-mb-px -me-px) and clipped. */}
      <dl className={cn("-mb-px -me-px grid min-w-0 flex-1", BASE[n], MID[n], WIDE[n])}>
        {items.map((item) => {
          const shown = item.status ? item.status.label : item.value;
          const clamp = item.wrap ? "break-words" : CLAMP;
          return (
          <div key={item.id} className="grid min-w-0 content-start gap-1 border-b border-e border-line px-4 py-3">
            <dt className="text-xs text-fg-3">{item.label}</dt>
            {loading ? (
              <dd>
                <Skeleton className="h-6 w-2/3" />
                <span className="sr-only">{s.loading}</span>
              </dd>
            ) : (
              <>
                <dd title={typeof shown === "string" && !item.wrap ? shown : undefined} className="min-w-0 text-lg font-semibold text-fg tabular-nums">
                  {item.status ? (
                    <StatusDot status={item.status.tone} className="text-lg font-semibold text-fg">
                      {item.href ? (
                        <L href={item.href} className="rounded-field underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-fg">
                          {item.status.label}
                        </L>
                      ) : (
                        item.status.label
                      )}
                    </StatusDot>
                  ) : isEmptyValue(item.value) ? (
                    <NotSet className="text-base font-normal" />
                  ) : item.href ? (
                    <L href={item.href} className="rounded-field underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-fg">
                      <bdi className={clamp}>{item.value}</bdi>
                    </L>
                  ) : (
                    <span className={clamp}>{item.value}</span>
                  )}
                </dd>
                {item.hint != null && <dd className="text-xs text-fg-3">{item.hint}</dd>}
              </>
            )}
          </div>
          );
        })}
      </dl>
      </div>
    </Surface>
  );
}
