"use client";

import type { ReactNode } from "react";
import { formatNumber } from "../lib/format-number";
import { useLang, useStrings, useText } from "../provider";
import { Money } from "../saudi/money";
import { DataTable, type DataTableColumn } from "./data-table";
import { Badge } from "./feedback";
import type { MenuItem } from "./menus";

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
};

/**
 * Document lines, for display: the amounts come as given, the table computes nothing.
 * `prices` says whether unit prices and totals include VAT; their headers say it too.
 * The discount and VAT columns show only when a line has a value. Card rows on phones.
 */
export function LineItemsTable({
  lines,
  caption,
  hideCaption,
  prices,
  rowActions,
  className,
}: {
  lines: LineItem[];
  caption: ReactNode;
  hideCaption?: boolean;
  prices: "incl" | "excl";
  rowActions?: (line: LineItem) => MenuItem[];
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
      cell: (x) => (
        // justify-items-start: the LTR SKU still sits at the start of an Arabic cell.
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
        </span>
      ),
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
  return (
    <DataTable
      columns={columns}
      rows={lines}
      getRowId={(x) => x.id}
      caption={caption}
      hideCaption={hideCaption}
      rowHref={(x) => x.href}
      rowActions={rowActions}
      cards
      className={className}
    />
  );
}
