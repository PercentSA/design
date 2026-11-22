"use client";

import { createContext, useContext, useCallback, useEffect, useId, useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "../lib/cn";
import { useSlidingIndicator } from "../lib/sliding-indicator";
import { useDir, useLinkComponent, useStrings, type LinkComponent } from "../provider";
import { Badge } from "./feedback";
import { Tooltip } from "./overlays";

export type SidebarItem = {
  /** Unique within the sidebar: it keys the saved fold state of a group. Without it the item is a plain row: not a link, never current, no children; for a status such as loading text. */
  href?: string;
  label: ReactNode;
  icon?: ReactNode;
  badge?: ReactNode;
  current?: boolean;
  /**
   * Links that fold under this item. The item stays a link to its own `href`; a chevron button beside it folds the children.
   * One level only: the children of a child are not shown. The icon rail shows no children.
   */
  children?: SidebarItem[];
  /** Open at first. `true` opens it even when no child is current; `false` keeps it folded even when the current page is inside. Without it the item opens at first when it or a child is `current`. */
  defaultOpen?: boolean;
  /** A dot at the row end (the rail: on the icon). `statusLabel` names it for screen readers and shows as a tooltip. */
  status?: "danger" | "warning";
  statusLabel?: string;
};
type Folds = Record<string, { open: boolean; cur?: string }>;
type OnFold = (href: string, open: boolean, cur?: string) => void;

export type SidebarSection = {
  title?: ReactNode;
  items: SidebarItem[];
  /** The title folds the items (expanded sidebar and phone sheet; the rail never folds). Needs `title`. */
  collapsible?: boolean;
  /** Open at first, before a stored choice. Without it the section starts open only when the current page is inside. */
  defaultOpen?: boolean;
  /** Shown on the title while the section is folded. */
  badge?: ReactNode;
  /** Keeps the fold in the browser (localStorage `p-sidebar-section:<id>`). Without it the choice is kept in memory only. */
  id?: string;
};

/** True when AppShell shows the sidebar in its phone sheet: always expanded, no collapse toggle. */
export const SidebarInSheet = createContext(false);

const SidebarRail = createContext(false);

/** True while the sidebar shows as an icon rail. False when it is expanded and in the phone sheet. For the parts in `header` and `footer`. */
export const useSidebarRail = () => useContext(SidebarRail);

const ITEM =
  "relative flex h-9 items-center gap-3 rounded-field px-3 text-sm text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg aria-[current=page]:bg-surface-2 aria-[current=page]:font-medium aria-[current=page]:text-fg [&_svg]:size-4 [&_svg]:shrink-0";

const PLAIN = "relative flex h-9 items-center gap-3 rounded-field px-3 text-sm text-fg-3 [&_svg]:size-4 [&_svg]:shrink-0";

const DOT = { danger: "bg-danger", warning: "bg-warning" };

function StatusText({ item }: { item: SidebarItem }) {
  return item.statusLabel ? <span className="sr-only">{item.statusLabel}</span> : null;
}

// An expanded row's dot sits before the badge; in the rail it sits on the icon in place of the badge dot.
function statusDot(item: SidebarItem, collapsed: boolean) {
  if (!item.status) return null;
  return <span aria-hidden className={cn("size-2 shrink-0 rounded-pill", DOT[item.status], collapsed && "absolute end-2.5 top-1.5")} />;
}

// The status label shows as a tooltip on an expanded row; the rail's tooltip adds it to the label.
function withStatusTip(link: ReactNode, item: SidebarItem, tipSide: "left" | "right") {
  return item.status && item.statusLabel ? (
    <Tooltip content={item.statusLabel} side={tipSide}>
      {link}
    </Tooltip>
  ) : (
    link
  );
}

// A plain function, not a component: the rail's Tooltip needs the link element itself to pass its trigger props to.
function itemLink(L: LinkComponent | "a", item: SidebarItem, collapsed: boolean, slid: boolean, grow?: boolean, childCurrent?: boolean) {
  if (item.href == null) {
    // A plain row: same box as a link row, but no link, no hover, never current.
    return (
      <div className={cn(PLAIN, collapsed && "justify-center px-0", grow && "min-w-0 flex-1")}>
        {item.icon}
        <span className={cn(collapsed ? "sr-only" : "min-w-0 flex-1 truncate")}>{item.label}</span>
        <StatusText item={item} />
        {statusDot(item, collapsed)}
        {item.badge != null && <Badge className={cn("h-5 px-2", collapsed && "sr-only")}>{item.badge}</Badge>}
      </div>
    );
  }
  return (
    <L
      href={item.href}
      aria-current={item.current ? "page" : undefined}
      // A folded group (or the rail) with the current page inside looks selected; only the link to the page itself has aria-current.
      data-has-current={childCurrent || undefined}
      className={cn(ITEM, childCurrent && "bg-surface-2 font-medium text-fg", slid && "aria-[current=page]:bg-transparent", collapsed && "justify-center px-0", grow && "min-w-0 flex-1")}
    >
      {item.icon}
      <span className={cn(collapsed ? "sr-only" : "min-w-0 flex-1 truncate")}>{item.label}</span>
      <StatusText item={item} />
      {statusDot(item, collapsed)}
      {item.badge != null && <Badge className={cn("h-5 px-2", collapsed && "sr-only")}>{item.badge}</Badge>}
      {item.badge != null && collapsed && !item.status && <span aria-hidden className="absolute end-2.5 top-1.5 size-1.5 rounded-pill bg-fg" />}
    </L>
  );
}

/** An item with children (expanded sidebar only): its link, a disclosure button, and the folded list. */
function Group({ L, item, slid, folds, onFold }: { L: LinkComponent | "a"; item: SidebarItem; slid: boolean; folds: Folds; onFold: OnFold }) {
  const s = useStrings();
  const id = useId();
  const tipSide = useDir() === "rtl" ? "left" : "right";
  const href = item.href!;
  const kids = item.children!;
  const childCurrent = kids.some((k) => k.current);
  const cur = item.current ? href : kids.find((k) => k.current)?.href;
  const [open, setOpen] = useState(folds[href]?.open ?? item.defaultOpen ?? !!cur);
  // Starts from the page the group saw last, so a page change that happened while the sidebar was a rail opens it on expand.
  const [seen, setSeen] = useState(href in folds ? folds[href].cur : cur);
  // The current page changes into a group: open it. A fold by the user stays until the current page changes again.
  if (cur !== seen) {
    setSeen(cur);
    if (cur) setOpen(true);
  }
  // Keep the choice above the group, so it survives a switch to the rail and back.
  useEffect(() => onFold(href, open, cur), [open, cur, href, onFold]);
  const name = typeof item.label === "string" ? item.label : "";
  return (
    <>
      <div className="flex items-center gap-0.5">
        {withStatusTip(itemLink(L, item, false, slid, true, childCurrent && !open), item, tipSide)}
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          aria-label={open ? s.hideSubItems(name) : s.showSubItems(name)}
          onClick={() => setOpen(!open)}
          className="flex size-9 shrink-0 items-center justify-center rounded-field text-fg-3 transition-colors hover:bg-surface-2 hover:text-fg [&_svg]:size-4"
        >
          {open ? <ChevronDown aria-hidden /> : <ChevronRight aria-hidden className="rtl:-scale-x-100" />}
        </button>
      </div>
      <ul id={id} hidden={!open} className={cn("ms-7 gap-0.5", open ? "grid" : "hidden")}>
        {kids.map((kid, i) => (
          <li key={kid.href ?? `plain-${i}`} className="flex">
            {withStatusTip(itemLink(L, kid, false, slid, true), kid, tipSide)}
          </li>
        ))}
      </ul>
    </>
  );
}

function Section({ section, collapsed, slid, folds, onFold }: { section: SidebarSection; collapsed: boolean; slid: boolean; folds: Folds; onFold: OnFold }) {
  const L = useLinkComponent();
  const id = useId();
  const listId = useId();
  const tipSide = useDir() === "rtl" ? "left" : "right";
  const foldable = !!section.collapsible && !!section.title;
  const folds_ = foldable && !collapsed;
  const hasCurrent = section.items.some((i) => i.current || i.children?.some((k) => k.current));
  const key = section.id ? `p-sidebar-section:${section.id}` : null;
  const [open, setOpen] = useState(hasCurrent || !!section.defaultOpen);
  const [seen, setSeen] = useState(hasCurrent);
  // The current page moves into a folded section: open it, without a stored choice. A fold by the user stays until the page changes again.
  if (hasCurrent !== seen) {
    setSeen(hasCurrent);
    if (hasCurrent) setOpen(true);
  }
  // The stored choice is read after mount, so the server and the first client render match. The current page inside wins.
  useEffect(() => {
    if (!foldable || !key || hasCurrent) return;
    try {
      const v = localStorage.getItem(key);
      if (v === "1" || v === "0") setOpen(v === "1");
    } catch {
      // Storage refused: keep the default fold.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only at mount (and a new id)
  }, [key]);
  const press = () => {
    setOpen(!open);
    if (key)
      try {
        localStorage.setItem(key, open ? "0" : "1");
      } catch {
        // Storage refused: the fold still works in memory.
      }
  };
  const shut = folds_ && !open;
  return (
    <div className="grid gap-1">
      {section.title && (
        <h2 id={id} className={cn("label px-3 pt-2 pb-1", folds_ && "px-1", collapsed && "sr-only")}>
          {folds_ ? (
            <button
              type="button"
              aria-expanded={open}
              aria-controls={listId}
              onClick={press}
              className="flex min-h-6 w-full items-center gap-2 rounded-field px-2 text-start transition-colors hover:text-fg [&_svg]:size-4 [&_svg]:shrink-0"
            >
              <span className="min-w-0 flex-1 truncate">{section.title}</span>
              {shut && section.badge != null && <Badge className="h-5 px-2">{section.badge}</Badge>}
              {open ? <ChevronDown aria-hidden /> : <ChevronRight aria-hidden className="rtl:-scale-x-100" />}
            </button>
          ) : (
            section.title
          )}
        </h2>
      )}
      <ul id={folds_ ? listId : undefined} hidden={shut || undefined} aria-labelledby={section.title ? id : undefined} className={cn("grid gap-0.5", shut && "hidden")}>
        {section.items.map((item, i) => {
          const key = item.href ?? `plain-${i}`;
          if (!collapsed && item.href != null && item.children?.length) {
            return (
              <li key={key}>
                <Group L={L} item={item} slid={slid} folds={folds} onFold={onFold} />
              </li>
            );
          }
          const link = itemLink(L, item, collapsed, slid, false, collapsed && item.href != null && !!item.children?.some((k) => k.current));
          return (
            <li key={key}>
              {collapsed ? (
                <Tooltip content={item.status && item.statusLabel ? <>{item.label} · {item.statusLabel}</> : item.label} side={tipSide}>
                  {link}
                </Tooltip>
              ) : (
                withStatusTip(link, item, tipSide)
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ToggleButton({ rail, showLabel, tipSide, onClick }: { rail: boolean; showLabel: boolean; tipSide: "left" | "right"; onClick: () => void }) {
  const s = useStrings();
  const Icon = rail ? PanelLeftOpen : PanelLeftClose;
  const words = rail ? s.expandSidebar : s.collapseSidebar;
  const withText = !rail && showLabel;
  const [tip, setTip] = useState(false);
  const button = (
    <button type="button" aria-expanded={!rail} aria-label={words} onClick={onClick} className={cn(ITEM, "shrink-0 text-fg-3", rail && "justify-center px-0")}>
      <Icon aria-hidden className="rtl:-scale-x-100" />
      {withText && <span className="min-w-0 flex-1 truncate text-start">{words}</span>}
    </button>
  );
  // One tree in both states, so the button keeps focus when it toggles; with the text shown there is no tooltip.
  return (
    <Tooltip content={words} side={tipSide} open={withText ? false : tip} onOpenChange={(open) => setTip(!withText && open)}>
      {button}
    </Tooltip>
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
  toggleLabel = true,
  className,
}: {
  sections: SidebarSection[];
  header?: ReactNode;
  footer?: ReactNode;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Name of the navigation; default the "Menu" string. */
  label?: string;
  /** Show the words "Collapse sidebar" beside the toggle icon while expanded (default). `false`: icon only. The rail always shows the icon only, with the words as tooltip. */
  toggleLabel?: boolean;
  className?: string;
}) {
  const s = useStrings();
  const tipSide = useDir() === "rtl" ? "left" : "right";
  const inSheet = useContext(SidebarInSheet);
  const [own, setOwn] = useState(false);
  const rail = !inSheet && (collapsed ?? own);
  const toggle = () => {
    setOwn(!rail);
    onCollapsedChange?.(!rail);
  };
  const [folds, setFolds] = useState<Folds>({});
  const onFold = useCallback<OnFold>((href, open, cur) => setFolds((f) => (f[href]?.open === open && f[href].cur === cur ? f : { ...f, [href]: { open, cur } })), []);
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
          <Section key={i} section={section} collapsed={rail} slid={!!mark} folds={folds} onFold={onFold} />
        ))}
      </nav>
      {footer && <div className="shrink-0 overflow-hidden"><SidebarRail.Provider value={rail}>{footer}</SidebarRail.Provider></div>}
      {!inSheet && <ToggleButton rail={rail} showLabel={toggleLabel} tipSide={tipSide} onClick={toggle} />}
    </div>
  );
}
