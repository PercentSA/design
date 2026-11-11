import { describe, expect, test } from "bun:test";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PercentProvider, Sidebar, type SidebarSection } from "../src";
import { click, mount, useDom } from "./dom";

useDom();

const ar = (node: ReactNode) => <PercentProvider lang="ar">{node}</PercentProvider>;
const make = (current?: string): SidebarSection[] => [
  {
    items: [
      { href: "/home", label: "Home", icon: <svg />, current: current === "/home" },
      {
        href: "/a",
        label: "Al Noor",
        icon: <svg />,
        current: current === "/a",
        children: [
          { href: "/a/app", label: "App", current: current === "/a/app" },
          { href: "/a/site", label: "Site" },
        ],
      },
    ],
  },
];
const group = (el: Element) => el.querySelector("button[aria-controls]")!;
const list = (el: Element) => el.querySelector("ul ul")!;

describe("Sidebar nested items", () => {
  test("link and disclosure button; folded at first", async () => {
    const el = await mount(<Sidebar sections={make("/home")} />);
    expect(el.querySelector('a[href="/a"]')).not.toBeNull();
    const b = group(el);
    expect(b.getAttribute("aria-expanded")).toBe("false");
    expect(b.getAttribute("aria-label")).toBe("Show Al Noor links");
    expect(list(el).id).toBe(b.getAttribute("aria-controls")!);
    expect(list(el).hasAttribute("hidden")).toBe(true);
  });

  test("open at first when a child or the parent is current; the child has aria-current", async () => {
    const el = await mount(<Sidebar sections={make("/a/app")} />);
    expect(group(el).getAttribute("aria-expanded")).toBe("true");
    expect(list(el).hasAttribute("hidden")).toBe(false);
    expect(el.querySelector('a[href="/a/app"]')!.getAttribute("aria-current")).toBe("page");
    const el2 = await mount(<Sidebar sections={make("/a")} />);
    expect(group(el2).getAttribute("aria-expanded")).toBe("true");
  });

  test("click and keyboard toggle", async () => {
    const el = await mount(<Sidebar sections={make("/a/app")} />);
    const b = group(el);
    await click(b);
    expect(b.getAttribute("aria-expanded")).toBe("false");
    expect(b.getAttribute("aria-label")).toBe("Show Al Noor links");
    // Enter and Space activate a native button: the browser sends a click, so one click stands for both.
    await click(b);
    expect(b.getAttribute("aria-expanded")).toBe("true");
    expect(b.tagName).toBe("BUTTON");
    expect(b.getAttribute("type")).toBe("button");
  });

  test("the group opens when the current page moves into it, and the user can fold it again", async () => {
    const { createRoot } = await import("react-dom/client");
    const { act } = await import("react");
    const el = document.createElement("div");
    document.body.append(el);
    const root = createRoot(el);
    await act(async () => root.render(<Sidebar sections={make("/home")} />));
    expect(group(el).getAttribute("aria-expanded")).toBe("false");
    await act(async () => root.render(<Sidebar sections={make("/a/app")} />));
    expect(group(el).getAttribute("aria-expanded")).toBe("true");
    await click(group(el));
    expect(group(el).getAttribute("aria-expanded")).toBe("false");
    await act(async () => root.unmount());
  });

  test("names differ per group, with and without a text label", async () => {
    const sec: SidebarSection[] = [{ items: [
      { href: "/a", label: "A", children: [{ href: "/a/1", label: "x" }] },
      { href: "/b", label: "B", children: [{ href: "/b/1", label: "y" }] },
      { href: "/c", label: <b>C</b>, children: [{ href: "/c/1", label: "z" }] },
    ] }];
    for (const [wrap, names] of [[(n: ReactNode) => n, ["Show A links", "Show B links", "Show sub-items"]], [ar, ["إظهار روابط A", "إظهار روابط B", "إظهار الروابط الفرعية"]]] as const) {
      const el = await mount(wrap(<Sidebar sections={sec} />));
      expect([...el.querySelectorAll("button[aria-controls]")].map((b) => b.getAttribute("aria-label"))).toEqual([...names]);
      expect(el.querySelector("button[aria-controls]")!.hasAttribute("title")).toBe(false);
    }
  });

  test("a move inside a folded group opens it; a fold stays until the page changes", async () => {
    const { createRoot } = await import("react-dom/client");
    const { act } = await import("react");
    const el = document.createElement("div");
    document.body.append(el);
    const root = createRoot(el);
    await act(async () => root.render(<Sidebar sections={make("/a/app")} />));
    await click(group(el));
    expect(group(el).getAttribute("aria-expanded")).toBe("false");
    await act(async () => root.render(<Sidebar sections={make("/a/app")} />));
    expect(group(el).getAttribute("aria-expanded")).toBe("false");
    const m = make("/a/app");
    m[0].items[1].children![0].current = false;
    m[0].items[1].children![1].current = true;
    await act(async () => root.render(<Sidebar sections={m} />));
    expect(group(el).getAttribute("aria-expanded")).toBe("true");
    await act(async () => root.unmount());
  });

  test("defaultOpen false keeps the group folded; the parent looks selected without aria-current", async () => {
    const s = make("/a/app");
    s[0].items[1].defaultOpen = false;
    const el = await mount(<Sidebar sections={s} />);
    expect(group(el).getAttribute("aria-expanded")).toBe("false");
    const parent = el.querySelector('a[href="/a"]')!;
    expect(parent.hasAttribute("data-has-current")).toBe(true);
    expect(parent.hasAttribute("aria-current")).toBe(false);
    await click(group(el));
    expect(parent.hasAttribute("data-has-current")).toBe(false);
  });

  test("rail: the parent of the current child looks selected; folds survive a rail toggle", async () => {
    const el = await mount(<Sidebar sections={make("/a/app")} />);
    await click(group(el)); // fold
    await click(el.querySelector("button[aria-expanded]:not([aria-controls])")!); // rail
    expect(el.querySelector('a[href="/a"]')!.hasAttribute("data-has-current")).toBe(true);
    await click(el.querySelector("button[aria-expanded]:not([aria-controls])")!); // expand
    expect(group(el).getAttribute("aria-expanded")).toBe("false");
  });

  test("a page change while the sidebar is a rail shows on expand", async () => {
    const { createRoot } = await import("react-dom/client");
    const { act } = await import("react");
    const rail = () => el.querySelector("button[aria-expanded]:not([aria-controls])")!;
    const site = () => { const m = make("/a/app"); m[0].items[1].children![0].current = false; m[0].items[1].children![1].current = true; return m; };
    let el!: HTMLElement;
    const run = async (first: SidebarSection[], second: SidebarSection[] | null, fold: boolean) => {
      el = document.createElement("div");
      document.body.append(el);
      const root = createRoot(el);
      await act(async () => root.render(<Sidebar sections={first} />));
      if (fold) await click(group(el));
      await click(rail());
      if (second) await act(async () => root.render(<Sidebar sections={second} />));
      await click(rail());
      const open = group(el).getAttribute("aria-expanded");
      await act(async () => root.unmount());
      return open;
    };
    expect(await run(make("/home"), make("/a/app"), false)).toBe("true");
    expect(await run(make("/a/app"), site(), true)).toBe("true");
    expect(await run(make("/a/app"), null, true)).toBe("false");
  });

  test("defaultOpen", async () => {
    const s = make("/home");
    s[0].items[1].defaultOpen = true;
    const el = await mount(<Sidebar sections={s} />);
    expect(group(el).getAttribute("aria-expanded")).toBe("true");
  });

  test("deeper levels are not shown", async () => {
    const s = make("/home");
    s[0].items[1].children![0].children = [{ href: "/deep", label: "Deep" }];
    const el = await mount(<Sidebar sections={s} />);
    expect(el.querySelector('a[href="/deep"]')).toBeNull();
    expect(el.querySelectorAll("button[aria-controls]").length).toBe(1);
  });

  test("rail: no children, no disclosure button, the parent stays a link", async () => {
    const el = await mount(<Sidebar sections={make("/a/app")} collapsed />);
    expect(el.querySelector("button[aria-controls]")).toBeNull();
    expect(el.querySelector('a[href="/a/app"]')).toBeNull();
    expect(el.querySelector('a[href="/a"]')).not.toBeNull();
  });

  test("Arabic strings and a chevron that follows the direction", async () => {
    const el = await mount(ar(<Sidebar sections={make("/home")} />));
    const b = group(el);
    expect(b.getAttribute("aria-label")).toBe("إظهار روابط Al Noor");
    expect(b.querySelector("svg")!.getAttribute("class")).toContain("rtl:-scale-x-100");
    await click(b);
    expect(b.getAttribute("aria-label")).toBe("إخفاء روابط Al Noor");
  });

  test("a flat sidebar has no group markup", () => {
    const html = renderToStaticMarkup(<PercentProvider lang="en"><Sidebar sections={[{ items: make()[0].items.slice(0, 1) }]} /></PercentProvider>);
    expect(html).not.toContain("aria-controls");
    expect(html).not.toContain(" hidden=");
  });

  // Locked against the 0.17.1 output: a sidebar without children looks and reads the same.
  test("flat sidebar markup is unchanged (expanded and rail)", () => {
    const flat: SidebarSection[] = [{ title: "T", items: [{ href: "/a", label: "A", icon: <svg />, badge: 3, current: true }, { href: "/b", label: "B", icon: <svg /> }] }];
    for (const collapsed of [false, true]) {
      expect(renderToStaticMarkup(<PercentProvider lang="en"><Sidebar sections={flat} collapsed={collapsed} /></PercentProvider>).replace(/_R_[0-9a-z]+_/g, "ID")).toMatchSnapshot();
    }
  });
});
