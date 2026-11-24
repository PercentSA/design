"use client";

import { useState } from "react";
import { cn } from "../lib/cn";
import { useAgoForm, useHourCycle, useLang, useStrings } from "../provider";
import { dateTimeAttribute, formatDateTime, formatRelative, type AgoForm, type DateInput, type HourCycle } from "../saudi/date-time";
import { Tooltip } from "./overlays";

/**
 * A date or time in the short form (or "5 minutes ago" with `ago`), with the exact value on hover, focus or tap.
 * `interactive={false}` inside a clickable parent: no tab stop, the exact value is the `title`.
 * `kind="date"` for calendar days. `kind="time"` shows the clock only ("3:45 PM"), for lists grouped by day; the tooltip has the full date and time. With `ago`, `kind="time"` is ignored: the `ago` form wins. `now` fixes the clock (tests, stable snapshots).
 * `inSentence` writes "today", "yesterday" and "tomorrow" in lower case, for a time inside a sentence; no effect with `ago`.
 * `hourCycle="h23"` shows 15:05, not 3:05 PM; `agoForm="short"` shows "5 min ago". Both default to the PercentProvider setting.
 */
export function TimeText({
  value,
  kind,
  ago = false,
  interactive = true,
  now,
  hourCycle,
  agoForm,
  inSentence = false,
  className,
}: {
  value: DateInput;
  kind?: "instant" | "date" | "time";
  ago?: boolean;
  interactive?: boolean;
  now?: Date;
  hourCycle?: HourCycle;
  agoForm?: AgoForm;
  inSentence?: boolean;
  className?: string;
}) {
  const lang = useLang();
  const strings = useStrings();
  const providerCycle = useHourCycle();
  const providerForm = useAgoForm();
  const cycle = hourCycle ?? providerCycle;
  const form = agoForm ?? providerForm;
  const [open, setOpen] = useState(false);
  const text = ago ? formatRelative(value, { lang, now, form }) : formatDateTime(value, { lang, kind, now, strings, hourCycle: cycle, inSentence });
  if (!text) return null;
  const full = formatDateTime(value, { lang, kind, style: "full", strings, hourCycle: cycle });
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
