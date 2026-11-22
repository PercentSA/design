import { describe, expect, test } from "bun:test";
import type { ComponentProps } from "react";
import { AttentionList, PercentProvider, type AttentionItem } from "../src";
import { mount, useDom } from "./dom";

useDom();

const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000);
const ITEMS: AttentionItem[] = [
  { id: "a", level: "critical", title: "Disk full", href: "/alerts/a", detail: "No space left", area: "Storage", context: <a href="/c">Al Noor</a>, openedAt: ago(5), action: <button type="button">Fix</button> },
  { id: "b", level: "important", title: "Slow response", href: "/alerts/b", area: "Main website", openedAt: ago(60) },
  { id: "c", level: "other", title: "Update ready", href: "/alerts/c", openedAt: ago(600), menu: [{ label: "Dismiss" }] },
];
const rows = (el: Element) => [...el.querySelectorAll("li")];

describe("AttentionList", () => {
  test("rows keep the given order and show level, title link, detail, area and context, age and action", async () => {
    const el = await mount(<AttentionList label="Open alerts" items={ITEMS} />);
    expect(el.querySelector("ul")!.getAttribute("aria-label")).toBe("Open alerts");
    const li = rows(el);
    expect(li.map((r) => r.querySelector("a")!.textContent)).toEqual(["Disk full", "Slow response", "Update ready"]);
    expect(li[0]!.querySelector("a")!.getAttribute("href")).toBe("/alerts/a");
    expect(li[0]!.textContent).toContain("No space left");
    expect(li[0]!.textContent).toContain("Storage · Al Noor");
    expect(li[1]!.textContent).not.toContain("·");
    expect(li[0]!.querySelector("time")!.textContent).toContain("ago");
    expect(li[0]!.textContent).toContain("Fix");
  });

  test("the level is a word, not only a colour", async () => {
    const en = await mount(<AttentionList label="x" items={ITEMS} />);
    expect(rows(en).map((r) => r.textContent)).toEqual([expect.stringContaining("Critical"), expect.stringContaining("Important"), expect.stringContaining("Other")]);
    const ar = await mount(
      <PercentProvider lang="ar">
        <AttentionList label="x" items={ITEMS} />
      </PercentProvider>,
    );
    expect(ar.textContent).toContain("حرج");
    expect(ar.textContent).toContain("مهم");
    expect(ar.textContent).toContain("أخرى");
  });

  test("menu adds a ⋯ button named More actions and the title", async () => {
    const el = await mount(<AttentionList label="x" items={ITEMS} />);
    const buttons = el.querySelectorAll("button[aria-haspopup]");
    expect(buttons.length).toBe(1);
    const name = buttons[0]!.getAttribute("aria-labelledby")!.split(" ").map((id) => document.getElementById(id)!.textContent).join(" ");
    expect(name).toBe("More actions Update ready");
    expect(buttons[0]!.textContent).toContain("More actions");
  });

  test("compact shows dot, title and area · age only", async () => {
    const el = await mount(<AttentionList label="x" compact items={ITEMS} />);
    const first = rows(el)[0]!;
    expect(first.querySelector('[class*="bg-danger"]')).not.toBeNull();
    const line = rows(el)[1]!.querySelector("p")!;
    expect(line.textContent).toContain("Important · Main website · ");
    expect(rows(el)[1]!.querySelector(".sr-only")).toBeNull();
    expect(first.textContent).toContain("Critical · Storage · ");
    expect(first.textContent).not.toContain("Al Noor");
    expect(el.querySelector("time[tabindex]")).toBeNull();
    expect(first.textContent).not.toContain("No space left");
    expect(first.textContent).not.toContain("Fix");
    expect(el.querySelector("button")).toBeNull();
  });

  test("empty shows the empty node and no list", async () => {
    const el = await mount(<AttentionList label="x" items={[]} empty={<p>All clear</p>} />);
    expect(el.textContent).toBe("All clear");
    expect(el.querySelector("ul")).toBeNull();
  });

  test("without empty, No items shows", async () => {
    const el = await mount(<AttentionList label="x" items={[]} />);
    expect(el.textContent).toContain("No items");
    expect(el.querySelector("ul")).toBeNull();
  });

  test("the age shows the exact time on hover or tap", async () => {
    const el = await mount(<AttentionList label="x" items={ITEMS} />);
    expect(el.querySelector('time[tabindex="0"]')).not.toBeNull();
  });

  test("the title link uses the provider link component", async () => {
    const Router = ({ href, ...rest }: ComponentProps<"a">) => <a data-router="" href={href} {...rest} />;
    const el = await mount(
      <PercentProvider lang="en" link={Router}>
        <AttentionList label="x" items={ITEMS} />
      </PercentProvider>,
    );
    expect(rows(el)[0]!.querySelector("a[data-router]")!.textContent).toBe("Disk full");
  });

  test("phone: the row stacks", async () => {
    const el = await mount(<AttentionList label="x" items={ITEMS} />);
    const li = rows(el)[0]!;
    expect(li.className).toContain("grid");
    expect(li.querySelector("button")!.parentElement!.className).toContain("max-md:col-span-3");
  });

  test("from 768 px all rows share one grid, so the columns line up", async () => {
    const el = await mount(<AttentionList label="x" items={ITEMS} />);
    expect(el.querySelector("ul")!.className).toContain("md:grid-cols-[");
    for (const li of rows(el)) expect(li.className).toContain("md:grid-cols-subgrid");
  });

  test("the tab order is title link, action, menu button", async () => {
    const item: AttentionItem = { ...ITEMS[0]!, context: undefined, menu: [{ label: "Dismiss" }] };
    const el = await mount(<AttentionList label="x" items={[item]} />);
    const order = [...el.querySelectorAll("li a, li button, li time[tabindex]")].map((n) => n.textContent!.trim());
    expect(order).toEqual(["Disk full", "5 minutes ago", "Fix", "More actions"]);
  });

  test("className stays when the list is empty", async () => {
    const el = await mount(<AttentionList label="x" items={[]} className="mt-4" />);
    expect(el.querySelector(".mt-4")).not.toBeNull();
  });

  test("compact level word is shown in Arabic", async () => {
    const el = await mount(
      <PercentProvider lang="ar">
        <AttentionList label="x" compact items={ITEMS} />
      </PercentProvider>,
    );
    expect(rows(el)[1]!.querySelector("p")!.textContent).toContain("مهم");
  });
});
