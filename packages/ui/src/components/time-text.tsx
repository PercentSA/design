"use client";

import { useState } from "react";
import { cn } from "../lib/cn";
import { useLang, useStrings } from "../provider";
import { dateTimeAttribute, formatDateTime, formatRelative, type DateInput } from "../saudi/date-time";
import { Tooltip } from "./overlays";

/**
 * A date or time in the short form (or "5 minutes ago" with `ago`), with the exact value on hover, focus or tap.
 * `interactive={false}` inside a clickable parent: no tab stop, the exact value is the `title`.
 * `kind="date"` for calendar days. `now` fixes the clock (tests, stable snapshots).
 */
export function TimeText({
  value,
  kind,
  ago = false,
  interactive = true,
  now,
  className,
}: {
  value: DateInput;
  kind?: "instant" | "date";
  ago?: boolean;
  interactive?: boolean;
  now?: Date;
  className?: string;
}) {
  const lang = useLang();
  const strings = useStrings();
  const [open, setOpen] = useState(false);
  const text = ago ? formatRelative(value, { lang, now }) : formatDateTime(value, { lang, kind, now, strings });
  if (!text) return null;
  const full = formatDateTime(value, { lang, kind, style: "full", strings });
  // "Today" and "5 minutes ago" can differ between the server render and the browser.
  const props = { dateTime: dateTimeAttribute(value, kind), suppressHydrationWarning: true, className: cn("whitespace-nowrap", className) };
  if (!interactive)
    return (
      <time {...props} title={full}>
        {text}
      </time>
    );
  return (
    <Tooltip content={full} open={open} onOpenChange={setOpen}>
      <time
        {...props}
        tabIndex={0}
        onClick={(e) => {
          // Radix closes a tooltip on click unless the event is prevented; a tap is the only way to open it on a phone.
          e.preventDefault();
          setOpen(true);
        }}
      >
        {text}
      </time>
    </Tooltip>
  );
}
