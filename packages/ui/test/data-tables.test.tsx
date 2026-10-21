import { describe, expect, mock, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Button, PercentProvider } from "../src";
import { Card } from "../src/components/card";
import { DataTable, type DataTableColumn } from "../src/components/data-table";
import { DescriptionList, List, ListItem } from "../src/components/list";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../src/components/table";
import { click, mount, useDom } from "./dom";

useDom();

const html = (node: React.ReactNode) => renderToStaticMarkup(node);
const ar = (node: React.ReactNode) => html(<PercentProvider lang="ar">{node}</PercentProvider>);

type Row = { id: string; name: string; amount: number };
const ROWS: Row[] = [
  { id: "a", name: "Item 10", amount: 5 },
  { id: "b", name: "Item 2", amount: 30 },
  { id: "c", name: "Item 1", amount: 12 },
];
const COLUMNS: DataTableColumn<Row>[] = [
  { key: "name", header: "Name", sortable: true },
  { key: "amount", header: "Amount", sortable: true, align: "end" },
];
const table = (props: Partial<React.ComponentProps<typeof DataTable<Row>>> = {}) => (
  <DataTable columns={COLUMNS} rows={ROWS} getRowId={(r) => r.id} caption="Items" {...props} />
);
// First-column text of the body rows, in order.
const names = (el: Element) => [...el.querySelectorAll("tbody tr")].map((tr) => tr.querySelector("td")?.textContent);
const header = (el: Element, text: string) => [...el.querySelectorAll("th")].find((th) => th.textContent === text)!;

describe("Card", () => {
  test("href makes the title the one link; buttons inside are not in the link and still work", async () => {
    const onShare = mock();
    const node = (
      <Card href="/en/work/masar" title="Masar" description="Booking app" action={<Button onClick={onShare}>Share</Button>} footer="2026">
        Body
      </Card>
    );
    const out = html(node);
    expect(out.match(/<a /g)).toHaveLength(1);
    expect(out).toMatch(/<a[^>]*href="\/en\/work\/masar"[^>]*>Masar<\/a>/);
    expect(out).toContain("after:absolute");
    const el = await mount(node);
    const button = [...el.querySelectorAll("button")].find((b) => b.textContent === "Share")!;
    expect(button.closest("a")).toBeNull();
    await click(button);
    expect(onShare).toHaveBeenCalledTimes(1);
  });
  test("without href there is no link", () => {
    const out = html(<Card title="Plan">Body</Card>);
    expect(out).not.toContain("<a ");
    expect(out).toContain(">Plan<");
    expect(out).toContain(">Body<");
  });
});

describe("Table", () => {
  test("numbers align to the end with tabular digits; headers are column headers", () => {
    const out = html(
      <Table caption="Invoices">
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead align="end">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Masar</TableCell>
            <TableCell align="end">1,200</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(out).toContain("<caption");
    expect(out).toContain(">Invoices<");
    expect(out).toMatch(/<td[^>]*class="[^"]*text-end[^"]*tabular-nums[^"]*"[^>]*>1,200</);
    expect(out).toMatch(/<th[^>]*scope="col"[^>]*class="[^"]*text-end/);
    expect(out).toContain("overflow-x-auto");
  });
});

describe("DataTable sorting", () => {
  test("a header button sorts ascending, then descending, with aria-sort and onSortChange", async () => {
    const onSortChange = mock();
    const el = await mount(table({ onSortChange }));
    expect(names(el)).toEqual(["Item 10", "Item 2", "Item 1"]);
    expect(el.querySelector("[aria-sort]")).toBeNull();
    await click(header(el, "Name").querySelector("button")!);
    expect(names(el)).toEqual(["Item 1", "Item 2", "Item 10"]);
    expect(header(el, "Name").getAttribute("aria-sort")).toBe("ascending");
    expect(onSortChange).toHaveBeenLastCalledWith({ key: "name", direction: "asc" });
    await click(header(el, "Name").querySelector("button")!);
    expect(names(el)).toEqual(["Item 10", "Item 2", "Item 1"]);
    expect(header(el, "Name").getAttribute("aria-sort")).toBe("descending");
    await click(header(el, "Amount").querySelector("button")!);
    expect(names(el)).toEqual(["Item 10", "Item 1", "Item 2"]);
    expect(header(el, "Name").hasAttribute("aria-sort")).toBe(false);
  });
  test("Arabic collation with numbers: alef forms sort by the next letter; 2 before 10", () => {
    const rows = [
      { id: "1", name: "أحمد", amount: 0 },
      { id: "2", name: "طلب 10", amount: 0 },
      { id: "3", name: "إبراهيم", amount: 0 },
      { id: "4", name: "طلب 2", amount: 0 },
    ];
    const out = ar(<DataTable columns={COLUMNS} rows={rows} getRowId={(r) => r.id} caption="الطلبات" defaultSort={{ key: "name", direction: "asc" }} />);
    const order = ["إبراهيم", "أحمد", "طلب 2", "طلب 10"].map((n) => out.indexOf(`>${n}<`));
    expect(order.every((i, k) => i > 0 && (k === 0 || i > order[k - 1]!))).toBe(true);
    expect(out).toContain('aria-sort="ascending"');
  });
  test("sortValue sorts by a value other than the shown cell", () => {
    const cols: DataTableColumn<Row>[] = [{ key: "name", header: "Name", sortable: true, sortValue: (r) => -r.amount }];
    const out = html(<DataTable columns={cols} rows={ROWS} getRowId={(r) => r.id} caption="Items" defaultSort={{ key: "name", direction: "asc" }} />);
    expect(out.indexOf(">Item 2<")).toBeLessThan(out.indexOf(">Item 1<"));
    expect(out.indexOf(">Item 1<")).toBeLessThan(out.indexOf(">Item 10<"));
  });
});

describe("DataTable selection", () => {
  test("row and header checkboxes: indeterminate, all, none; onSelectedChange gets ids", async () => {
    const onSelectedChange = mock();
    const el = await mount(table({ selectable: true, onSelectedChange }));
    const boxes = () => [...el.querySelectorAll('[role="checkbox"]')];
    expect(boxes()).toHaveLength(4);
    await click(boxes()[2]!);
    expect(onSelectedChange).toHaveBeenLastCalledWith(["b"]);
    expect(boxes()[0]!.getAttribute("aria-checked")).toBe("mixed");
    expect(el.textContent).toContain("1 selected");
    expect(el.querySelector("tbody tr")!.nextElementSibling!.getAttribute("data-state")).toBe("selected");
    await click(boxes()[0]!);
    expect([...onSelectedChange.mock.lastCall![0]].sort()).toEqual(["a", "b", "c"]);
    expect(boxes()[0]!.getAttribute("aria-checked")).toBe("true");
    expect(el.textContent).toContain("3 selected");
    await click(boxes()[0]!);
    expect(onSelectedChange).toHaveBeenLastCalledWith([]);
    expect(boxes()[0]!.getAttribute("aria-checked")).toBe("false");
  });
  test("each row checkbox is named by its row; the header one says select all (Arabic)", () => {
    const out = ar(table({ selectable: true, defaultSelected: ["a"] }));
    expect(out).toContain("تحديد كل الصفوف");
    expect(out).toContain("تحديد الصف");
    expect(out).toContain("المحدد: 1");
    const labelledby = out.match(/role="checkbox"[^>]*aria-labelledby="([^"]+)"/)?.[1] ?? out.match(/aria-labelledby="([^"]+)"[^>]*role="checkbox"/)?.[1];
    const [selectId, cellId] = labelledby!.split(" ");
    expect(out).toMatch(new RegExp(`id="${selectId}"[^>]*>تحديد الصف<`));
    expect(out).toMatch(new RegExp(`<td[^>]*id="${cellId}"[^>]*>Item 10<`));
  });
});

describe("DataTable pagination", () => {
  const many: Row[] = Array.from({ length: 5 }, (_, i) => ({ id: `r${i + 1}`, name: `Row ${i + 1}`, amount: i }));
  test("client side: pageSize slices the rows; Pagination moves between pages", async () => {
    const el = await mount(<DataTable columns={COLUMNS} rows={many} getRowId={(r) => r.id} caption="Rows" pageSize={2} />);
    expect(names(el)).toEqual(["Row 1", "Row 2"]);
    expect(el.querySelector('nav[aria-label="Pagination"]')).not.toBeNull();
    await click(el.querySelector('[aria-label="Go to page 3"]')!);
    expect(names(el)).toEqual(["Row 5"]);
  });
  test("server side: page/pageCount show the given rows unsliced and report page changes", async () => {
    const onPageChange = mock();
    const el = await mount(
      <DataTable columns={COLUMNS} rows={many} getRowId={(r) => r.id} caption="Rows" page={2} pageCount={4} onPageChange={onPageChange} defaultSort={{ key: "name", direction: "desc" }} />,
    );
    // The server sorted and sliced already: the table keeps the rows as given.
    expect(names(el)).toEqual(["Row 1", "Row 2", "Row 3", "Row 4", "Row 5"]);
    expect(el.querySelector('[aria-current="page"]')!.textContent).toBe("2");
    await click(el.querySelector('[aria-label="Next"]')!);
    expect(onPageChange).toHaveBeenCalledWith(3);
  });
  test("no pagination when everything fits on one page", () => {
    expect(html(table({ pageSize: 10 }))).not.toContain('aria-label="Pagination"');
  });
});

describe("DataTable loading and empty", () => {
  test("loading: aria-busy, skeleton rows instead of data, announced", () => {
    const out = html(table({ loading: true, pageSize: 4 }));
    expect(out).toMatch(/<table[^>]*aria-busy="true"/);
    expect(out).not.toContain(">Item 1<");
    expect(out.match(/animate-pulse/g)).toHaveLength(4 * COLUMNS.length);
    expect(out).toMatch(/role="status"[^>]*>Loading</);
  });
  test("empty: default EmptyState with noResults in both languages, or a custom node", () => {
    expect(html(table({ rows: [] }))).toContain("No results");
    expect(ar(table({ rows: [] }))).toContain("لا توجد نتائج");
    const out = html(table({ rows: [], empty: <p>Nothing yet</p>, selectable: true }));
    expect(out).toContain("Nothing yet");
    expect(out).toContain(`colSpan="${COLUMNS.length + 1}"`);
  });
  test("caption may be visually hidden", () => {
    expect(html(table({ hideCaption: true }))).toMatch(/<caption id="[^"]+" class="sr-only">Items</);
  });
});

describe("List and DescriptionList", () => {
  test("ListItem with href: the title is the one link; trailing controls stay outside it", async () => {
    const node = (
      <List>
        <ListItem href="/en/invoices/1" leading={<i>icon</i>} title="Invoice 1" description="Due today" trailing={<Button>Pay</Button>} />
        <ListItem title="Invoice 2" />
      </List>
    );
    const out = html(node);
    expect(out).toContain("<ul");
    expect(out.match(/<li/g)).toHaveLength(2);
    expect(out.match(/<a /g)).toHaveLength(1);
    expect(out).toMatch(/<a[^>]*>Invoice 1<\/a>/);
    expect(out).toContain("divide-y");
    const el = await mount(node);
    expect(el.querySelector("button")!.closest("a")).toBeNull();
  });
  test("DescriptionList: terms and details; columns from 768 px only with layout=columns", () => {
    const items = [{ term: "Client", details: "Masar" }, { term: "Year", details: "2026" }];
    const stack = html(<DescriptionList items={items} />);
    expect(stack).toContain("<dl");
    expect(stack).toMatch(/<dt[^>]*>Client<\/dt><dd[^>]*>Masar<\/dd>/);
    expect(stack).not.toContain("md:grid-cols");
    expect(html(<DescriptionList items={items} layout="columns" />)).toContain("md:grid-cols-");
  });
});

describe("RTL", () => {
  test("Arabic DataTable: pagination chevrons mirror; sort icons do not", () => {
    const many = Array.from({ length: 4 }, (_, i) => ({ id: `${i}`, name: `صف ${i}`, amount: i }));
    const out = ar(<DataTable columns={COLUMNS} rows={many} getRowId={(r) => r.id} caption="صفوف" pageSize={2} />);
    expect(out).toContain('aria-label="التنقل بين الصفحات"');
    expect(out.match(/rtl:-scale-x-100/g)).toHaveLength(2);
    expect(out).toContain('aria-label="انتقل إلى الصفحة 2"');
  });
  test("Arabic Card, List and DescriptionList render", () => {
    const out = ar(
      <Card title="مسار" href="/ar/work/masar">
        <List>
          <ListItem title="الفاتورة 1" />
        </List>
        <DescriptionList items={[{ term: "العميل", details: "مسار" }]} layout="columns" />
      </Card>,
    );
    expect(out).toContain(">مسار</a>");
    expect(out).toContain(">الفاتورة 1<");
    expect(out).toContain(">العميل</dt>");
  });
});
