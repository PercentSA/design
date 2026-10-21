"use client";

import { LOGO_STROKE, logoLayout, type LogoVersion } from "@percentsa/tokens";
import { cn } from "../lib/cn";
import { useStrings, useText } from "../provider";
import { FLAG_SA } from "./assets/flag-sa";
import { MARK_PATH, MARK_W, MARK_H } from "./brand-mark";

const STROKE = 6.63;

/** The flat % mark. The round-join stroke gives the logo's slightly soft corners. */
export function Mark({ className, label }: { className?: string; label?: string }) {
  const h = STROKE / 2;
  return (
    <svg
      viewBox={`${-h} ${-h} ${MARK_W + STROKE} ${MARK_H + STROKE}`}
      className={cn("block h-5 w-auto", className)}
      focusable="false"
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      <path d={MARK_PATH} fill="currentColor" stroke="currentColor" strokeWidth={STROKE} strokeLinejoin="round" />
    </svg>
  );
}

/** The logo in one of its 7 versions (geometry in @percentsa/tokens). Never mirrored in RTL. */
export function Logo({ version, className, label }: { version: LogoVersion; className?: string; label?: string }) {
  const { viewBox, parts } = logoLayout(version);
  return (
    <svg
      viewBox={viewBox.join(" ")}
      className={cn("block h-7 w-auto", className)}
      focusable="false"
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      <g fill="currentColor" stroke="currentColor" strokeWidth={LOGO_STROKE} strokeLinejoin="round">
        {parts.map((p, i) => (
          <path key={i} d={p.d} transform={p.transform} />
        ))}
      </g>
    </svg>
  );
}

export function MadeInKsa({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-fg-2", className)}>
      {useText()(useStrings().madeIn)}
      <img src={FLAG_SA} width="20" height="20" alt="" className="size-5" />
    </span>
  );
}
