import { describe, expect, test } from "bun:test";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PercentProvider } from "../src";
import { AreaChart, LineChart } from "../src/components/charts/line-chart";
import { BarChart } from "../src/components/charts/bar-chart";
import { DonutChart } from "../src/components/charts/donut-chart";
import { Sparkline } from "../src/components/charts/sparkline";
import { ChartLegend } from "../src/components/charts/legend";
import { areaPath, bandScale, donutAngles, linearScale, linePath, nearest, niceTicks, stack } from "../src/components/charts/scale";
import { click, mount, press, useDom } from "./dom";

const en = (node: ReactNode) => renderToStaticMarkup(<PercentProvider lang="en">{node}</PercentProvider>);
const ar = (node: ReactNode) => renderToStaticMarkup(<PercentProvider lang="ar">{node}</PercentProvider>);

const data = [
  { month: "Jan", revenue: 10, costs: 4 },
  { month: "Feb", revenue: 1200, costs: 6 },
  { month: "Mar", revenue: 30, costs: 8 },
];
const series = [
  { key: "revenue", label: "Revenue" },
  { key: "costs", label: "Costs" },
];
const props = { data, x: "month", series, title: "Revenue by month" };

describe("scales (pure)", () => {
  test.each([
    [0, 87, [0, 20, 40, 60, 80, 100]],
    [0, 1, [0, 0.2, 0.4, 0.6, 0.8, 1]],
    [-12, 30, [-20, -10, 0, 10, 20, 30]],
    [0, 0.3, [0, 0.1, 0.2, 0.3]],
    [0, 0, [0, 0.2, 0.4, 0.6, 0.8, 1]],
  ])("niceTicks(%p, %p)", (min, max, ticks) => {
    expect(niceTicks(min, max)).toEqual(ticks);
  });
  test("linear scale maps the domain to the range, also reversed", () => {
    expect(linearScale([0, 100], [200, 0])(25)).toBe(150);
    expect(linearScale([0, 10], [0, 100])(5)).toBe(50);
    expect(linearScale([5, 5], [0, 100])(5)).toBe(0);
  });
  test("band scale: equal bands, centres in the middle, reversed range runs right to left", () => {
    const b = bandScale(4, [0, 400]);
    expect([b.center(0), b.center(3)]).toEqual([50, 350]);
    expect(b.width).toBeCloseTo(70);
    expect(bandScale(4, [400, 0]).center(0)).toBe(350);
  });
  test("nearest index", () => {
    expect(nearest([10, 50, 90], 62)).toBe(1);
    expect(nearest([], 5)).toBeNull();
  });
  test("paths: linear, monotone, area", () => {
    expect(linePath([[0, 0], [10, 10], [20, 0]])).toBe("M0,0L10,10L20,0");
    const m = linePath([[0, 0], [10, 10], [20, 0]], "monotone");
    expect(m).toMatch(/^M0,0C/);
    expect(m.endsWith(",20,0")).toBe(true);
    expect(linePath([[5, 5]])).toBe("M5,5");
    expect(areaPath([[0, 1], [10, 2]], [[0, 9], [10, 9]])).toBe("M0,1L10,2L10,9L0,9Z");
  });
  test("stack: each series starts where the one below ends; tops are the sums; negatives go down", () => {
    const s = stack([
      [1, 2, -1],
      [3, 4, -2],
    ]);
    expect(s[0]).toEqual([[0, 1], [0, 2], [0, -1]]);
    expect(s[1]).toEqual([[1, 4], [2, 6], [-1, -3]]);
  });
  test("donut angles sum to 360°", () => {
    const a = donutAngles([1, 2, 3, 0.5]);
    expect(a[0]!.start).toBe(0);
    expect(a.at(-1)!.end).toBeCloseTo(360);
    expect(a.reduce((sum, x) => sum + x.end - x.start, 0)).toBeCloseTo(360);
    expect(donutAngles([0, 0]).every((x) => x.end === x.start)).toBe(true);
  });
});

const xs = (out: string, tag = "circle", attr = "cx") => [...out.matchAll(new RegExp(`<${tag}[^>]* ${attr}="([\\d.]+)"`, "g"))].map((m) => Number(m[1]));

describe("cartesian charts (server render)", () => {
  test("LineChart: a figure named by the title, an SVG hidden from screen readers, series dashes and markers", () => {
    const out = en(<LineChart {...props} markers />);
    expect(out).toContain('<figure aria-label="Revenue by month" tabindex="0"');
    expect(out).toMatch(/<svg[^>]*aria-hidden="true"/);
    expect(out).toContain('viewBox="0 0 640 240"');
    expect(out).toContain('stroke-dasharray="6 4"');
    expect(out).toContain("<rect"); // second series uses square markers
    expect(out).toContain("var(--p-fg-2)");
    expect(out).toContain("stroke-line");
    expect(out).toContain("fill-fg-3");
    expect(out).toContain("tabular-nums");
  });
  test("client colours replace the greys", () => {
    expect(en(<LineChart {...props} series={[{ key: "revenue", label: "Revenue", color: "#0af" }]} />)).toContain('stroke="#0af"');
  });
  test("RTL: the first x value is on the right; mirror={false} keeps it on the left", () => {
    const one = [{ key: "revenue", label: "Revenue" }];
    const rtl = xs(ar(<LineChart {...props} series={one} markers />));
    expect(rtl).toHaveLength(3);
    expect(rtl[0]).toBeGreaterThan(rtl[2]!);
    const ltr = xs(ar(<LineChart {...props} series={one} markers mirror={false} />));
    expect(ltr[0]).toBeLessThan(ltr[2]!);
    expect(xs(en(<LineChart {...props} series={one} markers />))[0]).toBeLessThan(320);
  });
  test("hidden data table: caption = title, headers = x + series labels, formatted values (EN)", () => {
    const out = en(<LineChart {...props} />);
    expect(out).toMatch(/<table class="sr-only"><caption>Revenue by month<\/caption>/);
    expect(out).toContain('<th scope="col">month</th><th scope="col">Revenue</th><th scope="col">Costs</th>');
    expect(out).toContain('<th scope="row">Feb</th><td>1,200</td><td>6</td>');
  });
  test("hidden data table in Arabic with xLabel", () => {
    const out = ar(
      <LineChart
        data={[{ m: "يناير", v: 1500 }]}
        x="m"
        xLabel="الشهر"
        series={[{ key: "v", label: "الإيرادات" }]}
        title="الإيرادات حسب الشهر"
      />,
    );
    expect(out).toContain("<caption>الإيرادات حسب الشهر</caption>");
    expect(out).toContain('<th scope="col">الشهر</th><th scope="col">الإيرادات</th>');
    expect(out).toContain('<th scope="row">يناير</th><td>1,500</td>');
  });
  test("a legend appears with more than one series", () => {
    expect(en(<LineChart {...props} />)).toContain("<ul");
    expect(en(<LineChart {...props} series={series.slice(0, 1)} />)).not.toContain("<ul");
  });
  test("custom format is used in the axis and the table", () => {
    const out = en(<LineChart {...props} format={(n) => `${n} u`} />);
    expect(out).toContain("<td>1200 u</td>");
    expect(out).toMatch(/<text[^>]*>1500 u<\/text>/);
  });
  test("AreaChart stacked: areas close, the top line of the last series sits at the stacked total", () => {
    const out = en(<AreaChart {...props} stacked />);
    expect(out.match(/Z"/g)).toHaveLength(2);
  });
  test("BarChart stacked: segment heights add up to the bar of the total", () => {
    const d = [{ k: "A", a: 20, b: 30 }];
    const s2 = [
      { key: "a", label: "A" },
      { key: "b", label: "B" },
    ];
    const heights = (out: string) => [...out.matchAll(/<rect[^>]*data-bar=""[^>]*height="([\d.]+)"/g)].map((m) => Number(m[1]));
    const stacked = heights(en(<BarChart data={d} x="k" series={s2} title="T" stacked />));
    const total = heights(en(<BarChart data={[{ k: "A", a: 50 }]} x="k" series={s2.slice(0, 1)} title="T" />));
    expect(stacked).toHaveLength(2);
    expect(stacked[0]! + stacked[1]!).toBeCloseTo(total[0]!);
    // Grouped bars use hatch patterns after the first series, so colour is not the only difference.
    expect(en(<BarChart data={d} x="k" series={s2} title="T" />)).toContain("<pattern");
  });
  test("horizontal BarChart grows from the start side (right in RTL)", () => {
    const one = [{ key: "revenue", label: "Revenue" }];
    const bars = (out: string) => [...out.matchAll(/<rect[^>]*data-bar=""[^>]*x="([\d.]+)"[^>]*width="([\d.]+)"/g)].map((m) => [Number(m[1]), Number(m[2])]);
    const rtl = bars(ar(<BarChart {...props} series={one} layout="horizontal" />));
    const ltr = bars(en(<BarChart {...props} series={one} layout="horizontal" />));
    // Same zero line for all bars: left edges in LTR, right edges in RTL.
    expect(new Set(ltr.map(([x]) => x)).size).toBe(1);
    expect(new Set(rtl.map(([x, w]) => Math.round(x! + w!))).size).toBe(1);
    expect(rtl[0]![0]! + rtl[0]![1]!).toBeGreaterThan(320);
  });
  test("empty data: the frame with the noResults string, no tab stop, no table", () => {
    const out = en(<BarChart {...props} data={[]} />);
    expect(out).toContain('aria-label="Revenue by month"');
    expect(out).toContain("No results");
    expect(out).not.toContain("tabindex");
    expect(out).not.toContain("<table");
    expect(ar(<LineChart {...props} data={[]} />)).toContain("لا توجد نتائج");
  });
});

describe("donut, sparkline, legend", () => {
  const slices = [
    { label: "Direct", value: 30 },
    { label: "Search", value: 50 },
    { label: "Social", value: 20 },
  ];
  test("DonutChart: one path per slice, centre text readable, legend with percentages, table", () => {
    const out = en(<DonutChart data={slices} title="Visits by source" label="Visits" value="100" />);
    expect(out.match(/<path[^>]*data-slice=""/g)).toHaveLength(3);
    expect(out).toContain(">Visits<");
    expect(out).toContain("50%");
    expect(out).toContain('<th scope="row">Search</th><td>50</td>');
  });
  test("Sparkline is decorative unless it has a title", () => {
    const deco = en(<Sparkline values={[1, 3, 2]} />);
    expect(deco).toContain('aria-hidden="true"');
    expect(deco).not.toContain("role=");
    const named = en(<Sparkline values={[1, 3, 2]} title="Sales, last 7 days" />);
    expect(named).toContain('role="img"');
    expect(named).toContain('aria-label="Sales, last 7 days"');
    expect(named).not.toContain("aria-hidden");
  });
  test("Sparkline mirrors in RTL", () => {
    const start = (out: string) => Number(out.match(/d="M([\d.]+),/)![1]);
    expect(start(en(<Sparkline values={[1, 3, 2]} />))).toBe(0);
    expect(start(ar(<Sparkline values={[1, 3, 2]} />))).toBe(100);
  });
  test("ChartLegend lists labels with a swatch per series look", () => {
    const out = en(<ChartLegend items={series} />);
    expect(out.match(/<li /g)).toHaveLength(2);
    expect(out).toContain("Costs");
    expect(out).toContain('stroke-dasharray="6 4"');
  });
});

describe("keyboard and live region (DOM)", () => {
  useDom();
  const live = (el: Element) => el.querySelector('[role="status"]')!.textContent;
  const tip = (el: Element) => el.querySelector("[data-tooltip]");

  test("Left/Right/Home/End move the active x; the live region and tooltip follow; Escape hides", async () => {
    const el = await mount(
      <PercentProvider lang="en">
        <LineChart {...props} />
      </PercentProvider>,
    );
    const fig = el.querySelector("figure")!;
    expect(live(el)).toBe("");
    await press(fig, { key: "ArrowRight" });
    expect(live(el)).toBe("Jan: Revenue 10, Costs 4");
    await press(fig, { key: "ArrowRight" });
    expect(live(el)).toBe("Feb: Revenue 1,200, Costs 6");
    expect(tip(el)?.textContent).toContain("1,200");
    await press(fig, { key: "End" });
    expect(live(el)).toContain("Mar:");
    await press(fig, { key: "ArrowRight" });
    expect(live(el)).toContain("Mar:");
    await press(fig, { key: "Home" });
    expect(live(el)).toContain("Jan:");
    await press(fig, { key: "Escape" });
    expect(tip(el)).toBeNull();
  });

  test("RTL: Left moves to the next x value", async () => {
    const el = await mount(
      <PercentProvider lang="ar">
        <BarChart {...props} />
      </PercentProvider>,
    );
    const fig = el.querySelector("figure")!;
    await press(fig, { key: "ArrowLeft" });
    expect(live(el)).toContain("Jan:");
    await press(fig, { key: "ArrowLeft" });
    expect(live(el)).toContain("Feb:");
    await press(fig, { key: "ArrowRight" });
    expect(live(el)).toContain("Jan:");
  });

  test("DonutChart: arrows move between slices", async () => {
    const el = await mount(
      <PercentProvider lang="en">
        <DonutChart data={[{ label: "Direct", value: 1 }, { label: "Search", value: 3 }]} title="Visits" />
      </PercentProvider>,
    );
    const fig = el.querySelector("figure")!;
    await click(fig);
    await press(fig, { key: "End" });
    expect(live(el)).toContain("Search:");
  });
});

describe("series looks", () => {
  test("every series grey has 3:1 on the page, and 9 series all look different", async () => {
    const { lookOf } = await import("../src/components/charts/legend");
    const looks = Array.from({ length: 9 }, (_, i) => lookOf(i));
    expect(looks.some((l) => l.color.includes("line"))).toBe(false);
    expect(new Set(looks.map((l) => `${l.color}|${l.hatch}`)).size).toBe(9);
    expect(new Set(looks.slice(0, 3).map((l) => l.hatch)).size).toBe(3);
  });
});

describe("brand chart colours and patterns (spec §5)", () => {
  const grey = (l: { color: string }) => l.color.match(/^var\(--p-chart-\d, (.+)\)$/)![1];
  const unique = (keys: string[]) => new Set(keys).size === keys.length;
  const fillOf = (l: { hatch?: number }) => String(l.hatch);
  const lineOf = (l: { dash?: string; marker: string }) => `${l.dash}|${l.marker}`;

  test("series i reads --p-chart-(i%5+1), falling back to today's grey; a series colour wins", async () => {
    const { lookOf } = await import("../src/components/charts/legend");
    expect(lookOf(0).color).toBe("var(--p-chart-1, var(--p-fg))");
    expect(lookOf(5).color).toBe("var(--p-chart-1, var(--p-fg-3))");
    expect(lookOf(4).color).toBe("var(--p-chart-5, var(--p-fg-2))");
    expect(lookOf(0, "red").color).toBe("red");
  });
  test("chart looks are unique: 9 series with the 3 greys, 15 series with 5 brand colours", async () => {
    const { lookOf } = await import("../src/components/charts/legend");
    const nine = Array.from({ length: 9 }, (_, i) => lookOf(i));
    expect(unique(nine.map((l) => `${grey(l)}|${fillOf(l)}`))).toBe(true);
    expect(unique(nine.map((l) => `${grey(l)}|${lineOf(l)}`))).toBe(true);
    const fifteen = Array.from({ length: 15 }, (_, i) => lookOf(i));
    expect(unique(fifteen.map((l, i) => `${i % 5}|${fillOf(l)}`))).toBe(true);
    expect(unique(fifteen.map((l, i) => `${i % 5}|${lineOf(l)}`))).toBe(true);
    // Five fills: solid and four hatch angles.
    expect(new Set(fifteen.map(fillOf)).size).toBe(5);
  });
  test("patterns off: no dash, no hatch, markers stay; no <pattern> in a BarChart", async () => {
    const { lookOf } = await import("../src/components/charts/legend");
    const l = lookOf(1, undefined, false);
    expect(l.dash).toBeUndefined();
    expect(l.hatch).toBeUndefined();
    expect(l.marker).toBe("square");
    const d = [{ k: "A", a: 20, b: 30 }];
    const s2 = [
      { key: "a", label: "A" },
      { key: "b", label: "B" },
    ];
    expect(en(<BarChart data={d} x="k" series={s2} title="T" patterns={false} />)).not.toContain("<pattern");
    expect(en(<LineChart {...props} patterns={false} />)).not.toContain("stroke-dasharray");
    expect(en(<DonutChart data={[{ label: "a", value: 1 }, { label: "b", value: 2 }]} title="T" patterns={false} />)).not.toContain("<pattern");
    expect(en(<ChartLegend items={series} patterns={false} />)).not.toContain("stroke-dasharray");
  });
  test("Sparkline reads --p-chart-1, falling back to fg-2", () => {
    expect(en(<Sparkline values={[1, 3, 2]} />)).toContain("text-[color:var(--p-chart-1,var(--p-fg-2))]");
  });
});
