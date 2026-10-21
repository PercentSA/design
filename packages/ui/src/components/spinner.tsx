"use client";

import { cn } from "../lib/cn";
import { useBrand, useStrings } from "../provider";
import { MARK_H, MARK_PATH, MARK_STROKE, MARK_W } from "./brand-mark";

// The three parts of the % mark light up in reading order: square, slash, square.
const [TL, BR, SLASH] = MARK_PATH.split(/ (?=M)/);
const PARTS = [TL!, SLASH!, BR!];

/**
 * Loading indicator drawn from the % mark. With a provider `brand`: the brand's `spinner`, else a plain ring.
 * `decorative` hides it when a parent already says it is busy.
 */
export function Spinner({ className, label, decorative }: { className?: string; label?: string; decorative?: boolean }) {
  const s = useStrings();
  const brand = useBrand();
  const svg = brand?.spinner ? (
    <span aria-hidden="true" className={cn("inline-flex", className)}>
      {brand.spinner}
    </span>
  ) : brand ? (
    <svg viewBox="0 0 24 24" className={cn("p-spinner-ring h-5 w-auto", className)} aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.2" />
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" pathLength="100" strokeDasharray="25 100" />
    </svg>
  ) : (
    <svg viewBox={`${-MARK_STROKE / 2} ${-MARK_STROKE / 2} ${MARK_W + MARK_STROKE} ${MARK_H + MARK_STROKE}`} className={cn("p-spinner h-5 w-auto", className)} aria-hidden="true" focusable="false">
      {PARTS.map((d) => (
        <path key={d} d={d} fill="currentColor" stroke="currentColor" strokeWidth={MARK_STROKE} strokeLinejoin="round" />
      ))}
    </svg>
  );
  if (decorative) return svg;
  return (
    <span role="status" className="inline-flex">
      {svg}
      <span className="sr-only">{label ?? s.loading}</span>
    </span>
  );
}
