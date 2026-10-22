import { addDays, monthDays, partsOf, type PlainDate } from "./calendar";
import type { CalendarKind } from "./date";

export type PeriodKind = "month" | "quarter" | "year" | "custom";
/** A report period: both ends are included. The ends are Gregorian ISO days in both calendars. */
export type Period = { kind: PeriodKind; from: PlainDate; to: PlainDate };

const COUNT = { month: 24, quarter: 8, year: 5 };

/** The month, quarter (3 months) or year that contains `day`, in the Gregorian or Hijri (Umm al-Qura) calendar. */
export function periodOf(kind: Exclude<PeriodKind, "custom">, day: PlainDate, calendar: CalendarKind = "gregorian"): Period {
  const { year, month } = partsOf(day, calendar);
  const first = kind === "year" ? 1 : kind === "quarter" ? month - ((month - 1) % 3) : month;
  const last = kind === "year" ? 12 : kind === "quarter" ? first + 2 : month;
  return { kind, from: monthDays({ calendar, year, month: first })[0]!, to: monthDays({ calendar, year, month: last }).at(-1)! };
}

/** The periods up to the one of `today`, newest first. Default: 24 months, 8 quarters or 5 years. */
export function periodOptions(
  kind: Exclude<PeriodKind, "custom">,
  today: PlainDate,
  count = COUNT[kind],
  calendar: CalendarKind = "gregorian",
): Period[] {
  const list = [periodOf(kind, today, calendar)];
  while (list.length < count) list.push(periodOf(kind, addDays(list.at(-1)!.from, -1), calendar));
  return list;
}
