"use client";

import { useId, useState, type ReactNode } from "react";
import { ArrowLeft, ChevronDown, Ellipsis } from "lucide-react";
import { cn } from "../lib/cn";
import { useLinkComponent, useStrings, useText } from "../provider";
import { buttonClass } from "./button-class";
import { DropdownMenu, type MenuItem } from "./menus";
import type { Crumb } from "./navigation";

const isDanger = (item: MenuItem) => typeof item === "object" && "label" in item && !!item.danger;

// Danger items go last, after a separator, in the "⋯" menu and in the phone panel.
function dangerLast(items: MenuItem[]): MenuItem[] {
  const rest = items.filter((i) => !isDanger(i));
  const danger = items.filter(isDanger);
  while (rest.at(-1) === "separator") rest.pop();
  return rest.length && danger.length ? [...rest, "separator", ...danger] : [...rest, ...danger];
}

const PANEL_ITEM =
  "flex min-h-11 w-full items-center gap-2 rounded-field border border-line-strong px-4 py-2 text-start text-sm text-fg-2 transition-colors hover:border-fg-3 hover:text-fg disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0";

/** The menu items as full-width buttons and links, for the phone panel. */
function PanelItems({ items, onDone }: { items: MenuItem[]; onDone: () => void }) {
  const L = useLinkComponent();
  const s = useStrings();
  const id = useId();
  return (
    <div className="grid gap-2 md:hidden">
      {items.map((item, i) => {
        if (item === "separator") return <hr key={i} className="border-line" />;
        if ("heading" in item)
          return (
            <p key={i} className="px-1 pt-1 text-xs text-fg-3">
              {item.heading}
            </p>
          );
        const describedBy = item.description ? `${id}${i}` : undefined;
        const content = (
          <>
            {item.icon}
            <span className="flex-1">
              {item.label}
              {/* Kept out of the item's name; aria-describedby reads it as the description. */}
              {item.description && (
                <span id={describedBy} aria-hidden="true" className="block text-xs text-fg-3">
                  {item.description}
                </span>
              )}
            </span>
          </>
        );
        const className = cn(PANEL_ITEM, item.danger && "text-danger hover:text-danger");
        // A disabled link item renders as a disabled button: nothing to follow.
        if (item.href && !item.disabled)
          return (
            <L key={i} href={item.href} target={item.target} rel={item.target === "_blank" ? "noopener noreferrer" : undefined} aria-describedby={describedBy} onClick={onDone} className={className}>
              {content}
              {item.target === "_blank" && <span className="sr-only"> {s.newTab}</span>}
            </L>
          );
        return (
          <button
            key={i}
            type="button"
            disabled={item.disabled}
            aria-describedby={describedBy}
            onClick={() => {
              onDone();
              item.onSelect?.();
            }}
            className={className}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}

/**
 * The top of a list or record page: the title with status badges, a meta line, a back link to the list (ERP pages go
 * list → record, so no breadcrumb trail), one primary action, secondary actions and a "⋯" menu. From 768 px the
 * actions sit at the end; below it the primary is full width and "More actions" opens the rest. `secondary` renders
 * once and is only hidden by CSS, so dialogs inside it stay mounted. `sticky`: from 768 px it stays under the
 * AppShell header (`--p-sticky-top`).
 */
export function PageHeader({
  title,
  headingLevel = 1,
  description,
  badges,
  meta,
  back,
  primary,
  secondary,
  menu,
  sticky,
  className,
}: {
  title: ReactNode;
  headingLevel?: 1 | 2;
  description?: ReactNode;
  badges?: ReactNode;
  meta?: ReactNode;
  /** A link above the title, back to the list. */
  back?: Crumb;
  /** The one primary action of the view. */
  primary?: ReactNode;
  /** Secondary buttons; they may hold their own dialogs. */
  secondary?: ReactNode;
  /** The "⋯" menu. Danger items go last. */
  menu?: MenuItem[];
  sticky?: boolean;
  className?: string;
}) {
  const s = useStrings();
  const t = useText();
  const L = useLinkComponent();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const items = dangerLast(menu ?? []);
  const more = !!secondary || items.length > 0;
  const H = `h${headingLevel}` as const;
  return (
    <div
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-6",
        sticky && "md:sticky md:top-(--p-sticky-top,0px) md:z-(--p-z-sticky) md:bg-bg md:py-3",
        className,
      )}
    >
      <div className="grid min-w-0 gap-1.5">
        {back?.href && (
          <L href={back.href} className="inline-flex w-fit items-center gap-1.5 text-sm text-fg-3 transition-colors hover:text-fg">
            <ArrowLeft aria-hidden className="size-4 rtl:-scale-x-100" />
            {back.label}
          </L>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <H className="heading text-2xl">{title}</H>
          {badges}
        </div>
        {description && <p className="text-sm text-fg-2">{description}</p>}
        {meta && <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-fg-3">{meta}</div>}
      </div>
      {(primary || more) && (
        // One order at every width (primary, secondary, "⋯"), so the visual order is the focus order (WCAG 2.4.3).
        <div className="flex shrink-0 flex-col gap-2 md:flex-row md:items-center">
          {primary && <div className="grid md:flex">{primary}</div>}
          {more && (
            <button
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpen((o) => !o)}
              className={cn(buttonClass("secondary"), "w-full md:hidden")}
            >
              {t(s.moreActions)}
              <ChevronDown aria-hidden className={cn("transition-transform motion-reduce:transition-none", open && "rotate-180")} />
            </button>
          )}
          {more && (
            <div id={panelId} className={cn(open ? "flex" : "hidden", "flex-col gap-2 md:flex md:flex-row md:items-center max-md:[&>*]:w-full")}>
              {secondary}
              {items.length > 0 && <PanelItems items={items} onDone={() => setOpen(false)} />}
            </div>
          )}
          {items.length > 0 && (
            <DropdownMenu
              align="end"
              items={items}
              trigger={
                <button type="button" aria-label={s.moreActions} className={cn(buttonClass("secondary", "md", true), "hidden md:inline-flex")}>
                  <Ellipsis aria-hidden />
                </button>
              }
            />
          )}
        </div>
      )}
    </div>
  );
}
