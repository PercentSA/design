import { describe, expect, test } from "bun:test";
import type { ComponentProps } from "react";
import { PercentProvider, RouteTabs, type RouteTab } from "../src";
import { click, mount, press, useDom } from "./dom";

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
});
