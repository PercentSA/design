"use client";

import { createContext, useContext, useId, useState, type ReactNode } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "../lib/cn";
import { useSlidingIndicator } from "../lib/sliding-indicator";
import { useDir, useLinkComponent, useStrings } from "../provider";
import { Badge } from "./feedback";
import { Tooltip } from "./overlays";

export type SidebarItem = { href: string; label: ReactNode; icon?: ReactNode; badge?: ReactNode; current?: boolean };
export type SidebarSection = { title?: ReactNode; items: SidebarItem[] };

/** True when AppShell shows the sidebar in its phone sheet: always expanded, no collapse toggle. */
export const SidebarInSheet = createContext(false);

const SidebarRail = createContext(false);

/** True while the sidebar shows as an icon rail. False when it is expanded and in the phone sheet. For the parts in `header` and `footer`. */
export const useSidebarRail = () => useContext(SidebarRail);

const ITEM =
  "relative flex h-9 items-center gap-3 rounded-field px-3 text-sm text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg aria-[current=page]:bg-surface-2 aria-[current=page]:font-medium aria-[current=page]:text-fg [&_svg]:size-4 [&_svg]:shrink-0";

function Section({ section, collapsed, slid }: { section: SidebarSection; collapsed: boolean; slid: boolean }) {
  const L = useLinkComponent();
  const id = useId();
  const tipSide = useDir() === "rtl" ? "left" : "right";
  return (
    <div className="grid gap-1">
      {section.title && (
        <h2 id={id} className={cn("label px-3 pt-2 pb-1", collapsed && "sr-only")}>
          {section.title}
        </h2>
      )}
      <ul aria-labelledby={section.title ? id : undefined} className="grid gap-0.5">
        {section.items.map((item) => {
          const link = (
            <L
              href={item.href}
              aria-current={item.current ? "page" : undefined}
              className={cn(ITEM, slid && "aria-[current=page]:bg-transparent", collapsed && "justify-center px-0")}
            >
              {item.icon}
              <span className={cn(collapsed ? "sr-only" : "min-w-0 flex-1 truncate")}>{item.label}</span>
              {item.badge != null && <Badge className={cn("h-5 px-2", collapsed && "sr-only")}>{item.badge}</Badge>}
              {item.badge != null && collapsed && <span aria-hidden className="absolute end-2.5 top-1.5 size-1.5 rounded-pill bg-fg" />}
            </L>
          );
          return (
            <li key={item.href}>
              {collapsed ? (
                <Tooltip content={item.label} side={tipSide}>
                  {link}
                </Tooltip>
              ) : (
                link
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * App navigation: sections of router links with icons and badges, a brand `header` and a `footer` (user menu).
 * Collapsed, it is an icon rail with tooltips; give every item an icon. Without `collapsed` it keeps its own state.
 */
export function Sidebar({
  sections,
  header,
  footer,
  collapsed,
  onCollapsedChange,
  label,
  className,
}: {
  sections: SidebarSection[];
  header?: ReactNode;
  footer?: ReactNode;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Name of the navigation; default the "Menu" string. */
  label?: string;
  className?: string;
}) {
  const s = useStrings();
  const inSheet = useContext(SidebarInSheet);
  const [own, setOwn] = useState(false);
  const rail = !inSheet && (collapsed ?? own);
  const toggle = () => {
    setOwn(!rail);
    onCollapsedChange?.(!rail);
  };
  const Icon = rail ? PanelLeftOpen : PanelLeftClose;
  // After the first measure one background slides to the current item; before it, the item draws its own.
  const [navRef, mark] = useSlidingIndicator<HTMLElement>("aria-current", "page");
  return (
    <div
      data-collapsed={rail || undefined}
      className={cn(
        "flex h-full flex-col gap-4 bg-surface p-3 transition-[width] duration-(--p-duration-base) motion-reduce:transition-none",
        inSheet ? "w-full" : cn("border-e border-line", rail ? "w-16" : "w-64"),
        className,
      )}
    >
      {header && <div className="flex min-h-10 shrink-0 items-center overflow-hidden px-1"><SidebarRail.Provider value={rail}>{header}</SidebarRail.Provider></div>}
      <nav ref={navRef} aria-label={label ?? s.menu} className="relative isolate -mx-3 grid flex-1 content-start gap-4 overflow-x-hidden overflow-y-auto px-3">
        {mark && <span {...mark} className={cn(mark.className, "rounded-field bg-surface-2")} />}
        {sections.map((section, i) => (
          <Section key={i} section={section} collapsed={rail} slid={!!mark} />
        ))}
      </nav>
      {footer && <div className="shrink-0 overflow-hidden"><SidebarRail.Provider value={rail}>{footer}</SidebarRail.Provider></div>}
      {!inSheet && (
        <button
          type="button"
          aria-expanded={!rail}
          aria-label={rail ? s.expandSidebar : s.collapseSidebar}
          onClick={toggle}
          className={cn(ITEM, "shrink-0 text-fg-3", rail && "justify-center px-0")}
        >
          <Icon aria-hidden className="rtl:-scale-x-100" />
        </button>
      )}
    </div>
  );
}
