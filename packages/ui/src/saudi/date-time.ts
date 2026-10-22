import type { Lang } from "../i18n/localized";
import { STRINGS, type Strings } from "../i18n/strings";

export type DateInput = Date | string | number | null | undefined;
export type DateTimeStyle = "short" | "full" | "numeric" | "export";
type Kind = "instant" | "date";

const ZONE = "Asia/Riyadh";
const DAY = 86_400_000;
const DAY_ONLY = /^\d{4}-\d{2}-\d{2}$/;
// A database "timestamp without time zone" holds UTC: read it as UTC, so the server and the browser agree.
const ZONELESS = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/;
const MARKS = /[‎‏؜]/g;

/** The instant, and whether the input is a calendar day. Null for empty or bad input. */
function read(value: DateInput): { date: Date; day: boolean } | null {
  if (value == null || value === "") return null;
  // A calendar day is noon UTC, read in UTC: never shifted to another day.
  if (typeof value === "string" && DAY_ONLY.test(value)) return { date: new Date(`${value}T12:00:00Z`), day: true };
  const date = new Date(typeof value === "string" && ZONELESS.test(value) ? `${value.replace(" ", "T")}Z` : value);
  return Number.isNaN(date.getTime()) ? null : { date, day: false };
}

const cache = new Map<string, Intl.DateTimeFormat>();
const formatter = (locale: string, options: Intl.DateTimeFormatOptions) => {
  const key = locale + JSON.stringify(options);
  let f = cache.get(key);
  if (!f) cache.set(key, (f = new Intl.DateTimeFormat(locale, options)));
  return f;
};
const parts = (f: Intl.DateTimeFormat, date: Date) => Object.fromEntries(f.formatToParts(date).map((p) => [p.type, p.value]));
// Gregorian calendar and Western digits in Arabic; en-US for "AM"/"PM".
const locale = (lang: Lang) => (lang === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-US");

/** "ص"/"م" or "AM"/"PM". */
const period = (lang: Lang, pm: boolean) =>
  parts(formatter(locale(lang), { hour: "numeric", hour12: true, timeZone: "UTC" }), new Date(Date.UTC(2000, 0, 1, pm ? 15 : 9))).dayPeriod!;

/** Numbers and names of a date in a zone, built from parts: no direction marks. */
function clock(date: Date, lang: Lang, timeZone: string) {
  const n = parts(
    formatter("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23", timeZone }),
    date,
  );
  const w = parts(formatter(locale(lang), { weekday: "long", month: "long", timeZone }), date);
  const h = Number(n.hour);
  const hm = `${h % 12 || 12}:${n.minute}`;
  return {
    ymd: `${n.year}-${n.month}-${n.day}`,
    year: n.year!,
    dayMonth: `${Number(n.day)} ${w.month}`,
    weekday: w.weekday!,
    numeric: `${n.day}/${n.month}/${n.year}`,
    time24: `${n.hour}:${n.minute}`,
    time: `${hm} ${period(lang, h >= 12)}`,
    seconds: `${hm}:${n.second} ${period(lang, h >= 12)}`,
  };
}

/**
 * A date or time in Riyadh time (or `timeZone`), 12-hour clock, Western digits, Gregorian calendar.
 * `short`: today "3:45 PM", yesterday and tomorrow "Yesterday 3:45 PM", this year "12 September, 3:45 PM",
 * other years "12/09/2025". `full`: "Sunday 27 September 2026, 3:45:12 PM". `numeric`: "27/09/2026".
 * `export`: "2026-09-27 15:45" (24 h, sortable). A calendar day (`kind="date"`, or a "YYYY-MM-DD" string) has no time.
 * A date-time string without a zone is read as UTC. Empty or bad input gives "".
 */
export function formatDateTime(
  value: DateInput,
  {
    lang = "en",
    kind,
    style = "short",
    now,
    timeZone = ZONE,
    strings = STRINGS[lang],
  }: { lang?: Lang; kind?: Kind; style?: DateTimeStyle; now?: Date; timeZone?: string; strings?: Strings } = {},
): string {
  const r = read(value);
  if (!r) return "";
  const day = r.day || kind === "date";
  const c = clock(r.date, lang, r.day ? "UTC" : timeZone);
  const comma = lang === "ar" ? "،" : ",";
  if (style === "export") return day ? c.ymd : `${c.ymd} ${c.time24}`;
  if (style === "numeric") return c.numeric;
  if (style === "full") return `${c.weekday} ${c.dayMonth} ${c.year}${day ? "" : `${comma} ${c.seconds}`}`;
  const today = clock(now ?? new Date(), lang, timeZone).ymd;
  const distance = Math.round((Date.parse(c.ymd) - Date.parse(today)) / DAY);
  const word = distance === 0 ? strings.today : distance === -1 ? strings.yesterday : distance === 1 ? strings.tomorrow : null;
  const thisYear = c.year === today.slice(0, 4);
  if (day) return word ?? (thisYear ? c.dayMonth : c.numeric);
  if (distance === 0) return c.time;
  if (word) return `${word} ${c.time}`;
  return thisYear ? `${c.dayMonth}${comma} ${c.time}` : c.numeric;
}

/** The value of `<time dateTime>`: "YYYY-MM-DD" for a calendar day, else the ISO instant. */
export function dateTimeAttribute(value: DateInput, kind?: Kind) {
  const r = read(value);
  if (!r) return "";
  return r.day || kind === "date" ? formatDateTime(value, { kind, style: "export" }) : r.date.toISOString();
}

const relative = new Map<Lang, Intl.RelativeTimeFormat>();

/** "now", "5 minutes ago", "yesterday", "2 months ago"; "الآن", "قبل 5 دقائق", "أمس", "قبل شهرين". */
export function formatRelative(value: DateInput, { lang = "en", now = new Date() }: { lang?: Lang; now?: Date } = {}): string {
  const r = read(value);
  if (!r) return "";
  let f = relative.get(lang);
  if (!f) relative.set(lang, (f = new Intl.RelativeTimeFormat(lang === "ar" ? "ar-u-nu-latn" : "en", { numeric: "auto" })));
  const s = (r.date.getTime() - now.getTime()) / 1000;
  const days = s / 86_400;
  const [n, unit]: [number, Intl.RelativeTimeFormatUnit] =
    Math.abs(s) < 45
      ? [0, "second"]
      : Math.abs(s) < 3600
        ? [s / 60, "minute"]
        : Math.abs(s) < 86_400
          ? [s / 3600, "hour"]
          : Math.abs(days) < 30
            ? [days, "day"]
            : Math.abs(days) < 365
              ? [days / 30, "month"]
              : [days / 365, "year"];
  return f.format(Math.round(n), unit).replace(MARKS, "");
}

/** A wall time "HH:mm[:ss]" (opening hours, appointment slots) on the 12-hour clock: "9:00 AM", "9:00 ص". */
export function formatTimeOfDay(time: string | null | undefined, { lang = "en" }: { lang?: Lang } = {}): string {
  const m = /^(\d{1,2}):(\d{2})/.exec(time ?? "");
  const h = Number(m?.[1]);
  if (!m || h > 23) return "";
  return `${h % 12 || 12}:${m[2]} ${period(lang, h >= 12)}`;
}
