import type { ReactNode } from "react";
import { cn } from "../lib/cn";

/**
 * The action bar at the end of a form page or a long sheet form: a short live summary at the start (a total, a count; read
 * politely by screen readers) and the buttons at the end, secondary first and the submit last. From 640 px one row; below it the
 * summary has its own line and the buttons share the row equally. `sticky` keeps it at the bottom of the scroll area. Put a
 * value in `<b>` to give it medium weight. In a Sheet give it `className="-mx-6 -mb-6 px-6"` to meet the sheet's edges.
 */
export function FormBar({ summary, children, sticky = true, className }: { summary?: ReactNode; children: ReactNode; sticky?: boolean; className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 border-t border-line bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-end",
        sticky && "sticky bottom-0 z-(--p-z-sticky)",
        className,
      )}
    >
      {summary != null && summary !== false && (
        <div role="status" className="min-w-0 text-sm text-fg-2 sm:flex-1 [&_b]:font-medium [&_b]:text-fg [&_strong]:font-medium [&_strong]:text-fg">
          {summary}
        </div>
      )}
      <div className="flex gap-2 max-sm:*:flex-1 sm:justify-end">{children}</div>
    </div>
  );
}
