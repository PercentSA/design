import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { act } from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import type { Root } from "react-dom/client";
import { NumberRoll, RevealText } from "../src";
import { mount, useDom } from "../../ui/test/dom";

useDom();

const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const textOf = (markup: string) => markup.replace(/<[^>]+>/g, "");

// The test drives the on-screen state and the resize callbacks by hand.
let observed: ((entries: { isIntersecting: boolean }[]) => void)[] = [];
let resized: (() => void)[] = [];
let sized: Element[] = [];
const saved = { io: globalThis.IntersectionObserver, ro: globalThis.ResizeObserver };
beforeEach(() => {
  observed = [];
  resized = [];
  sized = [];
  globalThis.IntersectionObserver = class {
    constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
      observed.push(cb);
    }
    observe() {}
    disconnect() {}
  } as unknown as typeof IntersectionObserver;
  globalThis.ResizeObserver = class {
    constructor(cb: () => void) {
      resized.push(cb);
    }
    observe(el: Element) {
      sized.push(el);
    }
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});
afterEach(() => {
  globalThis.IntersectionObserver = saved.io;
  globalThis.ResizeObserver = saved.ro;
});
const onScreen = (isIntersecting: boolean) => act(async () => observed.forEach((cb) => cb([{ isIntersecting }])));

describe("RevealText", () => {
  test("server HTML is the plain text once: one masked span per word, white space kept, no label copy", () => {
    const out = renderToStaticMarkup(<RevealText as="h2" className="display">{"We build  software"}</RevealText>);
    expect(out).toMatch(/^<h2 data-reveal="text" class="display">/);
    expect(out.match(/class="p-rt-w"/g)).toHaveLength(3);
    expect(textOf(out)).toBe("We build  software");
    expect(out).not.toContain("aria-label");
    expect(out).not.toContain("aria-hidden");
  });

  test("Arabic words stay whole (letters are never split, so they join)", () => {
    const out = renderToStaticMarkup(<RevealText>{"نبني البرمجيات"}</RevealText>);
    expect(out).toContain('<span class="p-rt-w"><span>نبني</span></span> <span class="p-rt-w"><span>البرمجيات</span></span>');
  });

  test("words get a delay by line (60 ms) and by place in the line (15 ms); measured again on resize", async () => {
    // happy-dom has no layout: the word tops come from this table.
    let tops: Record<string, number> = { a: 0, b: 0, c: 0, d: 40, e: 40, f: 80 };
    const real = Object.getOwnPropertyDescriptors(HTMLElement.prototype);
    Object.defineProperty(HTMLElement.prototype, "offsetTop", { configurable: true, get() { return tops[this.textContent] ?? 0; } });
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", { configurable: true, get: () => 40 });
    try {
      const el = await mount(<RevealText>{"a b c d e f"}</RevealText>);
      const delays = () => [...el.querySelectorAll<HTMLElement>(".p-rt-w")].map((w) => w.style.getPropertyValue("--p-rt-delay"));
      expect(delays()).toEqual(["0ms", "15ms", "30ms", "60ms", "75ms", "120ms"]);
      tops = { a: 0, b: 0, c: 40, d: 40, e: 80, f: 80 };
      await act(async () => resized.forEach((cb) => cb()));
      expect(delays()).toEqual(["0ms", "15ms", "60ms", "75ms", "120ms", "135ms"]);
      // A font that loads late changes the words' sizes and wraps, not always the element's size.
      // Identity, not toEqual: a failing deep compare of DOM nodes never finishes printing.
      expect([el.firstElementChild!, ...el.querySelectorAll(".p-rt-w")].every((x) => sized.includes(x))).toBe(true);
    } finally {
      Object.defineProperty(HTMLElement.prototype, "offsetTop", real.offsetTop!);
      Object.defineProperty(HTMLElement.prototype, "offsetHeight", real.offsetHeight!);
    }
  });

  test("shows once, when on screen", async () => {
    const el = await mount(<RevealText as="h2">{"We build software"}</RevealText>);
    const h2 = el.querySelector("h2")!;
    expect(h2.hasAttribute("data-shown")).toBe(false);
    await onScreen(true);
    expect(h2.hasAttribute("data-shown")).toBe(true);
  });

  test("CSS: hidden only under .js; each word rises in its mask with its delay; tokens for time and easing", () => {
    expect(css).toMatch(/\.p-rt-w \{[^}]*display: inline-block;[^}]*clip-path:/);
    expect(css).toMatch(/\.p-rt-w > span \{[^}]*transition: translate var\(--p-duration-reveal\) var\(--p-ease-out\) var\(--p-rt-delay/);
    expect(css).toMatch(/\.js \[data-reveal="text"\]:not\(\[data-shown\]\) \.p-rt-w > span \{\s*translate:/);
  });

  test("CSS: reduced motion fades the whole element and moves no word; printing shows it", () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\) \{[^@]*\[data-reveal="text"\] \{\s*transition: opacity var\(--p-duration-slow\);/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\) \{[^@]*\.js \[data-reveal="text"\]:not\(\[data-shown\]\) \{\s*opacity: 0;/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\) \{[^@]*\.js \[data-reveal="text"\]:not\(\[data-shown\]\) \.p-rt-w > span \{\s*translate: none;/);
    expect(css).toMatch(/@media print \{[^@]*\.js \[data-reveal="text"\]:not\(\[data-shown\]\)[^@]*opacity: 1;/);
  });
});

describe("NumberRoll", () => {
  const digits = (el: Element) => [...el.querySelectorAll<HTMLElement>(".p-roll-s")];
  const at = (s: HTMLElement) => s.style.getPropertyValue("--p-digit");

  test("server HTML: the value, left to right with tabular digits; screen readers get only the value", () => {
    const out = renderToStaticMarkup(<NumberRoll value={1284} className="display" />);
    expect(out).toMatch(/^<span class="p-roll display">/);
    expect(out).toContain('<span aria-hidden="true" class="p-roll-v tabular-nums" dir="ltr">');
    expect(out).toContain('<span class="sr-only">1,284</span>');
    expect(out.match(/class="p-roll-s"/g)).toHaveLength(4);
    expect([...out.matchAll(/--p-digit:(\d)/g)].map((m) => m[1])).toEqual(["1", "2", "8", "4"]);
    // The separator changes in place: plain text, no column.
    expect(out).toContain("<span>,</span>");
    expect(out).not.toContain("data-enter");
  });

  test("a new value rolls each digit column to its new digit (the same element, so CSS animates it)", async () => {
    const { createRoot } = await import("react-dom/client");
    const el = document.body.appendChild(document.createElement("div"));
    const root: Root = createRoot(el);
    await act(async () => root.render(<NumberRoll value={1284} />));
    const before = digits(el);
    await act(async () => root.render(<NumberRoll value={1290} />));
    const after = digits(el);
    expect(after).toEqual(before);
    expect(after.map(at)).toEqual(["1", "2", "9", "0"]);
    expect(el.querySelector(".sr-only")!.textContent).toBe("1,290");
    expect(el.querySelector("[data-enter]")).toBeNull();
    await act(async () => root.unmount());
  });

  test("more digits: columns match from the units; only the new digits enter", async () => {
    const { createRoot } = await import("react-dom/client");
    const el = document.body.appendChild(document.createElement("div"));
    const root: Root = createRoot(el);
    await act(async () => root.render(<NumberRoll value={999} format={String} />));
    const [, , units] = digits(el);
    await act(async () => root.render(<NumberRoll value={1000} format={String} />));
    const now = digits(el);
    expect(now.map(at)).toEqual(["1", "0", "0", "0"]);
    expect(now[3]).toBe(units!);
    expect(now.map((s) => s.hasAttribute("data-enter"))).toEqual([true, false, false, false]);
    await act(async () => root.unmount());
  });

  test("a new digit rolls in once: data-enter goes when its animation ends, so it does not replay back on screen", async () => {
    const { createRoot } = await import("react-dom/client");
    const el = document.body.appendChild(document.createElement("div"));
    const root: Root = createRoot(el);
    await act(async () => root.render(<NumberRoll value={99} format={String} />));
    await act(async () => root.render(<NumberRoll value={100} format={String} />));
    const [added] = digits(el);
    expect(added!.hasAttribute("data-enter")).toBe(true);
    await act(async () => {
      added!.dispatchEvent(new Event("animationend", { bubbles: true }));
    });
    expect(added!.hasAttribute("data-enter")).toBe(false);
    await act(async () => root.unmount());
  });

  test("off screen: marked still, so the value changes without animation", async () => {
    const el = await mount(<NumberRoll value={5} />);
    const box = el.querySelector(".p-roll")!;
    await onScreen(false);
    expect(box.hasAttribute("data-still")).toBe(true);
    await onScreen(true);
    expect(box.hasAttribute("data-still")).toBe(false);
    expect(css).toMatch(/\.p-roll\[data-still\] \.p-roll-s \{\s*transition: none;\s*animation: none;/);
  });

  test("CSS: digits roll with token time and easing; reduced motion: no roll", () => {
    expect(css).toMatch(/\.p-roll-s \{[^}]*translate: 0 calc\(var\(--p-digit\) \* -10%\);[^}]*transition: translate var\(--p-duration-slow\) var\(--p-ease-out\);/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s*\.p-roll-s \{\s*transition: none;\s*animation: none;/);
  });
});
