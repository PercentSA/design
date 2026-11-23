"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../lib/cn";
import { useSlidingIndicator } from "../lib/sliding-indicator";
import { useLinkComponent, useStrings, useText } from "../provider";
import { TAB_BASE, TAB_ROW } from "./tab-classes";
import { Badge } from "./feedback";
import { DropdownMenu } from "./menus";

export type RouteTab = { value: string; label: ReactNode; href: string; count?: number };

const PHONE_TABS = 3;
const TAB = "inline-flex items-center gap-2 aria-[current=page]:text-fg";

/**
 * Tabs that are links: one page for each tab. The current link has `aria-current="page"`.
 * Below 768 px the tabs that fit stay in the row, in list order, and the current one is always among them; the others go into "More".
 * Before the first measure (and on the server) three tabs stay in the row.
 */
export function RouteTabs({ label, items, current, className }: { label: string; items: RouteTab[]; current: string; className?: string }) {
  const L = useLinkComponent();
  const s = useStrings();
  const t = useText();
  // After the first measure one underline slides between the tabs; before it, the current tab draws its own.
  const [listRef, line] = useSlidingIndicator<HTMLElement>("aria-current", "page");
  const measure = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<string[]>();
  const at = items.findIndex((i) => i.value === current);
  // The first three, or the first two and the current one.
  const phone = new Set(fit ?? items.slice(0, at >= PHONE_TABS ? PHONE_TABS - 1 : PHONE_TABS).map((i) => i.value));
  if (!fit && at >= PHONE_TABS) phone.add(current);
  const rest = items.filter((i) => !phone.has(i.value));
  // Measure the row and the natural width of every tab (hidden measure row); keep the most tabs that fit with More.
  useEffect(() => {
    const nav = listRef.current;
    const box = measure.current;
    if (!nav || !box) return;
    const run = () => {
      const width = nav.getBoundingClientRect().width;
      const w = (v: string) => box.querySelector(`[data-measure="${v}"]`)?.getBoundingClientRect().width ?? 0;
      const sizes = items.map((i) => w(i.value));
      const more = w("more");
      // No layout (server-like environment, hidden row): keep the three-tab rule.
      if (!width || !more || sizes.some((x) => !x)) return setFit(undefined);
      const GAP = 24; // gap-6
      const cur = items.findIndex((i) => i.value === current);
      for (let k = items.length; k >= 0; k--) {
        // The first k tabs; the current one takes the place of the last fitted tab when it is not among them.
        const idx = items.map((_, n) => n).slice(0, k);
        if (cur >= 0 && !idx.includes(cur)) {
          if (idx.length) idx[idx.length - 1] = cur;
          else idx.push(cur);
        }
        const rest = items.length > idx.length;
        const total = idx.reduce((a, n) => a + sizes[n]! + GAP, -GAP) + (rest ? more + GAP : 0);
        if (total <= width || k === 0) {
          const next = idx.map((n) => items[n]!.value);
          return setFit((f) => (f && f.length === next.length && f.every((v, n) => v === next[n]) ? f : next));
        }
      }
    };
    run();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(run);
    ro.observe(nav);
    return () => ro.disconnect();
  }, [items, current, listRef]);
  useEffect(() => {
    // Scroll only the row: scrollIntoView would also scroll the window.
    const nav = listRef.current;
    const a = nav?.querySelector('[aria-current="page"]');
    if (!nav || !a) return;
    const n = nav.getBoundingClientRect();
    const r = a.getBoundingClientRect();
    // A physical difference is correct in RTL too.
    nav.scrollLeft += Math.min(0, r.left - n.left) || Math.max(0, r.right - n.right);
  }, [current, listRef]);
  return (
    <nav
      ref={listRef}
      aria-label={label}
      // The line is a background, so the current tab's border covers it without reaching outside the scrolling row.
      className={cn(TAB_ROW, "min-w-0", className)}
    >
      {line && <span {...line} className={cn(line.className, "border-b-2 border-primary")} />}
      {items.map((i) => (
        <L
          key={i.value}
          href={i.href}
          aria-current={i.value === current ? "page" : undefined}
          className={cn(TAB_BASE, TAB, !line && "aria-[current=page]:border-primary", !phone.has(i.value) && "max-md:hidden")}
        >
          {i.label}
          {i.count !== undefined && (
            <Badge className="h-5 px-2">
              {i.count}
            </Badge>
          )}
        </L>
      ))}
      {/* Natural widths of all tabs and of More, for the fit. No size, no output, no focus. */}
      <div ref={measure} aria-hidden inert className="pointer-events-none invisible absolute start-0 top-0 flex h-0 w-0 gap-6 overflow-hidden">
        {items.map((i) => (
          <span key={i.value} data-measure={i.value} className={cn(TAB_BASE, TAB, "shrink-0")}>
            {i.label}
            {i.count !== undefined && <Badge className="h-5 px-2">{i.count}</Badge>}
          </span>
        ))}
        <span data-measure="more" className={cn(TAB_BASE, TAB, "shrink-0")}>
          {t(s.more)}
          <ChevronDown aria-hidden className="size-4" />
        </span>
      </div>
      {rest.length > 0 && (
        <DropdownMenu
          trigger={
            <button type="button" className={cn(TAB_BASE, TAB, "md:hidden")}>
              {t(s.more)}
              <ChevronDown aria-hidden className="size-4" />
            </button>
          }
          items={rest.map((i) => ({ label: i.label, href: i.href }))}
          align="end"
        />
      )}
    </nav>
  );
}
