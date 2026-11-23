"use client";

import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "../lib/cn";
import { useStrings } from "../provider";
import { isEmptyValue, NotSet } from "./not-set";

export type ChangeItem = { label: ReactNode; before: ReactNode; after: ReactNode; group?: string; hidden?: boolean };

const textOf = (n: ReactNode) => (typeof n === "string" || typeof n === "number" ? String(n) : null);

/**
 * The values before and after a change, one row per item. `group` gives a heading above its items, in the order of the first
 * item of each group. A `hidden` item (a secret) shows only that it changed; its values are not rendered. `compact` shows one
 * line with the count and the labels, for a form bar. On a phone the two values stack under the label.
 */
export function ChangeList({ items, compact, note, className }: { items: ChangeItem[]; compact?: boolean; note?: ReactNode; className?: string }) {
  const s = useStrings();

  if (compact) {
    const labels = items.map((i) => textOf(i.label) ?? i.label);
    return (
      <span className={cn("block min-w-0 truncate", className)}>
        {s.changeCount(items.length)}:{" "}
        {labels.map((l, i) => (
          <span key={i}>
            {i > 0 && ", "}
            {l}
          </span>
        ))}
      </span>
    );
  }

  const groups: { name?: string; items: ChangeItem[] }[] = [];
  for (const it of items) {
    let g = groups.find((x) => x.name === it.group);
    if (!g) groups.push((g = { name: it.group, items: [] }));
    g.items.push(it);
  }

  const value = (v: ReactNode) => (isEmptyValue(v) ? <NotSet /> : v);

  return (
    <div className={cn("grid gap-4 text-sm", className)}>
      {groups.map((g, gi) => (
        <section key={gi} className="grid gap-1">
          {g.name != null && (
            <h3 data-group className="text-xs font-medium text-fg-2">
              {g.name}
            </h3>
          )}
          <ul className="grid divide-y divide-line">
            {g.items.map((it, i) => (
              <li key={i} data-change className="flex items-baseline gap-4 py-2 max-md:grid max-md:gap-1">
                <span className="w-48 shrink-0 font-medium text-fg max-md:w-auto">{it.label}</span>
                {it.hidden ? (
                  <span className="text-fg-3">{s.changeHidden}</span>
                ) : (
                  <span className="flex min-w-0 flex-wrap items-center gap-2 break-words">
                    <span data-before className="text-fg-3">
                      <span className="sr-only">{s.changeFrom}</span>
                      {value(it.before)}
                    </span>
                    <ArrowRight aria-hidden className="size-4 shrink-0 text-fg-3 rtl:-scale-x-100" />
                    <span data-after className="text-fg">
                      <span className="sr-only">{s.changeTo}</span>
                      {value(it.after)}
                    </span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
      {note != null && note !== false && (
        <p data-note className="text-fg-2">
          {note}
        </p>
      )}
    </div>
  );
}
