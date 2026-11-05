import { describe, expect, test } from "bun:test";
import { act, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Calendar, DateRangePicker, nextRange, PercentProvider, rangePreset, todayPlain, type DateRange } from "../src";
import { click, mount, press, useDom } from "./dom";

useDom();

const r = (from: string | null, to: string | null): DateRange => ({ from, to });

describe("range helpers", () => {
  test("nextRange", () => {
    expect(nextRange(r(null, null), "2026-09-05")).toEqual(r("2026-09-05", null));
    expect(nextRange(r("2026-09-05", null), "2026-09-09")).toEqual(r("2026-09-05", "2026-09-09"));
    expect(nextRange(r("2026-09-05", null), "2026-09-02")).toEqual(r("2026-09-02", "2026-09-05"));
    expect(nextRange(r("2026-09-02", "2026-09-05"), "2026-09-07")).toEqual(r("2026-09-07", null));
    // Only `to` (an "until" filter): the day joins it.
    expect(nextRange(r(null, "2026-09-15"), "2026-09-12")).toEqual(r("2026-09-12", "2026-09-15"));
  });

  test("rangePreset last 7 and last 30 days include today", () => {
    expect(rangePreset("last7Days", "2026-09-30")).toEqual({ from: "2026-09-24", to: "2026-09-30" });
    expect(rangePreset("last30Days", "2026-09-30")).toEqual({ from: "2026-09-01", to: "2026-09-30" });
    expect(rangePreset("last7Days", "2026-03-03")).toEqual({ from: "2026-02-25", to: "2026-03-03" });
  });

  test("rangePreset", () => {
    expect(rangePreset("thisWeek", "2026-09-30")).toEqual({ from: "2026-09-27", to: "2026-09-30" });
    expect(rangePreset("thisMonth", "2026-09-30")).toEqual({ from: "2026-09-01", to: "2026-09-30" });
    expect(rangePreset("lastMonth", "2026-09-30")).toEqual({ from: "2026-08-01", to: "2026-08-31" });
    expect(rangePreset("lastMonth", "2026-01-15")).toEqual({ from: "2025-12-01", to: "2025-12-31" });
    expect(rangePreset("today", "2026-09-27")).toEqual({ from: "2026-09-27", to: "2026-09-27" });
    expect(rangePreset("yesterday", "2026-09-27")).toEqual({ from: "2026-09-26", to: "2026-09-26" });
    expect(rangePreset("yesterday", "2026-03-01")).toEqual({ from: "2026-02-28", to: "2026-02-28" });
    // A week that starts on Saturday.
    expect(rangePreset("thisWeek", "2026-09-30", 6)).toEqual({ from: "2026-09-26", to: "2026-09-30" });
  });
});

describe("Calendar range mode", () => {
  test("Calendar range: the days in the range are selected; Enter sets from, then to", async () => {
    let last = r(null, null);
    function Range() {
      const [value, setValue] = useState(r("2026-09-10", "2026-09-12"));
      return (
        <Calendar
          mode="range"
          value={value}
          onValueChange={(v) => {
            last = v;
            setValue(v);
          }}
        />
      );
    }
    const el = await mount(<Range />);
    const selected = () => [...el.querySelectorAll('[aria-selected="true"] [data-day]')].map((b) => b.getAttribute("data-day"));
    expect(el.querySelector('[role="grid"]')!.getAttribute("aria-multiselectable")).toBe("true");
    expect(selected()).toEqual(["2026-09-10", "2026-09-11", "2026-09-12"]);
    const day = (d: string) => el.querySelector<HTMLButtonElement>(`[data-day="${d}"]`)!;
    expect(day("2026-09-10").className).toContain("bg-primary");
    expect(day("2026-09-11").className).not.toContain("bg-primary");

    // Enter on a focused day button is a click in the browser; happy-dom does not make that click, so the test does.
    const enter = async (d: string) => {
      await act(async () => day(d).focus());
      await press(day(d), { key: "Enter" });
      await click(day(d));
    };
    await enter("2026-09-15");
    expect(last).toEqual(r("2026-09-15", null));
    expect(selected()).toEqual(["2026-09-15"]);
    await enter("2026-09-18");
    expect(last).toEqual(r("2026-09-15", "2026-09-18"));
    expect(selected()).toEqual(["2026-09-15", "2026-09-16", "2026-09-17", "2026-09-18"]);
  });

  test("single mode keeps its markup", () => {
    const html = renderToStaticMarkup(<Calendar value="2026-09-10" onValueChange={() => {}} />);
    expect(html).not.toContain("aria-multiselectable");
    expect(html.match(/aria-selected="true"/g)).toHaveLength(1);
  });
});

describe("DateRangePicker", () => {
  const label = (value: DateRange) =>
    renderToStaticMarkup(
      <PercentProvider lang="ar">
        <DateRangePicker value={value} onValueChange={() => {}} />
      </PercentProvider>,
    );

  test("DateRangePicker label in Arabic: LTR range, from only, until only", () => {
    expect(label(r("2026-09-12", "2026-09-15"))).toContain('<span dir="ltr">12/09/2026 – 15/09/2026</span>');
    expect(label(r("2026-09-12", null))).toContain("من 12/09/2026");
    expect(label(r(null, "2026-09-15"))).toContain("حتى 15/09/2026");
    const one = label(r("2026-09-12", "2026-09-12"));
    expect(one).toContain("12/09/2026");
    expect(one).not.toContain("–");
    expect(label(r(null, null))).toContain("الفترة");
    expect(renderToStaticMarkup(<DateRangePicker value={r(null, null)} onValueChange={() => {}} placeholder="Any date" />)).toContain("Any date");
  });

  test("DateRangePicker size sm uses the small control height", () => {
    const trigger = (html: string) => html.match(/<button[^>]*aria-haspopup[^>]*>/)![0];
    const sm = trigger(renderToStaticMarkup(<DateRangePicker size="sm" value={r(null, null)} onValueChange={() => {}} />));
    expect(sm).toContain("h-(--p-control-h-sm)");
    expect(sm).not.toContain("h-(--p-control-h) ");
    expect(trigger(label(r(null, null)))).toContain("h-(--p-control-h) ");
  });

  test("a preset click commits and closes; the clear button empties the range and is named مسح التاريخ", async () => {
    let last = r(null, null);
    function Picker() {
      const [value, setValue] = useState(r("2026-09-12", "2026-09-15"));
      return (
        <PercentProvider lang="ar">
          <DateRangePicker
            value={value}
            onValueChange={(v) => {
              last = v;
              setValue(v);
            }}
          />
        </PercentProvider>
      );
    }
    const el = await mount(<Picker />);
    await click(el.querySelector("button")!);
    // Focus starts on the selected day, as in DatePicker.
    expect(document.activeElement?.getAttribute("data-day")).toBe("2026-09-12");
    const preset = [...document.querySelectorAll('[role="dialog"] button')].find((b) => b.textContent === "هذا الشهر")!;
    await click(preset);
    expect(last).toEqual(rangePreset("thisMonth", todayPlain()));
    expect(document.querySelector('[role="dialog"]')).toBeNull();

    const clear = el.querySelector('button[aria-label="مسح التاريخ"]')!;
    await click(clear);
    expect(last).toEqual(r(null, null));
    expect(el.querySelector('button[aria-label="مسح التاريخ"]')).toBeNull();
    expect(el.textContent).toContain("الفترة");
  });
});
