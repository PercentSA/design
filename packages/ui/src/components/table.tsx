"use client";

import { useId, type HTMLAttributes, type ReactNode, type TableHTMLAttributes, type TdHTMLAttributes, type ThHTMLAttributes } from "react";
import { cn } from "../lib/cn";

const ALIGN = { start: "text-start", end: "text-end", center: "text-center" } as const;
export type TableAlign = keyof typeof ALIGN;

/** A styled native table in a horizontal scroll container. `className` goes to the container. */
export function Table({
  caption,
  hideCaption,
  className,
  children,
  ...rest
}: TableHTMLAttributes<HTMLTableElement> & { caption?: ReactNode; /** Keeps the caption for screen readers only. */ hideCaption?: boolean }) {
  const id = useId();
  return (
    // relative: holds the visually hidden caption (absolute) inside the scroll container.
    // A named, focusable region: keyboard users can scroll a wide table with the arrow keys.
    <div
      role={caption ? "region" : undefined}
      aria-labelledby={caption ? id : undefined}
      tabIndex={caption ? 0 : undefined}
      className={cn("relative w-full overflow-x-auto focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-fg", className)}
    >
      <table className="w-full border-collapse text-sm" {...rest}>
        {caption && (
          <caption id={id} className={hideCaption ? "sr-only" : "pb-3 text-start font-medium text-fg"}>
            {caption}
          </caption>
        )}
        {children}
      </table>
    </div>
  );
}

export const TableHeader = ({ className, ...rest }: HTMLAttributes<HTMLTableSectionElement>) => <thead className={className} {...rest} />;

export const TableBody = ({ className, ...rest }: HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className={cn("[&_tr:last-child]:border-0", className)} {...rest} />
);

/** `data-state="selected"` marks a chosen row. */
export const TableRow = ({ className, ...rest }: HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={cn("border-b border-line transition-colors data-[state=selected]:bg-surface-2", className)} {...rest} />
);

type Align = { align?: TableAlign };

/** A column header (`scope="col"` unless set). */
export const TableHead = ({ align = "start", className, ...rest }: Omit<ThHTMLAttributes<HTMLTableCellElement>, "align"> & Align) => (
  <th scope="col" className={cn("h-10 px-3 text-xs font-medium whitespace-nowrap text-fg-3", ALIGN[align], className)} {...rest} />
);

/** Numbers: `align="end"` (adds tabular digits, so they line up). */
export const TableCell = ({ align = "start", className, ...rest }: Omit<TdHTMLAttributes<HTMLTableCellElement>, "align"> & Align) => (
  <td className={cn("px-3 py-3 align-middle text-fg", ALIGN[align], align === "end" && "tabular-nums", className)} {...rest} />
);
