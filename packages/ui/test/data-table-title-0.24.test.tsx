import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { DataTable, PercentProvider, type DataTableColumn } from "../src";
import { ABOVE_STRETCHED_LINK } from "../src/components/card";
import { click, mount, useDom } from "./dom";

useDom();

type Row = { id: string; level: string; title: string; at: string };
const ROWS: Row[] = [
  { id: "a", level: "Critical", title: "Disk full", at: "10:00" },
  { id: "b", level: "Other", title: "Update ready", at: "10:05" },
];
const COLUMNS: DataTableColumn<Row>[] = [
  { key: "level", header: "Level" },
  { key: "title", header: "Title" },
  { key: "at", header: "Time" },
];
const table = (props: object = {}) => <DataTable columns={COLUMNS} rows={ROWS} getRowId={(r) => r.id} caption="Alerts" rowHref={(r) => `/alerts/${r.id}`} cards selectable rowActions={() => [{ label: "Dismiss" }]} {...props} />;
const norm = (html: string) => html.replace(/:r[0-9a-z]+:/gi, "ID");
const cellsOf = (tr: Element) => [...tr.querySelectorAll("td")];

describe("DataTable titleColumn and rowLabel", () => {
  test("titleColumn makes that column the row link and the card title", async () => {
    const el = await mount(table({ titleColumn: "title" }));
    const tr = el.querySelector("tbody tr")!;
    const [, level, title, at] = cellsOf(tr);
    expect(level!.querySelector("a")).toBeNull();
    expect(title!.querySelector("a[data-stretched]")!.getAttribute("href")).toBe("/alerts/a");
    expect(title!.querySelector("a")!.textContent).toBe("Disk full");
    // The card title: the title cell grows on the first line; the level shows as a field with its header.
    expect(title!.className).toContain("p-cards:flex-1");
    expect(level!.className).not.toContain("p-cards:flex-1");
    expect(level!.textContent).toContain("Level");
    expect(title!.textContent).not.toContain("Title");
    expect(at!.textContent).toContain("Time");
  });

  test("with rowLabel the title cell keeps its own links and the row link has that name", async () => {
    const cols: DataTableColumn<Row>[] = [COLUMNS[0]!, { key: "title", header: "Title", cell: (r) => <span>{r.title} <a href="/own">Al Noor</a></span> }, COLUMNS[2]!];
    const el = await mount(<DataTable columns={cols} rows={ROWS} getRowId={(r) => r.id} caption="Alerts" rowHref={(r) => `/alerts/${r.id}`} titleColumn="title" rowLabel={(r) => `Open ${r.title}`} />);
    const tr = el.querySelector("tbody tr")!;
    const title = cellsOf(tr)[1]!;
    const rowLink = title.querySelector<HTMLAnchorElement>("a[data-stretched]")!;
    expect(rowLink.getAttribute("aria-label")).toBe("Open Disk full");
    expect(rowLink.getAttribute("href")).toBe("/alerts/a");
    expect(rowLink.textContent).toBe("");
    expect(rowLink.className).toContain("after:absolute");
    const own = title.querySelector<HTMLAnchorElement>("a:not([data-stretched])")!;
    expect(own.getAttribute("href")).toBe("/own");
    expect(own.textContent).toBe("Al Noor");
    expect(tr.className).toContain("time[tabindex]");
    expect(tr.className).toContain(ABOVE_STRETCHED_LINK.split(" ")[0]!.slice(0, 20));
    // The first cell has no row link.
    expect(cellsOf(tr)[0]!.querySelector("a")).toBeNull();
  });

  test("the checkbox and the row menu use the title column", async () => {
    const el = await mount(table({ titleColumn: "title" }));
    const tr = el.querySelector("tbody tr")!;
    const name = (control: Element) =>
      control
        .getAttribute("aria-labelledby")!
        .split(" ")
        .map((id) => document.getElementById(id)!.textContent)
        .join(" ");
    expect(name(tr.querySelector('[role="checkbox"]')!)).toBe("Select row Disk full");
    expect(name(tr.querySelector("button[aria-haspopup]")!)).toBe("Row actions Disk full");
  });

  test("the title column can be the first one and the row link works", async () => {
    const el = await mount(table({ titleColumn: "level" }));
    await click(el.querySelector("a[data-stretched]")!);
    expect(cellsOf(el.querySelector("tbody tr")!)[1]!.querySelector("a")!.textContent).toBe("Critical");
  });

  test("without the props the first column is the title, and naming it changes nothing", () => {
    const wrap = (node: React.ReactNode) => norm(renderToStaticMarkup(<PercentProvider lang="en">{node}</PercentProvider>));
    expect(wrap(table({ titleColumn: "level" }))).toBe(wrap(table()));
    expect(wrap(table({ titleColumn: "missing" }))).toBe(wrap(table()));
    const plain = wrap(table());
    expect(plain).toContain('<a href="/alerts/a" data-stretched="" ');
    expect(plain).not.toContain("aria-label=\"Open");
  });
});
