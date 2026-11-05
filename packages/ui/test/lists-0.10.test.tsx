import { describe, expect, test } from "bun:test";
import { act, useState, type ComponentProps, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DataTable, EmptyState, FilterBar, PercentProvider, type DataTableColumn, type DataTableProps, type FilterValue } from "../src";
import { click, mount, useDom } from "./dom";

useDom();

type Row = { id: string; name: string; phone: string | null; total: number; note: string | null };
const ROWS: Row[] = [
  { id: "a", name: "Sara", phone: "0551234567", total: 5, note: "First note" },
  { id: "b", name: "Omar", phone: null, total: 30, note: null },
  { id: "c", name: "Lina", phone: "", total: 12, note: "" },
];
const COLUMNS: DataTableColumn<Row>[] = [
  { key: "name", header: "Customer", description: (r) => r.phone, cardSlot: "meta" },
  { key: "total", header: "Total", align: "end", cardSlot: "end" },
  { key: "note", header: "Comment", cardSlot: "block" },
];
const RouterLink = ({ href, ...rest }: ComponentProps<"a">) => <a data-router="" href={href} {...rest} />;
const wrap = (lang: "en" | "ar", node: ReactNode) => (
  <PercentProvider lang={lang} link={RouterLink}>
    {node}
  </PercentProvider>
);
const table = (props: Partial<DataTableProps<Row>> = {}) => <DataTable columns={COLUMNS} rows={ROWS} getRowId={(r) => r.id} caption="Orders" {...props} />;
const html = (node: ReactNode, lang: "en" | "ar" = "en") => renderToStaticMarkup(wrap(lang, node));
const render = (node: ReactNode, lang: "en" | "ar" = "en") => mount(wrap(lang, node));
const cells = (el: Element, row: number) => [...el.querySelectorAll("tbody tr")[row]!.querySelectorAll("td")];

describe("DataTable description", () => {
  test("a muted second line under the value; null, undefined and empty show nothing", async () => {
    const el = await render(table({ columns: [COLUMNS[0]!] }));
    const lines = [0, 1, 2].map((i) => cells(el, i)[0]!.querySelectorAll("span.block").length);
    expect(lines).toEqual([1, 0, 0]);
    const line = cells(el, 0)[0]!.querySelector("span.block")!;
    expect(line.textContent).toBe("0551234567");
    expect(line.className).toMatch(/text-sm.*text-fg-2.*font-normal/);
  });

  test("with rowHref the line comes after the link, outside it, and a link in it stays clickable", async () => {
    const el = await render(
      table({
        rowHref: (r) => `/o/${r.id}`,
        columns: [{ key: "name", header: "Customer", description: (r) => <a href={`tel:${r.phone}`}>Call</a> }],
      }),
    );
    const cell = cells(el, 0)[0]!;
    const [stretched, tel] = [...cell.querySelectorAll("a")];
    expect(stretched!.hasAttribute("data-stretched")).toBe(true);
    expect(stretched!.textContent).toBe("Sara");
    expect(tel!.hasAttribute("data-stretched")).toBe(false);
    expect(stretched!.contains(tel!)).toBe(false);
    expect(stretched!.nextElementSibling!.contains(tel!)).toBe(true);
    // The row's rule lifts links above the stretched link.
    expect(el.querySelector("tbody tr")!.className).toContain("not([data-stretched]");
  });

  test("the first cell of a row with rowHref is font-medium at all widths; other cells are not", async () => {
    const el = await render(table({ rowHref: (r) => (r.id === "c" ? undefined : `/o/${r.id}`) }));
    expect(cells(el, 0)[0]!.classList.contains("font-medium")).toBe(true);
    expect(cells(el, 0)[1]!.classList.contains("font-medium")).toBe(false);
    expect(cells(el, 2)[0]!.classList.contains("font-medium")).toBe(false);
  });

  test("a description works in the other columns, and in the card field line (value and line in one span)", async () => {
    const el = await render(table({ cards: true, columns: [COLUMNS[0]!, { key: "total", header: "Total", description: () => "Simplified tax invoice" }] }));
    const td = cells(el, 0)[1]!;
    expect(td.querySelectorAll("span")[0]!.className).toContain("md:hidden");
    expect(td.querySelectorAll("span")[1]!.textContent).toBe("5Simplified tax invoice");
  });
});

describe("DataTable cardSlot", () => {
  test("end, meta and block cells: no header on the card, the slot classes", async () => {
    const el = await render(table({ cards: true, columns: [...COLUMNS, { key: "id", header: "Id", cardSlot: "meta" }] }));
    const [name, total, note] = cells(el, 0);
    expect(total!.className).toContain("max-md:shrink-0");
    expect(total!.className).not.toContain("max-md:order-1");
    expect(total!.querySelector(".md\\:hidden")).toBeNull();
    expect(note!.className).toMatch(/max-md:order-2.*max-md:basis-full/);
    expect(note!.querySelector(".md\\:hidden")).toBeNull();
    // The title cell is not a slot, even with a cardSlot on it.
    expect(name!.className).toContain("max-md:flex-1");
    expect(name!.className).not.toContain("max-md:text-fg-2");
    // The row breaks the title line when a meta cell exists, and uses margins in place of the row gap.
    const tr = el.querySelector("tbody tr")!;
    expect(tr.className).toContain("max-md:before:basis-full");
    expect(tr.className).toContain("max-md:gap-y-0");
  });

  test("meta cells sit in a wrapped line under the title; fields come after them", async () => {
    const el = await render(
      table({ cards: true, columns: [{ key: "name", header: "Customer" }, { key: "total", header: "Total", cardSlot: "meta" }, { key: "note", header: "Comment", cardSlot: "meta" }] }),
    );
    const [, a, b] = cells(el, 0);
    for (const td of [a!, b!]) expect(td.className).toMatch(/max-md:order-1.*max-md:text-fg-2/);
    const mixed = await render(table({ cards: true, columns: [{ key: "name", header: "Customer" }, { key: "total", header: "Total" }, { key: "note", header: "Comment", cardSlot: "meta" }] }));
    expect(cells(mixed, 0)[1]!.className).toContain("max-md:order-3");
  });

  test("a slot cell with no value is hidden on the card, and a slot with a value is not", async () => {
    const el = await render(table({ cards: true }));
    expect(cells(el, 0)[2]!.className).not.toContain("max-md:hidden");
    expect(cells(el, 1)[2]!.className).toContain("max-md:hidden");
    expect(cells(el, 2)[2]!.className).toContain("max-md:hidden");
    // A column without a slot keeps its line, as today.
    const plain = await render(table({ cards: true, columns: [COLUMNS[0]!, { key: "note", header: "Comment" }] }));
    expect(cells(plain, 1)[1]!.className).not.toContain("max-md:hidden");
  });

  test("without cards a cardSlot changes nothing; without a slot the card row keeps today's classes", () => {
    expect(html(table({ cards: false }))).not.toContain("max-md:");
    expect(html(table({ cards: false }))).toBe(html(table({ cards: false, columns: COLUMNS.map((c) => ({ ...c, cardSlot: undefined })) })));
    const plain = html(table({ cards: true, columns: COLUMNS.map((c) => ({ ...c, cardSlot: undefined })) }));
    expect(plain).toContain("max-md:gap-y-1.5");
    expect(plain).not.toContain("max-md:before:");
    expect(plain).not.toContain("max-md:order-3");
  });

  test("Arabic: logical classes only", () => {
    const out = html(table({ cards: true }), "ar");
    expect(out).toContain("text-end");
    expect(out).not.toMatch(/\b(?:max-md:)?(?:pl|pr|ml|mr)-|text-left|text-right/);
  });
});

describe("DataTable density", () => {
  test("compact: cells py-2, header h-9, card rows p-3 with gap-y-1; skeleton rows too", async () => {
    const plainColumns = COLUMNS.map((c) => ({ ...c, cardSlot: undefined }));
    const el = await render(table({ density: "compact", cards: true, selectable: true, columns: plainColumns }));
    expect(el.querySelector("thead th")!.className).toContain("h-9");
    expect(el.querySelector("thead th")!.className).not.toContain("h-10");
    expect(cells(el, 0)[1]!.className).toContain("py-2");
    expect(cells(el, 0)[1]!.className).not.toContain("py-3");
    expect(el.querySelector("tbody tr")!.className).toContain("max-md:p-3");
    expect(el.querySelector("tbody tr")!.className).toContain("max-md:gap-y-1");
    expect(el.querySelector("tbody tr")!.className).not.toContain("max-md:p-4");
    const loading = await render(table({ density: "compact", cards: true, loading: true }));
    expect(loading.querySelector("tbody tr")!.className).toContain("max-md:p-3");
    expect(loading.querySelector("tbody td")!.className).toContain("py-2");
  });

  test("default and density=\"default\" give the same markup as no prop", () => {
    expect(html(table({ density: "default", cards: true }))).toBe(html(table({ cards: true })));
    expect(html(table({ cards: true }))).toContain("h-10");
  });

  test("compact totals and group rows follow", () => {
    const out = html(table({ density: "compact", totals: { total: 47 }, groupBy: (r) => (r.total > 10 ? "big" : "small") }));
    expect(out).not.toContain("h-10");
    expect(out).not.toContain("py-3");
  });
});

describe("EmptyState variant", () => {
  test("framed (default) has the dashed frame; plain has none", () => {
    expect(html(<EmptyState title="No orders" />)).toContain("border-dashed");
    expect(html(<EmptyState variant="framed" title="No orders" />)).toBe(html(<EmptyState title="No orders" />));
    const plain = html(<EmptyState variant="plain" title="No orders yet" />);
    expect(plain).not.toMatch(/border|rounded-card/);
    expect(plain).toContain("No orders yet");
  });

  test("the DataTable default empty state is plain, in both languages", () => {
    for (const lang of ["en", "ar"] as const) {
      const out = html(table({ rows: [] }), lang);
      expect(out).not.toContain("border-dashed");
    }
    expect(html(table({ rows: [] }), "ar")).toContain("لا توجد نتائج");
    // A custom empty node is shown as given.
    expect(html(table({ rows: [], empty: <p>None</p> }))).toContain("<p>None</p>");
  });
});

const FILTERS = [
  { key: "status", label: "Status", multiple: true, options: [{ value: "paid", label: "Paid" }, { value: "open", label: "Open" }] },
  { key: "owner", label: "Owner", options: [{ value: "sara", label: "Sara" }, { value: "omar", label: "Omar" }] },
];
let last: FilterValue = {};
function Harness({ initial = {}, collapse = true, filters = FILTERS }: { initial?: FilterValue; collapse?: boolean; filters?: typeof FILTERS }) {
  const [value, setValue] = useState<FilterValue>(initial);
  return (
    <FilterBar
      collapseOnPhone={collapse}
      filters={filters}
      value={value}
      search={{ value: "", onValueChange: () => {}, placeholder: "Search" }}
      actions={<button type="button">Refresh</button>}
      onValueChange={(v) => {
        last = v;
        setValue(v);
      }}
    />
  );
}
const buttons = () => [...document.querySelectorAll("button")];
// The one button that shows only below 768 px (the bar's, not the sheet's).
const phone = () => buttons().find((b) => /^(Filters|عوامل التصفية)/.test(b.textContent!) && b.className.includes("md:hidden") && !b.className.includes("max-md:hidden"))!;
const settle = () => act(async () => void (await new Promise((r) => setTimeout(r, 20))));
const sheet = () => document.querySelector('[role="dialog"]');

describe("FilterBar collapseOnPhone", () => {
  test("off (default): no Filters button and no hiding class, as today", async () => {
    const el = await render(<Harness collapse={false} />);
    expect([...el.querySelectorAll("button")].map((b) => b.textContent)).toEqual(["Status", "Owner", "Refresh"]);
    expect(el.innerHTML).not.toContain("max-md:hidden");
  });

  test("on: the filter buttons hide below 768 px, one Filters button shows only there, search and actions stay", async () => {
    const el = await render(<Harness />);
    const byText = (t: string) => buttons().find((b) => b.textContent === t)!;
    expect(byText("Status").className).toContain("max-md:hidden");
    expect(byText("Owner").className).toContain("max-md:hidden");
    expect(phone()).toBeDefined();
    expect(el.querySelector('input[type="search"]')!.className).not.toContain("hidden");
    expect(byText("Refresh").parentElement!.className).not.toContain("hidden");
  });

  test("the count: none = label only; chosen = a badge with the total and a screen-reader text", async () => {
    await render(<Harness />);
    expect(phone().textContent).toBe("Filters");
    await render(<Harness initial={{ status: ["paid", "open"], owner: ["sara"] }} />);
    const withCount = buttons().filter((b) => b.textContent!.startsWith("Filters") && b.className.includes("md:hidden"))[1]!;
    // One accessible name with the number once: aria-label, and the visible badge is hidden from screen readers.
    expect(withCount.getAttribute("aria-label")).toBe("Filters, 3 selected");
    expect(withCount.querySelector('[aria-hidden="true"]:not(svg)')!.textContent).toBe("3");
    expect(withCount.querySelector(".sr-only")).toBeNull();
    expect(phone().getAttribute("aria-label")).toBeNull();
  });

  test("no filters: no button", async () => {
    const el = await render(<Harness filters={[]} />);
    expect([...el.querySelectorAll("button")].map((b) => b.textContent)).toEqual(["Refresh"]);
  });

  test("the button opens a bottom sheet with one group per filter: checkboxes for multiple, radios otherwise", async () => {
    await render(<Harness />);
    expect(sheet()).toBeNull();
    await click(phone());
    const dialog = sheet()!;
    expect(dialog.getAttribute("data-side")).toBe("bottom");
    expect(dialog.textContent).toContain("Filters");
    const groups = [...dialog.querySelectorAll("fieldset")];
    expect(groups.map((g) => g.querySelector("legend")!.textContent)).toEqual(["Status", "Owner"]);
    // The house Fieldset (min-w-0), and one name per group: the legend, no aria-label.
    expect(groups.every((g) => g.className.includes("min-w-0"))).toBe(true);
    expect(dialog.querySelector("[aria-label='Owner'],[aria-label='Status']")).toBeNull();
    expect(groups[0]!.querySelectorAll('[role="checkbox"]').length).toBe(2);
    expect(groups[1]!.querySelectorAll('[role="radio"]').length).toBe(2);
  });

  test("a change applies at once, with the same onValueChange as the menus", async () => {
    await render(<Harness />);
    await click(phone());
    const control = (name: string) => [...document.querySelectorAll('[role="dialog"] label')].find((l) => l.textContent === name)!.querySelector("button")!;
    await click(control("Paid"));
    expect(last).toEqual({ status: ["paid"] });
    await click(control("Open"));
    expect(last).toEqual({ status: ["paid", "open"] });
    await click(control("Paid"));
    expect(last).toEqual({ status: ["open"] });
    await click(control("Omar"));
    expect(last).toEqual({ status: ["open"], owner: ["omar"] });
    // The count on the bar follows, and the tags stay on the bar.
    expect(phone().textContent).toContain("2");
    expect(document.querySelectorAll('[aria-label^="Remove"]').length).toBe(2);
  });

  test("Clear filters in the sheet clears every filter; it is off when nothing is chosen", async () => {
    await render(<Harness initial={{ status: ["paid"], owner: ["sara"] }} />);
    await click(phone());
    const clear = [...document.querySelectorAll('[role="dialog"] button')].find((b) => b.textContent === "Clear filters") as HTMLButtonElement;
    expect(clear.hasAttribute("aria-disabled")).toBe(false);
    clear.focus();
    await click(clear);
    expect(last).toEqual({ status: [], owner: [] });
    // Not `disabled`: it keeps focus, which stays in the sheet. A click with nothing chosen does nothing.
    expect(clear.disabled).toBe(false);
    expect(clear.getAttribute("aria-disabled")).toBe("true");
    expect(document.activeElement).toBe(clear);
    expect(sheet()!.contains(document.activeElement)).toBe(true);
    await click(clear);
    expect(last).toEqual({ status: [], owner: [] });
    expect(phone().textContent).toBe("Filters");
    expect(phone().getAttribute("aria-label")).toBeNull();
  });

  test("the sheet closes with its close button; focus goes into the sheet and back to the Filters button", async () => {
    await render(<Harness />);
    const open = phone();
    open.focus();
    await click(open);
    expect(sheet()).not.toBeNull();
    expect(sheet()!.contains(document.activeElement)).toBe(true);
    await click(sheet()!.querySelector('[aria-label="Close"]')!);
    await settle();
    expect(sheet()).toBeNull();
    expect(document.activeElement).toBe(open);
  });

  test("removing a tag moves focus to the Filters button when the filter buttons are hidden", async () => {
    await render(<Harness initial={{ status: ["paid"] }} />);
    // A hidden (display: none) button cannot take focus; happy-dom has no media queries, so stub it.
    for (const b of buttons().filter((b) => b.className.includes("max-md:hidden"))) b.focus = () => {};
    await click(document.querySelector('[aria-label="Remove Status: Paid"]')!);
    expect(document.activeElement).toBe(phone());
  });

  test("Arabic: the strings, the groups, and a bottom sheet", async () => {
    const ar = [{ key: "status", label: "الحالة", multiple: true, options: [{ value: "paid", label: "مدفوع" }] }];
    await render(<Harness filters={ar} initial={{ status: ["paid"] }} />, "ar");
    expect(phone().getAttribute("aria-label")).toBe("عوامل التصفية, المحدد: 1");
    await click(phone());
    const dialog = sheet()!;
    expect(dialog.getAttribute("data-side")).toBe("bottom");
    expect(dialog.querySelector("legend")!.textContent).toBe("الحالة");
    expect(dialog.textContent).toContain("مدفوع");
    expect([...dialog.querySelectorAll("button")].some((b) => b.textContent === "مسح عوامل التصفية")).toBe(true);
  });
});
