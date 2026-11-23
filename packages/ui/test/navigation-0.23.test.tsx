import { afterEach, describe, expect, jest, test } from "bun:test";
import { act } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RouteTabs, Sidebar, Tabs, Tooltip, type RouteTab, type SidebarSection } from "../src";
import { click, mount, press, useDom } from "./dom";

useDom();

const sections: SidebarSection[] = [
  { title: "Plain", items: [{ href: "/a", label: "A", icon: <svg /> }] },
  { title: "Folding", collapsible: true, id: "f", items: [{ href: "/b", label: "B", icon: <svg /> }] },
];

describe("Sidebar section titles", () => {
  test("a folding section title has the same title classes as a plain title", async () => {
    const el = await mount(<Sidebar sections={sections} />);
    const plain = [...el.querySelectorAll("h2")].find((h) => h.textContent === "Plain")!;
    const button = el.querySelector("h2 button")!;
    expect(plain.classList.contains("label")).toBe(true);
    expect(button.classList.contains("label")).toBe(true);
  });
});

const names = ["Overview", "Deployments", "Logs", "Metrics", "Environment", "Settings"];
const items: RouteTab[] = names.map((value) => ({ value, label: value, href: `#${value}` }));
const widths: Record<string, number> = { Overview: 96, Deployments: 118, Logs: 64, Metrics: 80, Environment: 116, Settings: 88, more: 72 };

describe("tab scroll row", () => {
  test("the tab scroll row has block padding and a negative block margin", async () => {
    const t = await mount(<Tabs defaultValue="a" items={[{ value: "a", label: "A", content: "x" }]} />);
    const r = await mount(<RouteTabs label="x" items={items} current="Overview" />);
    for (const row of [t.querySelector('[role="tablist"]')!, r.querySelector("nav")!]) {
      expect(row.classList.contains("py-1")).toBe(true);
      expect(row.classList.contains("-my-1")).toBe(true);
    }
  });
});

// Stubs: own property of the prototype is saved and restored; the observer is deleted again.
let rowWidth = 0;
let savedRect: PropertyDescriptor | undefined;
let savedRO: PropertyDescriptor | undefined;
function stubLayout(width: number) {
  rowWidth = width;
  savedRect = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "getBoundingClientRect");
  savedRO = Object.getOwnPropertyDescriptor(globalThis, "ResizeObserver");
  Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", {
    configurable: true,
    writable: true,
    value(this: HTMLElement) {
      const m = this.getAttribute("data-measure");
      const w = m ? widths[m]! : this.tagName === "NAV" ? rowWidth : 0;
      return { x: 0, y: 0, left: 0, top: 0, right: w, bottom: 0, width: w, height: 0, toJSON() {} };
    },
  });
  Object.defineProperty(globalThis, "ResizeObserver", {
    configurable: true,
    writable: true,
    value: class {
      constructor(private cb: () => void) {}
      observe(el: Element) {
        // Only the tab row reports a size; other observers (menu placement) stay silent.
        if (el.tagName === "NAV") this.cb();
      }
      unobserve() {}
      disconnect() {}
    },
  });
}
afterEach(() => {
  if (savedRect) Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", savedRect);
  else if (savedRect === undefined && rowWidth) delete (HTMLElement.prototype as { getBoundingClientRect?: unknown }).getBoundingClientRect;
  if (savedRO) Object.defineProperty(globalThis, "ResizeObserver", savedRO);
  else delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
  savedRect = savedRO = undefined;
  rowWidth = 0;
});

const row = (el: Element) => [...el.querySelectorAll<HTMLElement>("nav > a")];
const shown = (el: Element) => row(el).filter((a) => !a.classList.contains("max-md:hidden")).map((a) => a.textContent);
const more = (el: Element) => [...el.querySelectorAll("nav > button")].some((b) => b.textContent === "More");

describe("RouteTabs phone measure", () => {
  test("the current tab is kept and the tabs fit with More", async () => {
    stubLayout(342);
    expect(shown(await mount(<RouteTabs label="x" items={items} current="Environment" />))).toEqual(["Overview", "Environment"]);
    const el = await mount(<RouteTabs label="x" items={items} current="Overview" />);
    expect(shown(el)).toEqual(["Overview", "Deployments"]);
    expect(more(el)).toBe(true);
  });
  test("a narrow row shows only the current tab and More", async () => {
    stubLayout(180);
    const el = await mount(<RouteTabs label="x" items={items} current="Logs" />);
    expect(shown(el)).toEqual(["Logs"]);
    expect(more(el)).toBe(true);
  });
  test("a tab is never in the row and in More at once", async () => {
    stubLayout(342);
    const el = await mount(<RouteTabs label="x" items={items} current="Environment" />);
    const inRow = shown(el);
    const trigger = el.querySelector<HTMLElement>("nav > button[aria-haspopup]")!;
    await click(trigger);
    await press(trigger, { key: "Enter" });
    const menu = [...document.querySelectorAll('[role="menuitem"]')].map((m) => m.textContent);
    expect(menu.length).toBe(names.length - inRow.length);
    for (const n of inRow) expect(menu).not.toContain(n);
  });
  test("all tabs fit: no More", async () => {
    stubLayout(2000);
    const el = await mount(<RouteTabs label="x" items={items} current="Overview" />);
    expect(shown(el).length).toBe(names.length);
    expect(more(el)).toBe(false);
  });
  test("from 768 px all tabs show: the row hides tabs and More only below md", async () => {
    stubLayout(342);
    const el = await mount(<RouteTabs label="x" items={items} current="Overview" />);
    // Tabs are hidden by max-md: only, and More by md:, so from 768 px all tabs show and More is gone.
    expect(row(el).every((a) => !a.className.split(" ").includes("hidden"))).toBe(true);
    expect(el.querySelector<HTMLElement>("nav > button[aria-haspopup]")!.classList.contains("md:hidden")).toBe(true);
  });
  test("the hidden measure row is aria-hidden and inert", async () => {
    stubLayout(342);
    const el = await mount(<RouteTabs label="x" items={items} current="Overview" />);
    const m = el.querySelector('[data-measure="more"]')!.parentElement!;
    expect(m.getAttribute("aria-hidden")).toBe("true");
    expect(m.hasAttribute("inert")).toBe(true);
  });
  test("the server render keeps the three-tab rule", () => {
    const html = renderToStaticMarkup(<RouteTabs label="x" items={items} current="Environment" />);
    const doc = new DOMParser().parseFromString(html, "text/html");
    const hidden = [...doc.querySelectorAll("nav > a")].filter((a) => a.classList.contains("max-md:hidden")).map((a) => a.textContent);
    expect(hidden).toEqual(["Logs", "Metrics", "Settings"]);
  });
});

describe("Tooltip focus open and scroll", () => {
  afterEach(() => jest.useRealTimers());
  const open = () => !!document.querySelector('[role="tooltip"]');
  const scroll = () => act(async () => void document.dispatchEvent(new Event("scroll")));
  test("a tooltip opened by focus stays open when the page scrolls in the next 300 ms", async () => {
    jest.useFakeTimers();
    const el = await mount(<Tooltip content="Tip"><button>t</button></Tooltip>);
    const b = el.querySelector("button")!;
    await act(async () => b.focus());
    expect(open()).toBe(true);
    await scroll();
    expect(open()).toBe(true);
    await act(async () => void jest.advanceTimersByTime(301));
    await scroll();
    expect(open()).toBe(false);
  });
  test("a pointer open closes on scroll as before", async () => {
    jest.useFakeTimers();
    const el = await mount(<Tooltip content="Tip"><button>t</button></Tooltip>);
    const b = el.querySelector("button")!;
    await act(async () => {
      b.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, pointerType: "mouse" }));
      jest.advanceTimersByTime(400);
    });
    expect(open()).toBe(true);
    await scroll();
    expect(open()).toBe(false);
  });
});
