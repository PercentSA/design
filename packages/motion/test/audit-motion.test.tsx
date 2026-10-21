// Regression tests for the motion fixes of the 0.3.1 audit.
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { act } from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { Counter, createSwitchController, Magnetic, Marquee, RevealText, type ScrambleTarget } from "../src";
import { mount, useDom } from "../../ui/test/dom";

useDom();

const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");

// The test drives the on-screen state, the resize callbacks and the media queries by hand.
let observed: ((entries: { isIntersecting: boolean }[]) => void)[] = [];
let resized: (() => void)[] = [];
let media: Record<string, boolean> = {};
const saved = {
  io: globalThis.IntersectionObserver,
  ro: globalThis.ResizeObserver,
  matchMedia: globalThis.matchMedia,
  getAnimations: HTMLElement.prototype.getAnimations,
};
beforeEach(() => {
  observed = [];
  resized = [];
  media = {};
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
    observe() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  globalThis.matchMedia = ((q: string) => ({ matches: media[q] ?? false, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof matchMedia;
  HTMLElement.prototype.getAnimations = () => [];
});
afterEach(() => {
  globalThis.IntersectionObserver = saved.io;
  globalThis.ResizeObserver = saved.ro;
  globalThis.matchMedia = saved.matchMedia;
  HTMLElement.prototype.getAnimations = saved.getAnimations;
});
const onScreen = (isIntersecting: boolean) => act(async () => observed.forEach((cb) => cb([{ isIntersecting }])));

test("decode() with reduced motion shows the final text at once", () => {
  const writes: (string | null)[] = [];
  const t: ScrambleTarget = { text: () => "Percent", top: () => 0, onScreen: () => true, write: (s) => void writes.push(s) };
  const c = createSwitchController({
    now: () => 0, rand: () => 0, reducedMotion: () => true, targets: () => [t],
    schedule: () => {}, navigate: () => {},
  });
  c.decode([t], 0, 140);
  expect(writes).toEqual([null]);
  expect(c.hasJobs()).toBe(false);
});

describe("Counter", () => {
  test("the number is hidden under html.js until counting starts, so the final number never jumps back to the start", async () => {
    expect(renderToStaticMarkup(<Counter value={48} />)).toContain(">48<");
    expect(css).toMatch(/prefers-reduced-motion: no-preference\)\s*\{\s*\.js \[data-counter\]:not\(\[data-run\]\) > \[aria-hidden\] \{\s*visibility: hidden;/);
    const el = await mount(<Counter value={48} />);
    const counter = el.querySelector("[data-counter]") as HTMLElement;
    expect(counter.hasAttribute("data-run")).toBe(false);
    await onScreen(true);
    expect(counter.hasAttribute("data-run")).toBe(true);
  });
});

test("Marquee: the loop pauses off screen", async () => {
  expect(css).toMatch(/\.p-marquee\[data-offscreen\] \.p-marquee-list,[^{]*\{\s*animation-play-state: paused;/);
  const el = await mount(<Marquee><li>A</li></Marquee>);
  const row = el.querySelector(".p-marquee")!;
  await onScreen(false);
  expect(row.hasAttribute("data-offscreen")).toBe(true);
  await onScreen(true);
  expect(row.hasAttribute("data-offscreen")).toBe(false);
});

test("Magnetic listens to the pointer only while on screen", async () => {
  media["(hover: hover) and (pointer: fine)"] = true;
  const listening: boolean[] = [];
  const add = document.addEventListener;
  const remove = document.removeEventListener;
  document.addEventListener = function (this: Document, type: string, ...rest: unknown[]) {
    if (type === "pointermove") listening.push(true);
    return (add as (...a: unknown[]) => void).call(this, type, ...rest);
  } as typeof add;
  document.removeEventListener = function (this: Document, type: string, ...rest: unknown[]) {
    if (type === "pointermove") listening.push(false);
    return (remove as (...a: unknown[]) => void).call(this, type, ...rest);
  } as typeof remove;
  try {
    await mount(<Magnetic><button type="button">Go</button></Magnetic>);
    expect(listening).toEqual([]);
    await onScreen(true);
    expect(listening).toEqual([true]);
    await onScreen(false);
    expect(listening).toEqual([true, false]);
  } finally {
    document.addEventListener = add;
    document.removeEventListener = remove;
  }
});

test("RevealText reads every word's position before it writes any delay", async () => {
  const el = await mount(<RevealText>{"one two three"}</RevealText>);
  const log: string[] = [];
  for (const w of el.querySelectorAll<HTMLElement>(".p-rt-w")) {
    Object.defineProperty(w, "offsetTop", { get: () => (log.push("read"), 0) });
    Object.defineProperty(w, "offsetHeight", { get: () => (log.push("read"), 20) });
    const set = w.style.setProperty.bind(w.style);
    w.style.setProperty = (...a: Parameters<typeof set>) => (log.push("write"), set(...a));
  }
  await act(async () => resized.forEach((cb) => cb()));
  expect(log.lastIndexOf("read")).toBeLessThan(log.indexOf("write"));
  expect(log.filter((x) => x === "write")).toHaveLength(3);
});
