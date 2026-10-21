"use client";

import { cn } from "../lib/cn";
import { useStrings } from "../provider";
import { RIYAL_VIEWBOX, RIYAL_PATHS, formatMoney } from "./money-format";

/** SAMA rules: left of the number with a space, as tall as the digits next to it. */
export function RiyalSign({ className, label }: { className?: string; label?: string }) {
  return (
    <svg
      viewBox={RIYAL_VIEWBOX}
      className={cn("inline-block h-[0.72em] w-auto align-baseline", className)}
      fill="currentColor"
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      {RIYAL_PATHS.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

/** Riyal sign + amount. Always sign-left, also in Arabic text. */
export function Money({ amount, decimals, className }: { amount: number; decimals?: 0 | 2; className?: string }) {
  return (
    <span dir="ltr" className={cn("inline-flex items-baseline gap-[0.25em] whitespace-nowrap tabular-nums", className)}>
      <RiyalSign label={useStrings().riyal} />
      {formatMoney(amount, { decimals })}
    </span>
  );
}
