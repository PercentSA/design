// Report parts (0.11.0): Stat container sizes, PeriodPicker presets/weekStart/clearTo, DataTable density="print", TableHead scope="row" and wrap.
import { describe, expect, test } from "bun:test";
import { useState, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DataTable, Money, PercentProvider, PeriodPicker, rangePreset, Stat, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, todayPlain, type DataTableColumn, type DateRange, type Period } from "../src";
import { click, mount, useDom } from "./dom";

useDom();
const html = (node: ReactNode, lang: "en" | "ar" = "en") => renderToStaticMarkup(<PercentProvider lang={lang}>{node}</PercentProvider>);
const dom = (node: ReactNode, lang: "en" | "ar" = "en") => {
  const doc = document.createElement("div");
  doc.innerHTML = html(node, lang);
  return doc;
};
const custom = (r: DateRange): Period => ({ kind: "custom", from: r.from!, to: r.to! });
const hasClass = (el: Element, ...names: string[]) => names.every((n) => el.className.split(/\s+/).includes(n));

describe("Stat tile container", () => {
  const stat = (lang: "en" | "ar" = "en") =>
    dom(
      <Stat label="Collected" value={<Money amount={123456.78} decimals={2} />} change={{ value: "12.5%", direction: "up" }} hint="Yesterday" className="extra" />,
      lang,
    );

  test("the tile is the container, and the size classes are on its children", () => {
    const tile = stat().firstElementChild!;
    expect(hasClass(tile, "@container", "extra", "border")).toBe(true);
    // No size class on the container itself: a container variant does not apply to the element that is the container.
    expect(tile.className).not.toMatch(/text-|@\[/);
    const value = [...tile.querySelectorAll("div")].find((d) => d.className.includes("tabular-nums") && d.className.includes("font-semibold"))!;
    expect(hasClass(value, "text-lg", "@[10rem]:text-xl", "@[12rem]:text-2xl", "@[15rem]:text-3xl")).toBe(true);
    expect(hasClass(tile.firstElementChild!, "p-4", "@[15rem]:p-5")).toBe(true);
  });

  test("label, change and hint keep their sizes; the change stays ltr in Arabic", () => {
    const tile = stat("ar").firstElementChild!;
    const text = (s: string) => [...tile.querySelectorAll("div")].find((d) => d.textContent === s)!;
    expect(text("Collected").className).toBe("text-sm text-fg-3");
    expect(text("Yesterday").className).toBe("text-xs text-fg-3");
    expect([...tile.querySelectorAll('span[dir="ltr"]')].at(-1)!.textContent).toBe("12.5%");
  });

  test("the smallest size is text-lg with p-4 (a 6-digit amount with 2 decimals fits 158 px)", () => {
    // happy-dom has no layout: the check is the classes. "123,456.78" is 10 characters; at text-lg (18px) about 100 px.
    const out = html(<Stat label="a" value="123,456.78" />);
    expect(out).toContain("text-lg");
    expect(out).toContain("p-4");
  });
});

describe("PeriodPicker report options", () => {
  const START: Period = { kind: "custom", from: "2026-09-01", to: "2026-09-30" };
  const DEFAULT: Period = { kind: "month", from: "2026-08-01", to: "2026-08-31" };
  function Picker({ log, lang = "en", ...props }: { log: Period[]; lang?: "en" | "ar" } & Partial<Parameters<typeof PeriodPicker>[0]>) {
    const [value, setValue] = useState(START);
    return (
      <PercentProvider lang={lang}>
        <PeriodPicker
          value={value}
          today="2026-09-27"
          {...props}
          onValueChange={(p) => {
            log.push(p);
            setValue(p as typeof START);
          }}
        />
      </PercentProvider>
    );
  }
  const open = async (el: Element) => click(el.querySelector("button[aria-haspopup]")!);
  const dialogButtons = () => [...document.querySelectorAll('[role="dialog"] button')];
  const KNOWN = ["Today", "Yesterday", "Last 7 days", "Last 30 days", "This week", "This month", "Last month", "اليوم", "أمس"];
  const firstWeekday = () => document.querySelector('[role="dialog"] thead th')!.getAttribute("abbr");
  const presetButtons = () => dialogButtons().map((b) => b.textContent!).filter((t) => KNOWN.includes(t));

  test("presets: only the given presets show, and a click commits the preset range as a custom period", async () => {
    const log: Period[] = [];
    const el = await mount(<Picker log={log} presets={["today", "yesterday", "last7Days", "last30Days"]} />);
    await open(el);
    expect(presetButtons()).toEqual(["Today", "Yesterday", "Last 7 days", "Last 30 days"]);
    await click(dialogButtons().find((b) => b.textContent === "Last 7 days")!);
    expect(log.at(-1)).toEqual(custom(rangePreset("last7Days", todayPlain())));
  });

  test("presets in Arabic use the Arabic labels", async () => {
    const el = await mount(<Picker log={[]} lang="ar" presets={["today", "yesterday"]} />);
    await open(el);
    expect(presetButtons()).toEqual(["اليوم", "أمس"]);
  });

  test("without presets the DateRangePicker default list shows", async () => {
    const el = await mount(<Picker log={[]} />);
    await open(el);
    expect(presetButtons()).toEqual(["Today", "Yesterday", "This week", "This month", "Last month"]);
  });

  test("weekStart=6: the calendar starts the week on Saturday and 'This week' starts on a Saturday", async () => {
    const log: Period[] = [];
    const el = await mount(<Picker log={log} weekStart={6} presets={["thisWeek"]} />);
    await open(el);
    expect(firstWeekday()).toBe("Saturday");
    await click(dialogButtons().find((b) => b.textContent === "This week")!);
    const range = rangePreset("thisWeek", todayPlain(), 6);
    expect(log.at(-1)).toEqual(custom(range));
    expect(new Date(`${range.from}T00:00:00Z`).getUTCDay()).toBe(6);
  });

  test("weekStart default is Sunday", async () => {
    const el = await mount(<Picker log={[]} />);
    await open(el);
    expect(firstWeekday()).toBe("Sunday");
  });

  test("clearTo: a cleared custom range goes to it; the default is this month", async () => {
    const log: Period[] = [];
    const el = await mount(<Picker log={log} clearTo={DEFAULT} />);
    await click(el.querySelector('button[aria-label="Clear dates"]')!);
    expect(log.at(-1)).toEqual(DEFAULT);
    const plain: Period[] = [];
    const el2 = await mount(<Picker log={plain} />);
    await click(el2.querySelector('button[aria-label="Clear dates"]')!);
    expect(plain.at(-1)).toEqual({ kind: "month", from: "2026-09-01", to: "2026-09-30" });
  });
});

type Row = { id: string; name: string; group: string; total: number };
const ROWS: Row[] = [
  { id: "a", name: "Sara", group: "G1", total: 5 },
  { id: "b", name: "Omar", group: "G1", total: 30 },
];
const COLS: DataTableColumn<Row>[] = [
  { key: "name", header: "Customer name" },
  { key: "total", header: "Total", align: "end", sortable: true },
];
const table = (props = {}) => <DataTable columns={COLS} rows={ROWS} getRowId={(r) => r.id} caption="Report" {...props} />;

describe('DataTable density="print"', () => {
  const print = () =>
    dom(table({ density: "print", cards: true, stickyHeader: true, totals: { total: 35 }, groupBy: (r: Row) => r.group, groupTotals: () => ({ total: 35 }) }));

  test("small cells, wrapping headers, no scroll box", () => {
    const el = print();
    const box = el.querySelector('[role="region"]')!;
    expect(hasClass(box, "overflow-visible")).toBe(true);
    expect(box.className).not.toContain("overflow-x-auto");
    expect(box.className).not.toContain("overflow-auto");
    for (const td of el.querySelectorAll("tbody td")) expect(hasClass(td, "px-1", "py-1", "text-xs")).toBe(true);
    for (const th of el.querySelectorAll("thead th")) {
      expect(hasClass(th, "h-8", "px-1")).toBe(true);
      expect(th.className).not.toContain("whitespace-nowrap");
    }
  });

  test("no cards and no sticky header even when asked", () => {
    const el = print();
    expect(el.innerHTML).not.toContain("max-md:");
    expect(el.querySelector("thead")!.className).not.toContain("sticky");
  });

  test("totals and group rows follow the small cells", () => {
    const el = print();
    for (const td of el.querySelectorAll("tfoot td")) expect(hasClass(td, "px-1", "py-1", "text-xs")).toBe(true);
    const group = el.querySelector('th[scope="rowgroup"]')!;
    expect(hasClass(group, "h-8", "px-1", "text-xs")).toBe(true);
    expect(group.className).not.toContain("whitespace-nowrap");
    // group row, 2 rows, subtotal
    expect(el.querySelectorAll("tbody tr").length).toBe(4);
  });

  test("RTL: no physical direction classes, same cells", () => {
    const el = dom(table({ density: "print" }), "ar");
    expect(el.innerHTML).not.toMatch(/\b(pl|pr|ml|mr)-\d|text-left|text-right/);
    expect(hasClass(el.querySelector("tbody td")!, "px-1", "py-1", "text-xs")).toBe(true);
  });

  test("default and compact do not change", () => {
    const d = dom(table());
    expect(d.querySelector('[role="region"]')!.className).toContain("overflow-x-auto");
    expect(hasClass(d.querySelector("thead th")!, "h-10", "whitespace-nowrap")).toBe(true);
    expect(d.querySelector("tbody td")!.className).not.toContain("text-xs");
    expect(hasClass(dom(table({ density: "compact" })).querySelector("thead th")!, "h-9")).toBe(true);
  });

  test("sorting still works in print", async () => {
    const el = await mount(<PercentProvider lang="en">{table({ density: "print" })}</PercentProvider>);
    await click(el.querySelector("thead button")!);
    expect(el.querySelector("thead th[aria-sort]")!.getAttribute("aria-sort")).toBe("ascending");
  });
});

describe("TableHead scope and wrap", () => {
  const head = (node: ReactNode, lang: "en" | "ar" = "en") =>
    dom(
      <Table>
        <TableHeader>
          <TableRow>{node}</TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>x</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
      lang,
    ).querySelector("th")!;

  test("the default is unchanged: scope col, h-10, nowrap, text-xs, text-fg-3", () => {
    const th = head(<TableHead>Name</TableHead>);
    expect(th.getAttribute("scope")).toBe("col");
    expect(hasClass(th, "h-10", "px-3", "text-xs", "font-medium", "whitespace-nowrap", "text-fg-3", "text-start")).toBe(true);
  });

  test('scope="row" has the look of a body cell: py-3, text-sm, text-fg, normal weight, wraps', () => {
    const th = head(<TableHead scope="row">Standard rated sales</TableHead>);
    expect(th.getAttribute("scope")).toBe("row");
    expect(hasClass(th, "py-3", "px-3", "text-sm", "font-normal", "text-fg")).toBe(true);
    for (const n of ["h-10", "text-xs", "whitespace-nowrap", "text-fg-3", "font-medium"]) expect(th.className).not.toContain(n);
  });

  test("wrap: the text may wrap and the height follows it; align end; RTL keeps text-start", () => {
    const th = head(<TableHead wrap align="end">Amount (⃁)</TableHead>);
    expect(th.className).not.toContain("whitespace-nowrap");
    expect(th.className).not.toMatch(/\bh-10\b/);
    expect(hasClass(th, "py-2", "text-xs", "text-end")).toBe(true);
    expect(hasClass(head(<TableHead wrap>المبلغ</TableHead>, "ar"), "text-start")).toBe(true);
  });

  test("scope rowgroup and a className override still work", () => {
    const th = head(<TableHead scope="rowgroup" className="h-9">G</TableHead>);
    expect(th.getAttribute("scope")).toBe("rowgroup");
    expect(hasClass(th, "h-9")).toBe(true);
  });
});
