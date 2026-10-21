import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { act } from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { Counter, counterValue, Magnetic, Marquee, Reveal, ScenePlayer, ScrambleProvider, ScrambleText, SlashReveal, slashRunPercent, ViewCursor } from "../src";

const html = (node: React.ReactNode) => renderToStaticMarkup(node);

describe("maths", () => {
  test("counter eases out: starts at from, ends at to, never goes back", () => {
    expect(counterValue(0, 0, 48)).toBe(0);
    expect(counterValue(1, 0, 48)).toBe(48);
    expect(counterValue(0.5, 0, 48)).toBeGreaterThan(24);
    let last = 0;
    for (let t = 0; t <= 1; t += 0.05) {
      const v = counterValue(t, 0, 48);
      expect(v).toBeGreaterThanOrEqual(last);
      last = v;
    }
  });
  test("slash wipe: the % slash run over the box height, as a share of the width", () => {
    expect(slashRunPercent(4 / 3)).toBeCloseTo(53.68, 2);
    expect(slashRunPercent(1)).toBeCloseTo(71.57, 2);
  });
});

describe("server render (no JavaScript yet): everything visible, real text in the DOM", () => {
  test("ScrambleText keeps the real text; the noise overlay is hidden from screen readers", () => {
    const out = html(<ScrambleProvider navigate={() => {}}><ScrambleText>Work</ScrambleText></ScrambleProvider>);
    expect(out).toContain('<span class="p-sx-r">Work</span>');
    expect(out).toContain('class="p-sx-f" aria-hidden="true"');
  });
  test("inline ScrambleText is marked, so its wider noise does not wrap to a second line", () => {
    expect(html(<ScrambleProvider navigate={() => {}}><ScrambleText>Work</ScrambleText></ScrambleProvider>)).toContain('data-sx="inline"');
    expect(html(<ScrambleProvider navigate={() => {}}><ScrambleText block>Work</ScrambleText></ScrambleProvider>)).toContain('data-sx="block"');
    expect(readFileSync(new URL("../styles.css", import.meta.url), "utf8")).toMatch(/\.p-sx\[data-sx="inline"\] > \.p-sx-f \{\s*white-space: nowrap;/);
  });
  test("Counter shows the final number, and screen readers get only the final number", () => {
    const out = html(<Counter value={1250} />);
    expect(out).toContain(">1,250<");
    expect(out).toContain('aria-hidden="true"');
  });
  test("Marquee: the second copy is inert and hidden", () => {
    const out = html(<Marquee><li>A</li><li>B</li></Marquee>);
    expect(out.match(/class="p-marquee-list"/g)).toHaveLength(2);
    expect(out).toMatch(/<ul class="p-marquee-list" aria-hidden="true" inert=""/);
  });
  test("Reveal and SlashReveal mark what the CSS animates; SlashReveal sets its aspect for the slash run", () => {
    expect(html(<Reveal>x</Reveal>)).toContain("data-reveal");
    const out = html(<SlashReveal aspect={4 / 3}><img alt="" /></SlashReveal>);
    expect(out).toContain("--p-aspect:1.3333");
    expect(out).toContain("aspect-ratio:1.3333");
    // IntersectionObserver ignores a fully clipped target: the observed box must not carry the clip-path.
    expect(out).toMatch(/^<div data-reveal="slash"[^>]*><div class="p-slash">/);
  });
  test("ViewCursor, Magnetic and ScenePlayer render", () => {
    expect(html(<ViewCursor label="View" />)).toContain('aria-hidden="true"');
    expect(html(<Magnetic><a href="#c">Talk</a></Magnetic>)).toContain("p-magnetic");
    const out = html(
      <ScenePlayer label="Services animation" playing steps={["Design", "Build", "Run"]} active={1} progress={0.5} onToggle={() => {}} onJump={() => {}} labels={{ play: "Play", pause: "Pause", show: (s) => `Show ${s}` }} />,
    );
    expect(out).toContain('aria-label="Pause"');
    expect(out).toContain('aria-label="Show Build"');
    expect(out).toContain('aria-current="step"');
  });
});

describe("reduced motion", () => {
  const real = globalThis.matchMedia;
  afterEach(() => void (globalThis.matchMedia = real));
  const reduce = () =>
    (globalThis.matchMedia = ((q: string) => ({ matches: q.includes("reduce"), media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof matchMedia);

  test("Counter shows the final value at once", async () => {
    reduce();
    const { createRoot } = await import("react-dom/client");
    const el = document.createElement("div");
    const root = createRoot(el);
    await act(async () => root.render(<Counter value={48} />));
    expect(el.textContent).toContain("48");
    await act(async () => root.unmount());
  });
  test("a language switch navigates at once, without scramble", async () => {
    reduce();
    const went: string[] = [];
    const { createRoot } = await import("react-dom/client");
    const { useScramble } = await import("../src");
    let api: ReturnType<typeof useScramble> | undefined;
    const Grab = () => ((api = useScramble()), null);
    const root = createRoot(document.createElement("div"));
    await act(async () => root.render(<ScrambleProvider navigate={(l) => went.push(l)}><Grab /></ScrambleProvider>));
    api!.request("ar");
    expect(went).toEqual(["ar"]);
    await act(async () => root.unmount());
  });
});

describe("ScrambleText targetRef", () => {
  test("hands out its scramble target (for decode on first paint) and takes it back on unmount", async () => {
    const got: (unknown | null)[] = [];
    const { createRoot } = await import("react-dom/client");
    const root = createRoot(document.createElement("div"));
    await act(async () =>
      root.render(
        <ScrambleProvider navigate={() => {}}>
          <ScrambleText targetRef={(t) => got.push(t)}>Work</ScrambleText>
        </ScrambleProvider>,
      ),
    );
    expect(got).toHaveLength(1);
    expect((got[0] as { text(): string }).text()).toBe("Work");
    await act(async () => root.unmount());
    expect(got.at(-1)).toBeNull();
  });
});

describe("Reveal on screen", () => {
  // A small IntersectionObserver for one element on an 800 px screen; rootMargin bottom in %.
  type Obs = { cb: IntersectionObserverCallback; threshold: number; bottom: number; el?: Element };
  const real = globalThis.IntersectionObserver;
  let observers: Obs[] = [];
  beforeEach(() => {
    observers = [];
    globalThis.IntersectionObserver = class {
      o: Obs;
      constructor(cb: IntersectionObserverCallback, opts: IntersectionObserverInit = {}) {
        const bottom = (opts.rootMargin ?? "0px 0px 0px 0px").split(/\s+/)[2] ?? "0px";
        this.o = { cb, threshold: Number(opts.threshold ?? 0), bottom: bottom.endsWith("%") ? parseFloat(bottom) / 100 : 0 };
        observers.push(this.o);
      }
      observe(el: Element) {
        this.o.el = el;
      }
      disconnect() {
        this.o.el = undefined;
      }
      unobserve() {}
      takeRecords() {
        return [];
      }
    } as unknown as typeof IntersectionObserver;
  });
  afterEach(() => void (globalThis.IntersectionObserver = real));
  /** The element's top is `top` px below the top of the screen. */
  const scroll = (top: number, height: number) =>
    act(async () => {
      for (const o of observers) {
        if (!o.el) continue;
        const visible = Math.max(0, Math.min(top + height, 800 * (1 + o.bottom)) - Math.max(top, 0));
        const isIntersecting = o.threshold > 0 ? visible / height >= o.threshold : visible > 0;
        o.cb([{ isIntersecting, intersectionRatio: visible / height, target: o.el } as IntersectionObserverEntry], o as unknown as IntersectionObserver);
      }
    });
  const mountReveal = async () => {
    const { createRoot } = await import("react-dom/client");
    const el = document.createElement("div");
    const root = createRoot(el);
    await act(async () => root.render(<Reveal>x</Reveal>));
    return { box: el.firstElementChild as HTMLElement, root };
  };

  test("a short element shows when a fifth of it is on screen", async () => {
    const { box, root } = await mountReveal();
    await scroll(790, 100);
    expect(box.hasAttribute("data-shown")).toBe(false);
    await scroll(700, 100);
    expect(box.hasAttribute("data-shown")).toBe(true);
    await act(async () => root.unmount());
  });
  test("an element taller than five screens shows when it fills a fifth of the screen", async () => {
    const { box, root } = await mountReveal();
    await scroll(300, 5000);
    expect(box.hasAttribute("data-shown")).toBe(true);
    await act(async () => root.unmount());
  });
});

describe("review fixes (motion)", () => {
  const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
  test("a link around ScrambleText keeps its underline (inline-block children do not get it)", () => {
    expect(css).toMatch(/\.p-sx \{[^}]*text-decoration: inherit;/);
  });
  test("Marquee has a pause button that works without a mouse (WCAG 2.2.2) and pauses on keyboard focus", async () => {
    const { createRoot } = await import("react-dom/client");
    const el = document.createElement("div");
    const root = createRoot(el);
    await act(async () => root.render(<Marquee labels={{ pause: "إيقاف مؤقت", play: "تشغيل" }}><li>A</li></Marquee>));
    const button = el.querySelector("button")!;
    expect(button.getAttribute("aria-label")).toBe("إيقاف مؤقت");
    await act(async () => button.click());
    expect(el.firstElementChild!.hasAttribute("data-paused")).toBe(true);
    expect(button.getAttribute("aria-label")).toBe("تشغيل");
    await act(async () => root.unmount());
    expect(css).toMatch(/\.p-marquee:focus-within \.p-marquee-list/);
    expect(css).toMatch(/\[data-paused\] \.p-marquee-list/);
  });
  test("reduced motion: no edge fade on the hand-scrolled row, and no pause button", () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s*\.p-marquee \{[^}]*mask-image: none;[^}]*\}\s*\.p-marquee-pp \{\s*display: none;/);
  });
  test("printing shows content that has not been revealed yet", () => {
    expect(css).toMatch(/@media print \{[^]*\[data-reveal="slash"\]:not\(\[data-shown\]\) > \.p-slash[^]*clip-path: none/);
  });
  test("the slash wipe uses the element's own direction (:dir) when hidden and when shown", () => {
    expect(css).not.toContain('html[dir="rtl"]');
    expect(css).toContain(".p-slash:dir(rtl)");
  });
});
