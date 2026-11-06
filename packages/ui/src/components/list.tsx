"use client";

import { Children, isValidElement, useEffect, useId, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "../lib/cn";
import { useFlip } from "../lib/flip";
import { useLinkComponent, useStrings } from "../provider";
import { Button } from "./actions";
import { LiveRegion } from "./utility";
import { ABOVE_STRETCHED_LINK, STRETCHED_LINK } from "./card";

/** Rows of ListItem with dividers between them. Rows with a stable `data-flip` id glide to their new place when the order changes. */
export function List({ className, ...rest }: HTMLAttributes<HTMLUListElement>) {
  const ref = useRef<HTMLUListElement>(null);
  // The rows' keys and ids: only an order change measures, not every parent render (that would also restart the glides).
  const order = Children.toArray(rest.children)
    .map((c) => (isValidElement<{ "data-flip"?: string }>(c) ? `${c.key}=${c.props["data-flip"] ?? ""}` : ""))
    .join(" ");
  useFlip(ref, [order]);
  return <ul className={cn("divide-y divide-line", className)} {...rest} ref={ref} />;
}

/** One row: `leading` (icon, avatar), title and description, `trailing` (meta, action). With `href` the row is one link, with `onSelect` one button; controls in `trailing` still work. */
export function ListItem({
  leading,
  title,
  description,
  trailing,
  href,
  onSelect,
  disabled,
  move,
  className,
  "data-flip": flip,
}: {
  leading?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  trailing?: ReactNode;
  href?: string;
  /** The row is one button (the title is its text); controls in `trailing` still work. Not with `href` (then `href` wins). */
  onSelect?: () => void;
  /** With `onSelect`: dim, and the row does not press. */
  disabled?: boolean;
  /**
   * Move up and move down buttons at the end of the row, before `trailing`, for an ordered list. The first row's up button and
   * the last row's down button are disabled. `onMove(from, to)` asks the app to reorder (give the rows stable keys); after the
   * row has its new `index`, the focus returns to the same button (to the other one when the row reached an end) and the move
   * is announced. `label` names the row in the button names and the announcement (default: `title` when it is a string).
   */
  move?: { index: number; count: number; onMove: (from: number, to: number) => void; label?: string; disabled?: boolean };
  className?: string;
  /** Stable id for the reorder glide of List. */
  "data-flip"?: string;
}) {
  const L = useLinkComponent();
  const pick = !href && !!onSelect;
  const id = useId();
  const s = useStrings();
  const up = useRef<HTMLButtonElement>(null);
  const down = useRef<HTMLButtonElement>(null);
  const want = useRef<{ to: number; key: "up" | "down" } | null>(null);
  const [said, setSaid] = useState("");
  const name = move?.label ?? (typeof title === "string" ? title : "");
  // A moved row is re-inserted in the DOM and loses focus: give it back once the app has changed `index`.
  useEffect(() => {
    const w = want.current;
    if (!move || !w || w.to !== move.index) return;
    want.current = null;
    const first = w.key === "up" ? up.current : down.current;
    (first && !first.disabled ? first : w.key === "up" ? down.current : up.current)?.focus();
    setSaid(s.moved(name, move.index + 1, move.count));
  }, [move?.index]); // eslint-disable-line react-hooks/exhaustive-deps
  const go = (key: "up" | "down") => {
    if (!move) return;
    const to = move.index + (key === "up" ? -1 : 1);
    want.current = { to, key };
    move.onMove(move.index, to);
  };
  // The press button holds the title; a screen reader also hears the description and the trailing part (phone, price).
  const describedBy = pick ? [description && `${id}d`, trailing && `${id}t`].filter(Boolean).join(" ") || undefined : undefined;
  return (
    <li
      data-flip={flip}
      className={cn(
        "relative flex items-center gap-4 px-3 py-3",
        (href || pick) && cn("transition-colors", !(pick && disabled) && "hover:bg-surface-2", ABOVE_STRETCHED_LINK),
        pick && disabled && "opacity-50",
        className,
      )}
    >
      {leading && <div className="shrink-0 text-fg-3 [&_svg]:size-5">{leading}</div>}
      <div className="grid min-w-0 flex-1 gap-0.5">
        <div className="text-sm font-medium text-fg">
          {href ? (
            <L href={href} data-stretched="" className={STRETCHED_LINK}>
              {title}
            </L>
          ) : pick ? (
            <button type="button" data-stretched="" disabled={disabled} aria-describedby={describedBy} onClick={onSelect} className={cn(STRETCHED_LINK, "text-start", disabled ? "cursor-not-allowed" : "cursor-pointer")}>
              {title}
            </button>
          ) : (
            title
          )}
        </div>
        {description && (
          <div id={`${id}d`} className="text-sm text-fg-2">
            {description}
          </div>
        )}
      </div>
      {move && (
        <div className="flex shrink-0 gap-1">
          <Button ref={up} variant="ghost" size="sm" iconOnly aria-label={s.moveItemUp(name)} disabled={move.disabled || move.index <= 0} onClick={() => go("up")}>
            <ArrowUp aria-hidden />
          </Button>
          <Button ref={down} variant="ghost" size="sm" iconOnly aria-label={s.moveItemDown(name)} disabled={move.disabled || move.index >= move.count - 1} onClick={() => go("down")}>
            <ArrowDown aria-hidden />
          </Button>
          <LiveRegion>{said}</LiveRegion>
        </div>
      )}
      {trailing && (
        <div id={`${id}t`} className="shrink-0 text-sm text-fg-3">
          {trailing}
        </div>
      )}
    </li>
  );
}

/**
 * Terms and their details. `columns`: term and details side by side from 768 px of the screen. `auto`: side by side
 * when the list itself is 28rem wide or more (a container query), so a list in a narrow cell stays stacked. The list
 * must not take its width from its content (a block, grid or flex child with a width is fine).
 * `density="compact"`: tighter rows, for dense records.
 * `cols` 2 or 3: the pairs flow in that many columns, row by row, by a container query on the list (a list in a
 * narrow card has fewer columns, down to one). The lines between rows run across the whole row, and a last row with
 * fewer pairs stretches its pairs. `layout` still sets each pair: `stack` term above details, columns of at least
 * 8rem; `columns` term beside details (from 18rem of the list), columns of at least 18rem; `auto` stacked in columns
 * of at least 8rem, beside each other when each column is 28rem or more.
 */
export function DescriptionList({
  items,
  layout = "stack",
  density = "default",
  cols = 1,
  className,
}: {
  items: { term: ReactNode; details: ReactNode }[];
  layout?: "stack" | "columns" | "auto";
  density?: "default" | "compact";
  cols?: 1 | 2 | 3;
  className?: string;
}) {
  const multi = cols > 1;
  const wide = layout === "columns"; // a pair side by side needs a wider column
  return (
    <dl className={cn(multi ? "flex flex-wrap @container" : "divide-y divide-line", !multi && layout === "auto" && "@container", className)}>
      {items.map((item, i) => (
        <div
          key={i}
          className={cn(
            "grid gap-1 text-sm",
            density === "compact" ? "py-2" : "py-3",
            !multi && layout === "columns" && "md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-6",
            !multi && layout === "auto" && "@md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] @md:gap-6",
            // Multi-column: a pair is 100% wide, then 1/2 and 1/3 of the list (columns of 8rem, or 18rem for pairs side by
            // side); `grow` fills a short last row.
            multi && "min-w-0 grow basis-full",
            multi && (wide ? "@min-[36rem]:basis-1/2 @min-[36rem]:pe-6" : "@min-[16rem]:basis-1/2 @min-[16rem]:pe-6"),
            cols === 3 && (wide ? "@min-[54rem]:basis-1/3" : "@min-[24rem]:basis-1/3"),
            // The line above a pair that starts a row after the first: pair i is in the first row when i < the shown columns.
            multi && i > 0 && "border-t border-line",
            multi && i === 1 && (wide ? "@min-[36rem]:border-t-0" : "@min-[16rem]:border-t-0"),
            cols === 3 && i === 2 && (wide ? "@min-[54rem]:border-t-0" : "@min-[24rem]:border-t-0"),
            // Pair shape: `columns` side by side from 18rem of the list; `auto` when each column is 28rem or more.
            multi && layout === "columns" && "@min-[18rem]:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] @min-[18rem]:gap-x-4",
            cols === 2 && layout === "auto" && "@min-[56rem]:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] @min-[56rem]:gap-x-4",
            cols === 3 && layout === "auto" && "@min-[84rem]:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] @min-[84rem]:gap-x-4",
          )}
        >
          <dt className="text-fg-3">{item.term}</dt>
          <dd className="text-fg">{item.details}</dd>
        </div>
      ))}
    </dl>
  );
}
