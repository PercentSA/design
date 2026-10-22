"use client";

import { useState, useSyncExternalStore } from "react";
import { cn } from "../lib/cn";
import { useLang, useStrings, useText } from "../provider";
import { todayPlain, viewLabel, type PlainDate } from "../saudi/calendar";
import { periodOf, periodOptions, type Period, type PeriodKind } from "../saudi/period";
import { SegmentedControl } from "./actions";
import { DateRangePicker } from "./calendar";
import { Select } from "./inputs";

const KINDS: PeriodKind[] = ["month", "quarter", "year", "custom"];
const noSubscribe = () => () => {};

/**
 * A report period: a month, quarter or year from a list (newest first), or a custom date range. Gregorian.
 * A kind switch keeps the end of the current period. A cleared custom range goes back to this month.
 */
export function PeriodPicker({
  value,
  onValueChange,
  kinds = KINDS,
  today: todayProp,
  className,
}: {
  value: Period;
  onValueChange: (period: Period) => void;
  kinds?: PeriodKind[];
  /** The day the lists end on (default: today in Riyadh). */
  today?: PlainDate;
  className?: string;
}) {
  const s = useStrings();
  const t = useText();
  const lang = useLang();
  // The clock is read only in the browser: a server render (Next.js Cache Components) must not read it. The closed
  // list is not shown, so on the server it ends at the chosen period.
  const today = useSyncExternalStore(noSubscribe, () => todayProp ?? todayPlain(), () => todayProp ?? value.to);
  // The first day of a custom range whose end is not chosen yet: the calendar stays open for the end.
  const [start, setStart] = useState<PlainDate | null>(null);
  const label = (p: Period) => {
    const year = Number(p.from.slice(0, 4));
    const month = Number(p.from.slice(5, 7));
    if (p.kind === "year") return String(year);
    if (p.kind === "quarter") return s.quarterLabel((month + 2) / 3, year);
    return viewLabel({ calendar: "gregorian", year, month }, lang);
  };
  const { kind } = value;
  let options = kind === "custom" ? [] : periodOptions(kind, today);
  // A value older (or newer) than the list still shows as its own option.
  if (kind !== "custom" && !options.some((p) => p.from === value.from)) options = [...options, value].sort((a, b) => (a.from < b.from ? 1 : -1));

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <SegmentedControl
        aria-label={s.periodKind}
        value={kind}
        onValueChange={(k) => {
          setStart(null);
          onValueChange(k === "custom" ? { kind: "custom", from: value.from, to: value.to } : periodOf(k as Exclude<PeriodKind, "custom">, value.to));
        }}
        options={kinds.map((k) => ({ value: k, label: t(k === "custom" ? s.customPeriod : s[k]) }))}
      />
      {kind === "custom" ? (
        <DateRangePicker
          value={start && value.from === start && value.to === start ? { from: start, to: null } : value}
          onValueChange={(range) => {
            setStart(range.to ? null : range.from);
            if (!range.from && !range.to) return onValueChange(periodOf("month", today));
            onValueChange({ kind: "custom", from: range.from ?? range.to!, to: range.to ?? range.from! });
          }}
          className="w-64 max-w-full"
        />
      ) : (
        <Select
          aria-label={s[kind]}
          value={value.from}
          valueText={label(value)}
          onValueChange={(from) => onValueChange(options.find((p) => p.from === from)!)}
          options={options.map((p) => ({ value: p.from, label: label(p) }))}
          className="w-auto min-w-44"
        />
      )}
    </div>
  );
}
