"use client";

import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { formatNumber } from "../lib/format-number";
import { useLang, useStrings, useText } from "../provider";
import { Money } from "../saudi/money";
import { DataTable, type DataTableColumn } from "./data-table";
import { Badge } from "./feedback";
import type { MenuItem } from "./menus";
import { Thumbnail } from "./thumbnail";
import { TotalsList, type TotalsItem } from "./totals-list";

export type LineItem = {
  id: string;
  name: ReactNode;
  sku?: string;
  quantity: number;
  unit?: ReactNode;
  unitPrice: number;
  discount?: number;
  vat?: number;
  total: number;
  /** Returned quantity: a chip when above 0. */
  returned?: number;
  /** The line opens this URL (for example the product). */
  href?: string;
  /** A small image at the start of the name cell. */
  media?: { src?: string | null; alt: string };
  /** Muted lines under the name: second-language name, description, VAT rate. */
  description?: ReactNode;
  /** Sub-lines without a price, for example the parts of a kit. */
  parts?: { id: string; name: ReactNode; sku?: string; quantity: number }[];
  /** More under the name: option chips, file thumbnails. */
  extra?: ReactNode;
};

/**
 * Document lines, for display: the amounts come as given, the table computes nothing.
 * `prices` says whether unit prices and totals include VAT; their headers say it too.
 * The discount and VAT columns show only when a line has a value. Card rows on phones.
 * A line can also carry `media`, `description`, `parts` and `extra` under or beside its name. `totals` puts a
 * TotalsList under the table, at the end side. `empty` replaces the rows when there are no lines.
 */
export function LineItemsTable({
  lines,
  caption,
  hideCaption,
  prices,
  rowActions,
  totals,
  empty,
  className,
}: {
  lines: LineItem[];
  caption: ReactNode;
  hideCaption?: boolean;
  prices: "incl" | "excl";
  rowActions?: (line: LineItem) => MenuItem[];
  /** Document totals under the table, at the end side (full width on narrow tables). */
  totals?: TotalsItem[];
  /** Shown in place of the rows when `lines` is empty. */
  empty?: ReactNode;
  className?: string;
}) {
  const s = useStrings().lines;
  const t = useText();
  const lang = useLang();
  const tax = prices === "incl" ? s.inclVat : s.exclVat;
  const money = (amount: number) => <Money amount={amount} decimals={2} />;
  const has = (key: "discount" | "vat") => lines.some((line) => (line[key] ?? 0) !== 0);
  const optional: DataTableColumn<LineItem>[] = [
    ...(has("discount") ? [{ key: "discount", header: t(s.discount), align: "end" as const, cell: (x: LineItem) => money(x.discount ?? 0) }] : []),
    ...(has("vat") ? [{ key: "vat", header: t(s.vat), align: "end" as const, cell: (x: LineItem) => money(x.vat ?? 0) }] : []),
  ];
  const columns: DataTableColumn<LineItem>[] = [
    {
      key: "name",
      header: t(s.product),
      cell: (x) => {
        // justify-items-start: the LTR SKU still sits at the start of an Arabic cell.
        const text = (
          <span className="grid justify-items-start gap-0.5">
            <span className="inline-flex flex-wrap items-center gap-2">
              {x.name}
              {(x.returned ?? 0) > 0 && <Badge>{t(s.returned(x.returned!))}</Badge>}
            </span>
            {x.sku && (
              <span dir="ltr" className="font-mono text-xs font-normal text-fg-3">
                {x.sku}
              </span>
            )}
            {x.description != null && <span className="text-xs font-normal text-fg-3">{x.description}</span>}
            {x.parts && x.parts.length > 0 && (
              <ul aria-label={s.kitParts} className="grid gap-0.5 text-xs font-normal text-fg-3">
                {x.parts.map((part) => (
                  <li key={part.id}>
                    {part.name}
                    {part.sku && (
                      <>
                        {" ("}
                        <bdi dir="ltr" className="font-mono">
                          {part.sku}
                        </bdi>
                        {")"}
                      </>
                    )}{" "}
                    {/* The "×" stays before the number, after the name, in both directions. */}
                    <bdi dir="ltr" className="tabular-nums">
                      × {formatNumber(part.quantity, lang)}
                    </bdi>
                  </li>
                ))}
              </ul>
            )}
            {x.extra != null && <span className="font-normal">{x.extra}</span>}
          </span>
        );
        return x.media ? (
          <span className="flex items-start gap-3">
            <Thumbnail size="sm" src={x.media.src} alt={x.media.alt} />
            {text}
          </span>
        ) : (
          text
        );
      },
    },
    {
      key: "quantity",
      header: t(s.quantity),
      align: "end",
      cell: (x) => (
        <>
          {formatNumber(x.quantity, lang)}
          {x.unit != null && <span className="text-fg-3"> {x.unit}</span>}
        </>
      ),
    },
    { key: "unitPrice", header: t(`${s.unitPrice} ${tax}`), align: "end", cell: (x) => <Money amount={x.unitPrice} maxDecimals={6} /> },
    ...optional,
    { key: "total", header: t(`${s.total} ${tax}`), align: "end", cell: (x) => money(x.total) },
  ];
  const table = (
    <DataTable
      columns={columns}
      rows={lines}
      getRowId={(x) => x.id}
      caption={caption}
      hideCaption={hideCaption}
      rowHref={(x) => x.href}
      rowActions={rowActions}
      empty={empty != null ? <p className="p-4 text-center text-sm text-fg-3">{empty}</p> : undefined}
      cards
      className={totals ? undefined : className}
    />
  );
  if (!totals) return table;
  return (
    <div className={cn("@container grid gap-4", className)}>
      {table}
      <TotalsList items={totals} className="w-full @xl:max-w-sm @xl:justify-self-end" />
    </div>
  );
}
