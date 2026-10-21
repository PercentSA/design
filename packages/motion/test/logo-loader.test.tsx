import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { act } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LOGO_ARABIC, logoLoaderFrame, quadPath } from "@percentsa/tokens";
import { LogoLoader } from "../src";
import { mount, useDom } from "../../ui/test/dom";

useDom();

// The test drives the frames, the on-screen state, the tab visibility and the media queries by hand.
const frames = new Map<number, FrameRequestCallback>();
let lastId = 0;
let observed: ((entries: { isIntersecting: boolean }[]) => void) | undefined;
let media: Record<string, boolean> = {};
let visibility: DocumentVisibilityState = "visible";
const saved = {
  raf: globalThis.requestAnimationFrame,
  caf: globalThis.cancelAnimationFrame,
  io: globalThis.IntersectionObserver,
  matchMedia: globalThis.matchMedia,
};

beforeEach(() => {
  frames.clear();
  observed = undefined;
  media = {};
  visibility = "visible";
  globalThis.requestAnimationFrame = (cb) => (frames.set(++lastId, cb), lastId);
  globalThis.cancelAnimationFrame = (id) => void frames.delete(id);
  globalThis.IntersectionObserver = class {
    constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
      observed = cb;
    }
    observe() {}
    disconnect() {}
  } as unknown as typeof IntersectionObserver;
  globalThis.matchMedia = ((q: string) => ({ matches: media[q] ?? false, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof matchMedia;
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => visibility });
});

afterEach(() => {
  globalThis.requestAnimationFrame = saved.raf;
  globalThis.cancelAnimationFrame = saved.caf;
  globalThis.IntersectionObserver = saved.io;
  globalThis.matchMedia = saved.matchMedia;
  delete (document as { visibilityState?: unknown }).visibilityState;
});

/** Runs the frames that are waiting, at time `now`. */
const frame = (now: number) =>
  act(async () => {
    const due = [...frames.values()];
    frames.clear();
    for (const cb of due) cb(now);
  });
const onScreen = (isIntersecting: boolean) => act(async () => observed!([{ isIntersecting }]));
const ds = (el: Element) => [...el.querySelectorAll("path")].map((p) => p.getAttribute("d")).sort();
const still = (ms: number) => {
  const f = logoLoaderFrame(ms);
  return [...f.main, ...f.left, ...f.right].sort();
};
const ARABIC = Object.values(LOGO_ARABIC).map(quadPath).sort();

describe("LogoLoader", () => {
  test("server markup: the still icon, hidden from screen readers", () => {
    const out = renderToStaticMarkup(<LogoLoader />);
    expect(out).toContain('viewBox="-620 -50 1240 400"');
    expect(out).toContain('aria-hidden="true"');
    for (const d of still(0)) expect(out).toContain(`d="${d}"`);
  });

  test("a label makes it an image", () => {
    const out = renderToStaticMarkup(<LogoLoader label="Loading" />);
    expect(out).toContain('role="img"');
    expect(out).toContain('aria-label="Loading"');
    expect(out).not.toContain("aria-hidden");
  });

  test("it plays on screen: 2 s in, the Arabic word", async () => {
    const el = await mount(<LogoLoader />);
    await onScreen(true);
    await frame(1000);
    await frame(3000);
    expect(ds(el)).toEqual(ARABIC);
  });

  test("reduced motion: the still icon, no frames", async () => {
    media["(prefers-reduced-motion: reduce)"] = true;
    const el = await mount(<LogoLoader />);
    expect(observed).toBeUndefined();
    expect(frames.size).toBe(0);
    expect(ds(el)).toEqual(still(0));
  });

  test("two loaders have different clip ids", () => {
    const ids = [...renderToStaticMarkup(<><LogoLoader /><LogoLoader /></>).matchAll(/<clipPath id="([^"]+)"/g)].map((m) => m[1]);
    expect(ids.length).toBe(4);
    expect(new Set(ids).size).toBe(4);
    for (const id of ids) expect(id).toMatch(/^[\w-]+$/);
  });

  test("hidden tab: no frames until it is visible again", async () => {
    visibility = "hidden";
    await mount(<LogoLoader />);
    await onScreen(true);
    expect(frames.size).toBe(0);
    visibility = "visible";
    await act(async () => void document.dispatchEvent(new Event("visibilitychange")));
    expect(frames.size).toBe(1);
  });

  test("off screen: no new frames, and the time off screen is not counted", async () => {
    const el = await mount(<LogoLoader />);
    await onScreen(true);
    await frame(1000);
    await frame(3000);
    await onScreen(false);
    expect(frames.size).toBe(0);
    await onScreen(true);
    await frame(60_000);
    expect(ds(el)).toEqual(ARABIC);
  });

  test("two observer entries in one call: the newest one counts", async () => {
    await mount(<LogoLoader />);
    await act(async () => observed!([{ isIntersecting: false }, { isIntersecting: true }]));
    expect(frames.size).toBe(1);
  });

  test("unmount cancels the frame", async () => {
    const { createRoot } = await import("react-dom/client");
    const root = createRoot(document.body.appendChild(document.createElement("div")));
    await act(async () => root.render(<LogoLoader />));
    await onScreen(true);
    expect(frames.size).toBe(1);
    await act(async () => root.unmount());
    expect(frames.size).toBe(0);
  });

  test("no colour literals: fill and stroke are currentColor", () => {
    const out = renderToStaticMarkup(<LogoLoader />);
    expect(new Set([...out.matchAll(/(?:fill|stroke)="([^"]*)"/g)].map((m) => m[1]))).toEqual(new Set(["currentColor"]));
    expect(out).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(/i);
  });

  test("same output in RTL: never mirrored", () => {
    expect(renderToStaticMarkup(<div dir="rtl"><LogoLoader /></div>).replace(' dir="rtl"', "")).toBe(renderToStaticMarkup(<div><LogoLoader /></div>));
  });
});
