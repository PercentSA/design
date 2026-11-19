// CodeEditor and CodeDiff (0.21.0): the entry @percentsa/ui/code-editor.
import { describe, expect, test } from "bun:test";
import { act, useState } from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
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
  });
});

describe("CodeDiff", () => {
  test("shows both sides, read only, with a changed line marked", async () => {
    await mount(<CodeDiff label="Changes" before={"a: 1\nb: 2\n"} after={"a: 1\nb: 3\n"} />);
    const editors = [...document.querySelectorAll<HTMLElement>(".cm-content")];
    expect(editors.map((e) => e.getAttribute("aria-label"))).toEqual(["Saved", "Not saved"]);
    expect(editors.every((e) => e.getAttribute("aria-readonly") === "true")).toBe(true);
    expect(document.querySelectorAll(".cm-changedLine").length).toBe(2);
  });
});

describe("entry", () => {
  test("the root entry does not load CodeMirror", () => {
    const src = readFileSync(resolve(import.meta.dir, "../src/index.ts"), "utf8");
    expect(src).not.toMatch(/code-editor|@codemirror/);
  });
});
