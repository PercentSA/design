"use client";

import { useId, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "../lib/cn";
import { useLinkComponent } from "../provider";
import { Badge } from "./feedback";

export type SideNavItem = { href: string; label: ReactNode; description?: ReactNode; icon?: ReactNode; current?: boolean; badge?: ReactNode };
export type SideNavGroup = { label?: ReactNode; items: SideNavItem[] };

// Same tokens as the Sidebar item; a label wraps (min height, not a fixed one).
const ROW =
  "flex items-center gap-3 text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg aria-[current=page]:bg-surface-2 aria-[current=page]:font-medium aria-[current=page]:text-fg [&_svg]:size-4 [&_svg]:shrink-0";

function Group({ group, list }: { group: SideNavGroup; list: boolean }) {
  const L = useLinkComponent();
  const id = useId();
  return (
    <div className="grid gap-1">
      {group.label && (
        <h2 id={id} className={cn("label pt-2 pb-1", list ? "px-1" : "px-3")}>
          {group.label}
        </h2>
      )}
      <ul aria-labelledby={group.label ? id : undefined} className={list ? "divide-y divide-line overflow-hidden rounded-card border border-line bg-surface" : "grid gap-0.5"}>
        {group.items.map((item) => (
          <li key={item.href}>
            <L
              href={item.href}
              aria-current={item.current ? "page" : undefined}
              className={cn(ROW, list ? "min-h-14 gap-4 px-4 py-3 text-base" : "min-h-9 rounded-field px-3 py-2 text-sm")}
            >
              {item.icon != null && <span aria-hidden className="contents">{item.icon}</span>}
              <span className="min-w-0 flex-1">
                <span className="block break-words">{item.label}</span>
                {list && item.description != null && <span className="mt-0.5 block text-sm font-normal text-fg-3">{item.description}</span>}
              </span>
              {item.badge != null && <Badge className="h-5 px-2">{item.badge}</Badge>}
              {list && <ChevronRight aria-hidden className="text-fg-3 rtl:-scale-x-100" />}
            </L>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * In-page navigation for an area with many sections (a settings area): groups of router links, a heading per group.
 * `column` (default) is the compact column next to the content; it fills its box, so the app sets the width.
 * `sticky` keeps it in view while the page scrolls, under the AppShell header (`--p-sticky-top`); it scrolls on its own when taller than the screen.
 * `list` is the same groups as a full-width list with each `description` and a chevron: the area's home on a phone.
 */
export function SideNav({
  groups,
  label,
  sticky,
  variant = "column",
  className,
}: {
  groups: SideNavGroup[];
  /** Name of the navigation for screen readers. */
  label: string;
  sticky?: boolean;
  variant?: "column" | "list";
  className?: string;
}) {
  const list = variant === "list";
  return (
    <nav
      aria-label={label}
      className={cn(
        "grid content-start gap-4",
        sticky && !list && "sticky top-(--p-sticky-top,0px) max-h-[calc(100dvh-var(--p-sticky-top,0px))] self-start overflow-y-auto",
        className,
      )}
    >
      {groups.map((group, i) => (
        <Group key={i} group={group} list={list} />
      ))}
    </nav>
  );
}
