import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { act } from "react";
import { Marquee } from "../src";
import { mount, useDom } from "../../ui/test/dom";

useDom();

// The test drives the frames, the scroll position and the on-screen state by hand.
const frames = new Map<number, FrameRequestCallback>();
let lastId = 0;
let now = 0;
let observed: ((entries: { isIntersecting: boolean }[]) => void) | undefined;
const anim = { playbackRate: 1, currentTime: 0 as number | null, effect: { getComputedTiming: () => ({ duration: 45_000 }) } };
const saved = {
  raf: globalThis.requestAnimationFrame,
  caf: globalThis.cancelAnimationFrame,
  io: globalThis.IntersectionObserver,
  matchMedia: globalThis.matchMedia,
  getAnimations: HTMLElement.prototype.getAnimations,
};

beforeEach(() => {
  frames.clear();
  now = 0;
  observed = undefined;
  anim.playbackRate = 1;
  anim.currentTime = 0;
  scrollTo(0, 0);
  globalThis.requestAnimationFrame = (cb) => (frames.set(++lastId, cb), lastId);
  globalThis.cancelAnimationFrame = (id) => void frames.delete(id);
  globalThis.IntersectionObserver = class {
    constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
      observed = cb;
    }
    observe() {}
    disconnect() {}
  } as unknown as typeof IntersectionObserver;
  HTMLElement.prototype.getAnimations = function () {
    return this.classList.contains("p-marquee-list") ? [anim as unknown as Animation] : [];
  };
});

afterEach(() => {
  globalThis.requestAnimationFrame = saved.raf;
  globalThis.cancelAnimationFrame = saved.caf;
  globalThis.IntersectionObserver = saved.io;
  globalThis.matchMedia = saved.matchMedia;
  HTMLElement.prototype.getAnimations = saved.getAnimations;
});

/** Runs the frames that are waiting, 16 ms after the last ones. */
const frame = () => {
  now += 16;
  const due = [...frames.values()];
  frames.clear();
  for (const cb of due) cb(now);
};
const scrollBy = (dy: number) => {
  scrollTo(0, scrollY + dy);
  dispatchEvent(new Event("scroll"));
};
const onScreen = (isIntersecting: boolean) => act(async () => observed!([{ isIntersecting }]));
const marquee = () => mount(<Marquee><li>A</li></Marquee>);

describe("D1: Marquee scroll boost runs frames only when something changes", () => {
  test("on screen, page not scrolling: no frames", async () => {
    await marquee();
    await onScreen(true);
    for (let i = 0; i < 5; i++) frame();
    expect(frames.size).toBe(0);
    expect(anim.playbackRate).toBe(1);
  });

  test("scrolling down speeds the row up; then it eases back to normal speed and the frames stop", async () => {
    await marquee();
    await onScreen(true);
    scrollBy(40);
    expect(frames.size).toBe(1);
    for (let i = 0; i < 10; i++) {
      frame();
      scrollBy(40);
    }
    expect(anim.playbackRate).toBeGreaterThan(2);
    let n = 0;
    for (; n < 200 && frames.size; n++) frame();
    expect(frames.size).toBe(0);
    // About 0.5 s to ease back (time constant 150 ms), then the loop stops at normal speed.
    expect(n).toBeLessThan(80);
    expect(anim.playbackRate).toBe(1);
  });

  test("scrolling up runs the row backwards; a later scroll starts the frames again", async () => {
    await marquee();
    await onScreen(true);
    scrollTo(0, 2000);
    await onScreen(true);
    for (let i = 0; i < 10; i++) {
      scrollBy(-60);
      frame();
    }
    expect(anim.playbackRate).toBeLessThan(0);
    for (let i = 0; i < 200 && frames.size; i++) frame();
    expect(frames.size).toBe(0);
    scrollBy(10);
    expect(frames.size).toBe(1);
  });

  test("after unmount a scroll runs no frames (the listener is removed)", async () => {
    const { createRoot } = await import("react-dom/client");
    const box = document.body.appendChild(document.createElement("div"));
    const root = createRoot(box);
    await act(async () => root.render(<Marquee><li>A</li></Marquee>));
    await onScreen(true);
    await act(async () => root.unmount());
    scrollBy(100);
    expect(frames.size).toBe(0);
  });

  test("off screen: scrolling runs no frames", async () => {
    await marquee();
    await onScreen(true);
    await onScreen(false);
    scrollBy(100);
    expect(frames.size).toBe(0);
  });

  test("reduced motion: no observer and no frames", async () => {
    globalThis.matchMedia = ((q: string) => ({ matches: q.includes("reduce"), addEventListener() {}, removeEventListener() {} })) as unknown as typeof matchMedia;
    await marquee();
    expect(observed).toBeUndefined();
    scrollBy(100);
    expect(frames.size).toBe(0);
  });
});
