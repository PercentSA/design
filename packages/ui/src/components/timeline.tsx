import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export type TimelineItem = {
  id: string;
  time: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  status?: "done" | "current" | "next";
};

const DOT = {
  done: "bg-primary",
  current: "bg-primary ring-4 ring-line-strong",
  next: "border border-line-strong",
  none: "bg-fg-3",
} as const;

const reached = (item?: TimelineItem) => item?.status === "done" || item?.status === "current";

/** Events in order (an order's progress, an activity log). Vertical, with the line on the start side. */
export function Timeline({ items, className }: { items: TimelineItem[]; className?: string }) {
  return (
    <ol className={cn("grid", className)}>
      {items.map((item, i) => {
        const next = items[i + 1];
        return (
          <li
            key={item.id}
            data-status={item.status}
            aria-current={item.status === "current" ? "step" : undefined}
            className="grid grid-cols-[0.75rem_1fr] gap-x-4"
          >
            <span aria-hidden="true" className="flex flex-col items-center">
              <span className={cn("mt-1.5 size-3 shrink-0 rounded-pill", DOT[item.status ?? "none"])} />
              {next && <span className={cn("my-1.5 w-px flex-1", reached(next) ? "bg-primary" : "bg-line-strong")} />}
            </span>
            <div className={cn("grid gap-0.5", next && "pb-8")}>
              <span className="text-xs text-fg-3 tabular-nums">{item.time}</span>
              <span className={cn("text-sm font-medium", item.status === "next" ? "text-fg-3" : "text-fg")}>{item.title}</span>
              {item.description && <span className="text-sm text-fg-2">{item.description}</span>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
