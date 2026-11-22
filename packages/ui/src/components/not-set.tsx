"use client";

import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { useStrings } from "../provider";

/** One rule for an empty value: null, undefined or "". */
export const isEmptyValue = (v: ReactNode) => v == null || v === "";

/** The "Not set" text of an empty value. */
export function NotSet({ className }: { className?: string }) {
  const s = useStrings();
  return <span className={cn("text-fg-3", className)}>{s.notSet}</span>;
}
