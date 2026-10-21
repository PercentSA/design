import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { act, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PercentProvider, SegmentedControl, Tabs } from "../src";
import { Sidebar, type SidebarSection } from "../src/components/sidebar";
import { click, mount, useDom } from "./dom";

useDom();

// happy-dom has no layout and its ResizeObserver never fires: give items a box and fire observers by hand.
type Box = { x: number; y: number; w: number; h: number };
let laidOut = true;
let frac = 0; // sub-pixel part of the tab boxes
let scale = 1; // a scale on an ancestor (a Dialog popping in)
/** An element's layout box, relative to its list's padding edge (as offset* would be, before rounding). */
function geometry(el: HTMLElement): Box {
  if (!laidOut) return { x: 0, y: 0, w: 0, h: 0 };
  if (el.matches("nav a")) {
    const i = [...document.querySelectorAll("nav a")].indexOf(el);
    return { x: 12, y: i * 40, w: el.closest("[data-collapsed]") ? 40 : 232, h: 36 };
  }
  if (el.matches("[role=tab], [role=radio]")) {
    const i = [...el.parentElement!.querySelectorAll("[role=tab], [role=radio]")].indexOf(el);
    return { x: i * 100 + frac, y: 0, w: 60 + i * 10 + frac, h: 40 };
  }
  return { x: 0, y: 0, w: 300, h: 300 };
}
const LISTS = "[role=tablist], [role=group], nav";
const ORIGIN = { x: 30, y: 20 }; // the list's border box on screen
/** On screen: the list's padding edge (inside its border), minus its scroll, then scaled. */
function rect(this: HTMLElement): DOMRect {
  const b = geometry(this);
  const list = this.parentElement?.closest<HTMLElement>(LISTS);
  const left = ORIGIN.x + ((list ? list.clientLeft - list.scrollLeft : 0) + b.x) * scale;
  const top = ORIGIN.y + ((list ? list.clientTop - list.scrollTop : 0) + b.y) * scale;
  const [width, height] = [b.w * scale, b.h * scale];
  return { left, top, width, height, x: left, y: top, right: left + width, bottom: top + height, toJSON() {} } as DOMRect;
}
const KEYS = { offsetLeft: "x", offsetTop: "y", offsetWidth: "w", offsetHeight: "h" } as const;
const saved = [...Object.keys(KEYS), "clientLeft", "clientTop"].map((k) => [k, Object.getOwnPropertyDescriptor(HTMLElement.prototype, k)] as const);
const savedRect = Element.prototype.getBoundingClientRect;
let observers: ResizeObserverCallback[] = [];
const savedRO = globalThis.ResizeObserver;
beforeAll(() => {
  // offset* are whole pixels and ignore transforms.
  for (const [k, f] of Object.entries(KEYS))
    Object.defineProperty(HTMLElement.prototype, k, { configurable: true, get(this: HTMLElement) { return Math.round(geometry(this)[f]); } });
  // The SegmentedControl group has a 1 px border.
  for (const k of ["clientLeft", "clientTop"])
    Object.defineProperty(HTMLElement.prototype, k, { configurable: true, get(this: HTMLElement) { return this.matches("[role=group]") ? 1 : 0; } });
  Element.prototype.getBoundingClientRect = rect as () => DOMRect;
  globalThis.ResizeObserver = class {
    constructor(cb: ResizeObserverCallback) {
      observers.push(cb);
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});
afterAll(() => {
  for (const [k, d] of saved) if (d) Object.defineProperty(HTMLElement.prototype, k, d);
  Element.prototype.getBoundingClientRect = savedRect;
  globalThis.ResizeObserver = savedRO;
});
beforeEach(() => {
  laidOut = true;
  frac = 0;
  scale = 1;
  observers = [];
});
const resize = () => act(async () => observers.forEach((cb) => cb([], {} as ResizeObserver)));
const settle = () => act(async () => {}); // MutationObserver callbacks run one microtask later

const indicator = (root: Element) => {
  const all = root.querySelectorAll("[data-indicator]");
  expect(all).toHaveLength(1);
  const el = all[0] as HTMLElement;
  expect(el.getAttribute("aria-hidden")).toBe("true");
  return el;
};
const at = (el: HTMLElement) => ({ transform: el.style.transform, width: el.style.width, height: el.style.height });
const slides = (el: HTMLElement) => /(^| )transition-\[/.test(el.className);

const TABS = [
  { value: "a", label: "Overview", content: "A" },
  { value: "b", label: "Specs", content: "B" },
  { value: "c", label: "Reviews", content: "C" },
];
const OPTIONS = [
  { value: "month", label: "Monthly" },
  { value: "year", label: "Yearly" },
];
const sections = (current: string): SidebarSection[] => [
  {
    title: "Workspace",
    items: [
      { href: "/app", label: "Overview", icon: <svg />, current: current === "/app" },
      { href: "/app/inbox", label: "Inbox", icon: <svg />, current: current === "/app/inbox" },
    ],
  },
  { items: [{ href: "/app/settings", label: "Settings", icon: <svg />, current: current === "/app/settings" }] },
];

describe("sliding indicator: server HTML and no layout", () => {
  test("server HTML has no indicator; the active item draws its own state", () => {
    const tabs = renderToStaticMarkup(<Tabs defaultValue="a" items={TABS} />);
    expect(tabs).not.toContain("data-indicator");
    expect(tabs).toMatch(/aria-selected="true"[^>]*class="[^"]*data-\[state=active\]:border-primary/);
    const seg = renderToStaticMarkup(<SegmentedControl aria-label="Billing" defaultValue="year" options={OPTIONS} />);
    expect(seg).not.toContain("data-indicator");
    expect(seg).toMatch(/aria-checked="true"[^>]*class="[^"]*data-\[state=on\]:bg-primary/);
    const side = renderToStaticMarkup(<Sidebar sections={sections("/app/inbox")} />);
    expect(side).not.toContain("data-indicator");
    expect(side).toMatch(/aria-current="page"[^>]*class="[^"]*aria-\[current=page\]:bg-surface-2/);
  });

  test("a list without layout (hidden) keeps the item's own state until it has a size", async () => {
    laidOut = false;
    const el = await mount(<Tabs defaultValue="a" items={TABS} />);
    expect(el.querySelector("[data-indicator]")).toBeNull();
    expect(el.querySelector('[role=tab][data-state="active"]')!.className).toContain("data-[state=active]:border-primary");
    laidOut = true;
    await resize();
    expect(at(indicator(el))).toEqual({ transform: "translate(0px, 0px)", width: "60px", height: "40px" });
    // It appears in place: no slide from nowhere.
    expect(slides(indicator(el))).toBe(false);
  });
});

describe("Tabs", () => {
  test("after the first measure one underline sits on the active tab and the tab's own border goes", async () => {
    const el = await mount(<Tabs defaultValue="b" items={TABS} />);
    const list = el.querySelector("[role=tablist]")!;
    const line = indicator(list);
    expect(at(line)).toEqual({ transform: "translate(100px, 0px)", width: "70px", height: "40px" });
    expect(line.className).toContain("border-primary");
    expect(slides(line)).toBe(false);
    for (const tab of list.querySelectorAll("[role=tab]")) expect(tab.className).not.toContain("data-[state=active]:border-primary");
  });

  test("a new tab: the underline slides to it; a resize with the same box changes nothing", async () => {
    const el = await mount(<Tabs defaultValue="a" items={TABS} />);
    const third = el.querySelectorAll("[role=tab]")[2]!;
    await act(async () => {
      third.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 }));
    });
    await settle();
    expect(third.getAttribute("data-state")).toBe("active");
    const line = indicator(el);
    expect(at(line)).toEqual({ transform: "translate(200px, 0px)", width: "80px", height: "40px" });
    expect(slides(line)).toBe(true);
    expect(line.className).toContain("motion-reduce:transition-none");
    await resize();
    expect(slides(indicator(el))).toBe(true); // same box: nothing changes
  });

  test("sub-pixel boxes: the underline matches the tab exactly, also in a scrolled list", async () => {
    frac = 0.5;
    const el = await mount(<Tabs defaultValue="b" items={TABS} />);
    const list = el.querySelector<HTMLElement>("[role=tablist]")!;
    list.scrollLeft = 25;
    await resize();
    expect(at(indicator(list))).toEqual({ transform: "translate(100.5px, 0px)", width: "70.5px", height: "40px" });
  });

  test("a scale on an ancestor (a Dialog popping in) does not shrink or move the underline", async () => {
    scale = 0.75;
    const el = await mount(<Tabs defaultValue="b" items={TABS} />);
    expect(at(indicator(el))).toEqual({ transform: "translate(100px, 0px)", width: "70px", height: "40px" });
  });
});

describe("SegmentedControl", () => {
  test("one pill under the chosen option follows the choice", async () => {
    const el = await mount(<SegmentedControl aria-label="Billing" defaultValue="month" options={OPTIONS} />);
    const group = el.querySelector("[role=radiogroup], [role=group]")!;
    expect(at(indicator(group))).toEqual({ transform: "translate(0px, 0px)", width: "60px", height: "40px" });
    expect(indicator(group).className).toContain("bg-primary");
    const [month, year] = group.querySelectorAll("[role=radio]");
    expect(month!.className).not.toContain("data-[state=on]:bg-primary");
    expect(month!.className).toContain("data-[state=on]:text-primary-fg");
    await click(year!);
    await settle();
    expect(at(indicator(group))).toEqual({ transform: "translate(100px, 0px)", width: "70px", height: "40px" });
    expect(slides(indicator(group))).toBe(true);
  });

  test("the labels change colour with the pill's duration and easing", async () => {
    const el = await mount(<SegmentedControl aria-label="Billing" defaultValue="month" options={OPTIONS} />);
    for (const item of el.querySelectorAll("[role=radio]")) {
      expect(item.className).toContain("duration-(--p-duration-base)");
      expect(item.className).toContain("ease-(--p-ease-out)");
    }
  });

  test("no option chosen: no indicator", async () => {
    const el = await mount(<SegmentedControl aria-label="Billing" options={OPTIONS} />);
    expect(el.querySelector("[data-indicator]")).toBeNull();
  });
});

describe("Sidebar", () => {
  test("the current-item background moves with the current page and follows the rail", async () => {
    let go: (href: string) => void = () => {};
    function S() {
      const [current, set] = useState("/app/inbox");
      go = set;
      return <Sidebar sections={sections(current)} />;
    }
    const el = await mount(
      <PercentProvider lang="ar">
        <S />
      </PercentProvider>,
    );
    const nav = el.querySelector("nav")!;
    expect(at(indicator(nav))).toEqual({ transform: "translate(12px, 40px)", width: "232px", height: "36px" });
    expect(indicator(nav).className).toContain("bg-surface-2");
    expect(nav.querySelector('[aria-current="page"]')!.className).not.toContain("aria-[current=page]:bg-surface-2");

    await act(async () => go("/app/settings"));
    await settle();
    expect(at(indicator(nav))).toEqual({ transform: "translate(12px, 80px)", width: "232px", height: "36px" });
    expect(slides(indicator(nav))).toBe(true);

    await click(el.querySelector("button[aria-expanded]")!);
    await resize(); // the browser reports the rail's new item width
    expect(at(indicator(nav))).toEqual({ transform: "translate(12px, 80px)", width: "40px", height: "36px" });
    expect(slides(indicator(nav))).toBe(false);
  });
});
