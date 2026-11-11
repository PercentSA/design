import { describe, expect, test } from "bun:test";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PercentProvider, Sidebar, type SidebarSection } from "../src";
import { click, mount, press, useDom } from "./dom";

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
    expect(b.getAttribute("aria-label")).toBe("Show sub-items");
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
    expect(b.getAttribute("aria-label")).toBe("Show sub-items");
    // Enter and Space activate a native button: the browser sends a click, so one click stands for both.
    await click(b);
    expect(b.getAttribute("aria-expanded")).toBe("true");
    expect(b.tagName).toBe("BUTTON");
    expect(b.getAttribute("type")).toBe("button");
    await press(b, { key: "Enter" });
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
    expect(b.getAttribute("aria-label")).toBe("إظهار العناصر الفرعية");
    expect(b.querySelector("svg")!.getAttribute("class")).toContain("rtl:rotate-90");
    await click(b);
    expect(b.getAttribute("aria-label")).toBe("إخفاء العناصر الفرعية");
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
