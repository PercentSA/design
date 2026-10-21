// Regression tests for the 0.3.1 audit fixes of the data-display components.
import { describe, expect, test } from "bun:test";
import { act, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PercentProvider } from "../src";
import { Avatar, AvatarGroup } from "../src/components/avatar";
import { Card } from "../src/components/card";
import { Axes, cartesian } from "../src/components/charts/cartesian";
import { ChartFrame } from "../src/components/charts/chart-frame";
import { DonutChart } from "../src/components/charts/donut-chart";
import { AreaChart, LineChart } from "../src/components/charts/line-chart";
import { BarChart } from "../src/components/charts/bar-chart";
import { extent, runs } from "../src/components/charts/scale";
import { Sparkline } from "../src/components/charts/sparkline";
import { CodeBlock } from "../src/components/code-block";
import { DataTable, type DataTableColumn } from "../src/components/data-table";
import { JsonViewer } from "../src/components/json-viewer";
import { Kanban } from "../src/components/kanban";
import { TicketView } from "../src/components/ticket-view";
import { click, mount, useDom } from "./dom";

useDom();

const en = (node: ReactNode) => renderToStaticMarkup(<PercentProvider lang="en">{node}</PercentProvider>);
const ar = (node: ReactNode) => renderToStaticMarkup(<PercentProvider lang="ar">{node}</PercentProvider>);

describe("charts", () => {
  const gap = [
    { m: "Jan", v: 1 },
    { m: "Feb", v: 2 },
    { m: "Mar", v: null },
    { m: "Apr" },
    { m: "May", v: 5 },
    { m: "Jun", v: 6 },
  ];
  const one = [{ key: "v", label: "Value" }];
  const paths = (out: string) => [...out.matchAll(/<path d="([^"]*)" fill="none"/g)].map((m) => m[1]!);

  test("a missing value breaks the line and the area, leaves out the bar, and reads — in the table", () => {
    const line = en(<LineChart data={gap} x="m" series={one} title="T" />);
    expect(paths(line)[0]!.match(/M/g)).toHaveLength(2);
    expect(line).toContain('<th scope="row">Mar</th><td>—</td>');
    expect(line).toContain('<th scope="row">Apr</th><td>—</td>');
    expect(line).toContain('<th scope="row">May</th><td>5</td>');
    const areaD = en(<AreaChart data={gap} x="m" series={one} title="T" />).match(/<path d="([^"]*)" fill="var/)![1]!;
    expect(areaD.match(/Z/g)).toHaveLength(2);
    expect(en(<BarChart data={gap} x="m" series={one} title="T" />).match(/data-bar=""/g)).toHaveLength(4);
  });

  test("a point alone (one row, or between gaps) gets a marker", () => {
    expect(en(<LineChart data={[{ m: "Jan", v: 3 }]} x="m" series={one} title="T" />)).toContain("<circle");
    const isolated = [{ m: "a", v: 1 }, { m: "b", v: null }, { m: "c", v: 2 }, { m: "d", v: 3 }];
    expect(en(<LineChart data={isolated} x="m" series={one} title="T" />).match(/<circle/g)).toHaveLength(1);
    expect(en(<Sparkline values={[5]} />)).toMatch(/d="M0,\d+(\.\d+)?h0"/);
  });

  test("150k values: extent and the axes do not overflow the stack", () => {
    const many = Array.from({ length: 200_000 }, (_, i) => i % 1000);
    expect(extent([...many, null])).toEqual([0, 999]);
    expect(runs([1, null, null, 2, 3, null])).toEqual([[1], [2, 3]]);
    const c = cartesian({ width: 640, height: 240, labels: many.map(String), min: 0, max: 999, format: String, mirror: false });
    expect(() => renderToStaticMarkup(<svg>{<Axes c={c} />}</svg>)).not.toThrow();
  });

  test("a pointer move inside the same row does not render the chart again", async () => {
    let renders = 0;
    const el = await mount(
      <ChartFrame
        title="T"
        width={100}
        height={100}
        measure={() => {}}
        columns={["x", "y"]}
        rows={[
          { label: "a", values: ["1"] },
          { label: "b", values: ["2"] },
        ]}
        kind="line"
        colors={[]}
        anchors={[
          [25, 50],
          [75, 50],
        ]}
        hit={(x) => (x < 50 ? 0 : 1)}
        mirror={false}
      >
        {() => {
          renders++;
          return null;
        }}
      </ChartFrame>,
    );
    el.querySelector("svg")!.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100 }) as DOMRect;
    const move = (clientX: number) =>
      act(async () => {
        el.querySelector("svg")!.parentElement!.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX, clientY: 10 }));
      });
    const start = renders;
    await move(10);
    expect(renders).toBe(start + 1);
    // React may render once more before it bails out on the same state; after that, no more renders.
    for (const x of [15, 20, 25, 30, 35, 40]) await move(x);
    const settled = renders;
    expect(settled - start).toBeLessThanOrEqual(2);
    await move(45);
    expect(renders).toBe(settled);
    await move(80);
    expect(renders).toBe(settled + 1);
  });

  test("DonutChart: the hidden table's first header has a name", () => {
    const data = [{ label: "Direct", value: 1 }];
    expect(en(<DonutChart data={data} title="Visits" />)).toContain('<th scope="col">Category</th><th scope="col">Visits</th>');
    expect(ar(<DonutChart data={data} title="الزيارات" />)).toContain('<th scope="col">الفئة</th>');
  });
});

describe("Invoice, TicketView, Avatar", () => {
  test("TicketView initials skip the Arabic article, like Avatar", () => {
    const out = en(<TicketView subject="S" id="1" status="Open" meta={[]} messages={[{ id: "1", author: { name: "محمد العتيبي" }, time: "", body: "" }]} />);
    expect(out).toContain(">مع<");
  });

  test("AvatarGroup rings take --p-avatar-ring (page colour by default); Card sets it to its surface", () => {
    const out = en(
      <Card>
        <AvatarGroup>
          <Avatar name="Sara Ahmed" />
        </AvatarGroup>
      </Card>,
    );
    expect(out).toContain("[&amp;&gt;*]:ring-[color:var(--p-avatar-ring,var(--p-bg))]");
    expect(out).toContain("[--p-avatar-ring:var(--p-surface)]");
  });
});

describe("JsonViewer, CodeBlock", () => {
  test("Date as an ISO string, Map as an object of its entries, Set as an array", async () => {
    const el = await mount(
      <JsonViewer value={{ at: new Date("2026-02-18T09:30:00Z"), tags: new Set(["a", "b"]), byId: new Map([["x", 1]]), none: new Set() }} defaultDepth={3} />,
    );
    const text = el.textContent!;
    expect(text).toContain('at: "2026-02-18T09:30:00.000Z"');
    expect(text).toMatch(/tags: \[.*0: "a".*1: "b".*\]/);
    expect(text).toMatch(/byId: \{.*x: 1.*\}/);
    expect(text).toContain("none: []");
  });

  test("CodeBlock without a file name or language: the scroll box is a group named Code (not one more landmark)", () => {
    expect(en(<CodeBlock code="x" />)).toMatch(/role="group" tabindex="0" aria-label="Code"/);
    expect(ar(<CodeBlock code="x" />)).toContain('aria-label="الشيفرة البرمجية"');
  });
});

describe("DataTable, Kanban", () => {
  type Row = { id: string; name: string };
  let sortCalls = 0;
  const COLUMNS: DataTableColumn<Row>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      sortValue: (r) => {
        sortCalls++;
        return r.name;
      },
    },
  ];
  const ROWS: Row[] = [
    { id: "1", name: "b" },
    { id: "2", name: "a" },
  ];

  test("DataTable does not sort again when only the selection changes", async () => {
    const el = await mount(<DataTable columns={COLUMNS} rows={ROWS} getRowId={(r) => r.id} caption="T" selectable defaultSort={{ key: "name", direction: "asc" }} />);
    expect([...el.querySelectorAll("tbody td:nth-child(2)")].map((td) => td.textContent)).toEqual(["a", "b"]);
    const before = sortCalls;
    await click(el.querySelector('tbody [role="checkbox"]')!);
    expect(el.querySelector('tbody tr[data-state="selected"]')).not.toBeNull();
    expect(sortCalls).toBe(before);
  });

  test("Kanban: while dragging over an empty column, its list holds only <li> children", async () => {
    const columns = [
      { id: "todo", title: "To do", cards: [{ id: "a" }] },
      { id: "done", title: "Done", cards: [] as { id: string }[] },
    ];
    const el = await mount(<Kanban columns={columns} getCardId={(c) => c.id} getCardLabel={(c) => c.id} renderCard={(c) => c.id} onMove={() => {}} />);
    const fire = (target: Element, type: string) =>
      act(async () => {
        const e = new Event(type, { bubbles: true, cancelable: true });
        Object.assign(e, { clientY: 0, dataTransfer: { setData() {}, effectAllowed: "", dropEffect: "" } });
        target.dispatchEvent(e);
      });
    await fire(el.querySelector('[data-card-id="a"]')!, "dragstart");
    await fire(el.querySelector('[data-column="done"]')!, "dragover");
    const list = el.querySelector('[data-column="done"] ul')!;
    expect(list.children).toHaveLength(1);
    expect([...el.querySelectorAll("ul")].flatMap((ul) => [...ul.children]).every((c) => c.tagName === "LI")).toBe(true);
  });
});
