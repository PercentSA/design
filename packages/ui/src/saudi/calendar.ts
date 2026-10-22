import type { Lang } from "../i18n/localized";
import { hijriParts, type CalendarKind } from "./date";

/** A day without time or zone: "2026-02-18" (Gregorian ISO). The value every date component uses. */
export type PlainDate = string;
export type MonthView = { calendar: CalendarKind; year: number; month: number };

const DAY = 86_400_000;
const pad = (n: number) => String(n).padStart(2, "0");

// Noon UTC is the same day in every zone from UTC-11 to UTC+11, including Riyadh.
export const fromPlain = (p: PlainDate) => new Date(`${p}T12:00:00Z`);
const toPlain = (d: Date) => d.toISOString().slice(0, 10);
export const addDays = (p: PlainDate, n: number) => toPlain(new Date(fromPlain(p).getTime() + n * DAY));
const weekday = (p: PlainDate) => fromPlain(p).getUTCDay();

/** Today in Riyadh. */
export const todayPlain = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(new Date());

export function partsOf(p: PlainDate, calendar: CalendarKind) {
  if (calendar === "hijri") return hijriParts(fromPlain(p));
  return { year: Number(p.slice(0, 4)), month: Number(p.slice(5, 7)), day: Number(p.slice(8, 10)) };
}

export const monthOf = (p: PlainDate, calendar: CalendarKind): MonthView => {
  const { year, month } = partsOf(p, calendar);
  return { calendar, year, month };
};

export function shiftView(view: MonthView, months: number): MonthView {
  const i = view.year * 12 + view.month - 1 + months;
  return { calendar: view.calendar, year: Math.floor(i / 12), month: (i % 12) + 1 };
}

function firstDay(view: MonthView): PlainDate {
  if (view.calendar === "gregorian") return `${String(view.year).padStart(4, "0")}-${pad(view.month)}-01`;
  // Umm al-Qura has no formula: estimate from the mean month, then step to day 1 with Intl.
  const epoch = Date.UTC(622, 6, 19, 12); // 1 Muharram 1 AH, proleptic Gregorian
  let p = toPlain(new Date(epoch + Math.round(((view.year - 1) * 12 + view.month - 1) * 29.530588) * DAY));
  for (let i = 0; i < 8; i++) {
    const h = hijriParts(fromPlain(p));
    const months = (view.year - h.year) * 12 + (view.month - h.month);
    if (months === 0 && h.day === 1) return p;
    p = addDays(p, Math.round(months * 29.53) - (h.day - 1));
  }
  throw new RangeError(`No Umm al-Qura date for ${view.year}-${view.month}`);
}

/** Every day of the month, in order. */
export function monthDays(view: MonthView): PlainDate[] {
  const first = firstDay(view);
  const days = [first];
  for (let p = addDays(first, 1); partsOf(p, view.calendar).day !== 1; p = addDays(p, 1)) days.push(p);
  return days;
}

/** The month as weeks of 7 days (with the days of the next and previous month that fill them). Saudi weeks start on Sunday. */
export function monthGrid(view: MonthView, weekStart = 0) {
  const days = monthDays(view);
  const lead = (weekday(days[0]!) - weekStart + 7) % 7;
  const cells = Math.ceil((lead + days.length) / 7) * 7;
  const start = addDays(days[0]!, -lead);
  const weeks = Array.from({ length: cells / 7 }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)));
  return { days, weeks };
}

/** Same day `n` months later in the calendar; the last day of the month when the day does not exist. */
export function addMonths(p: PlainDate, n: number, calendar: CalendarKind): PlainDate {
  const days = monthDays(shiftView(monthOf(p, calendar), n));
  return days[Math.min(partsOf(p, calendar).day, days.length) - 1]!;
}

/** A date range; either end may be open ("from 12/09", "until 15/09"). */
export type DateRange = { from: PlainDate | null; to: PlainDate | null };
export type DateRangePresetId = "today" | "yesterday" | "last7Days" | "last30Days" | "thisWeek" | "thisMonth" | "lastMonth";

/** The range after a day is chosen: the day joins an open range (the ends swap when needed); else a new range starts. */
export function nextRange(range: DateRange, day: PlainDate): DateRange {
  const end = range.from && range.to ? null : (range.from ?? range.to);
  if (!end) return { from: day, to: null };
  return day < end ? { from: day, to: end } : { from: end, to: day };
}

/**
 * A preset range up to `today` (Gregorian). `last7Days` and `last30Days` count today as day 1. `thisWeek` starts on
 * `weekStart` (0 = Sunday); `lastMonth` is the whole previous month.
 */
export function rangePreset(id: DateRangePresetId, today: PlainDate, weekStart = 0): DateRange {
  const first = `${today.slice(0, 8)}01`;
  switch (id) {
    case "today":
      return { from: today, to: today };
    case "yesterday": {
      const d = addDays(today, -1);
      return { from: d, to: d };
    }
    case "last7Days":
      return { from: addDays(today, -6), to: today };
    case "last30Days":
      return { from: addDays(today, -29), to: today };
    case "thisWeek":
      return { from: addDays(today, -((weekday(today) - weekStart + 7) % 7)), to: today };
    case "thisMonth":
      return { from: first, to: today };
    case "lastMonth": {
      const last = addDays(first, -1);
      return { from: `${last.slice(0, 8)}01`, to: last };
    }
  }
}

/** Grid keyboard: arrows (mirrored in RTL), Home/End of the week, PageUp/PageDown a month (with Shift a year). */
export function moveFocus(
  p: PlainDate,
  key: string,
  { calendar, rtl = false, weekStart = 0, shift = false }: { calendar: CalendarKind; rtl?: boolean; weekStart?: number; shift?: boolean },
): PlainDate {
  const back = (weekday(p) - weekStart + 7) % 7;
  switch (key) {
    case "ArrowRight":
      return addDays(p, rtl ? -1 : 1);
    case "ArrowLeft":
      return addDays(p, rtl ? 1 : -1);
    case "ArrowUp":
      return addDays(p, -7);
    case "ArrowDown":
      return addDays(p, 7);
    case "Home":
      return addDays(p, -back);
    case "End":
      return addDays(p, 6 - back);
    case "PageUp":
      return addMonths(p, shift ? -12 : -1, calendar);
    case "PageDown":
      return addMonths(p, shift ? 12 : 1, calendar);
    default:
      return p;
  }
}

const CAL = { gregorian: "gregory", hijri: "islamic-umalqura" } as const;
const locale = (lang: Lang) => (lang === "ar" ? "ar-SA" : "en-GB");

/** "Ramadan 1447 AH", "فبراير 2026". */
export const viewLabel = (view: MonthView, lang: Lang) =>
  new Intl.DateTimeFormat(locale(lang), { calendar: CAL[view.calendar], numberingSystem: "latn", month: "long", year: "numeric", timeZone: "UTC" }).format(
    fromPlain(firstDay(view)),
  );

/** The 12 month names of `year` in the calendar, January or Muharram first: "September", "رمضان". */
export function monthNames(calendar: CalendarKind, year: number, lang: Lang) {
  const f = new Intl.DateTimeFormat(locale(lang), { calendar: CAL[calendar], numberingSystem: "latn", month: "long", timeZone: "UTC" });
  return Array.from({ length: 12 }, (_, i) => f.format(fromPlain(firstDay({ calendar, year, month: i + 1 }))));
}

/** Weekday names from `weekStart`: short for the column, long for screen readers. */
export function weekdayNames(lang: Lang, weekStart = 0) {
  const f = (weekday: "short" | "long") => new Intl.DateTimeFormat(locale(lang), { weekday, timeZone: "UTC" });
  // 2026-02-15 is a Sunday.
  return Array.from({ length: 7 }, (_, i) => {
    const d = fromPlain(addDays("2026-02-15", (weekStart + i) % 7));
    return { short: f("short").format(d), long: f("long").format(d) };
  });
}
