import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { act, useState } from "react";
import { LogViewer, PercentProvider, type LogRow, type LogViewerProps } from "../src";
import { click, mount, press, useDom } from "./dom";

useDom();

const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
const saved: Record<string, PropertyDescriptor | undefined> = {};
let top = 0;
let height = 1000;
let into: Element[] = [];
let copied: string[] = [];

beforeEach(() => {
  top = 0;
  height = 1000;
  into = [];
  copied = [];
  for (const k of ["scrollHeight", "clientHeight", "scrollTop", "scrollIntoView"]) saved[k] = Object.getOwnPropertyDescriptor(proto, k);
  Object.defineProperty(proto, "scrollHeight", { configurable: true, get: () => height });
  Object.defineProperty(proto, "clientHeight", { configurable: true, get: () => 200 });
  Object.defineProperty(proto, "scrollTop", { configurable: true, get: () => top, set: (v: number) => void (top = v) });
  proto.scrollIntoView = function (this: Element) {
    into.push(this);
  };
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (t: string) => void copied.push(t) } });
});
afterEach(() => {
  for (const [k, d] of Object.entries(saved)) {
    if (d) Object.defineProperty(proto, k, d);
    else delete proto[k];
  }
});

const rows = (n: number, extra: Partial<LogRow> = {}): LogRow[] => Array.from({ length: n }, (_, i) => ({ key: `r${i}`, text: `line ${i}`, ...extra }));
const base = (o: Partial<LogViewerProps> = {}): LogViewerProps => ({ label: "Build log", rows: rows(5), live: "on", onLiveChange: () => {}, empty: "No lines", ...o });

let set: (o: Partial<LogViewerProps>) => void = () => {};
function Harness({ init, lang }: { init: Partial<LogViewerProps>; lang: "en" | "ar" }) {
  const [o, setO] = useState(init);
  set = (n) => setO((p) => ({ ...p, ...n }));
  return (
    <PercentProvider lang={lang}>
      <LogViewer {...base(o)} />
    </PercentProvider>
  );
}
const open = (o: Partial<LogViewerProps> = {}, lang: "en" | "ar" = "en") => mount(<Harness init={o} lang={lang} />);
const update = (o: Partial<LogViewerProps>) => act(async () => set(o));
const byName = (el: Element, t: string) => [...el.querySelectorAll("button")].find((b) => b.textContent === t || b.getAttribute("aria-label") === t);
const lis = (el: Element) => [...el.querySelectorAll("ol > li")] as HTMLElement[];
const box = (el: Element) => el.querySelector('[role="region"]') as HTMLElement;
const field = (el: Element) => el.querySelector("input") as HTMLInputElement;
const type = (i: HTMLInputElement, v: string) =>
  act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(i, v);
    i.dispatchEvent(new Event("input", { bubbles: true }));
  });
const marks = (el: Element) => [...el.querySelectorAll("mark")].map((m) => m.textContent);
const live = (el: Element) => [...el.querySelectorAll('[aria-live="polite"]')].map((n) => n.textContent).join("|");

describe("LogViewer", () => {
  test("rows show time, source and text; an error row has the danger mark and the word Error for screen readers", async () => {
    const el = await open({ rows: [{ key: "a", at: "10:00:01", source: "build", text: "ok" }, { key: "b", at: "10:00:02", source: "build", text: "failed", error: true }] });
    const [a, b] = lis(el);
    expect(a!.textContent).toContain("10:00:01");
    expect(a!.textContent).toContain("build");
    expect(a!.textContent).toContain("ok");
    expect(a!.className).not.toContain("border-danger");
    expect(b!.className).toContain("border-s-2");
    expect(b!.className).toContain("border-danger");
    expect(b!.querySelector(".sr-only")!.textContent).toBe("Error");
  });

  test("the region is named by the label and takes focus", async () => {
    const el = await open();
    expect(box(el).getAttribute("aria-label")).toBe("Build log");
    expect(box(el).tabIndex).toBe(0);
  });

  test("the scroll box is the positioned parent of the hidden Error words, so they do not make the page longer", async () => {
    const el = await open({ rows: [{ key: "b", at: "10:00:02", source: "build", text: "failed", error: true }] });
    expect(box(el).className.split(" ")).toContain("relative");
  });

  test("with live on, new rows scroll to the end when the reader was at the end", async () => {
    const el = await open();
    expect(top).toBe(1000);
    height = 1200;
    await update({ rows: rows(8) });
    expect(top).toBe(1200);
    expect(byName(el, "Jump to newest")).toBeUndefined();
  });

  test("new rows do not move a reader who scrolled up", async () => {
    const calls: string[] = [];
    const el = await open({ onLiveChange: (l) => calls.push(l) });
    top = 100;
    await act(async () => void box(el).dispatchEvent(new Event("scroll")));
    height = 1200;
    await update({ rows: rows(8) });
    expect(top).toBe(100);
    const jump = byName(el, "Jump to newest")!;
    expect(jump).toBeDefined();
    await click(jump);
    expect(top).toBe(1200);
    expect(byName(el, "Jump to newest")).toBeUndefined();
    expect(document.activeElement).toBe(box(el));
    expect(calls).toEqual([]);
  });

  for (const mode of ["paused", "off"] as const) {
    test(`paused and off do not follow (${mode})`, async () => {
      const el = await open({ live: mode });
      expect(top).toBe(1000); // the first render still shows the end
      height = 1500;
      await update({ rows: rows(8) });
      expect(top).toBe(1000);
      expect(byName(el, "Jump to newest")).toBeDefined();
    });
  }

  test("Pause calls onLiveChange(\"paused\"); Resume calls onLiveChange(\"on\"); off shows neither", async () => {
    const calls: string[] = [];
    const on = await open({ onLiveChange: (l) => calls.push(l) });
    await click(byName(on, "Pause")!);
    await update({ live: "paused" });
    await click(byName(on, "Resume")!);
    expect(calls).toEqual(["paused", "on"]);
    await update({ live: "off" });
    expect(byName(on, "Pause")).toBeUndefined();
    expect(byName(on, "Resume")).toBeUndefined();
  });

  test("search marks matches, counts them, and next and previous move between them", async () => {
    const data = [{ key: "a", text: "boot ok" }, { key: "b", text: "error one" }, { key: "c", text: "fine" }, { key: "d", text: "error two" }, { key: "e", text: "error three" }];
    const el = await open({ rows: data, search: "error" });
    expect(marks(el)).toEqual(["error", "error", "error"]);
    expect(live(el)).toContain("1 of 3");
    into = [];
    await click(byName(el, "Next match")!);
    expect(live(el)).toContain("2 of 3");
    expect(into.at(-1)).toBe(lis(el)[3]!);
    await click(byName(el, "Previous match")!);
    await click(byName(el, "Previous match")!);
    expect(live(el)).toContain("3 of 3");
  });

  test("a new row keeps the current match", async () => {
    const data = [{ key: "a", text: "x1" }, { key: "b", text: "x2" }, { key: "c", text: "x3" }];
    const el = await open({ rows: data, search: "x" });
    await click(byName(el, "Next match")!);
    expect(live(el)).toContain("2 of 3");
    await update({ rows: [{ key: "z", text: "x0" }, ...data, { key: "y", text: "x4" }] });
    expect(live(el)).toContain("3 of 5");
  });

  test("matching is plain text and not case sensitive", async () => {
    const el = await open({ rows: [{ key: "a", text: "see a.b here" }, { key: "b", text: "see axb here" }, { key: "c", text: "see A.B" }], search: "A.B" });
    expect(marks(el)).toEqual(["a.b", "A.B"]);
    expect(live(el)).toContain("1 of 2");
    await update({ search: "nothing" });
    expect(live(el)).toContain("No match");
  });

  test("the search field shows only with onSearchChange; Enter goes to the next match, Shift+Enter to the previous, Escape clears", async () => {
    expect(field(await open())).toBeNull();
    document.body.innerHTML = "";
    const typed: string[] = [];
    const data = [{ key: "a", text: "x" }, { key: "b", text: "x" }, { key: "c", text: "x" }];
    const el = await open({ rows: data, search: "x", onSearchChange: (t) => typed.push(t) });
    const f = field(el);
    expect(f.getAttribute("aria-label")).toBe("Search the log");
    await type(f, "xy");
    expect(typed).toEqual(["xy"]);
    await press(f, { key: "Enter" });
    expect(live(el)).toContain("2 of 3");
    await press(f, { key: "Enter", shiftKey: true });
    expect(live(el)).toContain("1 of 3");
    await press(f, { key: "Escape" });
    expect(typed.at(-1)).toBe("");
  });

  test("jumpTo scrolls its row into view and marks it", async () => {
    const el = await open({ rows: rows(5), jumpTo: "r3" });
    expect(into.at(-1)).toBe(lis(el)[3]!);
    expect(lis(el)[3]!.hasAttribute("data-jumped")).toBe(true);
    expect(top).toBe(0);
    await update({ jumpTo: "r1" });
    expect(lis(el)[3]!.hasAttribute("data-jumped")).toBe(false);
    expect(lis(el)[1]!.hasAttribute("data-jumped")).toBe(true);
    expect(into.at(-1)).toBe(lis(el)[1]!);
  });

  test("empty and loading", async () => {
    const el = await open({ rows: [] });
    expect(box(el).textContent).toContain("No lines");
    await update({ loading: true });
    expect(box(el).getAttribute("aria-busy")).toBe("true");
    expect(box(el).querySelectorAll(".animate-pulse").length).toBe(6);
    expect(box(el).textContent).not.toContain("No lines");
  });

  test("the source shows before the text below 768 px", async () => {
    const el = await open({ rows: [{ key: "a", source: "api", text: "hello" }] });
    const phone = lis(el)[0]!.querySelector("span.md\\:hidden")!;
    expect(phone.textContent).toBe("api · ");
    expect(phone.nextSibling!.textContent).toBe("hello");
  });

  test("Copy line copies the text of the row", async () => {
    const el = await open({ rows: rows(3) });
    await act(async () => {
      lis(el)[1]!.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 5, clientY: 5 }));
    });
    const item = [...document.querySelectorAll('[role="menuitem"]')].find((i) => i.textContent === "Copy line")!;
    await click(item);
    expect(copied).toEqual(["line 1"]);
  });

  test("typing a search scrolls the first match to the center", async () => {
    const data = [{ key: "a", text: "boot" }, { key: "b", text: "x one" }, { key: "c", text: "x two" }, { key: "d", text: "x three" }];
    const el = await open({ rows: data, search: "", onSearchChange: (t) => set({ search: t }) });
    into = [];
    await type(field(el), "x");
    expect(into.at(-1)).toBe(lis(el)[1]!);
    expect(live(el)).toContain("1 of 3");
  });

  test("a long press on touch copies the row under the pointer", async () => {
    const el = await open({ rows: rows(3) });
    await act(async () => {
      lis(el)[2]!.dispatchEvent(new Event("pointerdown", { bubbles: true }));
      // iOS sends no contextmenu event on the row; the menu opens from the long press on the list.
      el.querySelector("ol")!.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 5, clientY: 5 }));
    });
    await click([...document.querySelectorAll('[role="menuitem"]')].find((i) => i.textContent === "Copy line")!);
    expect(copied).toEqual(["line 2"]);
  });

  test("rows share one grid so the columns line up", async () => {
    const el = await open({ rows: [{ key: "a", at: "1", text: "x" }, { key: "b", text: "y" }] });
    expect(el.querySelector("ol")!.className).toContain("grid");
    expect(lis(el).every((li) => li.className.includes("grid-cols-subgrid"))).toBe(true);
    expect(lis(el)[1]!.querySelectorAll(":scope > span").length).toBe(lis(el)[0]!.querySelectorAll(":scope > span").length);
  });

  test("the buttons have Arabic names", async () => {
    const el = await open({ live: "paused", search: "line", onSearchChange: () => {} }, "ar");
    expect(byName(el, "متابعة")).toBeDefined();
    expect(byName(el, "النتيجة التالية")).toBeDefined();
    expect(field(el).getAttribute("aria-label")).toBe("البحث في السجل");
    expect(live(el)).toContain("1 من 5");
  });
});

describe("LogViewer follow after jumpTo, pause and a first search", () => {
  test("jumpTo at mount keeps the reader there when new rows come", async () => {
    for (const jumpTo of ["r0", "zz"]) {
      await open({ jumpTo });
      expect(top).toBe(0);
      height = 1200;
      await update({ rows: rows(8) });
      expect(top).toBe(0);
    }
  });

  test("Resume does not follow a reader who is not at the end", async () => {
    await open({ live: "paused" });
    expect(top).toBe(1000);
    height = 1500;
    await update({ rows: rows(8) });
    await update({ live: "on" });
    height = 1600;
    await update({ rows: rows(9) });
    expect(top).toBe(1000);
  });

  test("a search given at mount does not scroll; jumpTo wins", async () => {
    const el = await open({ jumpTo: "r3", search: "line", onSearchChange: () => {} });
    expect(into.at(-1)).toBe(lis(el)[3]!);
    into = [];
    await open({ search: "line", onSearchChange: () => {} });
    expect(into.length).toBe(0);
  });
});
