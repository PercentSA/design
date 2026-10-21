import type { Lang } from "../i18n/localized";

export type CalendarKind = "gregorian" | "hijri";

// Riyadh by default: a date-only value renders the same day on the server and in the browser.
const ZONE = "Asia/Riyadh";
const CAL = { gregorian: "gregory", hijri: "islamic-umalqura" } as const;

/** "18 February 2026", "1 Ramadan 1447 AH", "1 رمضان 1447 هـ". Western digits in Arabic. */
export function formatDate(
  date: Date,
  {
    lang = "en",
    calendar = "gregorian",
    style = "long",
    timeZone = ZONE,
  }: { lang?: Lang; calendar?: CalendarKind; style?: "long" | "medium" | "short"; timeZone?: string } = {},
) {
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-SA" : "en-GB", {
    calendar: CAL[calendar],
    numberingSystem: "latn",
    dateStyle: style,
    timeZone,
  }).format(date);
}

const hijriFormat = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  timeZone: ZONE,
});

/** Umm al-Qura year, month (1–12) and day of a date, in Riyadh. */
export function hijriParts(date: Date) {
  const n = (type: string) => Number(hijriFormat.formatToParts(date).find((p) => p.type === type)!.value);
  return { year: n("year"), month: n("month"), day: n("day") };
}
