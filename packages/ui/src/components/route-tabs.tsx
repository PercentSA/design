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
type Fit = { key: string; width: number; gap: number; more: number; sizes: number[] };

/** The values in the row: the most tabs, in list order, that fit with More. The current tab takes the place of the last fitted one. */
function fitValues(items: RouteTab[], current: string, f: Fit) {
  const cur = items.findIndex((i) => i.value === current);
  for (let k = items.length; k >= 0; k--) {
    const idx = items.map((_, n) => n).slice(0, k);
    if (cur >= 0 && !idx.includes(cur)) {
      if (idx.length) idx[idx.length - 1] = cur;
      else idx.push(cur);
    }
    const rest = items.length > idx.length;
    const total = idx.reduce((a, n) => a + f.sizes[n]! + f.gap, -f.gap) + (rest ? f.more + f.gap : 0);
    if (total <= f.width || k === 0) return idx.map((n) => items[n]!.value);
  }
  return [];
}

const px = (v: string) => parseFloat(v) || 0;
const same = (a: Fit | undefined, b: Fit) =>
  !!a && a.key === b.key && a.width === b.width && a.gap === b.gap && a.more === b.more && a.sizes.every((x, n) => x === b.sizes[n]);

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
  const wrap = useRef<HTMLDivElement>(null);
  const measure = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<Fit>();
  // The measure row exists only on the client below 768 px, so the server HTML and the desktop DOM have each label once.
  const [measuring, setMeasuring] = useState(false);
  // A stable key from the values only: a parent that builds `items` in each render does not restart the observer, and a new count or label keeps the fit (the observer on the measure spans re-fits it).
  const key = items.map((i) => i.value).join("\u0001");
  const at = items.findIndex((i) => i.value === current);
  const measured = fit?.key === key ? fit : undefined;
  // The first three, or the first two and the current one, until the first measure. After it, the measured widths and the current tab decide in this render.
  const phone = new Set(measured ? fitValues(items, current, measured) : items.slice(0, at >= PHONE_TABS ? PHONE_TABS - 1 : PHONE_TABS).map((i) => i.value));
  if (!measured && at >= PHONE_TABS) phone.add(current);
  const rest = items.filter((i) => !phone.has(i.value));
  useEffect(() => {
    if (typeof matchMedia === "undefined") return setMeasuring(true);
    const mq = matchMedia("(width < 48rem)");
    const on = () => setMeasuring(mq.matches);
    on();
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  // Measure the content width of the wrapper and the natural width of every tab and of More.
  useEffect(() => {
    const el = wrap.current;
    const nav = listRef.current;
    const box = measure.current;
    if (!measuring || !el || !nav || !box) return;
    const run = () => {
      const w = (v: string) => box.querySelector(`[data-measure="${v}"]`)?.getBoundingClientRect().width ?? 0;
      const sizes = items.map((i) => w(i.value));
      const more = w("more");
      const cs = getComputedStyle(el);
      const width = el.getBoundingClientRect().width - px(cs.paddingLeft) - px(cs.paddingRight) - px(cs.borderLeftWidth) - px(cs.borderRightWidth);
      const gap = parseFloat(getComputedStyle(nav).columnGap);
      // No layout (hidden row, test DOM): keep the three-tab rule.
      if (width <= 0 || !more || sizes.some((x) => !x)) return setFit(undefined);
      const next = { key, width, gap: Number.isNaN(gap) ? 24 : gap, more, sizes };
      setFit((f) => (same(f, next) ? f : next));
    };
    if (typeof ResizeObserver === "undefined") return run();
    const ro = new ResizeObserver(run);
    ro.observe(el);
    box.querySelectorAll("[data-measure]").forEach((m) => ro.observe(m));
    return () => ro.disconnect();
    // `items` is read through `key`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, measuring, listRef]);
  useEffect(() => {
    // Scroll only the row: scrollIntoView would also scroll the window. `measuring` is a dependency: a resize to a wide screen shows all tabs again.
    const nav = listRef.current;
    const a = nav?.querySelector('[aria-current="page"]');
    if (!nav || !a) return;
    const n = nav.getBoundingClientRect();
    const r = a.getBoundingClientRect();
    // A physical difference is correct in RTL too.
    nav.scrollLeft += Math.min(0, r.left - n.left) || Math.max(0, r.right - n.right);
  }, [current, listRef, measuring]);
  return (
    <div ref={wrap} data-route-tabs className={cn("relative w-full min-w-0", className)}>
      <nav
        ref={listRef}
        aria-label={label}
        // The line is a background, so the current tab's border covers it without reaching outside the scrolling row.
        className={TAB_ROW}
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
            {i.count !== undefined && <Badge className="h-5 px-2">{i.count}</Badge>}
          </L>
        ))}
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
      {/* Natural widths of all tabs and of More, for the fit. No size, no output, no focus. */}
      {measuring && (
        <div ref={measure} aria-hidden inert className="pointer-events-none invisible absolute start-0 top-0 flex h-0 w-0 gap-4 overflow-hidden">
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
      )}
    </div>
  );
}
