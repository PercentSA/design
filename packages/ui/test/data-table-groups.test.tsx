import { describe, expect, test } from "bun:test";
import { DataTable, PercentProvider, type DataTableColumn, type DataTableProps } from "../src";
import { click, mount, useDom } from "./dom";

useDom();

type Row = { id: string; name: string; city: string; amount: number; note: string };
const ROWS: Row[] = [
  { id: "a", name: "INV-1", city: "Riyadh", amount: 5, note: "First" },
  { id: "b", name: "INV-2", city: "Jeddah", amount: 30, note: "Second" },
  { id: "c", name: "INV-3", city: "Riyadh", amount: 12, note: "Third" },
  { id: "d", name: "INV-4", city: "Dammam", amount: 7, note: "Fourth" },
  { id: "e", name: "INV-5", city: "Jeddah", amount: 1, note: "Fifth" },
];
const COLUMNS: DataTableColumn<Row>[] = [
  { key: "name", header: "Invoice" },
  { key: "amount", header: "Amount", sortable: true, align: "end" },
  { key: "note", header: "Note" },
];
const sum = (rows: Row[]) => String(rows.reduce((n, r) => n + r.amount, 0));
const render = (props: Partial<DataTableProps<Row>> = {}, lang: "en" | "ar" = "en") =>
  mount(
    <PercentProvider lang={lang}>
      <DataTable columns={COLUMNS} rows={ROWS} getRowId={(r) => r.id} caption="Invoices" {...props} />
    </PercentProvider>,
  );
const texts = (tr: Element) => [...tr.children].map((td) => td.textContent);
const groupBy = (r: Row) => r.city;

describe("DataTable totals and groups", () => {
  test("totals: tfoot values under their columns, label الإجمالي", async () => {
    const ar = await render({ totals: { amount: "55" } }, "ar");
    const foot = ar.querySelectorAll("tfoot tr");
    expect(foot.length).toBe(1);
    expect(texts(foot[0]!)).toEqual(["الإجمالي", "55", ""]);
    expect(foot[0]!.children[1]!.className).toContain("text-end");
    // A value for the first column takes the place of the label; a select column gets an empty cell.
    const en = await render({ totals: { name: "5 invoices", amount: "55" }, selectable: true });
    expect(texts(en.querySelector("tfoot tr")!)).toEqual(["", "5 invoices", "55", ""]);
    // Without totals there is no tfoot.
    expect((await render()).querySelector("tfoot")).toBeNull();
  });

  test("groupBy: one tbody per group in first-appearance order, header scope rowgroup, subtotal row after each group", async () => {
    const el = await render(
      { groupBy, groupHeader: (key, rows) => `${key} (${rows.length})`, groupTotals: (_, rows) => ({ amount: sum(rows) }), rowActions: () => [] },
      "ar",
    );
    const bodies = [...el.querySelectorAll("tbody")];
    expect(bodies.length).toBe(3);
    const heads = bodies.map((b) => b.querySelector("th")!);
    expect(heads.map((th) => th.textContent)).toEqual(["Riyadh (2)", "Jeddah (2)", "Dammam (1)"]);
    expect(heads.every((th) => th.getAttribute("scope") === "rowgroup" && th.getAttribute("colspan") === "4")).toBe(true);
    expect(bodies.map((b) => [...b.querySelectorAll("tr")].slice(1, -1).map((tr) => tr.children[0]!.textContent))).toEqual([["INV-1", "INV-3"], ["INV-2", "INV-5"], ["INV-4"]]);
    expect(bodies.map((b) => texts(b.lastElementChild!))).toEqual([
      ["المجموع الفرعي", "17", "", ""],
      ["المجموع الفرعي", "31", "", ""],
      ["المجموع الفرعي", "7", "", ""],
    ]);
    // Default header: the key; no groupTotals, no subtotal row.
    const plain = await render({ groupBy });
    expect([...plain.querySelectorAll("tbody")].map((b) => [b.querySelector("th")!.textContent, b.querySelectorAll("tr").length])).toEqual([
      ["Riyadh", 3],
      ["Jeddah", 3],
      ["Dammam", 2],
    ]);
  });

  test("sorting works inside each group", async () => {
    const order = (el: Element) => [...el.querySelectorAll("tbody")].map((b) => [...b.querySelectorAll("tr:not(:first-child)")].map((tr) => tr.children[0]!.textContent));
    const el = await render({ groupBy, defaultSort: { key: "amount", direction: "desc" } });
    expect(order(el)).toEqual([["INV-3", "INV-1"], ["INV-2", "INV-5"], ["INV-4"]]);
    await click(el.querySelector("thead button")!);
    expect(order(el)).toEqual([["INV-1", "INV-3"], ["INV-5", "INV-2"], ["INV-4"]]);
  });

  test("groupBy with pageSize shows all rows", async () => {
    const el = await render({ groupBy, pageSize: 2 });
    expect(el.querySelectorAll("tbody tr:not(:first-child)").length).toBe(5);
    expect(el.querySelector("nav")).toBeNull();
    // Without groupBy the same table has pages.
    expect((await render({ pageSize: 2 })).querySelector("nav")).not.toBeNull();
  });

  test("hidden columns hide their totals", async () => {
    const el = await render({ hiddenColumns: ["amount"], totals: { amount: "55", note: "All paid" }, groupBy, groupTotals: (_, rows) => ({ amount: sum(rows), note: "ok" }) });
    expect(texts(el.querySelector("tfoot tr")!)).toEqual(["Total", "All paid"]);
    expect(texts(el.querySelector("tbody")!.lastElementChild!)).toEqual(["Subtotal", "ok"]);
    expect(el.querySelector("tbody th")!.getAttribute("colspan")).toBe("2");
  });
});
