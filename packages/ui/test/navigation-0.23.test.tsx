import { afterEach, describe, expect, jest, spyOn, test } from "bun:test";
import { act, useLayoutEffect, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RouteTabs, Sidebar, Tabs, Tooltip, type RouteTab, type SidebarSection } from "../src";
import { click, mount, press, stubMatchMedia, useDom } from "./dom";

useDom();

const sections: SidebarSection[] = [
  { title: "Plain", items: [{ href: "/a", label: "A", icon: <svg /> }] },
  {
    title: "Folding",
    collapsible: true,
    id: "f",
    items: [{ href: "/b", label: "B", icon: <svg /> }],
  },
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
const items: RouteTab[] = names.map((value) => ({
  value,
  label: value,
  href: `#${value}`,
}));
const baseWidths: Record<string, number> = { Overview: 96, Deployments: 118, Logs: 64, Metrics: 80, Environment: 116, Settings: 88, more: 72 };

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

// Stubs: the own descriptor is saved before the first stub of a test and put back after it; delete only when there was none.
const widths: Record<string, number> = {};
let rowWidth = 0;
let saved: { rect: PropertyDescriptor | undefined; ro: PropertyDescriptor | undefined } | null = null;
const observers: { cb: () => void; seen: Element[] }[] = [];
const fire = () => act(async () => observers.forEach((o) => o.cb()));
function stubLayout(width: number) {
  rowWidth = width;
  Object.assign(widths, baseWidths);
  observers.length = 0;
  saved ??= {
    rect: Object.getOwnPropertyDescriptor(HTMLElement.prototype, "getBoundingClientRect"),
    ro: Object.getOwnPropertyDescriptor(globalThis, "ResizeObserver"),
  };
  stubMatchMedia(true);
  Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", {
    configurable: true,
    writable: true,
    value(this: HTMLElement) {
      const m = this.getAttribute("data-measure");
      const w = m ? widths[m]! : this.hasAttribute("data-route-tabs") ? rowWidth : 0;
      return { x: 0, y: 0, left: 0, top: 0, right: w, bottom: 0, width: w, height: 0, toJSON() {} };
    },
  });
  Object.defineProperty(globalThis, "ResizeObserver", {
    configurable: true,
    writable: true,
    value: class {
      o: { cb: () => void; seen: Element[] };
      constructor(cb: () => void) {
        this.o = { cb, seen: [] };
        observers.push(this.o);
      }
      observe(el: Element) {
        this.o.seen.push(el);
        // Only the tab row reports a size at once; other observers (menu placement) stay silent.
        if (el.hasAttribute("data-route-tabs")) this.o.cb();
      }
      unobserve() {}
      disconnect() {}
    },
  });
}
afterEach(() => {
  if (!saved) return;
  if (saved.rect) Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", saved.rect);
  else delete (HTMLElement.prototype as { getBoundingClientRect?: unknown }).getBoundingClientRect;
  if (saved.ro) Object.defineProperty(globalThis, "ResizeObserver", saved.ro);
  else delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
  saved = null;
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

  test("the fit follows a change of a tab width (the measure spans are observed)", async () => {
    stubLayout(342);
    const el = await mount(<RouteTabs label="x" items={items} current="Overview" />);
    expect(shown(el)).toEqual(["Overview", "Deployments"]);
    expect(observers.flatMap((o) => o.seen).some((e) => e.getAttribute("data-measure") === "Deployments")).toBe(true);
    widths.Deployments = 300;
    await fire();
    expect(shown(el)).toEqual(["Overview"]);
  });
  test("a new current tab shows in the same commit", async () => {
    stubLayout(342);
    const log: (string | null)[][] = [];
    function Probe({ c }: { c: string }) {
      // Runs after the RouteTabs commit and before its passive effects.
      useLayoutEffect(
        () => void log.push([...document.querySelectorAll("nav > a")].filter((a) => !a.classList.contains("max-md:hidden")).map((a) => a.textContent)),
        [c],
      );
      return null;
    }
    function H() {
      const [c, setC] = useState("Overview");
      return (
        <>
          <button id="go" onClick={() => setC("Environment")} />
          <RouteTabs label="x" items={items} current={c} />
          <Probe c={c} />
        </>
      );
    }
    const el = await mount(<H />);
    log.length = 0;
    await click(el.querySelector("#go")!);
    expect(log[0]).toEqual(["Overview", "Environment"]);
  });
  const style = (columnGap: string, pad = "0px") =>
    spyOn(window, "getComputedStyle").mockImplementation((() => ({
      columnGap,
      paddingLeft: pad,
      paddingRight: pad,
      borderLeftWidth: "0px",
      borderRightWidth: "0px",
    })) as never);
  test("the gap comes from the computed style of the row", async () => {
    stubLayout(400);
    const spy = style("10px");
    try {
      expect(shown(await mount(<RouteTabs label="x" items={items} current="Overview" />))).toEqual(["Overview", "Deployments", "Logs"]);
    } finally {
      spy.mockRestore();
    }
  });
  test("the width is the content width: padding is taken off", async () => {
    stubLayout(374);
    const spy = style("24px", "16px");
    try {
      expect(shown(await mount(<RouteTabs label="x" items={items} current="Environment" />))).toEqual(["Overview", "Environment"]);
    } finally {
      spy.mockRestore();
    }
  });
  test("a parent render with equal items makes no new observer", async () => {
    stubLayout(342);
    function H() {
      const [n, setN] = useState(0);
      return (
        <>
          <button id="go" onClick={() => setN(n + 1)} />
          <RouteTabs
            label="x"
            items={names.map((value) => ({
              value,
              label: value,
              href: `#${value}`,
            }))}
            current="Overview"
          />
        </>
      );
    }
    const el = await mount(<H />);
    const before = observers.length;
    await click(el.querySelector("#go")!);
    await click(el.querySelector("#go")!);
    expect(observers.length).toBe(before);
  });
  test("the measured element is a full-width wrapper that can shrink", async () => {
    stubLayout(342);
    const el = await mount(<RouteTabs label="x" items={items} current="Overview" />);
    const wrap = el.querySelector("[data-route-tabs]")!;
    expect(wrap.classList.contains("min-w-0")).toBe(true);
    expect(wrap.classList.contains("w-full")).toBe(true);
    expect(observers.flatMap((o) => o.seen)).toContain(wrap);
    expect(wrap.querySelector("nav")).not.toBeNull();
  });
  test("from 768 px there is no measure row: each label is once in the DOM", async () => {
    stubLayout(342);
    stubMatchMedia(false);
    const el = await mount(<RouteTabs label="x" items={items} current="Overview" />);
    expect(el.querySelector("[data-measure]")).toBeNull();
    expect(el.textContent!.split("Overview").length - 1).toBe(1);
  });
  test("a new count or label keeps the measured fit", async () => {
    stubLayout(342);
    const log: (string | null)[][] = [];
    function Probe({ n }: { n: number }) {
      useLayoutEffect(() => void log.push([...document.querySelectorAll("nav > a")].filter((a) => !a.classList.contains("max-md:hidden")).map((a) => a.textContent?.replace(/\d+$/, "") ?? null)), [n]);
      return null;
    }
    function H() {
      const [n, setN] = useState(1);
      return (
        <>
          <button id="go" onClick={() => setN(n + 1)} />
          <RouteTabs label="x" items={items.map((i) => (i.value === "Deployments" ? { ...i, count: n, label: `Deployments` } : i))} current="Overview" />
          <Probe n={n} />
        </>
      );
    }
    const el = await mount(<H />);
    log.length = 0;
    await click(el.querySelector("#go")!);
    expect(log[0]).toEqual(["Overview", "Deployments"]);
  });
  test("the phone query is the same rule as max-md", async () => {
    stubLayout(342);
    const queries: string[] = [];
    Object.defineProperty(globalThis, "matchMedia", {
      configurable: true,
      writable: true,
      value: (q: string) => (queries.push(q), { matches: true, media: q, addEventListener() {}, removeEventListener() {} }),
    });
    await mount(<RouteTabs label="x" items={items} current="Overview" />);
    expect(queries).toEqual(["(width < 48rem)"]);
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
    expect(html.split(">Overview<").length - 1).toBe(1);
  });
});

describe("Tooltip focus open and scroll", () => {
  afterEach(() => jest.useRealTimers());
  const open = () => !!document.querySelector('[role="tooltip"]');
  const scroll = () => act(async () => void document.dispatchEvent(new Event("scroll")));
  test("a tooltip opened by focus stays open when the page scrolls in the next 300 ms", async () => {
    jest.useFakeTimers();
    const el = await mount(
      <Tooltip content="Tip">
        <button>t</button>
      </Tooltip>,
    );
    const b = el.querySelector("button")!;
    await act(async () => b.focus());
    expect(open()).toBe(true);
    await scroll();
    expect(open()).toBe(true);
    await act(async () => void jest.advanceTimersByTime(301));
    await scroll();
    expect(open()).toBe(false);
  });
  const focusOpen = async () => {
    jest.useFakeTimers();
    const el = await mount(
      <Tooltip content="Tip">
        <button>t</button>
      </Tooltip>,
    );
    const b = el.querySelector("button")!;
    await act(async () => b.focus());
    expect(open()).toBe(true);
    return b;
  };
  test("a click in the 300 ms after a focus open closes the tooltip", async () => {
    const b = await focusOpen();
    await act(async () => b.click());
    expect(open()).toBe(false);
  });
  test("a pointerdown in the 300 ms after a focus open closes the tooltip", async () => {
    const b = await focusOpen();
    await act(
      async () =>
        void b.dispatchEvent(
          new PointerEvent("pointerdown", { bubbles: true, pointerType: "touch" }),
        ),
    );
    expect(open()).toBe(false);
  });
  test("Escape in the 300 ms after a focus open closes the tooltip", async () => {
    await focusOpen();
    await act(async () => void document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" })));
    expect(open()).toBe(false);
  });
  test("blur in the 300 ms after a focus open closes the tooltip", async () => {
    const b = await focusOpen();
    await act(async () => b.blur());
    expect(open()).toBe(false);
  });
  test("a pointer open closes on scroll as before", async () => {
    jest.useFakeTimers();
    const el = await mount(
      <Tooltip content="Tip">
        <button>t</button>
      </Tooltip>,
    );
    const b = el.querySelector("button")!;
    await act(async () => {
      b.dispatchEvent(
        new PointerEvent("pointermove", { bubbles: true, pointerType: "mouse" }),
      );
      jest.advanceTimersByTime(400);
    });
    expect(open()).toBe(true);
    await scroll();
    expect(open()).toBe(false);
  });
});
