import { describe, expect, test } from "bun:test";
import type { ComponentProps } from "react";
import { PercentProvider, RouteTabs, type RouteTab } from "../src";
import { act } from "react";
import { click, mount, press, stubMatchMedia, useDom } from "./dom";

useDom();

const names = ["overview", "compose", "environment", "domains", "deployments", "logs", "metrics", "backups", "access", "settings"];
const items: RouteTab[] = names.map((value) => ({ value, label: value, href: `#${value}` }));
const nav = (el: Element) => el.querySelector("nav")!;
const row = (el: Element) => [...nav(el).querySelectorAll<HTMLElement>(":scope a")];
const shown = (el: Element) => row(el).filter((a) => !a.classList.contains("max-md:hidden")).map((a) => a.textContent);

describe("RouteTabs", () => {
  test("tabs are links in a named nav; the current one has aria-current=\"page\"", async () => {
    const el = await mount(<RouteTabs label="App sections" items={items.slice(0, 3)} current="compose" />);
    expect(nav(el).getAttribute("aria-label")).toBe("App sections");
    expect(row(el).map((a) => a.getAttribute("href"))).toEqual(["#overview", "#compose", "#environment"]);
    expect(row(el).filter((a) => a.getAttribute("aria-current") === "page").map((a) => a.textContent)).toEqual(["compose"]);
  });

  test("count shows after the label", async () => {
    const el = await mount(<RouteTabs label="x" items={[{ value: "a", label: "Deployments", href: "#a", count: 4 }]} current="a" />);
    const a = row(el)[0]!;
    expect(a.lastElementChild!.textContent).toBe("4");
    expect(a.lastElementChild!.className).toContain("h-5");
    expect(a.textContent).toBe("Deployments4");
  });

  test("below 768 px the first three stay and the rest go into More", async () => {
    const el = await mount(<RouteTabs label="x" items={items} current="overview" />);
    expect(row(el).map((a) => a.classList.contains("max-md:hidden"))).toEqual(names.map((_, i) => i > 2));
    const more = nav(el).querySelector<HTMLElement>("button[aria-haspopup]")!;
    expect(more.textContent).toBe("More");
    expect(more.classList.contains("md:hidden")).toBe(true);
    await click(more);
    await press(more, { key: "Enter" });
    const menu = [...document.querySelectorAll('[role="menuitem"]')];
    expect(menu.map((m) => m.getAttribute("href"))).toEqual(names.slice(3).map((n) => `#${n}`));
  });

  test("a current tab after the third takes the third place", async () => {
    const el = await mount(<RouteTabs label="x" items={items} current="environment" />);
    expect(shown(el)).toEqual(["overview", "compose", "environment"]);
    const el2 = await mount(<RouteTabs label="x" items={items} current="logs" />);
    expect(shown(el2)).toEqual(["overview", "compose", "logs"]);
    const more = el2.querySelector<HTMLElement>("button[aria-haspopup]")!;
    await click(more);
    await press(more, { key: "Enter" });
    expect([...document.querySelectorAll('[role="menuitem"]')].map((m) => m.getAttribute("href"))).toEqual(
      names.filter((n) => !["overview", "compose", "logs"].includes(n)).map((n) => `#${n}`),
    );
  });

  test("no More with three tabs or fewer", async () => {
    const el = await mount(<RouteTabs label="x" items={items.slice(0, 3)} current="overview" />);
    expect(nav(el).querySelector("button")).toBeNull();
  });

  test("uses the provider link component", async () => {
    const Link = (p: ComponentProps<"a">) => <a data-router="" {...p} />;
    const el = await mount(
      <PercentProvider lang="en" link={Link}>
        <RouteTabs label="x" items={items.slice(0, 2)} current="overview" />
      </PercentProvider>,
    );
    expect(row(el).every((a) => a.hasAttribute("data-router"))).toBe(true);
  });

  test("More is named المزيد on an Arabic page", async () => {
    const el = await mount(
      <PercentProvider lang="ar">
        <RouteTabs label="x" items={items} current="overview" />
      </PercentProvider>,
    );
    expect(nav(el).querySelector("button")!.textContent).toBe("المزيد");
  });

  test("the current tab is scrolled into view inside the row only", async () => {
    const calls: string[] = [];
    const proto = HTMLElement.prototype;
    // Own descriptors only: both methods live on Element.prototype, so the restore removes the stubs.
    const rect = Object.getOwnPropertyDescriptor(proto, "getBoundingClientRect");
    const into = Object.getOwnPropertyDescriptor(proto, "scrollIntoView");
    proto.scrollIntoView = () => void calls.push("window");
    proto.getBoundingClientRect = function (this: HTMLElement) {
      const box = this.tagName === "NAV" ? [0, 100] : this.getAttribute("aria-current") ? [150, 230] : [0, 50];
      return { left: box[0], right: box[1], top: 0, bottom: 0, width: box[1]! - box[0]!, height: 0, x: box[0]!, y: 0, toJSON() {} } as DOMRect;
    };
    try {
      const el = await mount(<RouteTabs label="x" items={items.slice(0, 3)} current="environment" />);
      expect(nav(el).scrollLeft).toBe(130);
      expect(calls).toEqual([]);
    } finally {
      if (rect) Object.defineProperty(proto, "getBoundingClientRect", rect);
      else delete (proto as { getBoundingClientRect?: unknown }).getBoundingClientRect;
      if (into) Object.defineProperty(proto, "scrollIntoView", into);
      else delete (proto as { scrollIntoView?: unknown }).scrollIntoView;
    }
  });
  test("after a resize from phone to desktop the current tab is brought into view", async () => {
    stubMatchMedia(true); // registers the restore; replaced below by a media query that can change
    const listeners = new Set<() => void>();
    const mq = { matches: true, media: "", addEventListener: (_: string, f: () => void) => listeners.add(f), removeEventListener: (_: string, f: () => void) => listeners.delete(f) };
    Object.defineProperty(globalThis, "matchMedia", { configurable: true, writable: true, value: () => mq });
    const proto = HTMLElement.prototype;
    const rect = Object.getOwnPropertyDescriptor(proto, "getBoundingClientRect");
    proto.getBoundingClientRect = function (this: HTMLElement) {
      const box = this.tagName === "NAV" ? [0, 100] : this.getAttribute("aria-current") ? [150, 230] : [0, 50];
      return { left: box[0], right: box[1], top: 0, bottom: 0, width: box[1]! - box[0]!, height: 0, x: box[0]!, y: 0, toJSON() {} } as DOMRect;
    };
    try {
      const el = await mount(<RouteTabs label="x" items={items.slice(0, 3)} current="environment" />);
      nav(el).scrollLeft = 0; // the row was scrolled back, for example by the layout change
      mq.matches = false;
      await act(async () => listeners.forEach((f) => f()));
      await act(() => new Promise<void>((r) => setTimeout(r, 10)));
      expect(nav(el).scrollLeft).toBe(130);
    } finally {
      if (rect) Object.defineProperty(proto, "getBoundingClientRect", rect);
      else delete (proto as { getBoundingClientRect?: unknown }).getBoundingClientRect;
    }
  });
  test("the scroll test leaves no stub behind on HTMLElement.prototype (later files stub Element.prototype)", () => {
    expect(Object.getOwnPropertyDescriptor(HTMLElement.prototype, "getBoundingClientRect")).toBeUndefined();
    expect(Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollIntoView")).toBeUndefined();
  });
});
