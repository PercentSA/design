"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, Ellipsis } from "lucide-react";
import { cn } from "../lib/cn";
import { useLang, useLinkComponent, useStrings, useText } from "../provider";
import { buttonClass } from "./button-class";
import { ABOVE_STRETCHED_LINK, STRETCHED_LINK } from "./card";
import { Checkbox } from "./choices";
import { EmptyState, Skeleton } from "./feedback";
import { Select } from "./inputs";
import { DropdownMenu, type MenuItem } from "./menus";
import { Pagination } from "./navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, type TableAlign } from "./table";
import { LiveRegion } from "./utility";

export type DataTableColumn<Row> = {
  key: string;
  header: ReactNode;
  /** Default: the row's field named `key`. */
  cell?: (row: Row) => ReactNode;
  /** Default: the row's field named `key`. */
  sortValue?: (row: Row) => string | number;
  sortable?: boolean;
  align?: TableAlign;
  /** CSS width of the column, for example "8rem". */
  width?: string;
  /** With `cards`: not shown on the cards (below 768 px). */
  hideOnCard?: boolean;
  /** ColumnsMenu can hide the column. Default true. */
  hideable?: boolean;
};

export type DataTableSort = { key: string; direction: "asc" | "desc" };

export type DataTableProps<Row> = {
  columns: DataTableColumn<Row>[];
  rows: Row[];
  getRowId: (row: Row) => string;
  /** The table's name for screen readers. */
  caption: ReactNode;
  hideCaption?: boolean;
  /** Controlled sort (`null`: not sorted). */
  sort?: DataTableSort | null;
  defaultSort?: DataTableSort;
  onSortChange?: (sort: DataTableSort) => void;
  selectable?: boolean;
  selected?: string[];
  defaultSelected?: string[];
  onSelectedChange?: (ids: string[]) => void;
  /** Client-side pages. */
  pageSize?: number;
  /** Server side: give `page` and `pageCount`; the table then shows `rows` as given (already sorted and sliced). */
  page?: number;
  pageCount?: number;
  onPageChange?: (page: number) => void;
  loading?: boolean;
  /** Shown when there are no rows. Default: EmptyState with "No results". */
  empty?: ReactNode;
  /** The whole row opens the record: the first cell becomes a link to this URL. `undefined`: a plain row. */
  rowHref?: (row: Row) => string | undefined;
  /** A "⋯" menu per row, in a last column. An empty array gives no button. */
  rowActions?: (row: Row) => MenuItem[];
  /** Below 768 px each row is a card: the first cell is its title, and the other cells show their header. Default false. */
  cards?: boolean;
  /** Keys of columns not shown (from ColumnsMenu). */
  hiddenColumns?: string[];
  /** Shows a "Rows per page" choice. Controlled: set `pageSize` in `onPageSizeChange`. A change goes to page 1. */
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
  /** The table scrolls in its own box (up to 70% of the screen height), and the header row stays in view. */
  stickyHeader?: boolean;
  /** A total row at the foot: values by column key. The first column shows "Total" unless it has a value. */
  totals?: Partial<Record<string, ReactNode>>;
  /** Reports: the rows in groups by this key, in the order the groups first appear in `rows`. A sort works inside each group. Client pages are off. */
  groupBy?: (row: Row) => string;
  /** The group's header row. Default: the key. */
  groupHeader?: (key: string, rows: Row[]) => ReactNode;
  /** A subtotal row after each group: values by column key, as `totals`. */
  groupTotals?: (key: string, rows: Row[]) => Partial<Record<string, ReactNode>>;
  className?: string;
};

const field = (row: unknown, key: string) => (row as Record<string, unknown>)[key];

// Cards: below 768 px the rows are cards, by CSS only, so there is one copy of the rows.
const CARD_ROW = "max-md:flex max-md:flex-wrap max-md:items-start max-md:gap-x-3 max-md:gap-y-1.5 max-md:rounded-card max-md:border max-md:border-line max-md:p-4";
// The cells after the title: one line each, the header at the start and the value at the end. order-1 puts them
// under the first line, so the checkbox, the title and "⋯" share it.
const CARD_FIELD = "max-md:order-1 max-md:flex max-md:basis-full max-md:items-center max-md:justify-between max-md:gap-3 max-md:p-0";
const ACTIONS_KEY = "p-row-actions";

/** A table with sorting, row selection, pages, loading and empty states. Client-side by default; server-side with `pageCount`. */
export function DataTable<Row>({
  columns: allColumns,
  rows,
  getRowId,
  caption,
  hideCaption,
  sort,
  defaultSort,
  onSortChange,
  selectable,
  selected,
  defaultSelected,
  onSelectedChange,
  pageSize,
  page,
  pageCount,
  onPageChange,
  loading,
  empty,
  rowHref,
  rowActions,
  cards,
  hiddenColumns,
  pageSizeOptions,
  onPageSizeChange,
  stickyHeader,
  totals,
  groupBy,
  groupHeader,
  groupTotals,
  className,
}: DataTableProps<Row>) {
  const columns = hiddenColumns ? allColumns.filter((c) => !hiddenColumns.includes(c.key)) : allColumns;
  const s = useStrings();
  const t = useText();
  const lang = useLang();
  const L = useLinkComponent();
  const uid = useId();
  const [innerSort, setInnerSort] = useState(defaultSort ?? null);
  const [innerSelected, setInnerSelected] = useState(defaultSelected ?? []);
  const [innerPage, setInnerPage] = useState(1);
  const server = pageCount !== undefined;
  const order = sort === undefined ? innerSort : sort;
  // Client side, `rows` holds every row: forget ids of rows that are gone. Server side, other pages keep theirs.
  const rowIds = new Set(rows.map(getRowId));
  const chosen = (selected ?? innerSelected).filter((id) => server || rowIds.has(id));
  const chosenSet = new Set(chosen);

  // A hidden column keeps its sort.
  const sortColumn = allColumns.find((c) => c.key === order?.key);
  const direction = order?.direction;
  const collator = useMemo(() => new Intl.Collator(lang, { numeric: true }), [lang]);
  // Sorted again only when the rows, the sort or the column change, not on every selection click.
  const sorted = useMemo(() => {
    if (!direction || !sortColumn || server) return rows;
    const value = (row: Row) => (sortColumn.sortValue ? sortColumn.sortValue(row) : field(row, sortColumn.key));
    const sign = direction === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const x = value(a);
      const y = value(b);
      return sign * (typeof x === "number" && typeof y === "number" ? x - y : collator.compare(String(x ?? ""), String(y ?? "")));
    });
  }, [rows, sortColumn, direction, server, collator]);

  // Reports (groupBy) show all rows: no client pages.
  const clientPages = !server && !groupBy && pageSize;
  const pages = server ? pageCount : clientPages ? Math.ceil(sorted.length / clientPages) : 1;
  const current = Math.max(1, Math.min(page ?? innerPage, pages));
  const visible = clientPages ? sorted.slice((current - 1) * clientPages, current * clientPages) : sorted;
  // Groups keep the order in which they first appear in `rows`; the rows inside keep the sort.
  const groups = groupBy ? new Map(rows.map((row) => [groupBy(row), [] as Row[]])) : undefined;
  if (groups) for (const row of visible) groups.get(groupBy!(row))!.push(row);
  const goTo = (n: number) => {
    setInnerPage(n);
    onPageChange?.(n);
  };

  const toggleSort = (key: string) => {
    const next: DataTableSort = { key, direction: order?.key === key && order.direction === "asc" ? "desc" : "asc" };
    setInnerSort(next);
    goTo(1);
    onSortChange?.(next);
  };

  const select = (ids: string[]) => {
    setInnerSelected(ids);
    onSelectedChange?.(ids);
  };
  // "Select all" acts on the rows on screen (this page).
  const ids = visible.map(getRowId);
  const count = ids.filter((id) => chosenSet.has(id)).length;
  const all = count > 0 && count === ids.length ? true : count > 0 ? "indeterminate" : false;

  const colSpan = columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0);
  // The actions cell joins the column cells (no new child slot), so tables without rowActions render as before.
  const withActions = (cells: ReactNode[], cell: () => ReactNode) => (rowActions ? [...cells, cell()] : cells);
  const bodyClass = cn(cards && "max-md:grid max-md:gap-3 max-md:[&_tr:last-child]:border");

  // `i` makes the row's ids (for the checkbox and "⋯" names) unique in the table.
  const renderRow = (row: Row, i: number | string) => {
    const id = getRowId(row);
    const isSelected = chosenSet.has(id);
    const href = rowHref?.(row);
    const actions = rowActions?.(row) ?? [];
    return (
      <TableRow
        key={id}
        data-state={isSelected ? "selected" : undefined}
        // The first cell's link covers the row; the checkbox and "⋯" sit above it.
        className={cn(href && cn("relative hover:bg-surface-2", ABOVE_STRETCHED_LINK), cards && CARD_ROW)}
      >
        {selectable && (
          <TableCell className={cn(cards && "max-md:p-0")}>
            <Checkbox
              className="gap-0 align-middle"
              // Named "Select row" + the first cell, so each checkbox says which row it selects.
              aria-labelledby={`${uid}s${i} ${uid}c${i}`}
              label={
                <span id={`${uid}s${i}`} className="sr-only">
                  {s.selectRow}
                </span>
              }
              checked={isSelected}
              onCheckedChange={(v) => select(v === true ? [...chosen, id] : chosen.filter((x) => x !== id))}
            />
          </TableCell>
        )}
        {withActions(
          columns.map((c, k) => {
            const value = c.cell ? c.cell(row) : (field(row, c.key) as ReactNode);
            return (
              <TableCell
                key={c.key}
                id={k === 0 ? `${uid}c${i}` : undefined}
                align={c.align}
                className={cn(cards && (k === 0 ? "max-md:min-w-0 max-md:flex-1 max-md:p-0 max-md:font-medium" : CARD_FIELD), cards && c.hideOnCard && "max-md:hidden")}
              >
                {k === 0 && href ? (
                  // -outline-offset keeps the row's focus ring inside the table's scroll box.
                  <L href={href} data-stretched="" className={cn(STRETCHED_LINK, "focus-visible:after:-outline-offset-2", cards && "max-md:after:rounded-card")}>
                    {value}
                  </L>
                ) : cards && k > 0 ? (
                  <>
                    <span className="text-xs text-fg-3 md:hidden">{c.header}</span>
                    <span>{value}</span>
                  </>
                ) : (
                  value
                )}
              </TableCell>
            );
          }),
          () => (
            <TableCell key={ACTIONS_KEY} className={cn("w-10 py-1.5", cards && "max-md:p-0")}>
              {actions.length > 0 && (
                <DropdownMenu
                  align="end"
                  items={actions}
                  trigger={
                    // Named "Row actions" + the first cell, like the select checkbox.
                    <button type="button" aria-labelledby={`${uid}a${i} ${uid}c${i}`} className={buttonClass("ghost", "sm", true)}>
                      <span id={`${uid}a${i}`} className="sr-only">
                        {s.rowActions}
                      </span>
                      <Ellipsis aria-hidden />
                    </button>
                  }
                />
              )}
            </TableCell>
          ),
        )}
      </TableRow>
    );
  };

  // The total and subtotal rows: values under their columns (hidden columns hide theirs); the first column shows the label unless it has a value.
  const totalRow = (values: Partial<Record<string, ReactNode>>, label: string) => (
    <TableRow className="font-semibold">
      {selectable && <TableCell />}
      {withActions(
        columns.map((c, k) => (
          <TableCell key={c.key} align={c.align}>
            {values[c.key] ?? (k === 0 ? t(label) : null)}
          </TableCell>
        )),
        () => <TableCell key={ACTIONS_KEY} />,
      )}
    </TableRow>
  );

  return (
    <div className={className}>
      <Table
        caption={caption}
        hideCaption={hideCaption}
        aria-busy={loading || undefined}
        className={cn(cards && "max-md:[&>table]:block", stickyHeader && "max-h-[70dvh] overflow-auto")}
      >
        {/* z-sticky: above the row controls that sit over a row link (z-1). */}
        <TableHeader className={cn(stickyHeader && "sticky top-0 z-(--p-z-sticky) bg-bg", cards && "max-md:sr-only") || undefined}>
          <TableRow>
            {selectable && (
              <TableHead className="w-10">
                <Checkbox
                  className="gap-0 align-middle"
                  label={<span className="sr-only">{s.selectAll}</span>}
                  checked={all}
                  disabled={loading || ids.length === 0}
                  onCheckedChange={(v) => select(v === true ? [...new Set([...chosen, ...ids])] : chosen.filter((id) => !ids.includes(id)))}
                />
              </TableHead>
            )}
            {withActions(
              columns.map((c) => {
                const active = order?.key === c.key ? order.direction : undefined;
                const Icon = active === "asc" ? ArrowUp : active === "desc" ? ArrowDown : ChevronsUpDown;
                return (
                  <TableHead
                    key={c.key}
                    align={c.align}
                    style={c.width ? { width: c.width } : undefined}
                    aria-sort={active === "asc" ? "ascending" : active === "desc" ? "descending" : undefined}
                  >
                    {c.sortable ? (
                      <button type="button" onClick={() => toggleSort(c.key)} className="-mx-1 inline-flex items-center gap-1 rounded-md px-1 transition-colors hover:text-fg">
                        {c.header}
                        <Icon aria-hidden className={cn("size-3.5 shrink-0", !active && "opacity-50")} />
                      </button>
                    ) : (
                      c.header
                    )}
                  </TableHead>
                );
              }),
              () => (
                <TableHead key={ACTIONS_KEY} className="w-10">
                  <span className="sr-only">{s.rowActions}</span>
                </TableHead>
              ),
            )}
          </TableRow>
        </TableHeader>
        {groups && !loading && visible.length > 0 ? (
          [...groups].map(([key, members], g) => (
            <TableBody key={key} className={bodyClass}>
              <TableRow>
                <TableHead scope="rowgroup" colSpan={colSpan} className="bg-surface text-sm text-fg">
                  {groupHeader ? groupHeader(key, members) : key}
                </TableHead>
              </TableRow>
              {members.map((row, i) => renderRow(row, `${g}-${i}`))}
              {groupTotals && totalRow(groupTotals(key, members), s.subtotal)}
            </TableBody>
          ))
        ) : (
          <TableBody className={bodyClass}>
            {loading ? (
              Array.from({ length: pageSize ?? (rows.length || 5) }, (_, i) => (
                <TableRow key={i} className={cn(cards && CARD_ROW)}>
                  {selectable && <TableCell className={cn(cards && "max-md:hidden")} />}
                  {withActions(
                    columns.map((c) => (
                      <TableCell key={c.key} className={cn(cards && "max-md:basis-full max-md:p-0")}>
                        <Skeleton className="h-4" />
                      </TableCell>
                    )),
                    () => <TableCell key={ACTIONS_KEY} className={cn(cards && "max-md:hidden")} />,
                  )}
                </TableRow>
              ))
            ) : visible.length === 0 ? (
              <TableRow className={cn(cards && "max-md:block")}>
                <TableCell colSpan={colSpan} className={cn(cards && "max-md:block")}>
                  {empty ?? <EmptyState title={t(s.noResults)} className="border-0" />}
                </TableCell>
              </TableRow>
            ) : (
              visible.map((row, i) => renderRow(row, i))
            )}
          </TableBody>
        )}
        {totals && <tfoot className="border-t border-line-strong [&_tr]:border-0">{totalRow(totals, s.total)}</tfoot>}
      </Table>
      <LiveRegion>{loading && s.loading}</LiveRegion>
      {(selectable || pages > 1 || pageSizeOptions) && (
        <div className="flex flex-wrap items-center gap-3 pt-4">
          {selectable && (
            <p role="status" className="text-sm text-fg-2">
              {chosen.length > 0 && t(s.selectedCount(chosen.length))}
            </p>
          )}
          {pages > 1 && <Pagination page={current} total={pages} onPageChange={goTo} className="ms-auto" />}
          {pageSizeOptions && (
            <div className={cn("flex items-center gap-2", pages <= 1 && "ms-auto")}>
              <label htmlFor={`${uid}p`} className="text-sm text-fg-2">
                {t(s.rowsPerPage)}
              </label>
              <Select
                id={`${uid}p`}
                className="h-(--p-control-h-sm) w-20"
                options={pageSizeOptions.map((n) => ({ value: String(n), label: String(n) }))}
                value={pageSize === undefined ? undefined : String(pageSize)}
                onValueChange={(v) => {
                  onPageSizeChange?.(Number(v));
                  goTo(1);
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
