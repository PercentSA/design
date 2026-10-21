import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { act, useRef, useState, type CSSProperties } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FilterBar, Kanban, List, ListItem, PercentProvider, useFlip, type FilterValue, type KanbanColumn } from "../src";
import { mount, useDom } from "./dom";

useDom();

type Call = { el: Element; keyframes: Keyframe[] | PropertyIndexedKeyframes | null; options: number | KeyframeAnimationOptions | undefined };
let calls: Call[] = [];
let cancelled: Element[] = [];
let measured = 0;
// Added to every top: moves the whole layout off screen.
let offsetY = 0;
const saved = { animate: Element.prototype.animate, rect: Element.prototype.getBoundingClientRect, matchMedia: globalThis.matchMedia };

beforeEach(() => {
  calls = [];
  cancelled = [];
  measured = 0;
  offsetY = 0;
  Element.prototype.animate = function (this: Element, keyframes, options) {
    calls.push({ el: this, keyframes, options });
    return { cancel: () => cancelled.push(this) } as unknown as Animation;
  };
  // Layout stub: 40 px rows in DOM order inside their parent; a Kanban column is 300 px wide.
  Element.prototype.getBoundingClientRect = function (this: Element) {
    measured++;
    const i = this.parentElement ? [...this.parentElement.children].indexOf(this) : 0;
    const column = this.closest("[data-column]");
    const left = column ? [...column.parentElement!.children].indexOf(column) * 300 : 0;
    const top = i * 40 + offsetY;
    return { left, top, width: 200, height: 40, right: left + 200, bottom: top + 40, x: left, y: top, toJSON() {} } as DOMRect;
  };
});

afterEach(() => {
  Element.prototype.animate = saved.animate;
  Element.prototype.getBoundingClientRect = saved.rect;
  globalThis.matchMedia = saved.matchMedia;
});

const flipOf = (c: Call) => c.el.getAttribute("data-flip") ?? c.el.getAttribute("data-card-id");
const byId = () => Object.fromEntries(calls.map((c) => [flipOf(c), (c.keyframes as Keyframe[]).map((k) => k.transform ?? k.opacity)]));

let setItems: (items: string[]) => void;
function Items({ initial, style }: { initial: string[]; style?: CSSProperties }) {
  const [items, set] = useState(initial);
  setItems = set;
  const ref = useRef<HTMLUListElement>(null);
  useFlip(ref, [items]);
  return (
    <ul ref={ref} style={style}>
      {items.map((id) => (
        <li key={id} data-flip={id}>
          <button type="button">{id}</button>
        </li>
      ))}
    </ul>
  );
}
const reorder = (items: string[]) => act(async () => setItems(items));

describe("useFlip", () => {
  test("first render: nothing animates (the server HTML is final)", async () => {
    await mount(<Items initial={["a", "b", "c"]} />);
    expect(calls).toEqual([]);
  });

  test("moved items glide from their old place to the new one; unmoved items stay", async () => {
    await mount(<Items initial={["a", "b", "c", "d"]} />);
    await reorder(["c", "a", "b", "d"]);
    expect(byId()).toEqual({ c: ["translate(0px, 80px)", "none"], a: ["translate(0px, -40px)", "none"], b: ["translate(0px, -40px)", "none"] });
    expect(calls[0]!.options).toEqual({ duration: 250, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" });
  });

  test("duration and easing come from the tokens", async () => {
    await mount(<Items initial={["a", "b"]} style={{ "--p-duration-base": "400ms", "--p-ease-out": "linear" } as CSSProperties} />);
    await reorder(["b", "a"]);
    expect(calls[0]!.options).toEqual({ duration: 400, easing: "linear" });
  });

  test("new items fade in; removed items leave at once", async () => {
    await mount(<Items initial={["a", "b", "c"]} />);
    await reorder(["b", "c", "d"]);
    expect(byId()).toEqual({ b: ["translate(0px, 40px)", "none"], c: ["translate(0px, 40px)", "none"], d: [0, 1] });
  });

  test("a new change stops the running glide before it measures", async () => {
    await mount(<Items initial={["a", "b"]} />);
    await reorder(["b", "a"]);
    await reorder(["a", "b"]);
    expect(cancelled.map((el) => el.getAttribute("data-flip")).sort()).toEqual(["a", "b"]);
  });

  test("the focused element keeps its focus when its item moves", async () => {
    const el = await mount(<Items initial={["a", "b", "c"]} />);
    const a = el.querySelector<HTMLElement>('[data-flip="a"] button')!;
    await act(async () => a.focus());
    await reorder(["c", "a", "b"]);
    expect(document.activeElement).toBe(a);
  });

  test("an element that takes focus in the same change (autoFocus) keeps it", async () => {
    let go: () => void = () => {};
    function Edit() {
      const [ids, set] = useState(["a", "b"]);
      go = () => set(["b", "a"]);
      const ref = useRef<HTMLUListElement>(null);
      useFlip(ref, [ids]);
      return (
        <ul ref={ref}>
          {ids.map((id) => (
            <li key={id} data-flip={id}>
              <button type="button">{id}</button>
              {ids[0] === "b" && id === "a" && <input aria-label="Name" autoFocus />}
            </li>
          ))}
        </ul>
      );
    }
    const el = await mount(<Edit />);
    await act(async () => el.querySelector<HTMLElement>('[data-flip="b"] button')!.focus());
    await act(async () => go());
    // A tag name, not the node: a failing toBe on happy-dom nodes prints for minutes.
    expect(document.activeElement?.tagName).toBe("INPUT");
  });

  test("reduced motion: no animation", async () => {
    globalThis.matchMedia = ((q: string) => ({ matches: q.includes("reduce"), addEventListener() {}, removeEventListener() {} })) as unknown as typeof matchMedia;
    await mount(<Items initial={["a", "b"]} />);
    await reorder(["b", "a"]);
    expect(calls).toEqual([]);
  });

  test("off screen: no animation", async () => {
    offsetY = 5000;
    await mount(<Items initial={["a", "b"]} />);
    await reorder(["b", "a"]);
    expect(calls).toEqual([]);
  });

  test("no Web Animations API: the list still reorders", async () => {
    (Element.prototype as { animate?: unknown }).animate = undefined;
    const el = await mount(<Items initial={["a", "b", "c"]} />);
    await reorder(["c", "a", "b"]);
    expect([...el.querySelectorAll("li")].map((li) => li.textContent)).toEqual(["c", "a", "b"]);
  });
});

type Task = { id: string; name: string };
let setColumns: (c: KanbanColumn<Task>[]) => void;
function Board({ initial }: { initial: KanbanColumn<Task>[] }) {
  const [columns, set] = useState(initial);
  setColumns = set;
  return <Kanban columns={columns} getCardId={(t) => t.id} getCardLabel={(t) => t.name} renderCard={(t) => t.name} onMove={() => {}} />;
}

describe("reorder glide in components", () => {
  test("Kanban: a card moved to another column glides from its old place", async () => {
    const a = { id: "a", name: "A" };
    const b = { id: "b", name: "B" };
    const c = { id: "c", name: "C" };
    await mount(<Board initial={[{ id: "todo", title: "To do", cards: [a, b] }, { id: "doing", title: "Doing", cards: [c] }]} />);
    await act(async () => setColumns([{ id: "todo", title: "To do", cards: [b] }, { id: "doing", title: "Doing", cards: [c, a] }]));
    expect(byId()).toEqual({ b: ["translate(0px, 40px)", "none"], a: ["translate(-300px, -40px)", "none"] });
  });

  test("List: items with a data-flip id glide when the order changes", async () => {
    let set: (ids: string[]) => void = () => {};
    function Rows() {
      const [ids, setIds] = useState(["a", "b"]);
      set = setIds;
      return (
        <List>
          {ids.map((id) => (
            <ListItem key={id} data-flip={id} title={id} />
          ))}
        </List>
      );
    }
    await mount(<Rows />);
    await act(async () => set(["b", "a"]));
    expect(byId()).toEqual({ b: ["translate(0px, 40px)", "none"], a: ["translate(0px, -40px)", "none"] });
  });

  test("List: a row's Rename button that shows an autofocused input leaves the focus in the input", async () => {
    function Row() {
      const [editing, setEditing] = useState(false);
      return (
        <List>
          <ListItem
            data-flip="a"
            title={editing ? <input aria-label="Name" autoFocus /> : "a"}
            trailing={
              <button type="button" onClick={() => setEditing(true)}>
                Rename
              </button>
            }
          />
          <ListItem data-flip="b" title="b" />
        </List>
      );
    }
    const el = await mount(<Row />);
    const rename = el.querySelector("button")!;
    await act(async () => rename.focus());
    await act(async () => rename.click());
    // A tag name, not the node: a failing toBe on happy-dom nodes prints for minutes.
    expect(document.activeElement?.tagName).toBe("INPUT");
  });

  test("List: a re-render with the same order measures nothing and keeps the running glides", async () => {
    let set: (ids: string[]) => void = () => {};
    let render: () => void = () => {};
    function Rows() {
      const [ids, setIds] = useState(["a", "b"]);
      const [, tick] = useState(0);
      set = setIds;
      render = () => tick((n) => n + 1);
      return (
        <List>
          {ids.map((id) => (
            <ListItem key={id} data-flip={id} title={id} />
          ))}
        </List>
      );
    }
    await mount(<Rows />);
    await act(async () => set(["b", "a"]));
    expect(calls).toHaveLength(2);
    calls = [];
    measured = 0;
    await act(async () => render());
    expect({ animated: calls.length, cancelled: cancelled.length, measured }).toEqual({ animated: 0, cancelled: 0, measured: 0 });
  });

  test("FilterBar: a new tag fades in; the other tags glide when one is removed", async () => {
    let set: (v: FilterValue) => void = () => {};
    function Filters() {
      const [value, setValue] = useState<FilterValue>({ status: ["active"] });
      set = setValue;
      const filters = [{ key: "status", label: "Status", multiple: true, options: [{ value: "active", label: "Active" }, { value: "paused", label: "Paused" }] }];
      return <FilterBar filters={filters} value={value} onValueChange={setValue} />;
    }
    await mount(<Filters />);
    await act(async () => set({ status: ["active", "paused"] }));
    expect(byId()["status:paused"]).toEqual([0, 1]);
    calls = [];
    await act(async () => set({ status: ["paused"] }));
    expect(byId()["status:paused"]).toEqual(["translate(0px, 40px)", "none"]);
  });

  test("server HTML carries the ids and no inline style", () => {
    const html = renderToStaticMarkup(
      <PercentProvider lang="ar">
        <List>
          <ListItem data-flip="x" title="س" />
        </List>
        <FilterBar filters={[{ key: "s", label: "الحالة", options: [{ value: "a", label: "نشط" }] }]} value={{ s: ["a"] }} onValueChange={() => {}} />
        <Kanban columns={[{ id: "c", title: "ع", cards: [{ id: "k", name: "ب" }] }]} getCardId={(t) => t.id} getCardLabel={(t) => t.name} renderCard={(t) => t.name} onMove={() => {}} />
      </PercentProvider>,
    );
    expect(html).toContain('data-flip="x"');
    expect(html).toContain('data-flip="s:a"');
    expect(html).toContain('data-flip="k"');
    expect(html).not.toContain("style=");
  });
});
