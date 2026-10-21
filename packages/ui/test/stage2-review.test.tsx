import { describe, expect, mock, test } from "bun:test";
import { act, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Card, DataTable, Kanban, ListItem, PercentProvider, QrCode, Stat, STRINGS, Table, Tree, ZatcaQr, zatcaTlv, type DataTableColumn } from "../src";
import { DonutChart } from "../src/components/charts/donut-chart";
import { LineChart } from "../src/components/charts/line-chart";
import { CommandPalette } from "../src/components/command-palette";
import { click, mount, press, useDom } from "./dom";

useDom();
const html = (node: React.ReactNode) => renderToStaticMarkup(node);
const noop = () => {};

type Task = { id: string; name: string };
const COLS = [
  { id: "todo", title: "To do", cards: [{ id: "a", name: "A" }, { id: "b", name: "B" }, { id: "c", name: "C" }] },
  { id: "done", title: "Done", cards: [] as Task[] },
];
const openMenu = async (el: Element, label: string) => {
  await act(async () => {
    el.querySelector(`[aria-label="${label}"]`)!.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, pointerType: "mouse" } as PointerEventInit));
  });
  return [...document.querySelectorAll('[role="menuitem"]')];
};
const status = () => [...document.querySelectorAll('[role="status"]')].map((s) => s.textContent).join("|");

describe("stage-2 review fixes", () => {
  test("Kanban: the Move menu also reorders inside the column, without a mouse (WCAG 2.5.7)", async () => {
    const onMove = mock();
    const el = await mount(<Kanban columns={COLS} getCardId={(t) => t.id} getCardLabel={(t) => t.name} renderCard={(t) => t.name} onMove={onMove} />);
    const items = await openMenu(el, "Move B");
    const labels = items.map((i) => i.textContent);
    expect(labels).toEqual(expect.arrayContaining(["Move up one", "Move down one", "Move to the top", "Move to the bottom", "Move to Done"]));
    await click(items.find((i) => i.textContent === "Move to the bottom")!);
    expect(onMove).toHaveBeenLastCalledWith("b", "todo", 2);
  });

  test("Kanban: a move is announced only when the board shows it", async () => {
    const el = await mount(<Kanban columns={COLS} getCardId={(t) => t.id} getCardLabel={(t) => t.name} renderCard={(t) => t.name} onMove={noop} />);
    const items = await openMenu(el, "Move A");
    await click(items.find((i) => i.textContent === "Move to Done")!);
    expect(status()).not.toContain("moved");
  });

  test("DataTable: select all picks the rows on the page, and forgets rows that are gone", async () => {
    type Row = { id: string; n: number };
    const cols: DataTableColumn<Row>[] = [{ key: "n", header: "N" }];
    const onSelectedChange = mock();
    let setRows: (r: Row[]) => void = noop;
    function T() {
      const [rows, set] = useState<Row[]>([1, 2, 3, 4, 5].map((n) => ({ id: `r${n}`, n })));
      setRows = set;
      return <DataTable caption="Rows" columns={cols} rows={rows} getRowId={(r) => r.id} selectable pageSize={2} onSelectedChange={onSelectedChange} />;
    }
    const el = await mount(<T />);
    await click(el.querySelector('thead [role="checkbox"]')!);
    expect(onSelectedChange).toHaveBeenLastCalledWith(["r1", "r2"]);
    expect(el.querySelector('thead [role="checkbox"]')!.getAttribute("aria-checked")).toBe("true");
    await act(async () => setRows([2, 3, 4, 5].map((n) => ({ id: `r${n}`, n }))));
    expect(el.textContent).toContain("1 selected");
  });

  test("DataTable: sorting a table with a controlled page goes back to page 1", async () => {
    type Row = { id: string; n: number };
    const onPageChange = mock();
    const rows = [1, 2, 3, 4].map((n) => ({ id: `r${n}`, n }));
    const el = await mount(<DataTable caption="Rows" columns={[{ key: "n", header: "N", sortable: true }]} rows={rows} getRowId={(r: Row) => r.id} pageSize={2} page={2} onPageChange={onPageChange} />);
    await click(el.querySelector("thead button")!);
    expect(onPageChange).toHaveBeenLastCalledWith(1);
  });

  test("slots that take any node are not in <p> (a <div> inside would break hydration)", () => {
    const block = <div>x</div>;
    expect(html(<Stat label={block} value={block} hint={block} />)).not.toContain("<p");
    expect(html(<Card title="T" description={block} />)).not.toContain("<p");
    expect(html(<ListItem title={block} description={block} />)).not.toContain("<p");
  });

  test("a wide table can be scrolled with the keyboard (focusable region named by its caption)", () => {
    const out = html(<Table caption="Invoices">{null}</Table>);
    expect(out).toMatch(/<div[^>]*role="region"[^>]*tabindex="0"|<div[^>]*tabindex="0"[^>]*role="region"/i);
    expect(out).toMatch(/aria-labelledby="([^"]+)"[^]*<caption id="\1"/);
  });

  test("Tree: selected={null} clears the selection", async () => {
    const el = await mount(<Tree items={[{ id: "a", label: "A" }]} selected={null} onSelect={noop} />);
    await click(el.querySelector('[role="treeitem"] [id]') ?? el.querySelector('[role="treeitem"]')!);
    expect(el.querySelector('[aria-selected="true"]')).toBeNull();
  });

  test("itemCount: one item is singular in English", () => {
    expect(STRINGS.en.itemCount(1)).toBe("1 item");
    expect(STRINGS.en.itemCount(3)).toBe("3 items");
    expect(html(<PercentProvider lang="ar">{STRINGS.ar.itemCount(1)}</PercentProvider>)).toBe("العناصر: 1");
  });
});

const DATA = [
  { month: "Jan", revenue: 10 },
  { month: "Feb", revenue: 20 },
  { month: "Mar", revenue: 30 },
];
const CHART = { x: "month", series: [{ key: "revenue", label: "Revenue" }], title: "Revenue" };
const svgWidth = (el: Element) => el.querySelector("svg[viewBox]")!.getAttribute("viewBox")!.split(" ")[2];

describe("stage-2 review fixes: charts, app, business", () => {
  test("a chart that mounts before its data still follows its box width", async () => {
    const boxes: [Element, ResizeObserverCallback][] = [];
    const saved = globalThis.ResizeObserver;
    globalThis.ResizeObserver = class {
      constructor(private cb: ResizeObserverCallback) {}
      observe(el: Element) {
        boxes.push([el, this.cb]);
      }
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
    try {
      let setData: (d: typeof DATA) => void = noop;
      function T() {
        const [data, set] = useState<typeof DATA>([]);
        setData = set;
        return <LineChart {...CHART} data={data} />;
      }
      const el = await mount(<T />);
      await act(async () => setData(DATA));
      const [box, cb] = boxes.at(-1) ?? [];
      expect(box?.isConnected).toBe(true);
      await act(async () => cb!([{ contentRect: { width: 340 } } as ResizeObserverEntry], {} as ResizeObserver));
      expect(svgWidth(el)).toBe("340");
    } finally {
      globalThis.ResizeObserver = saved;
    }
  });

  test("touch: a tap shows the values, and they stay when the finger lifts", async () => {
    const el = await mount(<LineChart {...CHART} data={DATA} />);
    const svg = el.querySelector("svg[viewBox]")!;
    svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 640, height: 240, right: 640, bottom: 240, x: 0, y: 0, toJSON() {} });
    const plot = svg.parentElement!.parentElement!;
    const fire = (type: string, pointerType: string) =>
      act(async () => {
        plot.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerType, clientX: 600, clientY: 120, relatedTarget: document.body } as PointerEventInit));
      });
    await fire("pointerdown", "touch");
    expect(el.querySelector("[data-tooltip]")?.textContent).toContain("Mar");
    await fire("pointerout", "touch");
    expect(el.querySelector("[data-tooltip]")).not.toBeNull();
    await fire("pointerout", "mouse");
    expect(el.querySelector("[data-tooltip]")).toBeNull();
  });

  test("a chart whose data gets shorter while a point is chosen does not crash", async () => {
    let setData: (d: typeof DATA) => void = noop;
    function T() {
      const [data, set] = useState(DATA);
      setData = set;
      return <LineChart {...CHART} data={data} />;
    }
    const el = await mount(<T />);
    await press(el.querySelector("figure")!, { key: "End" });
    await act(async () => setData(DATA.slice(0, 1)));
    expect(el.querySelector("figure")).not.toBeNull();
  });

  test("a donut in a box narrower than its height stays inside the box", () => {
    const out = html(<DonutChart data={[{ label: "A", value: 1 }, { label: "B", value: 1 }]} title="T" height={800} />);
    const radius = Number(/A([\d.]+),/.exec(out)![1]);
    expect(radius).toBeLessThanOrEqual(640 / 2);
  });

  test("CommandPalette: when the list gets shorter, Enter still runs the highlighted command", async () => {
    const log: string[] = [];
    const cmd = (id: string) => ({ id, label: id, onSelect: () => log.push(id) });
    let setCommands: (c: ReturnType<typeof cmd>[]) => void = noop;
    function T() {
      const [commands, set] = useState([cmd("one"), cmd("two"), cmd("three")]);
      setCommands = set;
      return <CommandPalette open onOpenChange={noop} commands={commands} />;
    }
    await mount(<T />);
    const input = () => document.querySelector<HTMLInputElement>('[role="combobox"]')!;
    await press(input(), { key: "ArrowDown" });
    await press(input(), { key: "ArrowDown" });
    await act(async () => setCommands([cmd("one")]));
    await press(input(), { key: "Enter" });
    expect(log).toEqual(["one"]);
  });

  test("QR codes are black on white in every theme (many scanners do not read inverted codes)", () => {
    for (const out of [html(<QrCode value="x" label="QR" />), html(<ZatcaQr seller="P" vatNumber="300000000000003" timestamp="2026-02-18T09:30:00Z" total={1} vat={0} label="QR" />)]) {
      expect(out).toMatch(/<rect[^>]*fill="#fff"/);
      expect(out).toMatch(/<path[^>]*fill="#000"/);
    }
  });

  test("ZATCA QR: an empty seller, VAT number or time is an error, not an empty tag", () => {
    const base = { seller: "P", vatNumber: "300000000000003", timestamp: "2026-02-18T09:30:00Z", total: 1, vat: 0 };
    for (const key of ["seller", "vatNumber", "timestamp"] as const) expect(() => zatcaTlv({ ...base, [key]: " " })).toThrow(/required/);
  });

  test("draw-in: a chart already on screen when it mounts does not hide and wipe in again", async () => {
    const saved = [globalThis.IntersectionObserver, globalThis.matchMedia, Element.prototype.animate] as const;
    const views: IntersectionObserverCallback[] = [];
    const animate = mock();
    globalThis.IntersectionObserver = class {
      constructor(cb: IntersectionObserverCallback) {
        views.push(cb);
      }
      observe() {}
      disconnect() {}
    } as unknown as typeof IntersectionObserver;
    globalThis.matchMedia = (() => ({ matches: false })) as unknown as typeof matchMedia;
    Element.prototype.animate = animate;
    const see = (cb: IntersectionObserverCallback, isIntersecting: boolean) => cb([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver);
    try {
      await mount(<LineChart {...CHART} data={DATA} />);
      see(views.at(-1)!, true);
      expect(animate).not.toHaveBeenCalled();
      await mount(<LineChart {...CHART} data={DATA} />);
      see(views.at(-1)!, false);
      see(views.at(-1)!, true);
      expect(animate).toHaveBeenCalledTimes(1);
    } finally {
      [globalThis.IntersectionObserver, globalThis.matchMedia, Element.prototype.animate] = saved;
    }
  });
});
