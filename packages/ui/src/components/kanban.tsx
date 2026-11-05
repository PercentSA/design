"use client";

import { useEffect, useId, useRef, useState, type DragEvent, type ReactNode } from "react";
import { ArrowRightLeft } from "lucide-react";
import { cn } from "../lib/cn";
import { useFlip } from "../lib/flip";
import { useStrings } from "../provider";
import { Button } from "./actions";
import { EmptyState, Skeleton } from "./feedback";
import { DropdownMenu } from "./menus";
import { LiveRegion } from "./utility";

export type KanbanColumn<Card> = {
  id: string;
  title: string;
  cards: Card[];
  /** Count in the header. Default `cards.length`; `null` shows "…" (not known yet). A server total, not the loaded cards. */
  count?: number | null;
  /** "loading": skeleton cards; "error": the error text and `onRetry`, loaded cards stay above it. Default "ready". */
  state?: "ready" | "loading" | "error";
  onRetry?: () => void;
  /** Text when the column has no cards. Default: "No items". */
  empty?: ReactNode;
  /** More cards exist: a "Load more" button at the end, and the next page loads by itself when the end of the column scrolls into view. */
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
};

/** The end of a column with more pages: the button, and a call of `onLoadMore` once per page when the end scrolls into view. */
function LoadMore<Card>({ column }: { column: KanbanColumn<Card> }) {
  const s = useStrings();
  const end = useRef<HTMLLIElement>(null);
  const asked = useRef(-1);
  const latest = useRef(column);
  latest.current = column;
  const n = column.cards.length;
  useEffect(() => {
    const el = end.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((entries) => {
      const c = latest.current;
      // Once per page: the page that is loaded or loading now has been asked for.
      if (entries.some((e) => e.isIntersecting) && !c.loadingMore && asked.current !== c.cards.length) {
        asked.current = c.cards.length;
        c.onLoadMore?.();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, [n]);
  return (
    <li ref={end} className="grid">
      <Button variant="secondary" size="sm" loading={column.loadingMore} onClick={() => column.onLoadMore?.()}>
        {s.loadMore}
      </Button>
    </li>
  );
}

/**
 * Where a dragged card lands. `slot` is the gap (0…n) under the pointer, from the cards' vertical
 * midpoints; `index` is the card's index after the move (in its own column the card leaves `from` first).
 */
export function dropIndex(midpoints: number[], y: number, from = -1) {
  const slot = midpoints.filter((m) => y > m).length;
  return { slot, index: from >= 0 && from < slot ? slot - 1 : slot };
}

const LINE = "pointer-events-none absolute inset-x-0 h-0.5 rounded-pill bg-fg";

/**
 * Columns of cards. Controlled: `onMove` reports the move, the parent updates `columns`.
 * Mouse: drag and drop. Keyboard, touch and screen readers: the "Move" menu on each card. Moves are announced.
 * Without `onMove` the board is a work board: no drag and no Move menu; the actions are content of `renderCard`.
 * Each column can carry a server `count`, a `state` (loading, error), an `empty` text and pages (`hasMore`, `onLoadMore`).
 * `fill`: the board takes the height of its parent and each column scrolls by itself. `columnWidth="fill"`: the columns share the width
 * (at least 14rem), then the row scrolls sideways. `phone="switch"`: below 768 px one column and a switch with title and count.
 */
export function Kanban<Card>({
  columns,
  getCardId,
  getCardLabel,
  renderCard,
  onMove,
  headingLevel = 3,
  fill = false,
  columnWidth = "fixed",
  phone = "scroll",
  column: shown,
  onColumnChange,
  density = "default",
  className,
}: {
  columns: KanbanColumn<Card>[];
  getCardId: (card: Card) => string;
  /** Plain-text name of a card, for the Move button and the announcement. */
  getCardLabel: (card: Card) => string;
  renderCard: (card: Card) => ReactNode;
  /** Absent: no drag and no Move menu. */
  onMove?: (cardId: string, toColumnId: string, toIndex: number) => void;
  /** Level of the column titles. Default 3. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** The board takes the height of its parent (give the parent a height); each column scrolls by itself. */
  fill?: boolean;
  /** "fixed": 18rem. "fill": the columns share the width, at least 14rem, then the row scrolls sideways. */
  columnWidth?: "fixed" | "fill";
  /** Below 768 px: "scroll" (a sideways row with snap) or "switch" (one column and a switch with title and count). */
  phone?: "scroll" | "switch";
  /** The shown column in "switch" mode. Controlled when `onColumnChange` is set (the app keeps it in the address). Default: the first. */
  column?: string;
  onColumnChange?: (columnId: string) => void;
  /** "compact": card padding 0.625rem, gap 0.5rem. */
  density?: "default" | "compact";
  className?: string;
}) {
  const H = `h${headingLevel}` as const;
  const s = useStrings();
  const id = useId();
  const board = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ card: string; column: string; index: number } | null>(null);
  const [over, setOver] = useState<{ column: string; slot: number } | null>(null);
  const [message, setMessage] = useState("");
  const [own, setOwn] = useState<string>();
  const wrap = fill || phone === "switch";
  const switchMode = phone === "switch";
  const active = columns.find((c) => c.id === (shown ?? own))?.id ?? columns[0]?.id;
  const pick = (id: string) => {
    setOwn(id);
    onColumnChange?.(id);
  };
  const compact = density === "compact";
  // The last move: announced (and, from the menu, focused) only when `columns` shows the card at its new place.
  const pending = useRef<{ card: string; column: string; index: number; message: string; focus: boolean } | null>(null);
  // Moved cards glide to their new place, also across columns.
  useFlip(board, [columns]);

  useEffect(() => {
    const p = pending.current;
    pending.current = null;
    if (!p) return;
    const card = columns.find((c) => c.id === p.column)?.cards[p.index];
    if (card === undefined || getCardId(card) !== p.card) return;
    setMessage(p.message);
    // A card moved to another column is a new element: give it the focus back.
    if (p.focus) board.current?.querySelector<HTMLElement>(`[data-card-id="${CSS.escape(p.card)}"] [data-move]`)?.focus();
  }, [columns]);

  const move = (card: Card, from: KanbanColumn<Card>, to: KanbanColumn<Card>, index: number, focus = false) => {
    const label = getCardLabel(card);
    const message = from === to ? s.cardPosition(label, index + 1, to.cards.length) : s.cardMoved(label, to.title);
    pending.current = { card: getCardId(card), column: to.id, index, message, focus };
    onMove?.(getCardId(card), to.id, index);
  };

  const target = (e: DragEvent<HTMLElement>, column: string) => {
    const mids = [...e.currentTarget.querySelectorAll<HTMLElement>("[data-card-id]")].map((el) => {
      const r = el.getBoundingClientRect();
      return r.top + r.height / 2;
    });
    return dropIndex(mids, e.clientY, drag?.column === column ? drag.index : -1);
  };
  const isNoop = (column: string, index: number) => drag?.column === column && drag.index === index;
  const end = () => {
    setDrag(null);
    setOver(null);
  };

  const sw = useRef<HTMLDivElement>(null);
  useEffect(() => {
    sw.current?.querySelector<HTMLElement>("[aria-pressed=true]")?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }, [active]);
  const countOf = (c: KanbanColumn<Card>) => (c.count === undefined ? c.cards.length : c.count);
  const countText = (c: KanbanColumn<Card>) => countOf(c) ?? "…";

  const body = (
    <>
      {switchMode && (
        <nav aria-label={s.columns} ref={sw} className="flex gap-2 overflow-x-auto pb-1 md:hidden">
          {columns.map((c) => (
            <Button key={c.id} variant={c.id === active ? "primary" : "secondary"} size="sm" aria-pressed={c.id === active} onClick={() => pick(c.id)}>
              {c.title}
              <span className="tabular-nums">({countText(c)})</span>
            </Button>
          ))}
        </nav>
      )}
      <div ref={board} className={cn("flex gap-3 overflow-x-auto pb-2", switchMode ? "md:snap-none" : "snap-x snap-mandatory md:snap-none", wrap ? "min-h-0 flex-1" : className)}>
        {columns.map((column, n) => {
          const slot = over?.column === column.id ? over.slot : -1;
          const state = column.state ?? "ready";
          const first = state === "loading" && column.cards.length === 0;
          return (
            <section
              key={column.id}
              data-column={column.id}
              aria-labelledby={`${id}-${n}`}
              aria-busy={state === "loading" || undefined}
              className={cn(
                "flex shrink-0 flex-col rounded-card border border-line bg-surface p-3",
                switchMode ? (column.id === active ? "w-full" : "max-md:hidden") : "w-[85%] snap-start sm:w-72",
                columnWidth === "fill" ? "md:min-w-56 md:flex-1 md:basis-0" : switchMode && "md:w-72",
                fill && "min-h-0",
              )}
              onDragOver={(e) => {
                if (!drag) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                const t = target(e, column.id);
                const next = isNoop(column.id, t.index) ? -1 : t.slot;
                if (slot !== next) setOver(next < 0 ? null : { column: column.id, slot: next });
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(null);
              }}
              onDrop={(e) => {
                if (!drag) return;
                e.preventDefault();
                const { index } = target(e, column.id);
                const from = columns.find((c) => c.id === drag.column);
                const card = from?.cards[drag.index];
                if (from && card !== undefined && !isNoop(column.id, index)) move(card, from, column, index);
                end();
              }}
            >
              <H id={`${id}-${n}`} className="flex items-center justify-between gap-2 px-1 pb-3 text-sm font-medium">
                {column.title}
                <span className="text-xs text-fg-3 tabular-nums">{countText(column)}</span>
              </H>
              <ul className={cn("relative flex min-h-24 flex-1 flex-col", "gap-2", fill && "min-h-0 overflow-y-auto")}>
                {/* An <li>: a <ul> may hold only list items. Hidden, so the list still reads as empty. */}
                {column.cards.length === 0 && slot === 0 && <li aria-hidden className={cn(LINE, "top-0")} />}
                {first && (
                  <>
                    <li className="sr-only">{s.loading}</li>
                    {[0, 1].map((k) => (
                      <li key={k} aria-hidden>
                        <Skeleton className="h-20" />
                      </li>
                    ))}
                  </>
                )}
                {column.cards.map((card, i) => {
                  const cardId = getCardId(card);
                  const label = getCardLabel(card);
                  return (
                    <li
                      key={cardId}
                      data-card-id={cardId}
                      data-flip={cardId}
                      draggable={!!onMove}
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", label);
                        e.dataTransfer.effectAllowed = "move";
                        setDrag({ card: cardId, column: column.id, index: i });
                      }}
                      onDragEnd={end}
                      className={cn(
                        "relative flex items-start gap-2 rounded-field border border-line bg-bg text-sm",
                        compact ? "p-2.5" : "p-3",
                        onMove && "cursor-grab active:cursor-grabbing",
                        drag?.card === cardId && "opacity-50",
                      )}
                    >
                      {slot === i && <span aria-hidden className={cn(LINE, "-top-[5px]")} />}
                      {slot === column.cards.length && i === column.cards.length - 1 && <span aria-hidden className={cn(LINE, "-bottom-[5px]")} />}
                      <div className="min-w-0 flex-1">{renderCard(card)}</div>
                      {onMove && (
                        <DropdownMenu
                          align="end"
                          trigger={
                            <button
                              type="button"
                              data-move
                              aria-label={`${s.moveCard} ${label}`}
                              className="-me-1.5 -mt-1.5 grid size-(--p-control-h-xs) shrink-0 place-items-center rounded-pill text-fg-3 transition-colors hover:bg-surface-2 hover:text-fg [&_svg]:size-4"
                            >
                              <ArrowRightLeft aria-hidden />
                            </button>
                          }
                          items={[
                            // Reorder without a mouse too (WCAG 2.5.7); `index` is the place after the move.
                            ...(i > 0
                              ? [
                                  { label: s.moveUp, onSelect: () => move(card, column, column, i - 1, true) },
                                  { label: s.moveToTop, onSelect: () => move(card, column, column, 0, true) },
                                ]
                              : []),
                            ...(i < column.cards.length - 1
                              ? [
                                  { label: s.moveDown, onSelect: () => move(card, column, column, i + 1, true) },
                                  { label: s.moveToBottom, onSelect: () => move(card, column, column, column.cards.length - 1, true) },
                                ]
                              : []),
                            ...(column.cards.length > 1 && columns.length > 1 ? ["separator" as const] : []),
                            ...columns
                              .filter((c) => c.id !== column.id)
                              .map((c) => ({ label: s.moveTo(c.title), onSelect: () => move(card, column, c, c.cards.length, true) })),
                          ]}
                        />
                      )}
                    </li>
                  );
                })}
                {state === "ready" && column.cards.length === 0 && slot !== 0 && (
                  <li className="grid flex-1 place-items-center px-2 py-6 text-center text-sm text-fg-3">{column.empty ?? s.noItems}</li>
                )}
                {state === "error" && column.cards.length === 0 && (
                  <li>
                    <EmptyState tone="error" variant="plain" title={s.loadFailed} onRetry={column.onRetry} className="px-2 py-6" />
                  </li>
                )}
                {state === "error" && column.cards.length > 0 && (
                  <li role="alert" className="grid gap-2 text-sm text-danger">
                    {s.loadFailed}
                    {column.onRetry && (
                      <Button variant="secondary" size="sm" onClick={column.onRetry}>
                        {s.retry}
                      </Button>
                    )}
                  </li>
                )}
                {column.hasMore && state !== "error" && !first && <LoadMore column={column} />}
              </ul>
            </section>
          );
        })}
      </div>
      <LiveRegion>{message}</LiveRegion>
    </>
  );
  // A wrapper only for the modes that need one; the plain board keeps its old markup.
  return wrap ? <div className={cn("flex flex-col gap-3", fill && "h-full min-h-0", className)}>{body}</div> : body;
}
