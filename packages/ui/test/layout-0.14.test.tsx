import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { act, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DescriptionList, Grid, PercentProvider, RecordSection } from "../src";
import { mount, useDom } from "./dom";

useDom();

const wrap = (lang: "en" | "ar", node: ReactNode) => <PercentProvider lang={lang}>{node}</PercentProvider>;

// A ResizeObserver that records what it watches; a test calls `fire` for the entries it wants.
type Observer = { cb: ResizeObserverCallback; watching: Set<Element>; disconnected: boolean };
let observers: Observer[] = [];
const saved = { RO: globalThis.ResizeObserver, height: Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight") };

beforeEach(() => {
  observers = [];
  globalThis.ResizeObserver = class {
    o: Observer;
    constructor(cb: ResizeObserverCallback) {
      this.o = { cb, watching: new Set(), disconnected: false };
      observers.push(this.o);
    }
    observe(el: Element) {
      this.o.watching.add(el);
    }
    unobserve(el: Element) {
      this.o.watching.delete(el);
    }
    disconnect() {
      this.o.disconnected = true;
      this.o.watching.clear();
    }
  } as unknown as typeof ResizeObserver;
  // happy-dom has no layout: a child's height is its data-h.
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", { configurable: true, get() { return Number(this.getAttribute("data-h") ?? 0); } });
});
afterEach(() => {
  globalThis.ResizeObserver = saved.RO;
  if (saved.height) Object.defineProperty(HTMLElement.prototype, "offsetHeight", saved.height);
  else delete (HTMLElement.prototype as { offsetHeight?: number }).offsetHeight;
});

const fire = (...els: Element[]) => act(async () => observers[0]!.cb(els.map((target) => ({ target }) as ResizeObserverEntry), {} as ResizeObserver));
const spanOf = (el: Element) => (el as HTMLElement).style.getPropertyValue("grid-row-end");
const cards = (heights: number[]) => heights.map((h, i) => <div key={i} data-h={h}>{i}</div>);

describe("Grid masonry", () => {
  test("not masonry: the same classes and no browser work", async () => {
    expect(renderToStaticMarkup(<Grid cols={3} gap={4}>x</Grid>)).toBe('<div class="grid gap-4 md:grid-cols-3">x</div>');
    const el = await mount(<Grid cols={3}>{cards([10, 20])}</Grid>);
    expect(observers.length).toBe(0);
    expect(el.querySelector("[data-masonry]")).toBeNull();
    expect(spanOf(el.querySelector("[data-h]")!)).toBe("");
  });

  test("the server markup is a normal grid: no data-masonry, no spans, nothing hidden", () => {
    const html = renderToStaticMarkup(<Grid masonry min="14rem">{cards([100, 50])}</Grid>);
    expect(html).not.toContain("data-masonry=");
    expect(html).not.toContain("grid-row-end");
    expect(html).not.toContain("--p-masonry-gap:");
    expect(html).toContain("grid-cols-[repeat(auto-fill,minmax(min(var(--min),100%),1fr))]");
    expect(html).toContain("<div data-h=\"100\">0</div><div data-h=\"50\">1</div>");
  });

  test("after mount: data-masonry, and a span of height + gap for each child, in DOM order", async () => {
    const el = await mount(<Grid masonry cols={3} style={{ columnGap: "24px" }}>{cards([100, 40, 60.2])}</Grid>);
    const grid = el.firstElementChild!;
    expect(grid.hasAttribute("data-masonry")).toBe(true);
    expect(grid.getAttribute("style")).toContain("--p-masonry-gap: 24px");
    expect([...grid.children].map(spanOf)).toEqual(["span 124", "span 64", "span 85"]);
    expect([...grid.children].map((c) => c.textContent)).toEqual(["0", "1", "2"]);
    expect(observers.length).toBe(1);
    expect([...observers[0]!.watching]).toEqual([...grid.children]);
    // The grid itself is never observed.
    expect(observers[0]!.watching.has(grid)).toBe(false);
  });

  test("a size change writes the new span; an unchanged size writes nothing", async () => {
    const el = await mount(<Grid masonry style={{ columnGap: "24px" }}>{cards([100, 40])}</Grid>);
    const [a, b] = [...el.firstElementChild!.children] as HTMLElement[];
    const writes: string[] = [];
    for (const c of [a!, b!]) {
      const set = c.style.setProperty.bind(c.style);
      c.style.setProperty = (n: string, v: string | null, p?: string) => (writes.push(`${c.textContent}:${v}`), set(n, v, p));
    }
    await fire(a!, b!);
    expect(writes).toEqual([]);
    a!.setAttribute("data-h", "300");
    await fire(a!);
    expect(writes).toEqual(["0:span 324"]);
    expect(spanOf(a!)).toBe("span 324");
    await fire(a!);
    expect(writes).toEqual(["0:span 324"]);
  });

  test("a gap change re-measures every child", async () => {
    const el = await mount(<Grid masonry style={{ columnGap: "24px" }}>{cards([100, 40])}</Grid>);
    const grid = el.firstElementChild as HTMLElement;
    grid.style.columnGap = "16px";
    await fire(grid.children[0]!);
    expect([...grid.children].map(spanOf)).toEqual(["span 116", "span 56"]);
  });

  test("children added or removed are watched or released, and measured", async () => {
    const Page = ({ list }: { list: number[] }) => <Grid masonry style={{ columnGap: "8px" }}>{cards(list)}</Grid>;
    const el = await mount(<Page list={[10, 20]} />);
    const grid = el.firstElementChild!;
    // Add a child through the DOM, as a child component could: the observer must pick it up.
    const extra = document.createElement("div");
    extra.setAttribute("data-h", "50");
    await act(async () => {
      grid.append(extra);
      await Promise.resolve();
    });
    expect(observers[0]!.watching.has(extra)).toBe(true);
    expect(spanOf(extra)).toBe("span 58");
    const first = grid.children[0]!;
    await act(async () => {
      first.remove();
      await Promise.resolve();
    });
    expect(observers[0]!.watching.has(first)).toBe(false);
    expect(observers[0]!.watching.size).toBe(2);
  });

  test("RTL: the same spans (columns follow the direction by themselves; nothing is physical)", async () => {
    const el = await mount(wrap("ar", <Grid masonry cols={2} style={{ columnGap: "24px" }}>{cards([100, 40])}</Grid>));
    const grid = el.querySelector("[data-masonry]")!;
    expect([...grid.children].map(spanOf)).toEqual(["span 124", "span 64"]);
    expect(grid.className).not.toMatch(/(^| )(left|right|ml|mr|pl|pr)-/);
  });
});

test("children keep their own height, and print is a normal grid", async () => {
  const el = await mount(<Grid masonry>{cards([10])}</Grid>);
  const c = el.firstElementChild!.className.split(" ");
  for (const k of ["data-masonry:*:h-auto!", "print:data-masonry:*:row-end-auto!", "print:data-masonry:auto-rows-auto", "print:data-masonry:gap-y-(--p-masonry-gap)", "print:data-masonry:mb-0"]) expect(c).toContain(k);
});

describe("Grid masonry cleanup", () => {
  test("unmount disconnects the observers and removes data-masonry", async () => {
    const { createRoot } = await import("react-dom/client");
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    await act(async () => root.render(<Grid masonry>{cards([10])}</Grid>));
    const grid = host.firstElementChild!;
    expect(grid.hasAttribute("data-masonry")).toBe(true);
    await act(async () => root.unmount());
    expect(observers[0]!.disconnected).toBe(true);
    expect(grid.hasAttribute("data-masonry")).toBe(false);
  });
});

const ROWS = Array.from({ length: 5 }, (_, i) => ({ term: `T${i}`, details: `D${i}` }));
const rows = (el: Element) => [...el.querySelectorAll("dl > div")] as HTMLElement[];

describe("DescriptionList cols", () => {
  test("default and cols={1} are unchanged", async () => {
    const def = await mount(<DescriptionList items={ROWS} />);
    const one = await mount(<DescriptionList items={ROWS} cols={1} layout="auto" />);
    expect(def.querySelector("dl")!.className).toBe("divide-y divide-line");
    expect(rows(def)[0]!.className).toBe("grid gap-1 text-sm py-3");
    expect(one.querySelector("dl")!.className).toBe("divide-y divide-line @container");
  });

  test("cols={2}: the list is the container; pairs are 100% wide, half from 16rem; stacked term above details", async () => {
    const el = await mount(<DescriptionList items={ROWS} cols={2} />);
    const dl = el.querySelector("dl")!;
    expect(dl.className).toContain("@container");
    expect(dl.className).toContain("flex-wrap");
    expect(dl.className).not.toContain("divide-y");
    const c = rows(el)[0]!.className;
    for (const k of ["basis-full", "@min-[16rem]:basis-1/2", "grid", "py-3", "grow", "min-w-0"]) expect(c.split(" ")).toContain(k);
    expect(c).not.toContain("24rem");
    expect(c).not.toMatch(/(^| )(md|@md):/);
    // term above details: both in one grid cell column
    expect(rows(el)[0]!.className).not.toContain("grid-cols");
    expect([...rows(el)[0]!.children].map((n) => n.tagName)).toEqual(["DT", "DD"]);
  });

  test("cols={3}: a third from 24rem", async () => {
    const el = await mount(<DescriptionList items={ROWS} cols={3} />);
    const c = rows(el)[0]!.className.split(" ");
    expect(c).toContain("@min-[24rem]:basis-1/3");
    expect(c).toContain("@min-[16rem]:basis-1/2");
  });

  test("lines: the first row has no line at any width; every later row has one across all its pairs", async () => {
    const two = rows(await mount(<DescriptionList items={ROWS} cols={2} />)).map((r) => r.className.split(" "));
    expect(two[0]).not.toContain("border-t");
    // Pair 1 is in the first row once there are two columns.
    expect(two[1]).toContain("border-t");
    expect(two[1]).toContain("@min-[16rem]:border-t-0");
    for (const i of [2, 3, 4]) {
      expect(two[i]).toContain("border-t");
      expect(two[i]!.some((k) => k.endsWith("border-t-0"))).toBe(false);
    }
    const three = rows(await mount(<DescriptionList items={ROWS} cols={3} />)).map((r) => r.className.split(" "));
    expect(three[1]).toContain("@min-[16rem]:border-t-0");
    expect(three[2]).toContain("@min-[24rem]:border-t-0");
    expect(three[2]).not.toContain("@min-[16rem]:border-t-0");
    for (const i of [3, 4]) expect(three[i]!.some((k) => k.endsWith("border-t-0"))).toBe(false);
  });

  test("compact works with cols and every layout; one container", async () => {
    for (const layout of ["stack", "columns", "auto"] as const) {
      const el = await mount(<DescriptionList items={ROWS} cols={2} density="compact" layout={layout} />);
      const c = rows(el)[0]!.className;
      expect(c).toContain("py-2");
      expect(c).not.toContain("py-3");
      expect(c).not.toMatch(/(^| )md:/);
      expect(el.querySelector("dl")!.className.split(" ").filter((k) => k === "@container").length).toBe(1);
    }
  });

  test("cols with layout: stack stays stacked; columns puts the term beside its details in 18rem columns; auto from 28rem a column", async () => {
    const stack = rows(await mount(<DescriptionList items={ROWS} cols={2} />))[0]!.className;
    expect(stack).not.toContain("grid-cols");
    const cols2 = rows(await mount(<DescriptionList items={ROWS} cols={2} layout="columns" />)).map((r) => r.className.split(" "));
    expect(cols2[0]).toContain("@min-[18rem]:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]");
    expect(cols2[0]).toContain("@min-[36rem]:basis-1/2");
    expect(cols2[0]).not.toContain("@min-[16rem]:basis-1/2");
    expect(cols2[1]).toContain("@min-[36rem]:border-t-0");
    const cols3 = rows(await mount(<DescriptionList items={ROWS} cols={3} layout="columns" />)).map((r) => r.className.split(" "));
    expect(cols3[0]).toContain("@min-[54rem]:basis-1/3");
    expect(cols3[2]).toContain("@min-[54rem]:border-t-0");
    const auto2 = rows(await mount(<DescriptionList items={ROWS} cols={2} layout="auto" />))[0]!.className.split(" ");
    expect(auto2).toContain("@min-[16rem]:basis-1/2");
    expect(auto2).toContain("@min-[56rem]:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]");
    const auto3 = rows(await mount(<DescriptionList items={ROWS} cols={3} layout="auto" />))[0]!.className.split(" ");
    expect(auto3).toContain("@min-[84rem]:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]");
    expect(auto3).not.toContain("@min-[56rem]:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]");
  });

  test("reading order is the item order, in English and Arabic", async () => {
    for (const lang of ["en", "ar"] as const) {
      const el = await mount(wrap(lang, <DescriptionList items={ROWS} cols={3} />));
      expect([...el.querySelectorAll("dt")].map((n) => n.textContent)).toEqual(["T0", "T1", "T2", "T3", "T4"]);
      expect([...el.querySelectorAll("dd")].map((n) => n.textContent)).toEqual(["D0", "D1", "D2", "D3", "D4"]);
      // Only logical properties.
      expect(el.querySelector("dl")!.innerHTML).not.toMatch(/(^| |")(left|right|ml|mr|pl|pr)-/);
    }
  });

  test("RecordSection passes cols through (and Not set still shows)", async () => {
    const el = await mount(<RecordSection title="Cash" cols={2} layout="stack" items={[{ term: "A", details: "1" }, { term: "B", details: null }]} />);
    expect(el.querySelector("dl")!.className).toContain("flex-wrap");
    expect(rows(el)[0]!.className).toContain("@min-[16rem]:basis-1/2");
    expect(rows(el)[0]!.className).not.toContain("grid-cols");
    // Its default layout (columns) stays: the term beside its details.
    const beside = await mount(<RecordSection title="Shift" cols={2} items={[{ term: "A", details: "1" }]} />);
    expect(rows(beside)[0]!.className).toContain("@min-[36rem]:basis-1/2");
    expect(el.textContent).toContain("Not set");
    const def = await mount(<RecordSection title="Cash" items={[{ term: "A", details: "1" }]} />);
    expect(def.querySelector("dl")!.className).toContain("divide-y");
    expect(rows(def)[0]!.className).toContain("md:grid-cols-");
  });
});
