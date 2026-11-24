import { describe, expect, test } from "bun:test";
import { DataTable, type DataTableColumn } from "../src";
import { mount, useDom } from "./dom";

useDom();

type Row = { id: string; title: string; at: string };
const ROWS: Row[] = [{ id: "a", title: "Disk full", at: "10:00" }];
const COLUMNS: DataTableColumn<Row>[] = [
  { key: "title", header: "Title" },
  { key: "at", header: "Time" },
];

describe("DataTable row names with rowLabel", () => {
  test("with rowLabel the checkbox and the row menu are named by rowLabel", async () => {
    const el = await mount(
      <DataTable columns={COLUMNS} rows={ROWS} getRowId={(r) => r.id} caption="Alerts" rowHref={(r) => `/alerts/${r.id}`} rowLabel={(r) => `Open ${r.title}`} selectable rowActions={() => [{ label: "Dismiss" }]} />,
    );
    const tr = el.querySelector("tbody tr")!;
    const ids = (control: Element) => control.getAttribute("aria-labelledby")!.split(" ");
    const name = (control: Element) => ids(control).map((id) => document.getElementById(id)!.textContent).join(" ");
    const box = tr.querySelector('[role="checkbox"]')!;
    const menu = tr.querySelector("button[aria-haspopup]")!;
    expect(name(box)).toBe("Select row Open Disk full");
    expect(name(menu)).toBe("Row actions Open Disk full");
    for (const control of [box, menu]) for (const id of ids(control)) expect(document.getElementById(id)!.querySelector("[aria-label]")).toBeNull();
  });
});
