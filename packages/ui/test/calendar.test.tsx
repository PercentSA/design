import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { addMonths, Calendar, DatePicker, Field, monthDays, monthGrid, monthNames, monthOf, moveFocus, partsOf, PercentProvider, todayPlain } from "../src";
import { mount, press, useDom } from "./dom";

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
  test("in a Field, the month and year lists do not take the field id", async () => {
    const { click, mount } = await import("./dom");
    const el = await mount(
      <Field label="Start date" id="start" hint="Day one">
        <DatePicker value="2026-02-18" onValueChange={() => {}} />
      </Field>,
    );
    await click(el.querySelector("button")!);
    expect(document.querySelectorAll("#start")).toHaveLength(1);
    const lists = [...document.querySelectorAll('[role="combobox"]')].map((c) => [c.getAttribute("aria-label"), c.getAttribute("aria-describedby")]);
    expect(lists).toEqual([["Month", null], ["Year", null]]);
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

describe("month and year lists", () => {
  const list = (el: Element, label: string) => el.querySelector<HTMLElement>(`[role="combobox"][aria-label="${label}"]`)!;
  const open = async (el: Element, label: string) => {
    await press(list(el, label), { key: "ArrowDown" });
    return [...document.querySelectorAll<HTMLElement>('[role="option"]')];
  };
  const choose = async (el: Element, label: string, text: string) => {
    const option = (await open(el, label)).find((o) => o.textContent === text)!;
    await press(option, { key: "Enter" });
  };
  const shown = (el: Element) => el.querySelector('[role="grid"]')!.getAttribute("aria-label");
  const firstDay = (el: Element) => el.querySelector<HTMLElement>("[data-day]")!.dataset.day;

  test("monthNames: 12 long names in the calendar and the language", () => {
    expect(monthNames("gregorian", 2026, "en")[8]).toBe("September");
    expect(monthNames("gregorian", 2026, "ar")[1]).toBe("فبراير");
    const hijri = monthNames("hijri", 1447, "ar");
    expect(hijri).toHaveLength(12);
    expect(hijri[8]).toBe("رمضان");
    expect(monthNames("hijri", 1447, "en")[9]).toBe(new Intl.DateTimeFormat("en-GB", { calendar: "islamic-umalqura", month: "long", timeZone: "UTC" }).format(new Date(`${monthDays({ calendar: "hijri", year: 1447, month: 10 })[0]}T12:00:00Z`)));
  });

  test("Gregorian: choosing a month and a year moves the grid", async () => {
    const el = await mount(<Calendar value="2026-02-18" onValueChange={() => {}} />);
    expect(list(el, "Month").textContent).toBe("February");
    expect(list(el, "Year").textContent).toBe("2026");
    const months = await open(el, "Month");
    expect(months.map((o) => o.textContent)).toEqual(monthNames("gregorian", 2026, "en"));
    await press(months[8]!, { key: "Enter" });
    expect(shown(el)).toBe("September 2026");
    expect(firstDay(el)).toBe("2026-09-01");
    await choose(el, "Year", "2024");
    expect(shown(el)).toBe("September 2024");
    // The shown month is also announced for the previous and next buttons.
    expect(el.querySelector('[aria-live="polite"]')!.textContent).toBe("September 2024");
  });

  test("Hijri: choosing a month and a year moves the grid", async () => {
    const el = await mount(
      <PercentProvider lang="ar">
        <Calendar value="2026-02-18" onValueChange={() => {}} defaultCalendar="hijri" />
      </PercentProvider>,
    );
    expect(list(el, "شهر").textContent).toBe("رمضان");
    expect(list(el, "سنة").textContent).toBe("1447");
    await choose(el, "شهر", "شوال");
    expect(firstDay(el)).toBe(monthDays({ calendar: "hijri", year: 1447, month: 10 })[0]);
    await choose(el, "سنة", "1440");
    expect(shown(el)).toBe("شوال 1440 هـ");
    expect(firstDay(el)).toBe(monthDays({ calendar: "hijri", year: 1440, month: 10 })[0]);
  });

  test("without min and max: 100 years back to 10 years forward in the shown calendar", async () => {
    const el = await mount(<Calendar value={null} onValueChange={() => {}} defaultCalendar="hijri" />);
    const years = (await open(el, "Year")).map((o) => Number(o.textContent));
    const now = partsOf(todayPlain(), "hijri").year;
    expect(years).toHaveLength(111);
    expect([Math.min(...years), Math.max(...years)]).toEqual([now - 100, now + 10]);
  });

  test("min and max limit the years and disable the months outside", async () => {
    const el = await mount(<Calendar value="2026-03-20" min="2025-06-10" max="2026-04-05" onValueChange={() => {}} />);
    expect((await open(el, "Year")).map((o) => o.textContent)).toEqual(["2025", "2026"]);
    await press(list(el, "Year"), { key: "Escape" });
    const enabled = (options: HTMLElement[]) => options.filter((o) => !o.hasAttribute("data-disabled")).map((o) => o.textContent);
    expect(enabled(await open(el, "Month"))).toEqual(monthNames("gregorian", 2026, "en").slice(0, 4));
    await press(document.querySelector('[role="option"]')!, { key: "Escape" });
    // A year change keeps the month when it can, else the nearest month inside min and max.
    await choose(el, "Year", "2025");
    expect(shown(el)).toBe("June 2025");
    expect(enabled(await open(el, "Month"))).toEqual(monthNames("gregorian", 2025, "en").slice(5));
  });

  test("Hijri min and max give Hijri years", async () => {
    const el = await mount(<Calendar value="2026-03-20" min="2025-06-10" max="2026-04-05" defaultCalendar="hijri" onValueChange={() => {}} />);
    const years = (await open(el, "Year")).map((o) => Number(o.textContent));
    expect(years).toEqual([partsOf("2025-06-10", "hijri").year, partsOf("2026-04-05", "hijri").year]);
  });
});
