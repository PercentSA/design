"use client";

// The entry @percentsa/ui/code-editor. CodeMirror 6 is heavy: only this file imports it, never the root index.
import { useEffect, useRef } from "react";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { yaml } from "@codemirror/lang-yaml";
import { HighlightStyle, bracketMatching, indentOnInput, syntaxHighlighting } from "@codemirror/language";
import { lintGutter, setDiagnostics } from "@codemirror/lint";
import { MergeView } from "@codemirror/merge";
import { highlightSelectionMatches, search, searchKeymap } from "@codemirror/search";
import { Annotation, Compartment, EditorSelection, EditorState, StateEffect, StateField, type Extension } from "@codemirror/state";
import { Decoration, EditorView, drawSelection, highlightActiveLine, keymap, lineNumbers } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import { useStrings } from "./provider";
import { cn } from "./lib/cn";

export type CodeLanguage = "yaml" | "text";
export type CodeDiagnostic = { line: number; message: string };

// Colors are design-system tokens (--p-*): they follow the light and dark theme. Grey only, no hue.
const theme = EditorView.theme({
  "&": { color: "var(--p-fg)", backgroundColor: "var(--p-surface)", fontSize: "13px", height: "100%" },
  "&.cm-focused": { outline: "2px solid var(--p-fg-3)", outlineOffset: "-1px" },
  ".cm-scroller": { fontFamily: "var(--p-font-mono)", lineHeight: "1.6" },
  ".cm-content": { caretColor: "var(--p-fg)", minHeight: "var(--pc-min, 12lh)" },
  ".cm-cursor": { borderLeftColor: "var(--p-fg)" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": { backgroundColor: "var(--p-line-strong)" },
  ".cm-activeLine": { backgroundColor: "var(--p-surface-2)" },
  ".cm-gutters": { color: "var(--p-fg-3)", backgroundColor: "var(--p-surface)", border: "none", borderInlineEnd: "1px solid var(--p-line)" },
  ".cm-activeLineGutter": { backgroundColor: "var(--p-surface-2)", color: "var(--p-fg)" },
  ".cm-matchingBracket": { outline: "1px solid var(--p-fg-3)", backgroundColor: "transparent" },
  ".cm-searchMatch": { backgroundColor: "var(--p-line-strong)" },
  ".cm-searchMatch-selected": { backgroundColor: "var(--p-fg-3)" },
  ".cm-panels": { backgroundColor: "var(--p-surface-2)", color: "var(--p-fg)", borderColor: "var(--p-line)" },
  ".cm-panels input, .cm-panels button": { color: "var(--p-fg)", backgroundColor: "var(--p-bg)", border: "1px solid var(--p-line-strong)", borderRadius: "4px", padding: "2px 6px" },
  ".cm-tooltip": { color: "var(--p-fg)", backgroundColor: "var(--p-surface-2)", border: "1px solid var(--p-line-strong)" },
  ".pc-line-error": { backgroundColor: "color-mix(in srgb, var(--p-danger) 14%, transparent)", boxShadow: "inset 2px 0 0 var(--p-danger)" },
  ".cm-changedLine": { backgroundColor: "var(--p-surface-2)" },
  ".cm-deletedChunk, .cm-insertedLine, .cm-deletedLine": { backgroundColor: "var(--p-surface-2)" },
  ".cm-changedText, ins.cm-insertedLine, del.cm-deletedLine": { textDecoration: "none" },
  ".cm-changedText": { backgroundColor: "var(--p-line-strong)" },
});

const highlight = syntaxHighlighting(
  HighlightStyle.define([
    { tag: [tags.propertyName, tags.definition(tags.propertyName), tags.heading], color: "var(--p-fg)", fontWeight: "600" },
    { tag: [tags.string, tags.content, tags.number, tags.bool, tags.null, tags.keyword], color: "var(--p-fg-2)" },
    { tag: [tags.comment, tags.lineComment], color: "var(--p-fg-3)", fontStyle: "italic" },
  ]),
);

const setErrorLines = StateEffect.define<{ line: number; message: string }[]>();
// One line decoration per diagnostic line; a line outside the text is dropped.
const errorLines = StateField.define({
  create: () => Decoration.none,
  update(deco, tr) {
    deco = deco.map(tr.changes);
    for (const e of tr.effects) {
      if (!e.is(setErrorLines)) continue;
      const doc = tr.state.doc;
      const lines = [...new Set(e.value.map((d) => d.line))].filter((n) => Number.isInteger(n) && n >= 1 && n <= doc.lines).sort((a, b) => a - b);
      deco = Decoration.set(lines.map((n) => Decoration.line({ class: "pc-line-error" }).range(doc.line(n).from)));
    }
    return deco;
  },
  provide: (f) => EditorView.decorations.from(f),
});

const fromOutside = Annotation.define<boolean>();

const language = (l: CodeLanguage): Extension => (l === "yaml" ? yaml() : []);

/** Settings that can change while the editor lives; the search panel words come from the page language. */
const settings = (label: string, readOnly: boolean, lang: CodeLanguage, find: string): Extension[] => [
  EditorState.phrases.of({ Find: find }),
  EditorState.readOnly.of(readOnly),
  EditorView.editable.of(!readOnly),
  EditorView.contentAttributes.of({ "aria-label": label }),
  language(lang),
];

/**
 * A text editor for configuration files (CodeMirror 6): line numbers, YAML highlighting, search, undo,
 * Tab to indent (Escape, then Tab, leaves the editor) and per-line diagnostics (1-based lines).
 * Always left to right, also in an Arabic page. Controlled: `value` and `onValueChange`.
 */
export function CodeEditor({
  value,
  onValueChange,
  language: lang = "yaml",
  diagnostics = [],
  readOnly = false,
  label,
  minLines = 12,
  className,
}: {
  value: string;
  onValueChange?: (value: string) => void;
  language?: CodeLanguage;
  diagnostics?: CodeDiagnostic[];
  readOnly?: boolean;
  label: string;
  minLines?: number;
  className?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const change = useRef(onValueChange);
  change.current = onValueChange;
  const find = useStrings().codeEditorSearch;
  const config = useRef(new Compartment());
  const first = useRef({ value, base: config.current.of(settings(label, readOnly, lang, find)) });

  // The view lives as long as the component; the settings below reach it through effects.
  useEffect(() => {
    const init = first.current;
    const v = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        doc: init.value,
        extensions: [
          history(),
          drawSelection(),
          indentOnInput(),
          bracketMatching(),
          highlightActiveLine(),
          highlightSelectionMatches(),
          search({ top: true }),
          lintGutter(),
          errorLines,
          keymap.of([...searchKeymap, ...historyKeymap, ...defaultKeymap, indentWithTab]),
          EditorView.updateListener.of((u) => {
            if (u.docChanged && !u.transactions.some((t) => t.annotation(fromOutside))) change.current?.(u.state.doc.toString());
          }),
          init.base,
          lineNumbers(),
          theme,
          highlight,
          EditorState.tabSize.of(2),
        ],
      }),
    });
    view.current = v;
    return () => {
      v.destroy();
      view.current = null;
    };
  }, []);

  useEffect(() => {
    view.current!.dispatch({ effects: config.current.reconfigure(settings(label, readOnly, lang, find)) });
  }, [label, readOnly, lang, find]);

  useEffect(() => {
    const v = view.current!;
    const text = v.state.doc.toString();
    if (value === text) return;
    const head = Math.min(v.state.selection.main.head, value.length);
    v.dispatch({ changes: { from: 0, to: text.length, insert: value }, selection: EditorSelection.cursor(head), annotations: fromOutside.of(true) });
  }, [value]);

  useEffect(() => {
    const v = view.current!;
    const doc = v.state.doc;
    const ok = diagnostics.filter((d) => d.line >= 1 && d.line <= doc.lines);
    v.dispatch({ effects: setErrorLines.of(ok) });
    // The lint package adds the gutter marker and the tooltip.
    v.dispatch(setDiagnostics(v.state, ok.map((d) => ({ from: doc.line(d.line).from, to: doc.line(d.line).to, severity: "error" as const, message: d.message }))));
  }, [diagnostics, value]);

  return (
    <div dir="ltr" className={cn("overflow-hidden rounded-field border border-line bg-surface", className)} style={{ "--pc-min": `${minLines * 1.6}em` } as React.CSSProperties}>
      <div ref={host} />
      <ul data-diagnostics aria-live="polite" className="sr-only">
        {diagnostics.map((d, i) => (
          <li key={i}>{`${d.line}: ${d.message}`}</li>
        ))}
      </ul>
    </div>
  );
}

/** Two read-only editors side by side, the saved text and the new text, with the changed lines marked. */
export function CodeDiff({ before, after, language: lang = "yaml", label, className }: { before: string; after: string; language?: CodeLanguage; label: string; className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const s = useStrings();
  useEffect(() => {
    const side = (doc: string, name: string): { doc: string; extensions: Extension[] } => ({
      doc,
      extensions: [...settings(name, true, lang, s.codeEditorSearch), lineNumbers(), theme, highlight],
    });
    const mv = new MergeView({ parent: host.current!, a: side(before, s.codeDiffBefore), b: side(after, s.codeDiffAfter), highlightChanges: true, gutter: true });
    return () => mv.destroy();
  }, [before, after, lang, s.codeDiffBefore, s.codeDiffAfter, s.codeEditorSearch]);
  return <div ref={host} dir="ltr" role="group" aria-label={label} className={cn("overflow-hidden rounded-field border border-line bg-surface", className)} />;
}
