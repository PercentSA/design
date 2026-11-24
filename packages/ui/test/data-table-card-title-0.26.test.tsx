import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { DataTable, PercentProvider, type DataTableColumn } from "../src";
import { mount, useDom } from "./dom";

useDom();

type Row = { id: string; order: string; customer: string };
const ROWS: Row[] = [{ id: "a", order: "Order 1042", customer: "Al Noor" }];
const COLUMNS: DataTableColumn<Row>[] = [
  { key: "order", header: "Order" },
  { key: "customer", header: "Customer", hideOnCard: true },
];
const table = (props: object = {}) => <DataTable columns={COLUMNS} rows={ROWS} getRowId={(r) => r.id} caption="Orders" cards {...props} />;
const norm = (html: string) => html.replace(/:r[0-9a-z]+:/gi, "ID");

describe("DataTable cardTitle", () => {
  test("cardTitle shows on cards and the table keeps the title cell", async () => {
    for (const extra of [{}, { rowHref: (r: Row) => `/o/${r.id}` }, { rowHref: (r: Row) => `/o/${r.id}`, rowLabel: (r: Row) => `Open ${r.order}` }]) {
      const el = await mount(table({ cardTitle: (r: Row) => `${r.order} · ${r.customer}`, ...extra }));
      const cell = el.querySelector("tbody td")!;
      const table_ = cell.querySelectorAll(".p-cards\\:hidden");
      const card = cell.querySelectorAll(".hidden.p-cards\\:inline");
      expect(table_.length).toBe(1);
      expect(table_[0]!.textContent).toBe("Order 1042");
      expect(card.length).toBe(1);
      expect(card[0]!.textContent).toBe("Order 1042 · Al Noor");
    }
  });

  test("without cardTitle the markup does not change", () => {
    const wrap = (node: React.ReactNode) => norm(renderToStaticMarkup(<PercentProvider lang="en">{node}</PercentProvider>));
    expect(wrap(table({ cardTitle: undefined }))).toBe(wrap(table()));
  });

  test("without cardTitle the title cell has no view copies", async () => {
    for (const extra of [{}, { rowHref: (r: Row) => `/o/${r.id}` }]) {
      const cell = (await mount(table(extra))).querySelector("tbody td")!;
      expect(cell.querySelector(".p-cards\\:hidden, .p-cards\\:inline")).toBeNull();
      expect(cell.textContent).toBe("Order 1042");
    }
  });
});
