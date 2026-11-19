// CodeEditor and CodeDiff (0.21.0): the entry @percentsa/ui/code-editor.
import { describe, expect, test } from "bun:test";
import { act, useState } from "react";
import { EditorView } from "@codemirror/view";
import { CodeDiff, CodeEditor } from "../src/code-editor";
import { PercentProvider } from "../src";
import { mount, useDom } from "./dom";

useDom();

const content = () => document.querySelector<HTMLElement>(".cm-content")!;
const view = () => EditorView.findFromDOM(document.querySelector<HTMLElement>(".cm-editor")!)!;
const key = (el: Element, init: KeyboardEventInit) => {
  const e = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init });
  act(() => void el.dispatchEvent(e));
  return e;
};

describe("CodeEditor", () => {
  test("shows the value and reports edits", async () => {
    const seen: string[] = [];
    await mount(<CodeEditor label="Compose file" value={"a: 1\n"} onValueChange={(v) => seen.push(v)} />);
    expect(view().state.doc.toString()).toBe("a: 1\n");
    await act(async () => view().dispatch({ changes: { from: 5, insert: "b" } }));
    expect(seen).toEqual(["a: 1\nb"]);
  });

  test("a new value from outside replaces the text and keeps the cursor in range", async () => {
    const seen: string[] = [];
    let set: (v: string) => void = () => {};
    function Host() {
      const [value, setValue] = useState("a: 1\nb: 2\n");
      set = setValue;
      return <CodeEditor label="Compose file" value={value} onValueChange={(v) => seen.push(v)} />;
    }
    await mount(<Host />);
    await act(async () => view().dispatch({ selection: { anchor: 10 } }));
    await act(async () => set("c"));
    expect(view().state.doc.toString()).toBe("c");
    expect(view().state.selection.main.head).toBeLessThanOrEqual(1);
    expect(seen).toEqual([]);
  });

  test("diagnostics mark their lines", async () => {
    await mount(<CodeEditor label="Compose file" value={"a: 1\nb: [\n"} diagnostics={[{ line: 2, message: "bad" }]} />);
    const lines = [...document.querySelectorAll(".cm-line")];
    expect(lines[0]!.classList.contains("pc-line-error")).toBe(false);
    expect(lines[1]!.classList.contains("pc-line-error")).toBe(true);
    expect(document.querySelector('[data-diagnostics]')!.textContent).toContain("bad");
  });

  test("a line outside the text is ignored", async () => {
    await mount(<CodeEditor label="Compose file" value="a: 1" diagnostics={[{ line: 9, message: "far" }, { line: 0, message: "zero" }]} />);
    expect(document.querySelector(".pc-line-error")).toBeNull();
  });

  test("readOnly blocks edits", async () => {
    const seen: string[] = [];
    await mount(<CodeEditor label="Compose file" value="a: 1" readOnly onValueChange={(v) => seen.push(v)} />);
    expect(content().getAttribute("aria-readonly")).toBe("true");
    // A program can still dispatch; the keyboard commands (Tab to indent, Backspace) are blocked.
    key(content(), { key: "Tab", code: "Tab", keyCode: 9 });
    await act(async () => void view().dispatch({ selection: { anchor: 4 } }));
    key(content(), { key: "Backspace", code: "Backspace", keyCode: 8 });
    expect(seen).toEqual([]);
    expect(view().state.doc.toString()).toBe("a: 1");
  });

  test("Tab indents and does not leave the editor; Escape then Tab leaves it", async () => {
    await mount(<CodeEditor label="Compose file" value="a:" />);
    const tab = key(content(), { key: "Tab", code: "Tab", keyCode: 9 });
    expect(tab.defaultPrevented).toBe(true);
    expect(view().state.doc.toString()).toMatch(/^\s+a:$/);
    key(content(), { key: "Escape", code: "Escape", keyCode: 27 });
    const out = key(content(), { key: "Tab", code: "Tab", keyCode: 9 });
    expect(out.defaultPrevented).toBe(false);
  });

  test("the label names the editor; the text is left to right in an Arabic page", async () => {
    await mount(
      <PercentProvider lang="ar">
        <CodeEditor label="ملف الإعداد" value="a: 1" />
      </PercentProvider>,
    );
    expect(content().getAttribute("role")).toBe("textbox");
    expect(content().getAttribute("aria-label")).toBe("ملف الإعداد");
    expect(document.querySelector(".cm-editor")!.closest("[dir]")!.getAttribute("dir")).toBe("ltr");
  });

  test("a new label or readOnly reaches the open editor", async () => {
    let set: (v: boolean) => void = () => {};
    function Host() {
      const [ro, setRo] = useState(false);
      set = setRo;
      return <CodeEditor label={ro ? "Locked" : "Open"} value="a" readOnly={ro} />;
    }
    await mount(<Host />);
    expect([content().getAttribute("aria-label"), content().getAttribute("aria-readonly")]).toEqual(["Open", null]);
    await act(async () => set(true));
    expect([content().getAttribute("aria-label"), content().getAttribute("aria-readonly")]).toEqual(["Locked", "true"]);
  });

  test("the search panel uses the page language", async () => {
    const { openSearchPanel } = await import("@codemirror/search");
    await mount(
      <PercentProvider lang="ar">
        <CodeEditor label="x" value="a: 1" />
      </PercentProvider>,
    );
    await act(async () => void openSearchPanel(view()));
    expect(document.querySelector<HTMLInputElement>('.cm-search input[name="search"]')!.placeholder).toBe("بحث");
    const panel = document.querySelector(".cm-search")!;
    // The visible words of the whole panel are Arabic: no English word is left.
    expect(panel.textContent!.replace(/[^A-Za-z]/g, "")).toBe("");
    expect(panel.querySelector<HTMLInputElement>('input[name="replace"]')!.placeholder).toBe("استبدال");
    expect(panel.querySelector('button[name="replaceAll"]')!.textContent).toBe("استبدال الكل");
    expect(panel.querySelector('button[name="close"]')!.getAttribute("aria-label")).toBe("إغلاق");
  });

  test("Go to line uses the page language", async () => {
    const { gotoLine } = await import("@codemirror/search");
    await mount(
      <PercentProvider lang="ar">
        <CodeEditor label="x" value="a: 1" />
      </PercentProvider>,
    );
    await act(async () => void gotoLine(view()));
    const dialog = document.querySelector(".cm-dialog")!;
    expect(dialog.textContent).toContain("الانتقال إلى سطر");
    expect(dialog.querySelector("button")!.textContent).toBe("انتقال");
  });

  test("a read-only editor stays focusable and keeps its caret", async () => {
    await mount(<CodeEditor label="x" value="a: 1" readOnly />);
    expect(content().getAttribute("contenteditable")).toBe("true");
    content().focus();
    expect(document.activeElement).toBe(content());
  });

  test("the theme has no hue: every rule is a token and wins over the CodeMirror base themes", async () => {
    await mount(<CodeEditor label="x" value="a: 1" diagnostics={[{ line: 1, message: "m" }]} />);
    const rules = [...document.querySelectorAll("style")].flatMap((e) => (e.textContent ?? "").split("\n")).filter((l) => l.includes("var(--p-"));
    expect(rules.length).toBeGreaterThan(20);
    // Token rules of the syntax highlight are a single class; all others must beat the base themes.
    const wrong = rules
      .filter((l) => !/^\.\S+ \{/.test(l))
      .flatMap((l) => l.slice(l.indexOf("{") + 1, l.lastIndexOf("}")).split(";"))
      .filter((d) => d.trim() && !d.includes("!important"));
    expect(wrong).toEqual([]);
    expect(rules.filter((l) => /#[0-9a-fA-F]{3,8}\b/.test(l))).toEqual([]);
    const mine = rules.filter((l) => l.includes("!important")).join("\n");
    // The active line must not hide the selection; a search match is an outline, not the selection fill; the close buttons keep their base look; lint points use the danger token.
    expect(mine).toMatch(/\.cm-activeLine \{background-color: color-mix\(/);
    expect(mine).toMatch(/\.cm-searchMatch-selected \{[^}]*outline: 2px solid var\(--p-fg\)/);
    expect(mine).not.toMatch(/\.cm-searchMatch-selected \{[^}]*color-mix/);
    const all = [...document.querySelectorAll("style")].map((e) => e.textContent).join("\n");
    expect(all).toMatch(/\.cm-dialog-close \{color: inherit !important/);
    expect(mine).toContain("button:not([name=close]):not(.cm-dialog-close)");
    expect(mine).toMatch(/\.cm-lintPoint:after \{border-bottom-color: var\(--p-danger\)/);
  });
});

describe("CodeDiff", () => {
  test("shows both sides, read only, with a changed line marked", async () => {
    await mount(<CodeDiff label="Changes" before={"a: 1\nb: 2\n"} after={"a: 1\nb: 3\n"} />);
    const editors = [...document.querySelectorAll<HTMLElement>(".cm-content")];
    expect(editors.map((e) => e.getAttribute("aria-label"))).toEqual(["Saved", "Not saved"]);
    expect(editors.every((e) => e.getAttribute("aria-readonly") === "true" && e.getAttribute("contenteditable") === "true")).toBe(true);
    expect(document.querySelectorAll(".cm-changedLine").length).toBe(2);
  });
});
