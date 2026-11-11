import { describe, expect, spyOn, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { PercentProvider, Sidebar, type SidebarSection } from "../src";
import { mount, useDom } from "./dom";

useDom();

const make = (): SidebarSection[] => [
  {
    items: [
      { href: "/home", label: "Home", icon: <svg />, current: true },
      { label: <span role="status">Loading clients…</span>, icon: <svg />, current: true, children: [{ href: "/x", label: "X" }] },
      { label: "Second note", icon: <svg /> },
    ],
  },
];
const row = (el: Element) => [...el.querySelectorAll("li")].find((li) => li.textContent?.includes("Loading clients"))!;

describe("Sidebar plain row", () => {
  test("not a link, not current, not focusable, no chevron", async () => {
    const r = row(await mount(<Sidebar sections={make()} />));
    expect(r.querySelector("a")).toBeNull();
    expect(r.querySelector("[aria-current]")).toBeNull();
    expect(r.querySelector("[tabindex],button,a")).toBeNull();
    expect(r.textContent).not.toContain("X");
  });

  test("the rail shows the label as sr-only", async () => {
    const r = row(await mount(<Sidebar sections={make()} collapsed />));
    expect(r.querySelector(".sr-only")?.textContent).toBe("Loading clients…");
    expect(r.querySelector("a")).toBeNull();
  });

  test("two plain rows give no key warning", async () => {
    const err = spyOn(console, "error").mockImplementation(() => {});
    await mount(<Sidebar sections={make()} />);
    expect(err.mock.calls.filter((c) => String(c[0]).includes("key"))).toHaveLength(0);
    err.mockRestore();
  });

  test("a link row next to a plain row is unchanged", () => {
    const html = (s: SidebarSection[]) => renderToStaticMarkup(<PercentProvider lang="en"><Sidebar sections={s} /></PercentProvider>);
    const link = '<a href="/home" aria-current="page"';
    expect(html(make())).toContain(link);
    expect(html([{ items: [make()[0].items[0]] }])).toContain(link);
  });
});
