import { describe, expect, mock, test } from "bun:test";
import type { ComponentProps, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DataTable, PercentProvider, type DataTableColumn, type DataTableProps } from "../src";
import { ABOVE_STRETCHED_LINK } from "../src/components/card";
import { click, mount, press, useDom } from "./dom";

useDom();

type Row = { id: string; name: string; amount: number; note: string };
const ROWS: Row[] = [
  { id: "a", name: "INV-1", amount: 5, note: "First" },
  { id: "b", name: "INV-2", amount: 30, note: "Second" },
  { id: "c", name: "INV-3", amount: 12, note: "Third" },
];
const COLUMNS: DataTableColumn<Row>[] = [
  { key: "name", header: "Invoice", sortable: true },
  { key: "amount", header: "Amount", sortable: true, align: "end" },
  { key: "note", header: "Note" },
];
const table = (props: Partial<DataTableProps<Row>> = {}) => <DataTable columns={COLUMNS} rows={ROWS} getRowId={(r) => r.id} caption="Invoices" {...props} />;
const html = (node: ReactNode) => renderToStaticMarkup(node);
const RouterLink = ({ href, ...rest }: ComponentProps<"a">) => <a data-router="" href={href} {...rest} />;
// The accessible name from aria-labelledby: the text of each referenced element, in order.
const labelledBy = (el: Element) =>
  el
    .getAttribute("aria-labelledby")!
    .split(" ")
    .map((id) => document.getElementById(id)!.textContent)
    .join(" ");

describe("DataTable rows", () => {
  test("without the new props the markup is unchanged", () => {
    expect(
      html(
        <>
          {table({ selectable: true, defaultSelected: ["b"], defaultSort: { key: "amount", direction: "desc" }, pageSize: 2 })}
          {table({ selectable: true, loading: true })}
          {table({ rows: [] })}
        </>,
      ),
    ).toMatchSnapshot();
  });

  test("rowHref: one link per row in the first cell, through the provider link", async () => {
    const el = await mount(<PercentProvider lang="en" link={RouterLink}>{table({ rowHref: (r) => (r.id === "c" ? undefined : `/invoices/${r.id}`) })}</PercentProvider>);
    const rows = [...el.querySelectorAll("tbody tr")];
    expect(rows.map((tr) => tr.querySelectorAll("a").length)).toEqual([1, 1, 0]);
    const link = rows[0]!.querySelector("a")!;
    expect(link.hasAttribute("data-router")).toBe(true);
    expect(link.getAttribute("href")).toBe("/invoices/a");
    expect(link.hasAttribute("data-stretched")).toBe(true);
    expect(link.className).toContain("after:absolute");
    expect(link.textContent).toBe("INV-1");
    expect(link.parentElement).toBe(rows[0]!.querySelector("td"));
    expect(rows[0]!.classList.contains("relative")).toBe(true);
    // A row without a link is a plain row.
    expect(rows[2]!.classList.contains("relative")).toBe(false);
  });

  test("controls in a linked row do not follow the link", async () => {
    const onLink = mock();
    const onSelectedChange = mock();
    const onDelete = mock();
    const Link = ({ href, ...rest }: ComponentProps<"a">) => (
      <a
        href={href}
        {...rest}
        onClick={(e) => {
          e.preventDefault();
          onLink();
        }}
      />
    );
    const el = await mount(
      <PercentProvider lang="en" link={Link}>
        {table({ selectable: true, onSelectedChange, rowHref: (r) => `/invoices/${r.id}`, rowActions: () => [{ label: "Delete", onSelect: onDelete }] })}
      </PercentProvider>,
    );
    const tr = el.querySelector("tbody tr")!;
    for (const c of ABOVE_STRETCHED_LINK.split(" ")) expect(tr.classList.contains(c)).toBe(true);
    const checkbox = tr.querySelector('[role="checkbox"]')!;
    const more = tr.querySelector("button[aria-haspopup]")!;
    expect(checkbox.closest("a")).toBeNull();
    expect(more.closest("a")).toBeNull();
    await click(checkbox);
    expect(onSelectedChange).toHaveBeenLastCalledWith(["a"]);
    await click(more);
    await press(more, { key: "Enter" });
    const item = [...document.querySelectorAll('[role="menuitem"]')].find((n) => n.textContent === "Delete")!;
    await click(item);
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onLink).not.toHaveBeenCalled();
    // The row link itself still works.
    await click(tr.querySelector("a")!);
    expect(onLink).toHaveBeenCalledTimes(1);
  });

  test("rowActions: the button is named by Row actions + the first cell; [] gives no button; Arabic إجراءات الصف", async () => {
    const el = await mount(table({ rowActions: (r) => (r.id === "b" ? [] : [{ label: "Delete", danger: true }]) }));
    const rows = [...el.querySelectorAll("tbody tr")];
    const button = rows[0]!.querySelector("button")!;
    expect(labelledBy(button)).toBe("Row actions INV-1");
    expect(button.querySelector("svg")).not.toBeNull();
    expect(rows[1]!.querySelector("button")).toBeNull();
    // Every row keeps the column, so the cells stay aligned.
    expect(rows.map((tr) => tr.querySelectorAll("td").length)).toEqual([4, 4, 4]);
    const head = [...el.querySelectorAll("thead th")].at(-1)!;
    expect(head.querySelector(".sr-only")!.textContent).toBe("Row actions");
    const out = html(<PercentProvider lang="ar">{table({ rowActions: () => [{ label: "حذف" }] })}</PercentProvider>);
    expect(out).toContain(">إجراءات الصف<");
    expect(out).not.toContain("Row actions");
  });

  test("cards: other cells carry their header for phones; hideOnCard cells hide below md; the head is sr-only below md", async () => {
    const columns = COLUMNS.map((c) => (c.key === "note" ? { ...c, hideOnCard: true } : c));
    const el = await mount(<DataTable columns={columns} rows={ROWS} getRowId={(r) => r.id} caption="Invoices" cards selectable rowActions={() => [{ label: "Delete" }]} />);
    expect(el.querySelector("thead")!.classList.contains("max-md:sr-only")).toBe(true);
    const tr = el.querySelector("tbody tr")!;
    expect(tr.classList.contains("max-md:flex")).toBe(true);
    const [, first, amount, note] = [...tr.querySelectorAll("td")];
    // The first cell is the card's title: no header label.
    expect(first!.querySelector('[class~="md:hidden"]')).toBeNull();
    const label = amount!.querySelector('[class~="md:hidden"]')!;
    expect(label.textContent).toBe("Amount");
    expect(amount!.firstElementChild).toBe(label);
    expect(note!.classList.contains("max-md:hidden")).toBe(true);
    // One copy of the rows: no second markup for phones.
    expect(el.querySelectorAll("tbody tr")).toHaveLength(3);
    expect(el.textContent!.split("INV-1")).toHaveLength(2);
    // Without cards, no phone labels.
    const plain = html(table());
    expect(plain).not.toContain("md:hidden");
    expect(plain).not.toContain("max-md:");
  });
});
