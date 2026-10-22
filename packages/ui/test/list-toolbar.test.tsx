import { describe, expect, mock, test } from "bun:test";
import { useState, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ColumnsMenu, DataTable, FilterBar, PercentProvider, type DataTableColumn, type DataTableProps, type FilterDef } from "../src";
import { click, mount, press, useDom } from "./dom";

useDom();

const html = (node: ReactNode) => renderToStaticMarkup(node);
const ar = (node: ReactNode) => <PercentProvider lang="ar">{node}</PercentProvider>;

type Row = { id: string; name: string; client: string; amount: number };
const ROWS: Row[] = Array.from({ length: 30 }, (_, i) => ({ id: `r${i}`, name: `INV-${i + 1}`, client: i % 2 ? "Masar" : "Sadeem", amount: i * 10 }));
const COLUMNS: DataTableColumn<Row>[] = [
  { key: "name", header: "Invoice", hideable: false },
  { key: "client", header: "Client" },
  { key: "amount", header: "Amount", align: "end" },
];
const table = (props: Partial<DataTableProps<Row>> = {}) => <DataTable columns={COLUMNS} rows={ROWS} getRowId={(r) => r.id} caption="Invoices" {...props} />;
const FILTERS: FilterDef[] = [{ key: "status", label: "Status", options: [{ value: "paid", label: "Paid" }] }];

describe("ColumnsMenu", () => {
  test("ColumnsMenu lists only hideable columns; a click toggles the key; the menu stays open", async () => {
    const got: string[][] = [];
    function Harness() {
      const [hidden, setHidden] = useState<string[]>([]);
      return (
        <ColumnsMenu
          columns={COLUMNS}
          hidden={hidden}
          onHiddenChange={(h) => {
            got.push(h);
            setHidden(h);
          }}
        />
      );
    }
    const el = await mount(<Harness />);
    const trigger = el.querySelector("button")!;
    expect(trigger.textContent).toBe("Columns");
    expect(trigger.querySelector("svg")).not.toBeNull();
    await press(trigger, { key: "Enter" });
    const items = () => [...document.querySelectorAll('[role="menuitemcheckbox"]')];
    expect(items().map((i) => i.textContent)).toEqual(["Client", "Amount"]);
    expect(items().map((i) => i.getAttribute("aria-checked"))).toEqual(["true", "true"]);
    await click(items()[0]!);
    expect(got.at(-1)).toEqual(["client"]);
    expect(document.querySelector('[role="menu"]')).not.toBeNull();
    expect(items()[0]!.getAttribute("aria-checked")).toBe("false");
    await click(items()[1]!);
    expect(got.at(-1)).toEqual(["client", "amount"]);
    await click(items()[0]!);
    expect(got.at(-1)).toEqual(["amount"]);
    expect(html(ar(<ColumnsMenu columns={COLUMNS} hidden={[]} onHiddenChange={() => {}} />))).toContain("الأعمدة");
  });
});

describe("DataTable list options", () => {
  test("hiddenColumns removes the header and the cells of those columns", async () => {
    const el = await mount(table({ hiddenColumns: ["client"] }));
    expect([...el.querySelectorAll("thead th")].map((th) => th.textContent)).toEqual(["Invoice", "Amount"]);
    expect([...el.querySelectorAll("tbody tr")].every((tr) => tr.querySelectorAll("td").length === 2)).toBe(true);
    expect(el.textContent).not.toContain("Masar");
  });

  test("page size: the select lists the options; a change calls onPageSizeChange(25) and onPageChange(1); Arabic label عدد الصفوف", async () => {
    const onPageSizeChange = mock();
    const onPageChange = mock();
    const el = await mount(table({ pageSize: 10, pageSizeOptions: [10, 25, 50], onPageSizeChange, onPageChange }));
    const select = el.querySelector<HTMLElement>('[role="combobox"]')!;
    expect(el.querySelector(`label[for="${select.id}"]`)!.textContent).toBe("Rows per page");
    expect(select.textContent).toBe("10");
    await click([...el.querySelectorAll("nav button")].find((b) => b.textContent === "2")!);
    expect(onPageChange).toHaveBeenLastCalledWith(2);
    await press(select, { key: "ArrowDown" });
    const options = [...document.querySelectorAll('[role="option"]')];
    expect(options.map((o) => o.textContent)).toEqual(["10", "25", "50"]);
    await press(options[1]!, { key: "Enter" });
    expect(onPageSizeChange).toHaveBeenLastCalledWith(25);
    expect(onPageChange).toHaveBeenLastCalledWith(1);
    expect(html(ar(table({ pageSize: 10, pageSizeOptions: [10, 25] })))).toContain(">عدد الصفوف<");
    expect(html(table({ pageSize: 10 }))).not.toContain("Rows per page");
  });

  test("stickyHeader: own scroll box and a sticky head", () => {
    const out = html(table({ stickyHeader: true }));
    expect(out).toMatch(/<div role="region"[^>]*class="[^"]*max-h-\[70dvh\][^"]*overflow-auto/);
    expect(out).toMatch(/<thead class="[^"]*sticky[^"]*bg-bg/);
    expect(html(table())).not.toContain("sticky");
  });
});

describe("FilterBar actions", () => {
  test("FilterBar actions render at the end of the first row", async () => {
    const el = await mount(<FilterBar filters={FILTERS} value={{ status: ["paid"] }} onValueChange={() => {}} actions={<button data-action="">Refresh</button>} />);
    const [first, tags] = [...el.querySelector('[role="group"]')!.children];
    const action = el.querySelector("[data-action]")!;
    expect(first!.lastElementChild!.contains(action)).toBe(true);
    expect(first!.lastElementChild!.classList.contains("ms-auto")).toBe(true);
    expect(tags!.contains(action)).toBe(false);
    expect(html(<FilterBar filters={FILTERS} value={{}} onValueChange={() => {}} />)).not.toContain("ms-auto");
  });
});
