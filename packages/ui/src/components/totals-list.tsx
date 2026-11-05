import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { Money } from "../saudi/money";

export type TotalsItem = {
  label: ReactNode;
  /** Shown as given, with 2 decimals: a discount is a negative amount. */
  amount: number;
  /** The grand total: bold, with a line above. */
  total?: boolean;
  /** A small line under the label, for example the VAT rate. */
  hint?: ReactNode;
  /** A negative amount in brackets: "(1,234.50)". */
  accounting?: boolean;
};

/** Document totals: labels at the start, amounts at the end, aligned under each other. */
export function TotalsList({ items, className }: { items: TotalsItem[]; className?: string }) {
  return (
    // One grid for all rows (subgrid), so every amount ends on the same line.
    <dl className={cn("grid grid-cols-[minmax(0,1fr)_auto] gap-x-6 text-sm", className)}>
      {items.map((item, i) => (
        <div
          key={i}
          className={cn(
            "col-span-2 grid grid-cols-subgrid items-baseline py-1.5",
            item.total ? "mt-1.5 border-t border-line-strong pt-3 text-base font-semibold text-fg" : "text-fg-2",
          )}
        >
          <dt>
            {item.label}
            {item.hint != null && <span className="block text-xs font-normal text-fg-3">{item.hint}</span>}
          </dt>
          <dd className="text-end text-fg tabular-nums">
            <Money amount={item.amount} decimals={2} accounting={item.accounting} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
