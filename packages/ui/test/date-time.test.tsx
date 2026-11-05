import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { formatDateTime, formatRelative, formatTimeOfDay, PercentProvider, STRINGS, TimeText, type Lang } from "../src";
import { click, mount, useDom } from "./dom";

useDom();

const now = new Date("2026-09-27T12:45:00Z"); // a Sunday, 15:45 in Riyadh
const f = (value: string, lang: Lang) => formatDateTime(value, { lang, now });
const ago = (seconds: number, lang: Lang) => formatRelative(new Date(now.getTime() - seconds * 1000), { lang, now });

describe("formatDateTime", () => {
  test("short form, Arabic", () => {
    expect(f("2026-09-27T12:45:12Z", "ar")).toBe("3:45 م");
    expect(f("2026-09-26T23:30:00Z", "ar")).toBe("2:30 ص"); // the Riyadh day, not the UTC day
    expect(f("2026-09-26T12:45:00Z", "ar")).toBe("أمس 3:45 م");
    expect(f("2026-09-28T06:00:00Z", "ar")).toBe("غداً 9:00 ص");
    expect(f("2026-09-12T12:45:00Z", "ar")).toBe("12 سبتمبر، 3:45 م");
    expect(f("2025-09-12T12:45:00Z", "ar")).toBe("12/09/2025");
  });
  test("short form, English", () => {
    expect(f("2026-09-27T12:45:12Z", "en")).toBe("3:45 PM");
    expect(f("2026-09-26T12:45:00Z", "en")).toBe("Yesterday 3:45 PM");
    expect(f("2026-09-28T06:00:00Z", "en")).toBe("Tomorrow 9:00 AM");
    expect(f("2026-09-12T12:45:00Z", "en")).toBe("12 September, 3:45 PM");
    expect(f("2025-09-12T12:45:00Z", "en")).toBe("12/09/2025");
  });
  test("calendar day is never shifted", () => {
    expect(f("2026-09-27", "ar")).toBe("اليوم");
    expect(f("2026-09-26", "ar")).toBe("أمس");
    expect(f("2026-09-28", "ar")).toBe("غداً");
    expect(f("2026-10-05", "ar")).toBe("5 أكتوبر");
    expect(f("2027-01-05", "ar")).toBe("05/01/2027");
    expect(formatDateTime("2026-09-26T23:30:00Z", { lang: "ar", kind: "date", now })).toBe("اليوم");
  });
  test("full, numeric and export styles", () => {
    expect(formatDateTime("2026-09-27T12:45:12Z", { lang: "ar", style: "full" })).toBe("الأحد 27 سبتمبر 2026، 3:45:12 م");
    expect(formatDateTime("2026-09-27T12:45:12Z", { lang: "en", style: "full" })).toBe("Sunday 27 September 2026, 3:45:12 PM");
    expect(formatDateTime("2026-09-27", { style: "full", lang: "ar" })).toBe("الأحد 27 سبتمبر 2026");
    expect(formatDateTime("2026-09-27T12:45:12Z", { style: "numeric" })).toBe("27/09/2026");
    expect(formatDateTime("2026-09-27T12:45:12Z", { style: "export" })).toBe("2026-09-27 15:45");
    expect(formatDateTime("2026-09-27", { style: "export" })).toBe("2026-09-27");
  });
  test("zoneless timestamp is read as UTC", () => {
    const zone = process.env.TZ;
    const full = (value: string) => formatDateTime(value, { lang: "ar", style: "full" });
    try {
      // A server in UTC and a browser in Riyadh give the same text.
      for (const tz of ["UTC", "Asia/Riyadh"]) {
        process.env.TZ = tz;
        expect(full("2026-09-27T12:45:12")).toBe(full("2026-09-27T12:45:12Z"));
        expect(full("2026-09-27 12:45:12.123")).toBe(full("2026-09-27T12:45:12Z"));
      }
    } finally {
      if (zone === undefined) delete process.env.TZ;
      else process.env.TZ = zone;
    }
  });
  test("no Arabic-Indic digits and no direction marks in any output", () => {
    const values = ["2026-09-27T12:45:12Z", "2026-09-26T12:45:00Z", "2026-09-12T12:45:00Z", "2025-09-12T12:45:00Z", "2026-10-05"];
    const out: string[] = [];
    for (const lang of ["ar", "en"] as const) {
      for (const value of values)
        for (const style of ["short", "full", "numeric", "export"] as const) out.push(formatDateTime(value, { lang, style, now }));
      for (const s of [10, 300, 10_800, 86_400, 5_184_000]) out.push(ago(s, lang));
      out.push(formatTimeOfDay("18:30", { lang }));
    }
    expect(out.filter((s) => !s || /[٠-٩۰-۹‎‏؜]/.test(s))).toEqual([]);
  });
  test("empty and bad input give an empty string", () => {
    for (const value of [null, undefined, "", "not a date"]) {
      expect(formatDateTime(value)).toBe("");
      expect(formatRelative(value)).toBe("");
    }
  });
  test("strings override changes the words", () => {
    const strings = { ...STRINGS.ar, yesterday: "البارحة" };
    expect(formatDateTime("2026-09-26T12:45:00Z", { lang: "ar", now, strings })).toBe("البارحة 3:45 م");
  });
});

describe("formatRelative and formatTimeOfDay", () => {
  test("formatRelative", () => {
    expect([10, 300, 10_800, 86_400, 5_184_000].map((s) => ago(s, "ar"))).toEqual(["الآن", "قبل 5 دقائق", "قبل 3 ساعات", "أمس", "قبل شهرين"]);
    expect([10, 300, 10_800, 86_400, 5_184_000].map((s) => ago(s, "en"))).toEqual(["now", "5 minutes ago", "3 hours ago", "yesterday", "2 months ago"]);
  });
  test("formatTimeOfDay", () => {
    expect(formatTimeOfDay("09:00:00", { lang: "ar" })).toBe("9:00 ص");
    expect(formatTimeOfDay("00:30", { lang: "ar" })).toBe("12:30 ص");
    expect(formatTimeOfDay("12:00", { lang: "ar" })).toBe("12:00 م");
    expect(formatTimeOfDay("18:30:00", { lang: "ar" })).toBe("6:30 م");
    expect(formatTimeOfDay("09:00", { lang: "en" })).toBe("9:00 AM");
    expect(formatTimeOfDay(null)).toBe("");
    expect(formatTimeOfDay("25:00")).toBe("");
  });
});

describe("TimeText", () => {
  const FULL = "السبت 26 سبتمبر 2026، 3:45:00 م";
  test("TimeText server markup: <time dateTime> with the short text in the page language", () => {
    const html = renderToStaticMarkup(
      <PercentProvider lang="ar">
        <TimeText value="2026-09-26T12:45:00Z" now={now} />
      </PercentProvider>,
    );
    expect(html).toContain('dateTime="2026-09-26T12:45:00.000Z"');
    expect(html).toContain("أمس 3:45 م");
    expect(renderToStaticMarkup(<TimeText value="2026-09-26" kind="date" />)).toContain('dateTime="2026-09-26"');
  });
  test("TimeText interactive: one tab stop; a click shows the full value", async () => {
    const el = await mount(
      <PercentProvider lang="ar">
        <TimeText value="2026-09-26T12:45:00Z" now={now} />
      </PercentProvider>,
    );
    expect(el.querySelectorAll('[tabindex="0"]').length).toBe(1);
    expect(document.body.textContent).not.toContain(FULL);
    await click(el.querySelector("time")!);
    expect(document.body.textContent).toContain(FULL);
  });
  test("TimeText interactive={false}: title holds the full value, no tabindex; null renders nothing", () => {
    const html = renderToStaticMarkup(
      <PercentProvider lang="ar">
        <TimeText value="2026-09-26T12:45:00Z" now={now} interactive={false} />
      </PercentProvider>,
    );
    expect(html).toContain(`title="${FULL}"`);
    expect(html).not.toContain("tabindex");
    expect(html).not.toContain("tabIndex");
    expect(renderToStaticMarkup(<TimeText value={null} />)).toBe("");
  });
});
