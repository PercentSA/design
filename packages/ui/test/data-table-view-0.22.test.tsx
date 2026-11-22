import { act } from "react";
import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { readFileSync } from "node:fs";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DataTable, PercentProvider, type DataTableProps } from "../src";
import { click, mount, useDom } from "./dom";

useDom();
afterEach(() => localStorage.clear());

type Row = { id: string; name: string };
const ROWS: Row[] = [
  { id: "a", name: "Al Noor" },
  { id: "b", name: "Main website" },
  { id: "c", name: "Shop" },
];
const COLUMNS = [{ key: "name", header: "Name" }];
const table = (props: Partial<DataTableProps<Row>> = {}) => (
  <DataTable columns={COLUMNS} rows={ROWS} getRowId={(r) => r.id} caption="Apps" cards {...props} />
);
const render = (node: ReactNode, lang: "en" | "ar" = "en") => mount(<PercentProvider lang={lang}>{node}</PercentProvider>);
const root = (el: Element) => el.firstElementChild as HTMLElement;
const radio = (el: Element, name: string) => [...el.querySelectorAll('[role="radio"]')].find((r) => r.textContent === name) as HTMLElement;

describe("DataTable view switch", () => {
  test("the root can shrink in a grid and keeps className", async () => {
    const el = await render(table({ className: "x" }));
    expect(root(el).classList.contains("min-w-0")).toBe(true);
    expect(root(el).classList.contains("x")).toBe(true);
  });

  test("without viewKey there is no switch and no data-view", async () => {
    const el = await render(table());
    expect(el.querySelector('[role="radiogroup"]')).toBeNull();
    expect(root(el).hasAttribute("data-view")).toBe(false);
  });

  test("viewKey with cards shows a radio group named View; Table is chosen", async () => {
    const el = await render(table({ viewKey: "apps" }));
    expect(el.querySelector('[role="radiogroup"]')!.getAttribute("aria-label")).toBe("View");
    expect(radio(el, "Table").getAttribute("aria-checked")).toBe("true");
    expect(radio(el, "Cards").getAttribute("aria-checked")).toBe("false");
  });

  test("Cards sets data-view=\"cards\" and stores the choice", async () => {
    const el = await render(table({ viewKey: "apps" }));
    await click(radio(el, "Cards"));
    expect(root(el).getAttribute("data-view")).toBe("cards");
    expect(localStorage.getItem("p-view:apps")).toBe("cards");
    await click(radio(el, "Table"));
    expect(root(el).hasAttribute("data-view")).toBe(false);
    expect(localStorage.getItem("p-view:apps")).toBe("table");
  });

  test("a stored choice is used after mount; an unknown value keeps the default", async () => {
    localStorage.setItem("p-view:apps", "cards");
    const el = await render(table({ viewKey: "apps" }));
    expect(root(el).getAttribute("data-view")).toBe("cards");
    localStorage.setItem("p-view:other", "grid");
    const other = await render(table({ viewKey: "other" }));
    expect(root(other).hasAttribute("data-view")).toBe(false);
  });

  test("defaultView=\"cards\" is used without a stored choice", async () => {
    const el = await render(table({ viewKey: "apps", defaultView: "cards" }));
    expect(root(el).getAttribute("data-view")).toBe("cards");
    expect(radio(el, "Cards").getAttribute("aria-checked")).toBe("true");
  });

  test("a storage error keeps the default and the switch still works", async () => {
    const get = spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const set = spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    try {
      const el = await render(table({ viewKey: "apps" }));
      expect(root(el).hasAttribute("data-view")).toBe(false);
      await click(radio(el, "Cards"));
      expect(root(el).getAttribute("data-view")).toBe("cards");
    } finally {
      get.mockRestore();
      set.mockRestore();
    }
  });

  test("viewKey without cards shows no switch", async () => {
    const el = await render(table({ viewKey: "apps", cards: false }));
    expect(el.querySelector('[role="radiogroup"]')).toBeNull();
    expect(root(el).hasAttribute("data-view")).toBe(false);
  });

  test("toolbar and switch share one row; the switch is last and hidden below 768 px", async () => {
    const el = await render(table({ viewKey: "apps", toolbar: <span data-testid="tb">Filter</span> }));
    const row = el.querySelector('[data-testid="tb"]')!.parentElement!.parentElement!;
    expect(row.className).toContain("flex flex-wrap items-center gap-2 pb-4");
    expect(row.children[0]!.className).toContain("min-w-0 flex-1");
    const last = row.lastElementChild!;
    expect(last.className).toContain("max-md:hidden");
    expect(last.querySelector('[role="radiogroup"]')).not.toBeNull();
    const plain = await render(table());
    expect(plain.querySelector(".pb-4")).toBeNull();
    const only = await render(table({ toolbar: "T" }));
    expect(only.querySelector(".pb-4")!.querySelector('[role="radiogroup"]')).toBeNull();
  });

  test("card classes use the p-cards variant", () => {
    const html = renderToStaticMarkup(<PercentProvider lang="en">{table()}</PercentProvider>);
    expect(html).toMatch(/<tr class="[^"]*p-cards:flex/);
    expect(html).not.toContain("max-md:");
  });

  test("styles.css defines p-cards for phones and for the cards view", () => {
    const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
    expect(css).toContain("@custom-variant p-cards");
    expect(css).toContain("(width < 48rem)");
    expect(css).toContain('[data-view="cards"]');
  });

  test("the switch names are Arabic on an Arabic page", async () => {
    const el = await render(table({ viewKey: "apps" }), "ar");
    expect(el.querySelector('[role="radiogroup"]')!.getAttribute("aria-label")).toBe("طريقة العرض");
    expect(radio(el, "جدول")).toBeDefined();
    expect(radio(el, "بطاقات")).toBeDefined();
  });
});

describe("DataTable view switch: keys and hidden header", () => {
  const arrow = (el: Element, key: string) =>
    act(async () => {
      el.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
    });

  test("ArrowRight selects Cards and sets data-view; in RTL ArrowLeft does", async () => {
    const el = await render(table({ viewKey: "apps" }));
    await arrow(radio(el, "Table"), "ArrowRight");
    expect(root(el).getAttribute("data-view")).toBe("cards");
    expect(radio(el, "Cards").getAttribute("aria-checked")).toBe("true");
    const ar = await render(table({ viewKey: "apps" }), "ar");
    await arrow(radio(ar, "جدول"), "ArrowLeft");
    expect(root(ar).getAttribute("data-view")).toBe("cards");
    await arrow(radio(ar, "بطاقات"), "ArrowRight");
    expect(root(ar).hasAttribute("data-view")).toBe(false);
  });

  test("in the cards view the header controls leave the Tab order; the header stays sr-only", async () => {
    const props = { viewKey: "apps", selectable: true, columns: [{ key: "name", header: "Name", sortable: true }] };
    const el = await render(table(props));
    const controls = () => [...el.querySelectorAll("thead button")];
    expect(controls().length).toBeGreaterThan(1);
    expect(controls().every((b) => !b.hasAttribute("tabindex"))).toBe(true);
    await click(radio(el, "Cards"));
    expect(controls().every((b) => b.getAttribute("tabindex") === "-1")).toBe(true);
    const cls = el.querySelector("thead")!.className;
    expect(cls).toContain("p-cards:sr-only");
    expect(cls).not.toContain("invisible");
  });
  test("below 768 px a cards table takes its header controls out of the Tab order too; a table without cards keeps them", async () => {
    const original = globalThis.matchMedia;
    globalThis.matchMedia = ((q: string) => ({ matches: q.includes("48rem"), addEventListener() {}, removeEventListener() {} })) as unknown as typeof matchMedia;
    try {
      const columns = [{ key: "name", header: "Name", sortable: true }];
      const el = await render(table({ selectable: true, columns }));
      const controls = [...el.querySelectorAll("thead button")];
      expect(controls.length).toBeGreaterThan(1);
      expect(controls.every((b) => b.getAttribute("tabindex") === "-1")).toBe(true);
      const plain = await render(table({ cards: false, columns }));
      expect([...plain.querySelectorAll("thead button")].every((b) => !b.hasAttribute("tabindex"))).toBe(true);
    } finally {
      globalThis.matchMedia = original;
    }
  });
  test("the cards view puts as many cards in a row as fit; group, total and empty rows take the full row", async () => {
    type G = Row & { group: string; n: number };
    const rows: G[] = ROWS.map((r, i) => ({ ...r, group: i < 2 ? "One" : "Two", n: i }));
    const el = await render(
      <DataTable<G>
        columns={[{ key: "name", header: "Name" }, { key: "n", header: "N" }]}
        rows={rows}
        getRowId={(r) => r.id}
        caption="Apps"
        cards
        viewKey="apps"
        defaultView="cards"
        groupBy={(r) => r.group}
        groupTotals={() => ({ n: 1 })}
        totals={{ n: 3 }}
      />,
    );
    const bodies = [...el.querySelectorAll("tbody")];
    expect(bodies.length).toBe(2);
    for (const b of bodies) expect(b.className).toContain("p-cards:grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))]");
    const full = (tr: Element | null | undefined) => expect(tr?.className.split(" ")).toContain("p-cards:col-span-full");
    for (const th of el.querySelectorAll('tbody th[scope="rowgroup"]')) full(th.closest("tr"));
    for (const tr of el.querySelectorAll("tbody tr.font-semibold")) full(tr);
    expect(el.querySelectorAll("tbody tr.font-semibold").length).toBe(2);
    const empty = await render(table({ rows: [], viewKey: "apps", defaultView: "cards" }));
    full(empty.querySelector("tbody tr"));
  });
});
