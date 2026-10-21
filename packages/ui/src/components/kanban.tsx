"use client";

import { useEffect, useId, useRef, useState, type DragEvent, type ReactNode } from "react";
import { ArrowRightLeft } from "lucide-react";
import { cn } from "../lib/cn";
import { useFlip } from "../lib/flip";
import { useStrings } from "../provider";
import { DropdownMenu } from "./menus";
import { LiveRegion } from "./utility";

export type KanbanColumn<Card> = { id: string; title: string; cards: Card[] };

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
 */
export function Kanban<Card>({
  columns,
  getCardId,
  getCardLabel,
  renderCard,
  onMove,
  headingLevel = 3,
  className,
}: {
  columns: KanbanColumn<Card>[];
  getCardId: (card: Card) => string;
  /** Plain-text name of a card, for the Move button and the announcement. */
  getCardLabel: (card: Card) => string;
  renderCard: (card: Card) => ReactNode;
  onMove: (cardId: string, toColumnId: string, toIndex: number) => void;
  /** Level of the column titles. Default 3. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  className?: string;
}) {
  const H = `h${headingLevel}` as const;
  const s = useStrings();
  const id = useId();
  const board = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ card: string; column: string; index: number } | null>(null);
  const [over, setOver] = useState<{ column: string; slot: number } | null>(null);
  const [message, setMessage] = useState("");
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
    onMove(getCardId(card), to.id, index);
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

  return (
    <>
      <div ref={board} className={cn("flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 md:snap-none", className)}>
        {columns.map((column, n) => {
          const slot = over?.column === column.id ? over.slot : -1;
          return (
            <section
              key={column.id}
              data-column={column.id}
              aria-labelledby={`${id}-${n}`}
              className="flex w-[85%] shrink-0 snap-start flex-col rounded-card border border-line bg-surface p-3 sm:w-72"
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
                <span className="text-xs text-fg-3 tabular-nums">{column.cards.length}</span>
              </H>
              <ul className="relative flex min-h-24 flex-1 flex-col gap-2">
                {/* An <li>: a <ul> may hold only list items. Hidden, so the list still reads as empty. */}
                {column.cards.length === 0 && slot === 0 && <li aria-hidden className={cn(LINE, "top-0")} />}
                {column.cards.map((card, i) => {
                  const cardId = getCardId(card);
                  const label = getCardLabel(card);
                  return (
                    <li
                      key={cardId}
                      data-card-id={cardId}
                      data-flip={cardId}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", label);
                        e.dataTransfer.effectAllowed = "move";
                        setDrag({ card: cardId, column: column.id, index: i });
                      }}
                      onDragEnd={end}
                      className={cn(
                        "relative flex cursor-grab items-start gap-2 rounded-field border border-line bg-bg p-3 text-sm active:cursor-grabbing",
                        drag?.card === cardId && "opacity-50",
                      )}
                    >
                      {slot === i && <span aria-hidden className={cn(LINE, "-top-[5px]")} />}
                      {slot === column.cards.length && i === column.cards.length - 1 && <span aria-hidden className={cn(LINE, "-bottom-[5px]")} />}
                      <div className="min-w-0 flex-1">{renderCard(card)}</div>
                      <DropdownMenu
                        align="end"
                        trigger={
                          <button
                            type="button"
                            data-move
                            aria-label={`${s.moveCard} ${label}`}
                            className="-me-1.5 -mt-1.5 grid size-8 shrink-0 place-items-center rounded-pill text-fg-3 transition-colors hover:bg-surface-2 hover:text-fg [&_svg]:size-4"
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
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
      <LiveRegion>{message}</LiveRegion>
    </>
  );
}
