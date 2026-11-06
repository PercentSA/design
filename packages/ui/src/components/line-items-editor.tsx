"use client";

import { Fragment, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { ChevronDown, Ellipsis, Plus, Trash2 } from "lucide-react";
import { cn } from "../lib/cn";
import { useStrings } from "../provider";
import { Button } from "./actions";
import { buttonClass } from "./button-class";
import { lineCellScope } from "./field";
import { Skeleton } from "./feedback";
import { Grid, Surface } from "./layout";
import { DropdownMenu, type MenuItem } from "./menus";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";
import { Text } from "./text";
import { TotalsList, type TotalsItem } from "./totals-list";
import { LiveRegion } from "./utility";

export type LineCellContext = {
  /** The line's position, from 0. */
  index: number;
  disabled: boolean;
  /** Moves the focus to the next editable cell (call it after a pick). */
  next: () => void;
};

export type LineEditorColumn<Line> = {
  key: string;
  /** The column header; on line cards it is the visible label of a read-only cell (a `Field` shows its own label). */
  header: ReactNode;
  cell: (line: Line, ctx: LineCellContext) => ReactNode;
  /** Minimum width on table rows: xs 6rem (quantity), sm 8rem (money), md 10rem (default), lg 14rem, fill (the rest, at least 14rem; the product). */
  width?: "xs" | "sm" | "md" | "lg" | "fill";
  align?: "start" | "end";
  /** A total or a fact: not a stop for Enter, no label box. */
  readOnly?: boolean;
  /** On line cards: "title" (first row, full width), "field" (in the number grid), "end" (last in the grid, at the end side), "hide". Default "field". */
  card?: "title" | "field" | "end" | "hide";
};

const WIDTH = {
  xs: { rem: 6, cls: "min-w-24" },
  sm: { rem: 8, cls: "min-w-32" },
  md: { rem: 10, cls: "min-w-40" },
  lg: { rem: 14, cls: "min-w-56" },
  fill: { rem: 14, cls: "w-full min-w-56" },
} as const;
const NUMBER_REM = 2.5;
const BUTTON_REM = 2.5;
const FOCUSABLE = 'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])';
const TEXT_INPUT = 'input:not([type="hidden"]):not([disabled]), textarea:not([disabled])';
/** The control of a cell the editor moves to: its text input first (a NumberInput has its "−" button before it), else the first control. */
const controlOf = (cell: Element | null | undefined) => cell?.querySelector<HTMLElement>(TEXT_INPUT) ?? cell?.querySelector<HTMLElement>(FOCUSABLE) ?? null;

type After = { kind: "add"; from: number } | { kind: "remove"; index: number; from: number };

/**
 * The lines of a document in a form: one row per line with the app's inputs in the cells, add and remove, a keyboard order,
 * per-line details, totals, and line cards when the part is too narrow for the columns (it measures itself; the server renders rows).
 * Enter never submits the form from inside the editor: it moves to the next editable cell, the next line, and from the last
 * cell of the last line adds a line (`onAdd`). After an add the focus goes to the new line; after a remove to the line that took
 * its place, else to the add button. Both are announced. A `Field` inside a cell hides its label on rows (the column header shows
 * it) and shows it on cards. The part computes nothing: the app owns the lines and the totals. Closed details are not rendered.
 * Rows and cards are different elements, so cell inputs must be controlled (`value`, not `defaultValue`): an uncontrolled input
 * would lose its text when the width crosses the switch. The focused cell keeps its focus across the switch.
 */
export function LineItemsEditor<Line>({
  lines,
  getKey,
  columns,
  caption,
  hideCaption,
  onAdd,
  addLabel,
  onRemove,
  canRemove,
  lineActions,
  detail,
  openDetails,
  onOpenDetailsChange,
  totals,
  empty,
  loading,
  error,
  disabled = false,
  numbered = true,
  className,
}: {
  lines: readonly Line[];
  getKey: (line: Line) => string;
  columns: LineEditorColumn<Line>[];
  /** Names the table; hidden with `hideCaption` (the section title says it). */
  caption: ReactNode;
  hideCaption?: boolean;
  /** Adds one empty line; the part then focuses the first editable cell of the new last line. No add button without it. */
  onAdd?: () => void;
  /** Default: "Add line". */
  addLabel?: ReactNode;
  /** No trash button without it. */
  onRemove?: (index: number) => void;
  /** False: this line shows no trash (for example the only line). Default true. */
  canRemove?: (line: Line, index: number) => boolean;
  /** Rare actions of a line, in a "⋯" menu at the end of the row. */
  lineActions?: (line: Line, index: number) => MenuItem[];
  /** More fields of a line, under its row, opened by the line's "Line details" button. The part lays them out in a grid. */
  detail?: (line: Line, ctx: LineCellContext) => ReactNode;
  /** Controlled open details (line keys); else the part keeps them. */
  openDetails?: string[];
  onOpenDetailsChange?: (keys: string[]) => void;
  /** Under the rows, at the end side (full width below 36rem). */
  totals?: TotalsItem[];
  /** Text in place of the rows when there is no line, or the screen waits for a choice. */
  empty?: ReactNode;
  /** Three skeleton rows. */
  loading?: boolean;
  /** A list error (no lines, too many); linked to the table. */
  error?: ReactNode;
  /** The add button disabled; no trash, no menu; the app disables its inputs. */
  disabled?: boolean;
  /** The "#" column. Default true. */
  numbered?: boolean;
  className?: string;
}) {
  const s = useStrings().lines;
  const uid = useId();
  const root = useRef<HTMLDivElement>(null);
  const addButton = useRef<HTMLButtonElement>(null);
  const after = useRef<After | null>(null);
  const [cards, setCards] = useState(false);
  const cardsRef = useRef(false);
  const [announce, setAnnounce] = useState({ text: "", n: 0 });
  const setMessage = (text: string) => setAnnounce((a) => ({ text, n: a.n + 1 }));
  // The cell that has the focus when rows and cards switch (they remount), so the focus can come back to it.
  const held = useRef<{ line: string; col: string; start: number | null; end: number | null } | null>(null);
  const [kept, setKept] = useState<string[]>([]);
  const open = openDetails ?? kept;
  const setOpen = (keys: string[]) => {
    if (openDetails === undefined) setKept(keys);
    onOpenDetailsChange?.(keys);
  };

  const buttons = (detail ? 1 : 0) + (onRemove && !disabled ? 1 : 0) + (lineActions && !disabled ? 1 : 0);
  const need = columns.reduce((sum, c) => sum + WIDTH[c.width ?? "md"].rem, 0) + (numbered ? NUMBER_REM : 0) + buttons * BUTTON_REM;
  // Rows until the width is known (the server, the first paint); then cards when the columns do not fit.
  useLayoutEffect(() => {
    const el = root.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const ro = new ResizeObserver(([e]) => {
      const w = e?.contentRect.width ?? 0;
      if (w <= 0) return;
      const next = w < need * rem;
      if (next === cardsRef.current) return;
      cardsRef.current = next;
      const at = document.activeElement as HTMLInputElement | null;
      const cell = at && el.contains(at) ? at.closest<HTMLElement>("[data-lc]") : null;
      held.current = cell ? { line: cell.dataset.line!, col: cell.dataset.col!, start: at!.selectionStart ?? null, end: at!.selectionEnd ?? null } : null;
      setCards(next);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [need]);

  useLayoutEffect(() => {
    const h = held.current;
    held.current = null;
    if (!h) return;
    const cell = root.current?.querySelector(`[data-lc][data-line="${h.line}"][data-col="${h.col}"]`);
    const input = controlOf(cell) as HTMLInputElement | null;
    input?.focus();
    if (input && h.start != null && h.end != null) try { input.setSelectionRange(h.start, h.end); } catch { /* not a text input */ }
  }, [cards]);

  const cellsOf = (line: number) => [...(root.current?.querySelectorAll<HTMLElement>(`[data-lc][data-line="${line}"]`) ?? [])];
  // A move by the editor selects the text, so a typed value replaces the old one.
  const focusIn = (el: Element | undefined) => {
    const c = controlOf(el);
    c?.focus();
    if (c instanceof HTMLInputElement || c instanceof HTMLTextAreaElement) c.select();
  };
  const focusLine = (line: number) => {
    const first = cellsOf(line).find((c) => c.querySelector(FOCUSABLE));
    if (first) return focusIn(first);
    const action = root.current?.querySelector<HTMLElement>(`[data-line-index="${line}"] [data-line-action]`);
    (action ?? addButton.current)?.focus();
  };
  /** The next editable cell of the line, else the first of the next line, else (Enter only) a new line. */
  const go = (cell: HTMLElement, addAtEnd: boolean) => {
    const line = Number(cell.dataset.line);
    const mine = cellsOf(line);
    const target = mine[mine.indexOf(cell) + 1] ?? cellsOf(line + 1)[0];
    if (target) focusIn(target);
    else if (addAtEnd) add();
  };
  const add = () => {
    if (!onAdd || disabled) return;
    after.current = { kind: "add", from: lines.length };
    onAdd();
  };
  const remove = (index: number) => {
    after.current = { kind: "remove", index, from: lines.length };
    onRemove?.(index);
  };
  // The app changes `lines` in its own time; focus and announce once the count has changed.
  useEffect(() => {
    const a = after.current;
    if (!a) return;
    if (a.kind === "add" && lines.length > a.from) {
      after.current = null;
      focusLine(lines.length - 1);
      setMessage(s.added(lines.length));
    } else if (a.kind === "remove" && lines.length < a.from) {
      after.current = null;
      if (a.index < lines.length) focusLine(a.index);
      else if (addButton.current) addButton.current.focus();
      else if (lines.length) focusLine(lines.length - 1);
      else root.current?.focus();
      setMessage(s.removed(a.index + 1));
    }
  }, [lines.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Enter" || e.defaultPrevented || e.nativeEvent.isComposing || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;
    const target = e.target as HTMLElement;
    // Buttons and text areas keep Enter; a Combobox with its list open has already handled it (defaultPrevented).
    if (!target.matches("input, select")) return;
    e.preventDefault();
    const cell = target.closest<HTMLElement>("[data-lc]");
    if (cell && root.current?.contains(cell)) go(cell, true);
  };

  const ctxOf = (index: number, col?: number): LineCellContext => ({
    index,
    disabled,
    next: () => {
      const cell = col === undefined ? undefined : root.current?.querySelector<HTMLElement>(`[data-lc][data-line="${index}"][data-col="${col}"]`);
      if (cell) go(cell, false);
      else focusIn(cellsOf(index + 1)[0]);
    },
  });

  const actionsOf = (line: Line, index: number) => {
    const key = getKey(line);
    const n = index + 1;
    const isOpen = open.includes(key);
    const items = lineActions && !disabled ? lineActions(line, index) : [];
    return (
      <>
        {detail && (
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            data-line-action=""
            aria-expanded={isOpen}
            aria-controls={isOpen ? `${uid}d${key}` : undefined}
            aria-label={`${s.details} ${n}`}
            onClick={() => setOpen(isOpen ? open.filter((k) => k !== key) : [...open, key])}
          >
            <ChevronDown aria-hidden className={cn("transition-transform", isOpen && "rotate-180")} />
          </Button>
        )}
        {onRemove && !disabled && (canRemove?.(line, index) ?? true) && (
          <Button variant="ghost" size="sm" iconOnly data-line-action="" aria-label={s.remove(n)} onClick={() => remove(index)}>
            <Trash2 aria-hidden />
          </Button>
        )}
        {items.length > 0 && (
          <DropdownMenu
            align="end"
            items={items}
            trigger={
              <button type="button" data-line-action="" aria-label={`${s.more} ${n}`} className={buttonClass("ghost", "sm", true)}>
                <Ellipsis aria-hidden />
              </button>
            }
          />
        )}
      </>
    );
  };

  const detailOf = (line: Line, index: number) => (
    <div id={`${uid}d${getKey(line)}`} role="group" aria-label={`${s.details} ${index + 1}`}>
      <Grid min="16rem" gap={4}>
        {detail?.(line, ctxOf(index))}
      </Grid>
    </div>
  );

  const errorId = error ? `${uid}-error` : undefined;
  const captionId = `${uid}-caption`;
  const showEmpty = lines.length === 0 && !loading;

  const table = (
    <Table caption={caption} hideCaption={hideCaption} scrolls={false} aria-describedby={errorId} aria-busy={loading || undefined}>
      <TableHeader>
        <TableRow>
          {numbered && <TableHead className="w-10">{s.number}</TableHead>}
          {columns.map((c) => (
            <TableHead key={c.key} align={c.align} className={WIDTH[c.width ?? "md"].cls}>
              {c.header}
            </TableHead>
          ))}
          {buttons > 0 && (
            <TableHead style={{ width: `${buttons * BUTTON_REM}rem` }}>
              <span className="sr-only">{s.more}</span>
            </TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading &&
          [0, 1, 2].map((i) => (
            <TableRow key={i}>
              {numbered && (
                <TableCell className="py-2">
                  <Skeleton className="h-(--p-control-h)" />
                </TableCell>
              )}
              {columns.map((c) => (
                <TableCell key={c.key} className="py-2">
                  <Skeleton className="h-(--p-control-h)" />
                </TableCell>
              ))}
              {buttons > 0 && <TableCell className="py-2" />}
            </TableRow>
          ))}
        {showEmpty && empty != null && (
          <TableRow>
            <TableCell colSpan={columns.length + (numbered ? 1 : 0) + (buttons > 0 ? 1 : 0)} className="py-6 text-center">
              <Text size="sm" tone="subtle">
                {empty}
              </Text>
            </TableCell>
          </TableRow>
        )}
        {!loading &&
          lines.map((line, i) => {
            const key = getKey(line);
            const n = i + 1;
            const isOpen = !!detail && open.includes(key);
            return (
              <Fragment key={key}>
                <TableRow data-line-index={i} className={cn(isOpen && "border-b-0")}>
                  {numbered && (
                    <TableCell className="py-2 align-top">
                      <div className="flex min-h-(--p-control-h) items-center text-fg-3">{n}</div>
                    </TableCell>
                  )}
                  {columns.map((c, ci) =>
                    c.readOnly ? (
                      <TableCell key={c.key} align={c.align} className="py-2 align-top">
                        <div className={cn("flex min-h-(--p-control-h) items-center", c.align === "end" && "justify-end")}>{c.cell(line, ctxOf(i, ci))}</div>
                      </TableCell>
                    ) : (
                      <TableCell key={c.key} align={c.align} data-lc="" data-line={i} data-col={ci} className="py-2 align-top">
                        <lineCellScope.Provider value={{ hideLabel: true, suffix: s.line(n) }}>{c.cell(line, ctxOf(i, ci))}</lineCellScope.Provider>
                      </TableCell>
                    ),
                  )}
                  {buttons > 0 && (
                    <TableCell className="py-2 align-top">
                      <div className="flex min-h-(--p-control-h) items-center justify-end">{actionsOf(line, i)}</div>
                    </TableCell>
                  )}
                </TableRow>
                {isOpen && (
                  <TableRow>
                    <TableCell colSpan={columns.length + (numbered ? 1 : 0) + (buttons > 0 ? 1 : 0)} className="bg-surface-2 py-3">
                      {detailOf(line, i)}
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
      </TableBody>
    </Table>
  );

  const cell = (c: LineEditorColumn<Line>, line: Line, i: number, ci: number) =>
    c.readOnly ? (
      <div key={c.key} className="grid gap-1">
        {c.card !== "title" && <span className="text-xs text-fg-3">{c.header}</span>}
        <div className={cn("min-w-0", c.align === "end" && "text-end")}>{c.cell(line, ctxOf(i, ci))}</div>
      </div>
    ) : (
      <div key={c.key} data-lc="" data-line={i} data-col={ci} className="min-w-0">
        <lineCellScope.Provider value={{ hideLabel: false }}>{c.cell(line, ctxOf(i, ci))}</lineCellScope.Provider>
      </div>
    );

  const cardList = (
    <div aria-describedby={errorId} aria-busy={loading || undefined} className="grid gap-3">
      <p id={captionId} className={hideCaption ? "sr-only" : "text-sm font-medium text-fg"}>
        {caption}
      </p>
      {loading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-28" />)}
      {showEmpty && empty != null && (
        <Text size="sm" tone="subtle" className="py-4 text-center">
          {empty}
        </Text>
      )}
      {!loading && lines.length > 0 && (
        <ul aria-labelledby={captionId} className="grid gap-3">
          {lines.map((line, i) => {
            const key = getKey(line);
            const n = i + 1;
            const isOpen = !!detail && open.includes(key);
            const part = (kind: "title" | "field" | "end") => columns.map((c, ci) => ((c.card ?? "field") === kind ? cell(c, line, i, ci) : null));
            return (
              <li key={key} data-line-index={i}>
                <Surface role="group" aria-label={s.line(n)} className="grid gap-3 p-3">
                  {(numbered || buttons > 0) && (
                    <div className="-my-1 flex min-h-8 items-center gap-2">
                      {numbered && <span className="min-w-4 text-xs text-fg-3 tabular-nums">{n}</span>}
                      <div className="flex-1" />
                      {buttons > 0 && <div className="flex shrink-0 items-center">{actionsOf(line, i)}</div>}
                    </div>
                  )}
                  <div className="grid min-w-0 gap-3 empty:hidden">{part("title")}</div>
                  <Grid min="7rem" gap={3}>
                    {part("field")}
                    {part("end")}
                  </Grid>
                  {isOpen && <div className="border-t border-line pt-3">{detailOf(line, i)}</div>}
                </Surface>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );

  return (
    <div ref={root} tabIndex={-1} onKeyDown={onKeyDown} className={cn("@container grid gap-4 outline-none", className)}>
      {cards ? cardList : table}
      {error && (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      )}
      {onAdd && (
        <div>
          <Button ref={addButton} variant="secondary" size="sm" disabled={disabled} onClick={add}>
            <Plus aria-hidden />
            {addLabel ?? s.add}
          </Button>
        </div>
      )}
      {totals && <TotalsList items={totals} className="w-full @xl:max-w-sm @xl:justify-self-end" />}
      <LiveRegion>
        <span key={announce.n}>{announce.text}</span>
      </LiveRegion>
    </div>
  );
}
