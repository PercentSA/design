"use client";

import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn } from "../lib/cn";
import { useStrings } from "../provider";
import { Surface } from "./layout";

export type StatChange = { value: string; direction: "up" | "down" | "flat"; tone?: "neutral" | "danger" };

const ICON = { up: ArrowUp, down: ArrowDown, flat: Minus } as const;

/**
 * A key number (KPI). The change arrow is neutral: `tone="danger"` only when the owner of the data
 * says the change is bad. `chart` is a slot, for example a Sparkline. The tile is a container: the value size and the
 * padding follow the tile width (from 15rem `text-3xl`, from 12rem `text-2xl`, from 10rem `text-xl`, below `text-lg`),
 * so an amount fits a narrow tile in a row of tiles. The tile takes its width from its parent (a grid cell, `flex-1` or a
 * width); in a parent that sizes to its content it is 9rem wide (`min-w-36`).
 */
export function Stat({
  label,
  value,
  change,
  hint,
  chart,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  change?: StatChange;
  hint?: ReactNode;
  chart?: ReactNode;
  className?: string;
}) {
  const s = useStrings();
  const Icon = change && ICON[change.direction];
  const spoken = change && { up: s.increase, down: s.decrease, flat: s.noChange }[change.direction];
  return (
    // The container is the tile; the sizes are on its children (a container variant does not apply to the container itself).
    <Surface className={cn("@container min-w-36", className)}>
      <div className="grid content-start gap-3 p-4 @[15rem]:p-5">
      <div className="text-sm text-fg-3">{label}</div>
      <div className="flex items-end justify-between gap-4">
        <div className="grid gap-1.5">
          <div className="text-lg font-semibold tabular-nums @[10rem]:text-xl @[12rem]:text-2xl @[15rem]:text-3xl">{value}</div>
          {change && Icon && (
            <div className={cn("inline-flex items-center gap-1 text-sm", change.tone === "danger" ? "text-danger" : "text-fg-2")}>
              <Icon aria-hidden className="size-3.5 shrink-0" />
              <span className="sr-only">{spoken} </span>
              {/* The sign stays before the number in Arabic too. */}
              <span dir="ltr" className="tabular-nums">{change.value}</span>
            </div>
          )}
        </div>
        {chart && <div className="w-24 shrink-0 text-fg-2">{chart}</div>}
      </div>
      {hint && <div className="text-xs text-fg-3">{hint}</div>}
      </div>
    </Surface>
  );
}
