"use client";

import { useEffect, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../lib/cn";
import { useSlidingIndicator } from "../lib/sliding-indicator";
import { useLinkComponent, useStrings, useText } from "../provider";
import { TAB_BASE } from "./tab-classes";
import { Badge } from "./feedback";
import { DropdownMenu } from "./menus";

export type RouteTab = { value: string; label: ReactNode; href: string; count?: number };

const PHONE_TABS = 3;
const TAB = "inline-flex items-center gap-2 aria-[current=page]:text-fg";

/**
 * Tabs that are links: one page for each tab. The current link has `aria-current="page"`.
 * Below 768 px three tabs stay in the row (the current one always among them); the others go into "More".
 */
export function RouteTabs({ label, items, current, className }: { label: string; items: RouteTab[]; current: string; className?: string }) {
  const L = useLinkComponent();
  const s = useStrings();
  const t = useText();
  // After the first measure one underline slides between the tabs; before it, the current tab draws its own.
  const [listRef, line] = useSlidingIndicator<HTMLElement>("aria-current", "page");
  const at = items.findIndex((i) => i.value === current);
  // The first three, or the first two and the current one.
  const phone = new Set(items.slice(0, at >= PHONE_TABS ? PHONE_TABS - 1 : PHONE_TABS).map((i) => i.value));
  if (at >= PHONE_TABS) phone.add(current);
  const rest = items.filter((i) => !phone.has(i.value));
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
      // The line is an inset shadow, so the current tab's border covers it without reaching outside the scrolling row.
      className={cn("relative isolate flex min-w-0 gap-6 overflow-x-auto shadow-[inset_0_-1px_0_var(--p-line)]", className)}
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
