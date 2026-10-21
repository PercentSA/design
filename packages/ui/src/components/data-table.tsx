import { useId, useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cn } from "../lib/cn";
import { useLang, useStrings, useText } from "../provider";
import { Checkbox } from "./choices";
import { EmptyState, Skeleton } from "./feedback";
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
  className?: string;
};

const field = (row: unknown, key: string) => (row as Record<string, unknown>)[key];

/** A table with sorting, row selection, pages, loading and empty states. Client-side by default; server-side with `pageCount`. */
export function DataTable<Row>({
  columns,
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
  className,
}: DataTableProps<Row>) {
  const s = useStrings();
  const t = useText();
  const lang = useLang();
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

  const sortColumn = columns.find((c) => c.key === order?.key);
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

  const pages = server ? pageCount : pageSize ? Math.ceil(sorted.length / pageSize) : 1;
  const current = Math.max(1, Math.min(page ?? innerPage, pages));
  const visible = !server && pageSize ? sorted.slice((current - 1) * pageSize, current * pageSize) : sorted;
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

  const colSpan = columns.length + (selectable ? 1 : 0);
  return (
    <div className={className}>
      <Table caption={caption} hideCaption={hideCaption} aria-busy={loading || undefined}>
        <TableHeader>
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
            {columns.map((c) => {
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
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: pageSize ?? (rows.length || 5) }, (_, i) => (
              <TableRow key={i}>
                {selectable && <TableCell />}
                {columns.map((c) => (
                  <TableCell key={c.key}>
                    <Skeleton className="h-4" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : visible.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan}>{empty ?? <EmptyState title={t(s.noResults)} className="border-0" />}</TableCell>
            </TableRow>
          ) : (
            visible.map((row, i) => {
              const id = getRowId(row);
              const isSelected = chosenSet.has(id);
              return (
                <TableRow key={id} data-state={isSelected ? "selected" : undefined}>
                  {selectable && (
                    <TableCell>
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
                  {columns.map((c, k) => (
                    <TableCell key={c.key} id={k === 0 ? `${uid}c${i}` : undefined} align={c.align}>
                      {c.cell ? c.cell(row) : (field(row, c.key) as ReactNode)}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
      <LiveRegion>{loading && s.loading}</LiveRegion>
      {(selectable || pages > 1) && (
        <div className="flex flex-wrap items-center gap-3 pt-4">
          {selectable && (
            <p role="status" className="text-sm text-fg-2">
              {chosen.length > 0 && t(s.selectedCount(chosen.length))}
            </p>
          )}
          {pages > 1 && <Pagination page={current} total={pages} onPageChange={goTo} className="ms-auto" />}
        </div>
      )}
    </div>
  );
}
