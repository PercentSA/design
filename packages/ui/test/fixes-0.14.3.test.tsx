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

  test("phone cards: the card grid has one column of at most the box width", () => {
    const html = renderToStaticMarkup(<DataTable columns={columns} rows={[{ id: "1", name: "A" }]} getRowId={(r) => r.id} caption="Rows" cards />);
    expect(html).toMatch(/<tbody class="[^"]*max-md:grid max-md:grid-cols-1/);
    const plain = renderToStaticMarkup(<DataTable columns={columns} rows={[{ id: "1", name: "A" }]} getRowId={(r) => r.id} caption="Rows" />);
    expect(plain).not.toContain("max-md:grid-cols-1");
  });
});
