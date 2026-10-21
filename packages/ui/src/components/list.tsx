"use client";

import { Children, isValidElement, useRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { useFlip } from "../lib/flip";
import { useLinkComponent } from "../provider";
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

/** One row: `leading` (icon, avatar), title and description, `trailing` (meta, action). With `href` the row is one link; controls in `trailing` still work. */
export function ListItem({
  leading,
  title,
  description,
  trailing,
  href,
  className,
  "data-flip": flip,
}: {
  leading?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  trailing?: ReactNode;
  href?: string;
  className?: string;
  /** Stable id for the reorder glide of List. */
  "data-flip"?: string;
}) {
  const L = useLinkComponent();
  return (
    <li data-flip={flip} className={cn("relative flex items-center gap-4 px-3 py-3", href && cn("transition-colors hover:bg-surface-2", ABOVE_STRETCHED_LINK), className)}>
      {leading && <div className="shrink-0 text-fg-3 [&_svg]:size-5">{leading}</div>}
      <div className="grid min-w-0 flex-1 gap-0.5">
        <div className="text-sm font-medium text-fg">
          {href ? (
            <L href={href} data-stretched="" className={STRETCHED_LINK}>
              {title}
            </L>
          ) : (
            title
          )}
        </div>
        {description && <div className="text-sm text-fg-2">{description}</div>}
      </div>
      {trailing && <div className="shrink-0 text-sm text-fg-3">{trailing}</div>}
    </li>
  );
}

/** Terms and their details. `columns`: term and details side by side from 768 px. */
export function DescriptionList({
  items,
  layout = "stack",
  className,
}: {
  items: { term: ReactNode; details: ReactNode }[];
  layout?: "stack" | "columns";
  className?: string;
}) {
  return (
    <dl className={cn("divide-y divide-line", className)}>
      {items.map((item, i) => (
        <div key={i} className={cn("grid gap-1 py-3 text-sm", layout === "columns" && "md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-6")}>
          <dt className="text-fg-3">{item.term}</dt>
          <dd className="text-fg">{item.details}</dd>
        </div>
      ))}
    </dl>
  );
}
