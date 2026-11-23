import { describe, expect, test } from "bun:test";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Card, PercentProvider } from "../src";
import { AreaChart, LineChart } from "../src/components/charts/line-chart";
import { mount, press, useDom } from "./dom";

useDom();

const en = (node: ReactNode) => renderToStaticMarkup(<PercentProvider lang="en">{node}</PercentProvider>);
const ar = (node: ReactNode) => renderToStaticMarkup(<PercentProvider lang="ar">{node}</PercentProvider>);
// First strong isolate and pop directional isolate: an SVG label keeps its own word order inside the dir="ltr" plot.
const iso = (t: string) => `\u2068${t}\u2069`;
const data = [
  { t: "10:00", cpu: 20 },
  { t: "10:05", cpu: 40 },
  { t: "10:10", cpu: 95 },
  { t: "10:15", cpu: 30 },
];
const base = { data, x: "t", series: [{ key: "cpu", label: "CPU" }], title: "CPU", height: 240 };
const limit = { value: 100, label: "Limit 1 CPU" };


describe("chart limit and point select", () => {
  test("the limit label has its own word order: plaintext bidi and the direction of its first strong letter", () => {
    const style = (label: string) => en(<LineChart {...base} limit={{ value: 100, label }} />).match(/<text[^>]*style="([^"]*)"[^>]*>\u2068/)![1]!;
    expect(style("0.5 GB")).toContain("unicode-bidi:plaintext");
    expect(style("0.5 GB")).toContain("direction:ltr");
    expect(style("0.5 GB الحد")).toContain("direction:ltr");
    expect(style("0.5 الحد GB")).toContain("direction:rtl");
  });
  test("the limit label grows into the plot: its text anchor follows the plot side and the label direction", () => {
    const anchor = (wrap: (n: ReactNode) => string, label: string) => wrap(<LineChart {...base} limit={{ value: 100, label }} />).match(/<text[^>]*text-anchor="([a-z]+)"[^>]*style="[^"]*unicode-bidi:plaintext/)![1];
    // English plot: the label sits at the right edge, so its right end is at x.
    expect(anchor(en, "Limit 1 CPU")).toBe("end");
    expect(anchor(en, "الحد: 0.5 GB")).toBe("start");
    // Arabic plot: the label sits at the left edge, so its left end is at x.
    expect(anchor(ar, "الحد: 0.5 GB")).toBe("end");
    expect(anchor(ar, "Limit 1 CPU")).toBe("start");
  });
  test("limit draws a dashed line with its label inside the plot", () => {
    const html = en(<LineChart {...base} limit={limit} />);
    const m = html.match(/<line[^>]*stroke-dasharray="4 4"[^>]*>/);
    expect(m).not.toBeNull();
    const y = Number(m![0].match(/y1="([\d.]+)"/)![1]);
    expect(y).toBeGreaterThanOrEqual(8);
    expect(y).toBeLessThanOrEqual(216);
    expect(html).toContain(`${iso("Limit 1 CPU")}</text>`);
  });

  test("the limit label stays inside the SVG when the limit is the top tick", () => {
    // Data max 95, limit 100: the line is on the top tick (y 8), so the label goes under the line.
    const html = en(<LineChart {...base} limit={limit} />);
    const t = html.match(/<text([^>]*)>\u2068Limit 1 CPU/)![1]!;
    expect(Number(t.match(/ y="([\d.]+)"/)![1])).toBeGreaterThanOrEqual(12);
    expect(t).toContain('dominant-baseline="hanging"');
    // A limit lower in the plot keeps its label above the line.
    const low = en(<LineChart {...base} limit={{ value: 50, label: "Half" }} />);
    const line = Number(low.match(/<line[^>]*y1="([\d.]+)"[^>]*stroke-dasharray="4 4"/)![1]);
    const lt = low.match(/<text([^>]*)>\u2068Half/)![1]!;
    expect(Number(lt.match(/ y="([\d.]+)"/)![1])).toBe(line - 4);
    expect(lt).not.toContain("dominant-baseline");
  });

  test("an Arabic label keeps its word order: SVG labels are isolated", () => {
    const html = ar(<LineChart {...base} data={[{ t: "يناير 2026", cpu: 10 }, { t: "فبراير 2026", cpu: 20 }]} limit={{ value: 0.5, label: "الحد: 0.5 GB" }} />);
    expect(html).toContain(`${iso("الحد: 0.5 GB")}</text>`);
    expect(html).toContain(`${iso("يناير 2026")}</text>`);
  });

  test("the limit line is not in the draw-in group", async () => {
    const el = await mount(<PercentProvider lang="en"><LineChart {...base} limit={limit} /></PercentProvider>);
    expect(el.querySelector("[data-draw]")!.innerHTML).not.toContain("stroke-dasharray");
    expect(el.querySelector('line[stroke-dasharray="4 4"]')).not.toBeNull();
  });

  test("the axis grows to show a limit above the data", () => {
    const html = en(<LineChart {...base} data={[{ t: "a", cpu: 10 }, { t: "b", cpu: 40 }]} limit={{ value: 80, label: "L" }} />);
    const ticks = [...html.matchAll(/text-anchor="end"[^>]*>\u2068?(\d+)\u2069?<\/text>/g)].map((m) => Number(m[1]));
    expect(Math.max(...ticks)).toBeGreaterThanOrEqual(80);
  });

  test("the limit label is in the hidden text for screen readers", () => {
    const html = en(<LineChart {...base} limit={limit} />);
    expect(html).toMatch(/class="sr-only"[\s\S]*Limit 1 CPU/);
  });

  test("in a mirrored chart the limit label is at the left end", () => {
    const html = en(<LineChart {...base} limit={limit} mirror />);
    expect(html).toMatch(/text-anchor="start"[^>]*>\u2068Limit 1 CPU/);
    expect(en(<LineChart {...base} limit={limit} />)).toMatch(/text-anchor="end"[^>]*>\u2068Limit 1 CPU/);
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

  test("exactly 90 % of the limit shows in the warning colour; less does not", async () => {
    const el = await mount(<PercentProvider lang="en"><LineChart {...base} data={[{ t: "a", cpu: 89.9 }, { t: "b", cpu: 90 }]} limit={limit} /></PercentProvider>);
    const fig = el.querySelector("figure")!;
    await press(fig, { key: "End" });
    expect(el.querySelector("[data-tooltip] .text-warning")?.textContent).toBe("90");
    await press(fig, { key: "Home" });
    expect(el.querySelector("[data-tooltip] .text-warning")).toBeNull();
  });

  test("a click on the plot calls onSelectPoint with the x label and the index", async () => {
    const calls: [string, number][] = [];
    const el = await mount(<PercentProvider lang="en"><LineChart {...base} onSelectPoint={(x, i) => calls.push([x, i])} /></PercentProvider>);
    const rect = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = () => ({ left: 0, top: 0, width: 640, height: 240, right: 640, bottom: 240, x: 0, y: 0, toJSON() {} }) as DOMRect;
    try {
      const plot = el.querySelector("svg")!.parentElement!.parentElement!;
      expect(plot.className).toContain("cursor-pointer");
      await import("react").then(({ act }) =>
        act(async () => {
          // Row 1 centre is left of the middle: x about 200 of 640.
          plot.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: 215, clientY: 100 }));
        }),
      );
    } finally {
      Element.prototype.getBoundingClientRect = rect;
    }
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

  test("the limit label has a halo: paint-order stroke with the chart surface colour; Card sets that colour to its surface", () => {
    const html = en(<LineChart {...base} limit={limit} />);
    const text = html.match(/<text[^>]*>\u2068Limit 1 CPU/)![0];
    expect(text).toContain("[paint-order:stroke]");
    expect(text).toContain("stroke-[color:var(--p-chart-surface,var(--p-bg))]");
    expect(text).not.toContain("var(--color-");
    expect(en(<Card>x</Card>)).toContain("[--p-chart-surface:var(--p-surface)]");
  });

  describe("touch", () => {
    const tapAt = async (plot: Element, x: number, pointerType: string) => {
      const { act } = await import("react");
      await act(async () => {
        plot.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: x, clientY: 100, pointerType }));
        plot.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: x, clientY: 100 }));
      });
    };
    const run = async (fn: (plot: Element, calls: [string, number][], el: HTMLElement) => Promise<void>) => {
      const calls: [string, number][] = [];
      const el = await mount(<PercentProvider lang="en"><LineChart {...base} onSelectPoint={(x, i) => calls.push([x, i])} /></PercentProvider>);
      const rect = Element.prototype.getBoundingClientRect;
      Element.prototype.getBoundingClientRect = () => ({ left: 0, top: 0, width: 640, height: 240, right: 640, bottom: 240, x: 0, y: 0, toJSON() {} }) as DOMRect;
      try {
        await fn(el.querySelector("svg")!.parentElement!.parentElement!, calls, el);
      } finally {
        Element.prototype.getBoundingClientRect = rect;
      }
    };
    const shown = (el: Element) => el.querySelector("[data-tooltip] p")?.textContent;

    test("the first tap shows the value, the second tap on the same point calls onSelectPoint once", () =>
      run(async (plot, calls, el) => {
        await tapAt(plot, 215, "touch");
        expect(calls).toEqual([]);
        expect(shown(el)).toBe("10:05");
        await tapAt(plot, 215, "touch");
        expect(calls).toEqual([["10:05", 1]]);
      }));

    test("a tap on another point moves the value and does not select", () =>
      run(async (plot, calls, el) => {
        await tapAt(plot, 215, "touch");
        await tapAt(plot, 520, "touch");
        expect(calls).toEqual([]);
        expect(shown(el)).toBe("10:15");
        await tapAt(plot, 520, "touch");
        expect(calls).toEqual([["10:15", 3]]);
      }));

    test("the plot has touch-manipulation only with onSelectPoint (no double-tap zoom)", () => {
      expect(en(<LineChart {...base} onSelectPoint={() => {}} />)).toContain("touch-manipulation");
      expect(en(<LineChart {...base} />)).not.toContain("touch-manipulation");
    });

    test("a mouse click calls onSelectPoint at once, as before", () =>
      run(async (plot, calls) => {
        await tapAt(plot, 215, "mouse");
        expect(calls).toEqual([["10:05", 1]]);
      }));
  });
});
