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
import type { Strings } from "./i18n/strings";
import { cn } from "./lib/cn";

export type CodeLanguage = "yaml" | "text";
export type CodeDiagnostic = { line: number; message: string };

// Colors are design-system tokens (--p-*): they follow the light and dark theme. Grey only, no hue (the
// error mark uses the danger token). The CodeMirror base themes (selection, brackets, search, merge,
// lint) use more specific selectors and hues, so every value here is !important.
const important = (spec: Record<string, any>): Record<string, any> =>
  Object.fromEntries(Object.entries(spec).map(([k, v]) => [k, typeof v === "string" ? `${v} !important` : important(v)]));
const underline = (c: string) => `linear-gradient(${c}, ${c}) bottom/100% 2px no-repeat`;

const theme = EditorView.theme(
  important({
    "&": { color: "var(--p-fg)", backgroundColor: "var(--p-surface)", fontSize: "13px" },
    "&.cm-focused": { outline: "2px solid var(--p-fg-3)", outlineOffset: "-1px" },
    ".cm-scroller": { fontFamily: "var(--p-font-mono)", lineHeight: "1.6" },
    ".cm-content": { caretColor: "var(--p-fg)", minHeight: "var(--pc-min, 12lh)" },
    ".cm-cursor, &.cm-focused .cm-cursor": { borderLeftColor: "var(--p-fg)" },
    ".cm-selectionBackground, &.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, ::selection": { background: "var(--p-line-strong)" },
    ".cm-selectionMatch": { backgroundColor: "var(--p-line)" },
    // Translucent: the selection layer is drawn behind the text, an opaque line would hide it.
    ".cm-activeLine": { backgroundColor: "color-mix(in srgb, var(--p-fg) 5%, transparent)" },
    ".cm-specialChar": { color: "var(--p-fg-3)" },
    ".cm-gutters": { color: "var(--p-fg-3)", backgroundColor: "var(--p-surface)", border: "none", borderInlineEnd: "1px solid var(--p-line)" },
    ".cm-activeLineGutter": { backgroundColor: "var(--p-surface-2)", color: "var(--p-fg)" },
    "&.cm-focused .cm-matchingBracket, .cm-matchingBracket": { backgroundColor: "transparent", outline: "1px solid var(--p-fg-3)" },
    "&.cm-focused .cm-nonmatchingBracket, .cm-nonmatchingBracket": { backgroundColor: "transparent", outline: "1px solid var(--p-danger)" },
    // An outline, so the text keeps its contrast and a match differs from the selection (a fill).
    ".cm-searchMatch": { backgroundColor: "transparent", outline: "1px solid var(--p-fg-3)", outlineOffset: "-1px" },
    ".cm-searchMatch-selected": { backgroundColor: "color-mix(in srgb, var(--p-fg) 10%, transparent)", outline: "2px solid var(--p-fg)", outlineOffset: "-2px" },
    ".cm-panels": { backgroundColor: "var(--p-surface-2)", color: "var(--p-fg)" },
    ".cm-panels-top": { borderBottom: "1px solid var(--p-line)" },
    ".cm-panels input, .cm-panels button:not([name=close]):not(.cm-dialog-close)": { color: "var(--p-fg)", backgroundColor: "var(--p-bg)", backgroundImage: "none", border: "1px solid var(--p-line-strong)", borderRadius: "4px", padding: "2px 6px" },
    ".cm-tooltip": { color: "var(--p-fg)", backgroundColor: "var(--p-surface-2)", border: "1px solid var(--p-line-strong)" },
    ".cm-tooltip .cm-tooltip-arrow:before, .cm-tooltip .cm-tooltip-arrow:after": { borderTopColor: "var(--p-line-strong)", borderBottomColor: "var(--p-line-strong)" },
    ".pc-line-error": { backgroundColor: "color-mix(in srgb, var(--p-danger) 14%, transparent)", boxShadow: "inset 2px 0 0 var(--p-danger)" },
    // The merge view: changed lines, changed text and the change gutter.
    "&.cm-merge-a .cm-changedLine, &.cm-merge-b .cm-changedLine, .cm-deletedChunk, .cm-inlineChangedLine, .cm-insertedLine, .cm-deletedLine": { backgroundColor: "var(--p-surface-2)" },
    "&.cm-merge-a .cm-changedText, &.cm-merge-b .cm-changedText, .cm-deletedChunk .cm-deletedText": { background: underline("var(--p-fg-3)") },
    "&.cm-merge-b .cm-deletedText": { background: "var(--p-line-strong)" },
    ".cm-changedLineGutter, .cm-deletedLineGutter, .cm-inlineChangedLineGutter": { background: "var(--p-fg-3)" },
    ".cm-collapsedLines": { color: "var(--p-fg-2)", background: "var(--p-surface-2)" },
    // The lint package: underline, gutter marker, tooltip.
    ".cm-lintRange-error": { backgroundImage: "none", textDecoration: "underline wavy var(--p-danger)", textUnderlineOffset: "2px" },
    ".cm-lintRange-active": { backgroundColor: "var(--p-line-strong)" },
    ".cm-diagnostic-error": { borderLeft: "5px solid var(--p-danger)" },
    ".cm-lintPoint:after": { borderBottomColor: "var(--p-danger)" },
    ".cm-lint-marker-error": { content: '""', background: "var(--p-danger)", borderRadius: "50%", width: "0.7em", height: "0.7em" },
  }),
);

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

// Every word of the search panel, "Go to line" and the editor announcements, by the CodeMirror phrase.
const phrases = (s: Strings): Record<string, string> => ({
  Find: s.codeEditorSearch,
  Replace: s.codeEditorReplace,
  replace: s.codeEditorReplace,
  "replace all": s.codeEditorReplaceAll,
  all: s.codeEditorAll,
  "by word": s.codeEditorWholeWord,
  "match case": s.codeEditorMatchCase,
  regexp: s.codeEditorRegexp,
  next: s.next,
  previous: s.previous,
  close: s.close,
  "current match": s.codeEditorCurrentMatch,
  go: s.codeEditorGo,
  "Go to line": s.codeEditorGoToLine,
  "on line": s.codeEditorOnLine,
  "replaced $ matches": s.codeEditorReplacedMany,
  "replaced match on line $": s.codeEditorReplacedOne,
  "Control character": s.codeEditorControlChar,
  "Selection deleted": s.codeEditorSelectionDeleted,
});

/** Settings that can change while the editor lives; the search panel words come from the page language. */
const settings = (label: string, readOnly: boolean, lang: CodeLanguage, s: Strings): Extension[] => [
  EditorState.phrases.of(phrases(s)),
  // Read only, not "not editable": the content stays focusable, so keyboard users can select, copy and search.
  EditorState.readOnly.of(readOnly),
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
  const strings = useStrings();
  const words = JSON.stringify(phrases(strings)); // a provider may pass a new strings object each render
  const config = useRef(new Compartment());
  const first = useRef({ value, base: config.current.of(settings(label, readOnly, lang, strings)) });

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
    view.current!.dispatch({ effects: config.current.reconfigure(settings(label, readOnly, lang, strings)) });
  }, [label, readOnly, lang, words]);

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
  const words = JSON.stringify([s.codeDiffBefore, s.codeDiffAfter, phrases(s)]);
  useEffect(() => {
    const side = (doc: string, name: string): { doc: string; extensions: Extension[] } => ({
      doc,
      extensions: [...settings(name, true, lang, s), lineNumbers(), theme, highlight],
    });
    const mv = new MergeView({ parent: host.current!, a: side(before, s.codeDiffBefore), b: side(after, s.codeDiffAfter), highlightChanges: true, gutter: true });
    return () => mv.destroy();
  }, [before, after, lang, words]);
  return <div ref={host} dir="ltr" role="group" aria-label={label} className={cn("overflow-hidden rounded-field border border-line bg-surface", className)} />;
}
