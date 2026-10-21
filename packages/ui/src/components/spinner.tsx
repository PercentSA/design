import { cn } from "../lib/cn";
import { useBrand, useStrings } from "../provider";
import { MARK_H, MARK_W } from "./brand";

// The three parts of the % mark light up in reading order: square, slash, square.
const PARTS = ["M0 0H70.8V70.8H0Z", "M160.3 0H228L70.3 221.2H2Z", "M159.2 150.4H230V221.2H159.2Z"];

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
    <svg viewBox={`-4 -4 ${MARK_W + 8} ${MARK_H + 8}`} className={cn("p-spinner h-5 w-auto", className)} aria-hidden="true" focusable="false">
      {PARTS.map((d) => (
        <path key={d} d={d} fill="currentColor" stroke="currentColor" strokeWidth={6.63} strokeLinejoin="round" />
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
