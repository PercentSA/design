import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { buttonClass, DataTable, type DataTableColumn } from "../src";

type Row = { id: string; name: string };
const columns: DataTableColumn<Row>[] = [{ key: "name", header: "Name", cell: (r) => r.name }];

describe("0.14.3", () => {
  test("a pressed link button is marked; other variants are unchanged", () => {
    const link = buttonClass("link").split(" ");
    expect(link).toContain("aria-pressed:font-semibold");
    expect(link).toContain("aria-pressed:decoration-fg");
    expect(buttonClass("secondary")).not.toContain("aria-pressed:");
  });

  test("cards: the card grid columns are never wider than the box (a phone keeps one column)", () => {
    const html = renderToStaticMarkup(<DataTable columns={columns} rows={[{ id: "1", name: "A" }]} getRowId={(r) => r.id} caption="Rows" cards />);
    expect(html).toMatch(/<tbody class="[^"]*p-cards:grid p-cards:grid-cols-\[repeat\(auto-fill,minmax\(min\(100%,18rem\),1fr\)\)\]/);
    const plain = renderToStaticMarkup(<DataTable columns={columns} rows={[{ id: "1", name: "A" }]} getRowId={(r) => r.id} caption="Rows" />);
    expect(plain).not.toContain("p-cards:grid");
  });
});
