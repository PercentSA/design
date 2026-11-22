import { describe, expect, test } from "bun:test";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PercentProvider } from "../src";
import { AreaChart, LineChart } from "../src/components/charts/line-chart";
import { mount, press, useDom } from "./dom";

useDom();

const en = (node: ReactNode) => renderToStaticMarkup(<PercentProvider lang="en">{node}</PercentProvider>);
const data = [
  { t: "10:00", cpu: 20 },
  { t: "10:05", cpu: 40 },
  { t: "10:10", cpu: 95 },
  { t: "10:15", cpu: 30 },
];
const base = { data, x: "t", series: [{ key: "cpu", label: "CPU" }], title: "CPU", height: 240 };
const limit = { value: 100, label: "Limit 1 CPU" };


describe("chart limit and point select", () => {
  test("limit draws a dashed line with its label inside the plot", () => {
    const html = en(<LineChart {...base} limit={limit} />);
    const m = html.match(/<line[^>]*stroke-dasharray="4 4"[^>]*>/);
    expect(m).not.toBeNull();
    const y = Number(m![0].match(/y1="([\d.]+)"/)![1]);
    expect(y).toBeGreaterThanOrEqual(8);
    expect(y).toBeLessThanOrEqual(216);
    expect(html).toContain("Limit 1 CPU</text>");
  });

  test("the axis grows to show a limit above the data", () => {
    const html = en(<LineChart {...base} data={[{ t: "a", cpu: 10 }, { t: "b", cpu: 40 }]} limit={{ value: 80, label: "L" }} />);
    const ticks = [...html.matchAll(/text-anchor="end"[^>]*>(\d+)<\/text>/g)].map((m) => Number(m[1]));
    expect(Math.max(...ticks)).toBeGreaterThanOrEqual(80);
  });

  test("the limit label is in the hidden text for screen readers", () => {
    const html = en(<LineChart {...base} limit={limit} />);
    expect(html).toMatch(/class="sr-only"[\s\S]*Limit 1 CPU/);
  });

  test("in a mirrored chart the limit label is at the left end", () => {
    const html = en(<LineChart {...base} limit={limit} mirror />);
    expect(html).toMatch(/text-anchor="start"[^>]*>Limit 1 CPU/);
    expect(en(<LineChart {...base} limit={limit} />)).toMatch(/text-anchor="end"[^>]*>Limit 1 CPU/);
  });

  test("a value at 90 % of the limit or more shows in the warning colour", async () => {
    const el = await mount(<PercentProvider lang="en"><LineChart {...base} limit={limit} /></PercentProvider>);
    const fig = el.querySelector("figure")!;
    await press(fig, { key: "End" });
    await press(fig, { key: "ArrowLeft" });
    expect(el.querySelector("[data-tooltip] .text-warning")?.textContent).toBe("95");
    await press(fig, { key: "Home" });
    expect(el.querySelector("[data-tooltip] .text-warning")).toBeNull();
  });

  test("a click on the plot calls onSelectPoint with the x label and the index", async () => {
    const calls: [string, number][] = [];
    const el = await mount(<PercentProvider lang="en"><LineChart {...base} onSelectPoint={(x, i) => calls.push([x, i])} /></PercentProvider>);
    const rect = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = () => ({ left: 0, top: 0, width: 640, height: 240, right: 640, bottom: 240, x: 0, y: 0, toJSON() {} }) as DOMRect;
    const plot = el.querySelector("svg")!.parentElement!.parentElement!;
    expect(plot.className).toContain("cursor-pointer");
    await import("react").then(({ act }) =>
      act(async () => {
        // Row 1 centre is left of the middle: x about 200 of 640.
        plot.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: 215, clientY: 100 }));
      }),
    );
    Element.prototype.getBoundingClientRect = rect;
    expect(calls).toEqual([["10:05", 1]]);
  });

  test("Enter on the focused chart calls onSelectPoint for the active row; without onSelectPoint Enter does nothing", async () => {
    const calls: [string, number][] = [];
    const el = await mount(<PercentProvider lang="en"><LineChart {...base} onSelectPoint={(x, i) => calls.push([x, i])} /></PercentProvider>);
    const fig = el.querySelector("figure")!;
    await press(fig, { key: "Enter" });
    expect(calls).toEqual([]);
    await press(fig, { key: "Home" });
    await press(fig, { key: "ArrowRight" });
    await press(fig, { key: "Enter" });
    expect(calls).toEqual([["10:05", 1]]);
    expect(fig.getAttribute("aria-describedby")).toBeTruthy();
    expect(document.getElementById(fig.getAttribute("aria-describedby")!)?.textContent).toBe("Press Enter to open the chosen point.");
    await press(fig, { key: "End" });
    const ev = new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true });
    fig.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
    expect(calls.at(-1)).toEqual(["10:15", 3]);

    const plain = await mount(<PercentProvider lang="en"><LineChart {...base} /></PercentProvider>);
    const f2 = plain.querySelector("figure")!;
    expect(f2.hasAttribute("aria-describedby")).toBe(false);
    await press(f2, { key: "Home" });
    const e2 = new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true });
    f2.dispatchEvent(e2);
    expect(e2.defaultPrevented).toBe(false);
  });

  test("AreaChart takes the same props", () => {
    const html = en(<AreaChart {...base} limit={limit} onSelectPoint={() => {}} />);
    expect(html).toContain('stroke-dasharray="4 4"');
    expect(html).toContain("cursor-pointer");
  });

  test("a chart without the new props renders as before", () => {
    const html = en(<LineChart {...base} />);
    expect(html).not.toContain("4 4");
    expect(html).not.toContain("cursor-pointer");
    expect(html).not.toContain("aria-describedby");
  });
});
