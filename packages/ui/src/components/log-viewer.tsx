"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { cn } from "../lib/cn";
import { useStrings } from "../provider";
import { Button } from "./actions";
import { Skeleton } from "./feedback";
import { Input } from "./inputs";
import { ContextMenu } from "./menus";

// shortcut: no virtual list; fine up to about 2,000 rows (the app limit is 1,000); add one if a view needs more.

export type LogRow = { key: string; text: string; at?: string; source?: string; error?: boolean };
export type LogLive = "on" | "paused" | "off";
export type LogViewerProps = {
  label: string;
  /** Oldest first. */
  rows: LogRow[];
  live: LogLive;
  onLiveChange: (live: "on" | "paused") => void;
  /** Text to mark: plain, not case sensitive. */
  search?: string;
  /** Given: the viewer shows its own search field. */
  onSearchChange?: (text: string) => void;
  /** A row key: the row scrolls into view and is marked. */
  jumpTo?: string;
  empty: ReactNode;
  loading?: boolean;
  /** The start of the toolbar, announced politely. */
  status?: ReactNode;
  /** CSS height of the box. */
  height?: string;
  className?: string;
};

const atEndOf = (b: HTMLElement) => b.scrollHeight - b.scrollTop - b.clientHeight < 24;
const rowKey = (t: EventTarget) => (t as HTMLElement).closest<HTMLElement>("[data-key]")?.dataset.key;
const escapeRe = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Log lines with time, source and text. While `live` is on, it follows new lines only when the reader is at the end. */
export function LogViewer({ label, rows, live, onLiveChange, search, onSearchChange, jumpTo, empty, loading, status, height = "60dvh", className }: LogViewerProps) {
  const s = useStrings();
  const box = useRef<HTMLDivElement>(null);
  const items = useRef(new Map<string, HTMLLIElement>());
  const copyKey = useRef<string>(undefined);
  const atEnd = useRef(true); // set by the box scroll event and after each rows change and jump
  const prevQ = useRef(search ?? ""); // a search given at mount does not scroll
  const started = useRef(false);
  const [away, setAway] = useState(false);
  const [cur, setCur] = useState<string>();

  const toEnd = () => {
    if (!box.current) return;
    box.current.scrollTop = box.current.scrollHeight;
    atEnd.current = true;
  };

  useLayoutEffect(() => {
    const first = !started.current && rows.length > 0;
    if (first) started.current = true;
    if ((first && jumpTo === undefined) || (!first && live === "on" && atEnd.current)) toEnd();
    if (box.current) {
      atEnd.current = atEndOf(box.current);
      setAway(!atEnd.current);
    }
    // Follows new rows only; `live` and `jumpTo` are read when the rows change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  const jumpFound = jumpTo !== undefined && rows.some((r) => r.key === jumpTo);
  useLayoutEffect(() => {
    if (!jumpFound) return;
    items.current.get(jumpTo)?.scrollIntoView?.({ block: "start" });
    if (box.current) atEnd.current = atEndOf(box.current);
  }, [jumpTo, jumpFound]);

  const re = search ? new RegExp(`(${escapeRe(search)})`, "gi") : undefined;
  const matches = re ? rows.filter((r) => r.text.split(re).length > 1).map((r) => r.key) : [];
  const idx = Math.max(0, matches.indexOf(cur ?? ""));
  const current = matches[idx];
  const go = (delta: number) => {
    const n = matches.length;
    if (!n) return;
    const key = matches[(idx + delta + n) % n]!;
    setCur(key);
    items.current.get(key)?.scrollIntoView?.({ block: "center" });
  };

  // A new search starts at its first match.
  useLayoutEffect(() => {
    const q = search ?? "";
    if (q === prevQ.current) return;
    prevQ.current = q;
    setCur(undefined);
    if (matches[0]) items.current.get(matches[0])?.scrollIntoView?.({ block: "center" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const parts = (text: string, isCurrent: boolean) =>
    re
      ? text.split(re).map((t, i) =>
          i % 2 ? (
            <mark key={i} className={cn("rounded-sm text-inherit", isCurrent ? "bg-primary text-primary-fg" : "bg-fg/20")}>
              {t}
            </mark>
          ) : (
            t
          ),
        )
      : text;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <div role="status" className="me-auto text-sm text-fg-2">
          {status}
        </div>
        {onSearchChange && (
          <Input
            start={<Search aria-hidden="true" />}
            aria-label={s.logSearch}
            value={search ?? ""}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                go(e.shiftKey ? -1 : 1);
              } else if (e.key === "Escape") onSearchChange("");
            }}
            className="w-56"
          />
        )}
        <span aria-live="polite" className="text-xs text-fg-2 tabular-nums">
          {re && (matches.length ? s.logMatch(idx + 1, matches.length) : s.logNoMatch)}
        </span>
        {re && (
          <>
            <Button variant="ghost" size="sm" iconOnly aria-label={s.logPreviousMatch} disabled={!matches.length} onClick={() => go(-1)}>
              <ChevronUp aria-hidden="true" />
            </Button>
            <Button variant="ghost" size="sm" iconOnly aria-label={s.logNextMatch} disabled={!matches.length} onClick={() => go(1)}>
              <ChevronDown aria-hidden="true" />
            </Button>
          </>
        )}
        {live !== "off" && (
          <Button variant="secondary" size="sm" onClick={() => onLiveChange(live === "on" ? "paused" : "on")}>
            {live === "on" ? s.pause : s.logResume}
          </Button>
        )}
        {away && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              toEnd();
              setAway(false);
              box.current?.focus(); // the button removes itself; keep focus in the log
            }}
          >
            {s.logJumpToNewest}
          </Button>
        )}
      </div>
      <div
        ref={box}
        role="region"
        aria-label={label}
        aria-busy={loading || undefined}
        tabIndex={0}
        style={{ height }}
        onScroll={(e) => {
          atEnd.current = atEndOf(e.currentTarget);
          setAway(!atEnd.current);
        }}
        className="overflow-y-auto rounded-card border border-line bg-surface py-2 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-fg"
      >
        {loading ? (
          <div className="flex flex-col gap-2 px-3">
            {["w-full", "w-4/5", "w-11/12", "w-3/5", "w-full", "w-2/5"].map((w, i) => (
              <Skeleton key={i} className={cn("h-4", w)} />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="px-3">{empty}</div>
        ) : (
          <ContextMenu
            items={[
              {
                label: s.logCopyLine,
                onSelect: () => {
                  const r = rows.find((x) => x.key === copyKey.current);
                  if (r) navigator.clipboard?.writeText(r.text).catch(() => {}); // no clipboard on http pages or without permission
                },
              },
            ]}
          >
            <ol
              className="grid grid-cols-[auto_1fr] md:grid-cols-[auto_9rem_1fr]"
              // iOS opens the menu from a long press and sends no contextmenu event, so the row is also read at pointer down.
              onPointerDown={(e) => (copyKey.current = rowKey(e.target))}
              onContextMenu={(e) => (copyKey.current = rowKey(e.target) ?? copyKey.current)}
            >
              {rows.map((r) => (
                <li
                  key={r.key}
                  ref={(el) => {
                    if (el) items.current.set(r.key, el);
                    else items.current.delete(r.key);
                  }}
                  data-key={r.key}
                  data-jumped={r.key === jumpTo ? "" : undefined}
                  aria-current={r.key === current ? "true" : undefined}
                  className={cn(
                    "col-span-full grid grid-cols-subgrid gap-x-3 border-s-2 border-transparent px-3 py-0.5 font-mono text-[13px] leading-6",
                    "data-jumped:bg-surface-2",
                    r.error && "border-danger",
                  )}
                >
                  {r.error && <span className="sr-only">{s.logError}</span>}
                  <span dir="ltr" className="text-fg-3 tabular-nums">
                    {r.at}
                  </span>
                  <span className="truncate text-fg-3 max-md:hidden">{r.source}</span>
                  <span dir="ltr" className="min-w-0 text-start break-words whitespace-pre-wrap text-fg">
                    {r.source && <span className="text-fg-3 md:hidden">{r.source} · </span>}
                    {parts(r.text, r.key === current)}
                  </span>
                </li>
              ))}
            </ol>
          </ContextMenu>
        )}
      </div>
    </div>
  );
}
