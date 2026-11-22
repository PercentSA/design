"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../lib/cn";

/** A long text cut at `lines` lines. A click, tap, Enter or Space opens the full text and `details`. A text that fits stays plain text. */
export function ExpandableText({ text, lines = 1, details, className }: { text: string; lines?: number; details?: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  const [fits, setFits] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || open) return;
    const measure = () => setFits(el.scrollHeight <= el.clientHeight + 1);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, text, lines]);

  const clamp = open ? undefined : ({ display: "-webkit-box", WebkitLineClamp: lines, WebkitBoxOrient: "vertical", overflow: "hidden" } as const);
  const body = (
    <span ref={ref} className={cn("min-w-0", open && "whitespace-pre-wrap break-words")} style={clamp}>
      {text}
    </span>
  );
  if (fits && !details && !open) return <span className={cn("inline-block max-w-full", className)}>{body}</span>;
  return (
    <>
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className={cn("flex w-full min-w-0 items-start gap-2 rounded-sm text-start", className)}>
        {body}
        <ChevronDown aria-hidden className={cn("mt-0.5 size-4 shrink-0 text-fg-3 transition-transform", open && "rotate-180")} />
      </button>
      {open && details}
    </>
  );
}
