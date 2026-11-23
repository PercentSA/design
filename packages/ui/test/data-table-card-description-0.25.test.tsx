import { describe, expect, test } from "bun:test";
import { DataTable, type DataTableColumn } from "../src";
import { mount, useDom } from "./dom";

useDom();

type Row = { id: string; name: string; plan: string; note: string };
const ROWS: Row[] = [{ id: "a", name: "Main website", plan: "Pro", note: "Serves shop.example.com from the Riyadh region." }];
const cols = (cardDescription?: "title" | "block"): DataTableColumn<Row>[] => [
  { key: "name", header: "Name", description: (r) => r.note, cardDescription },
  { key: "plan", header: "Plan", cardSlot: "meta" },
];
const table = (cardDescription?: "title" | "block") => (
  <DataTable columns={cols(cardDescription)} rows={ROWS} getRowId={(r) => r.id} caption="Sites" cards />
);
const cells = (el: HTMLElement) => [...el.querySelectorAll("tbody tr td")];
const withNote = (el: HTMLElement) => cells(el).filter((c) => c.textContent?.includes(ROWS[0]!.note));

describe("DataTable column cardDescription", () => {
  test("a block description comes after the meta line on a card", async () => {
    const el = await mount(table("block"));
    const [title, meta, block] = cells(el);
    expect(meta!.className).toContain("p-cards:order-1");
    expect(block!.textContent).toBe(ROWS[0]!.note);
    expect(block!.className).toContain("p-cards:order-2");
    expect(block!.className).toContain("p-cards:basis-full");
    // The table view shows the description under the title; the card hides that copy and shows the block.
    expect(block!.className).toContain("hidden");
    expect(title!.querySelector("span.block")!.className).toContain("p-cards:hidden");
  });

  test("the default keeps the description under the title", async () => {
    for (const el of [await mount(table()), await mount(table("title"))]) {
      expect(cells(el)).toHaveLength(2);
      const holders = withNote(el);
      expect(holders).toHaveLength(1);
      expect(holders[0]).toBe(cells(el)[0]!);
      expect(holders[0]!.querySelector("span.block")!.className).not.toContain("p-cards:hidden");
    }
  });

  test("each cell keeps its own column header: the copy is the last cell", async () => {
    const wide: DataTableColumn<Row & { region?: string }>[] = [...cols("block"), { key: "region", header: "Region" }];
    const el = await mount(
      <DataTable columns={wide} rows={[{ ...ROWS[0]!, region: "Jeddah" }]} getRowId={(r) => r.id} caption="Sites" cards selectable rowActions={() => [{ label: "Edit" }]} />,
    );
    const head = [...el.querySelectorAll("thead tr th")].map((c) => c.textContent);
    const row = [...el.querySelectorAll("tbody tr td")].map((c) => c.textContent);
    expect(row[head.indexOf("Plan")]).toBe("Pro");
    expect(row[head.indexOf("Region")]).toContain("Jeddah");
    expect(row[head.indexOf("Row actions")]).toContain("Row actions");
    expect(row.at(-1)).toBe(ROWS[0]!.note);
  });
});
