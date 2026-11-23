"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../lib/cn";
import { useStrings } from "../provider";

type Status = "done" | "current" | "next" | "running" | "failed" | "warning" | "skipped" | "waiting";

export type TimelineItem = {
  id: string;
  time?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  status?: Status;
  /** Shown at the end of the title row, for example how long a step took. */
  duration?: ReactNode;
  /** Opens with a button below the title. */
  detail?: ReactNode;
  /** Start state of the detail. When not given, a failed step starts open. */
  open?: boolean;
};

const DOT = {
  done: "bg-primary",
  current: "bg-primary ring-4 ring-line-strong",
  next: "border border-line-strong",
  waiting: "border border-line-strong",
  running: "bg-primary motion-safe:animate-pulse",
  failed: "bg-danger",
  warning: "bg-warning",
  skipped: "border border-dashed border-line-strong",
  none: "bg-fg-3",
} as const;

// "current" and "next" have no status word, as in 0.22.0.
const WORD = {
  done: "stepDone",
  running: "stepRunning",
  failed: "stepFailed",
  warning: "stepWarning",
  skipped: "stepSkipped",
  waiting: "stepWaiting",
} as const;

const reached = (item?: TimelineItem) => !!item?.status && ["done", "current", "running", "failed", "warning"].includes(item.status);

/** Steps or events in order (an order's progress, a job's steps). Vertical, with the line on the start side. */
export function Timeline({ items, onSelect, className }: { items: TimelineItem[]; onSelect?: (id: string) => void; className?: string }) {
  return (
    <ol className={cn("grid", className)}>
      {items.map((item, i) => (
        <Step key={item.id} item={item} last={i === items.length - 1} next={items[i + 1]} onSelect={onSelect} />
      ))}
    </ol>
  );
}

function Step({ item, next, last, onSelect }: { item: TimelineItem; next?: TimelineItem; last: boolean; onSelect?: (id: string) => void }) {
  const s = useStrings();
  const id = useId();
  const [open, setOpen] = useState(item.open ?? item.status === "failed");
  const status = item.status;
  const word = status && status in WORD ? s[WORD[status as keyof typeof WORD]] : undefined;
  const titleClass = cn("text-sm font-medium", status === "next" || status === "skipped" ? "text-fg-3" : "text-fg");
  return (
    <li data-status={status} aria-current={status === "current" ? "step" : undefined} className="grid grid-cols-[0.75rem_1fr] gap-x-4">
      <span aria-hidden="true" className="flex flex-col items-center">
        <span className={cn("mt-1.5 size-3 shrink-0 rounded-pill", DOT[status ?? "none"])} />
        {!last && <span className={cn("my-1.5 w-px flex-1", reached(next) ? "bg-primary" : "bg-line-strong")} />}
      </span>
      <div className={cn("grid gap-0.5", !last && "pb-8")}>
        {item.time != null && <span className="text-xs text-fg-3 tabular-nums">{item.time}</span>}
        <div className="flex items-baseline justify-between gap-4">
          {onSelect ? (
            <button type="button" onClick={() => onSelect(item.id)} className={cn(titleClass, "text-start hover:underline")}>
              {item.title}
            </button>
          ) : (
            <span className={titleClass}>{item.title}</span>
          )}
          {item.duration != null && <span className="shrink-0 text-xs text-fg-3 tabular-nums">{item.duration}</span>}
        </div>
        {word && <span className="sr-only">{word}</span>}
        {item.description && <span className="text-sm text-fg-2">{item.description}</span>}
        {item.detail != null && (
          <>
            <button
              type="button"
              aria-expanded={open}
              aria-controls={id}
              onClick={() => setOpen(!open)}
              className="inline-flex min-h-6 items-center gap-1 justify-self-start text-xs text-fg-2 hover:text-fg"
            >
              <ChevronDown aria-hidden className={cn("size-3.5 transition-transform motion-reduce:transition-none", open && "rotate-180")} />
              {open ? s.hideDetails : s.showDetails}
            </button>
            {open && (
              <div id={id} className="text-sm text-fg-2">
                {item.detail}
              </div>
            )}
          </>
        )}
      </div>
    </li>
  );
}
