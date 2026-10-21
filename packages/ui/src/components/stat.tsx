import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn } from "../lib/cn";
import { useStrings } from "../provider";
import { Surface } from "./layout";

export type StatChange = { value: string; direction: "up" | "down" | "flat"; tone?: "neutral" | "danger" };

const ICON = { up: ArrowUp, down: ArrowDown, flat: Minus } as const;

/**
 * A key number (KPI). The change arrow is neutral: `tone="danger"` only when the owner of the data
 * says the change is bad. `chart` is a slot, for example a Sparkline.
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
    <Surface className={cn("grid content-start gap-3 p-5", className)}>
      <div className="text-sm text-fg-3">{label}</div>
      <div className="flex items-end justify-between gap-4">
        <div className="grid gap-1.5">
          <div className="text-3xl font-semibold tabular-nums">{value}</div>
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
    </Surface>
  );
}
