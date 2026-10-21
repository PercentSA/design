import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { addMonths, Calendar, DatePicker, Field, monthGrid, monthOf, moveFocus, PercentProvider } from "../src";
import { useDom } from "./dom";

useDom();

describe("month grid", () => {
  test("Hijri: Ramadan 1447 runs 18 Feb – 19 Mar 2026; weeks start on Sunday", () => {
    const g = monthGrid({ calendar: "hijri", year: 1447, month: 9 });
    expect(g.days).toHaveLength(30);
    expect(g.days[0]).toBe("2026-02-18");
    expect(g.days.at(-1)).toBe("2026-03-19");
    expect(g.weeks[0]![0]).toBe("2026-02-15");
    expect(g.weeks.every((w) => w.length === 7)).toBe(true);
    expect(g.weeks.at(-1)).toContain("2026-03-19");
  });
  test("Gregorian: February 2026 has 28 days and starts on a Sunday", () => {
    const g = monthGrid({ calendar: "gregorian", year: 2026, month: 2 });
    expect(g.days).toHaveLength(28);
    expect(g.weeks[0]![0]).toBe("2026-02-01");
    expect(g.weeks).toHaveLength(4);
  });
  test("monthOf finds the month of a day in each calendar", () => {
    expect(monthOf("2026-03-19", "hijri")).toEqual({ calendar: "hijri", year: 1447, month: 9 });
    expect(monthOf("2026-03-20", "gregorian")).toEqual({ calendar: "gregorian", year: 2026, month: 3 });
  });
});

describe("keyboard date math", () => {
  test("arrows follow the reading direction", () => {
    expect(moveFocus("2026-02-18", "ArrowRight", { calendar: "gregorian" })).toBe("2026-02-19");
    expect(moveFocus("2026-02-18", "ArrowRight", { calendar: "gregorian", rtl: true })).toBe("2026-02-17");
    expect(moveFocus("2026-02-18", "ArrowDown", { calendar: "hijri" })).toBe("2026-02-25");
  });
  test("Home and End go to the start and end of the week", () => {
    expect(moveFocus("2026-02-18", "Home", { calendar: "gregorian" })).toBe("2026-02-15");
    expect(moveFocus("2026-02-18", "End", { calendar: "gregorian" })).toBe("2026-02-21");
  });
  test("PageDown moves one month in the shown calendar and keeps the day when it can", () => {
    // 30 Ramadan 1447 → Shawwal has 29 days → 29 Shawwal.
    expect(moveFocus("2026-03-19", "PageDown", { calendar: "hijri" })).toBe("2026-04-17");
    expect(moveFocus("2026-01-31", "PageDown", { calendar: "gregorian" })).toBe("2026-02-28");
    expect(addMonths("2026-02-18", -12, "hijri")).toBe("2025-03-01");
  });
});

describe("Calendar and DatePicker render", () => {
  test("Arabic Hijri calendar: grid, month name, Arabic weekdays, chosen day", () => {
    const out = renderToStaticMarkup(
      <PercentProvider lang="ar">
        <Calendar value="2026-02-18" onValueChange={() => {}} defaultCalendar="hijri" />
      </PercentProvider>,
    );
    expect(out).toContain('role="grid"');
    expect(out).toContain("رمضان 1447 هـ");
    expect(out).toContain("الأحد");
    expect(out).toMatch(/aria-selected="true"[^>]*>|<button[^>]*aria-selected="true"/);
    expect(out).toContain('aria-label="الشهر التالي"');
  });
  test("DatePicker: the trigger takes the field label and posts an ISO date", () => {
    const out = renderToStaticMarkup(
      <Field label="Start date" id="start">
        <DatePicker value="2026-02-18" onValueChange={() => {}} name="start" />
      </Field>,
    );
    expect(out).toMatch(/<button[^>]*id="start"/);
    expect(out).toContain('name="start" value="2026-02-18"');
    expect(out).toContain("18 February 2026");
  });
});

describe("DatePicker in the browser", () => {
  test("opening it puts focus on the chosen day", async () => {
    const { click, mount } = await import("./dom");
    const el = await mount(<DatePicker value="2026-02-18" onValueChange={() => {}} />);
    await click(el.querySelector("button")!);
    expect(document.activeElement?.getAttribute("data-day")).toBe("2026-02-18");
  });
});

describe("min and max: keyboard users can always reach a day", () => {
  test("DatePicker opens on the first day that can be chosen when today is before min", async () => {
    const { click, mount } = await import("./dom");
    const { addDays, todayPlain } = await import("../src");
    const min = addDays(todayPlain(), 40);
    const el = await mount(<DatePicker value={null} min={min} max={addDays(min, 20)} onValueChange={() => {}} />);
    await click(el.querySelector("button")!);
    expect(document.activeElement?.getAttribute("data-day")).toBe(min);
  });
  test("in a month that starts before min, the Tab stop is the first day that can be chosen", async () => {
    const { click, mount } = await import("./dom");
    const el = await mount(<Calendar value="2026-03-20" min="2026-02-10" onValueChange={() => {}} />);
    await click(el.querySelector('[aria-label="Previous month"]')!);
    const stop = el.querySelector<HTMLButtonElement>('[data-day][tabindex="0"]')!;
    expect([stop.dataset.day, stop.disabled]).toEqual(["2026-02-10", false]);
  });
});
