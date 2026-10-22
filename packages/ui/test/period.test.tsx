// PeriodPicker and its period helpers (0.8.0).
import { describe, expect, test } from "bun:test";
import { useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PercentProvider, PeriodPicker, periodOf, periodOptions, STRINGS, viewLabel, type CalendarKind, type Period } from "../src";
import { click, mount, press, useDom } from "./dom";

useDom();
const TODAY = "2026-09-27";
const noop = () => {};

describe("period helpers", () => {
  test("periodOf bounds", () => {
    expect(periodOf("month", TODAY)).toEqual({ kind: "month", from: "2026-09-01", to: "2026-09-30" });
    expect(periodOf("quarter", TODAY)).toEqual({ kind: "quarter", from: "2026-07-01", to: "2026-09-30" });
    expect(periodOf("year", TODAY)).toEqual({ kind: "year", from: "2026-01-01", to: "2026-12-31" });
    expect(periodOf("month", "2028-02-10")).toEqual({ kind: "month", from: "2028-02-01", to: "2028-02-29" });
    expect(periodOf("quarter", "2026-01-01")).toEqual({ kind: "quarter", from: "2026-01-01", to: "2026-03-31" });
    expect(periodOf("quarter", "2026-12-31")).toEqual({ kind: "quarter", from: "2026-10-01", to: "2026-12-31" });
  });

  test("periodOptions newest first, default counts", () => {
    const months = periodOptions("month", TODAY);
    expect(months).toHaveLength(24);
    expect(months[0]).toEqual(periodOf("month", TODAY));
    expect(months[1]).toEqual({ kind: "month", from: "2026-08-01", to: "2026-08-31" });
    expect(months.at(-1)).toEqual({ kind: "month", from: "2024-10-01", to: "2024-10-31" });
    const quarters = periodOptions("quarter", TODAY);
    expect(quarters).toHaveLength(8);
    expect(quarters.map((q) => q.from)).toEqual(["2026-07-01", "2026-04-01", "2026-01-01", "2025-10-01", "2025-07-01", "2025-04-01", "2025-01-01", "2024-10-01"]);
    expect(periodOptions("year", TODAY).map((y) => y.from)).toEqual(["2026-01-01", "2025-01-01", "2024-01-01", "2023-01-01", "2022-01-01"]);
    expect(periodOptions("year", TODAY, 2)).toHaveLength(2);
  });
});

// Umm al-Qura parts straight from Intl, and the first and last day that share them: the expected Hijri periods.
const umalqura = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", { year: "numeric", month: "numeric", day: "numeric", timeZone: "UTC" });
const hijri = (d: string) => {
  const n = (type: string) => Number(umalqura.formatToParts(new Date(`${d}T12:00:00Z`)).find((p) => p.type === type)!.value);
  return { year: n("year"), month: n("month") };
};
const shift = (d: string, n: number) => new Date(Date.parse(`${d}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
const span = (day: string, key: (h: { year: number; month: number }) => string) => {
  const k = key(hijri(day));
  let from = day;
  let to = day;
  while (key(hijri(shift(from, -1))) === k) from = shift(from, -1);
  while (key(hijri(shift(to, 1))) === k) to = shift(to, 1);
  return { from, to };
};
const HIJRI_KEY = {
  month: (h: { year: number; month: number }) => `${h.year}-${h.month}`,
  quarter: (h: { year: number; month: number }) => `${h.year}-q${Math.ceil(h.month / 3)}`,
  year: (h: { year: number; month: number }) => `${h.year}`,
};

describe("Hijri periods", () => {
  test("periodOf: the Umm al-Qura month, quarter (3 months) and year that contain the day", () => {
    for (const day of [TODAY, "2026-02-18", "2026-03-19", "2025-06-26"])
      for (const kind of ["month", "quarter", "year"] as const) expect(periodOf(kind, day, "hijri")).toEqual({ kind, ...span(day, HIJRI_KEY[kind]) });
  });

  test("periodOptions: Hijri periods back from today, newest first", () => {
    const months = periodOptions("month", TODAY, 3, "hijri");
    expect(months[0]).toEqual(periodOf("month", TODAY, "hijri"));
    expect(months[1]).toEqual({ kind: "month", ...span(shift(months[0]!.from, -1), HIJRI_KEY.month) });
    expect(months[2]!.to).toBe(shift(months[1]!.from, -1));
    expect(periodOptions("year", TODAY, undefined, "hijri")).toHaveLength(5);
    // The calendar left out is Gregorian.
    expect(periodOptions("quarter", TODAY)).toEqual(periodOptions("quarter", TODAY, undefined, "gregorian"));
  });

  test("labels in the Hijri calendar, with the era from the strings", () => {
    const html = (lang: "en" | "ar", value: Period, strings?: { hijriEra: string }) =>
      renderToStaticMarkup(
        <PercentProvider lang={lang} strings={strings}>
          <PeriodPicker value={value} onValueChange={noop} today={TODAY} calendar="hijri" />
        </PercentProvider>,
      );
    const trigger = (out: string) => out.match(/<button[^>]*role="combobox"[^>]*>(.*?)<\/button>/)![1]!.replace(/<[^>]+>/g, "");
    const h = hijri(TODAY);
    const q = Math.ceil(h.month / 3);
    expect(trigger(html("ar", periodOf("month", TODAY, "hijri")))).toBe(viewLabel({ calendar: "hijri", ...h }, "ar"));
    expect(trigger(html("en", periodOf("month", TODAY, "hijri")))).toBe(viewLabel({ calendar: "hijri", ...h }, "en"));
    expect(trigger(html("ar", periodOf("year", TODAY, "hijri")))).toBe(`${h.year} هـ`);
    expect(trigger(html("en", periodOf("year", TODAY, "hijri")))).toBe(`${h.year} AH`);
    expect(trigger(html("ar", periodOf("quarter", TODAY, "hijri")))).toBe(`${STRINGS.ar.quarterLabel(q, h.year)} هـ`);
    expect(trigger(html("en", periodOf("quarter", TODAY, "hijri")))).toBe(`Q${q} ${h.year} AH`);
    expect(trigger(html("en", periodOf("year", TODAY, "hijri"), { hijriEra: "H" }))).toBe(`${h.year} H`);
  });

  test("PeriodPicker calendar=hijri: kind switches give Hijri periods; custom opens the Hijri calendar", async () => {
    const log: Period[] = [];
    const el = await mount(<Picker start={periodOf("month", TODAY, "hijri")} log={log} calendar="hijri" />);
    await click(kind("Quarter"));
    expect(log.at(-1)).toEqual(periodOf("quarter", TODAY, "hijri"));
    await click(kind("Year"));
    expect(log.at(-1)).toEqual(periodOf("year", TODAY, "hijri"));
    await click(kind("Custom"));
    expect(log.at(-1)).toEqual({ ...periodOf("year", TODAY, "hijri"), kind: "custom" });
    await click(el.querySelector("button[aria-haspopup]")!);
    expect(document.querySelector('[role="dialog"] [role="grid"]')!.getAttribute("aria-label")).toBe(viewLabel({ calendar: "hijri", ...hijri(log.at(-1)!.from) }, "en"));
  });
});

function Picker({ start, log, lang = "en", calendar }: { start: Period; log: Period[]; lang?: "en" | "ar"; calendar?: CalendarKind }) {
  const [value, setValue] = useState(start);
  return (
    <PercentProvider lang={lang}>
      <PeriodPicker
        calendar={calendar}
        value={value}
        onValueChange={(p) => {
          log.push(p);
          setValue(p);
        }}
        today={TODAY}
      />
    </PercentProvider>
  );
}
const kind = (label: string) => [...document.querySelectorAll('[role="radiogroup"] button')].find((b) => b.textContent === label)!;

describe("PeriodPicker", () => {
  test("a kind switch keeps the end (September 2026 → Q3 2026 → 2026)", async () => {
    const log: Period[] = [];
    const el = await mount(<Picker start={periodOf("month", TODAY)} log={log} />);
    expect(el.querySelector('[role="radiogroup"]')!.getAttribute("aria-label")).toBe("Period");
    await click(kind("Quarter"));
    expect(log.at(-1)).toEqual({ kind: "quarter", from: "2026-07-01", to: "2026-09-30" });
    // From Q3 back to a month: the quarter's last month, not its first.
    await click(kind("Month"));
    expect(log.at(-1)).toEqual({ kind: "month", from: "2026-09-01", to: "2026-09-30" });
    await click(kind("Year"));
    expect(log.at(-1)).toEqual({ kind: "year", from: "2026-01-01", to: "2026-12-31" });
    // Custom starts from the current period.
    await click(kind("Custom"));
    expect(log.at(-1)).toEqual({ kind: "custom", from: "2026-01-01", to: "2026-12-31" });
  });

  test("the period select lists the options and changes the value", async () => {
    const log: Period[] = [];
    const el = await mount(<Picker start={periodOf("quarter", TODAY)} log={log} />);
    const select = el.querySelector<HTMLElement>('[role="combobox"]')!;
    await press(select, { key: "ArrowDown" });
    const options = [...document.querySelectorAll('[role="option"]')];
    expect(options.map((o) => o.textContent)).toEqual(["Q3 2026", "Q2 2026", "Q1 2026", "Q4 2025", "Q3 2025", "Q2 2025", "Q1 2025", "Q4 2024"]);
    await press(options[1]!, { key: "Enter" });
    expect(log.at(-1)).toEqual({ kind: "quarter", from: "2026-04-01", to: "2026-06-30" });
  });

  test("custom: from only → to = from; cleared → this month", async () => {
    const log: Period[] = [];
    const el = await mount(<Picker start={{ kind: "custom", from: "2026-09-10", to: "2026-09-12" }} log={log} lang="ar" />);
    await click(el.querySelector("button[aria-haspopup]")!);
    const day = (d: string) => document.querySelector<HTMLButtonElement>(`[data-day="${d}"]`)!;
    await click(day("2026-09-15"));
    expect(log.at(-1)).toEqual({ kind: "custom", from: "2026-09-15", to: "2026-09-15" });
    // The range is still open at its end: the next day completes it.
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    await click(day("2026-09-20"));
    expect(log.at(-1)).toEqual({ kind: "custom", from: "2026-09-15", to: "2026-09-20" });
    await click(el.querySelector('button[aria-label="مسح التاريخ"]')!);
    expect(log.at(-1)).toEqual(periodOf("month", TODAY));
  });

  test("labels: سبتمبر 2026, الربع الثالث 2026, September 2026, Q3 2026", () => {
    const html = (lang: "en" | "ar", value: Period) =>
      renderToStaticMarkup(
        <PercentProvider lang={lang}>
          <PeriodPicker value={value} onValueChange={noop} today={TODAY} />
        </PercentProvider>,
      );
    const trigger = (out: string) => out.match(/<button[^>]*role="combobox"[^>]*>(.*?)<\/button>/)![1]!.replace(/<[^>]+>/g, "");
    expect(trigger(html("ar", periodOf("month", TODAY)))).toBe("سبتمبر 2026");
    expect(trigger(html("ar", periodOf("quarter", TODAY)))).toBe("الربع الثالث 2026");
    expect(trigger(html("en", periodOf("month", TODAY)))).toBe("September 2026");
    expect(trigger(html("en", periodOf("quarter", TODAY)))).toBe("Q3 2026");
    expect(trigger(html("en", periodOf("year", TODAY)))).toBe("2026");
    const ar = html("ar", periodOf("month", TODAY));
    expect(ar).toContain(`aria-label="نوع الفترة"`);
    for (const word of ["شهر", "ربع سنة", "سنة", "فترة مخصصة"]) expect(ar).toContain(`>${word}<`);
  });

  test("an old value still shows", async () => {
    const el = await mount(<Picker start={periodOf("month", "2020-01-15")} log={[]} />);
    const select = el.querySelector<HTMLElement>('[role="combobox"]')!;
    expect(select.textContent).toBe("January 2020");
    await press(select, { key: "ArrowDown" });
    const options = [...document.querySelectorAll('[role="option"]')].map((o) => o.textContent);
    expect(options).toHaveLength(25);
    expect(options[0]).toBe("September 2026");
    expect(options.at(-1)).toBe("January 2020");
  });

  test("kinds limits the choice", () => {
    const out = renderToStaticMarkup(<PeriodPicker value={periodOf("year", TODAY)} onValueChange={noop} kinds={["month", "year"]} today={TODAY} />);
    expect(out).toContain(">Month<");
    expect(out).not.toContain(">Quarter<");
    expect(out).not.toContain(">Custom<");
  });

  test("a server render does not read the clock (Next.js Cache Components)", () => {
    const RealDate = globalThis.Date;
    globalThis.Date = class extends RealDate {
      constructor(...args: []) {
        if (args.length === 0) throw new Error("the clock was read");
        super(...args);
      }
    } as DateConstructor;
    try {
      const out = renderToStaticMarkup(<PeriodPicker value={periodOf("month", TODAY)} onValueChange={noop} />);
      expect(out).toContain("September 2026");
    } finally {
      globalThis.Date = RealDate;
    }
  });
});
