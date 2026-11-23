"use client";

import { useId, type ReactNode } from "react";
import { Ellipsis } from "lucide-react";
import { cn } from "../lib/cn";
import { useLinkComponent, useStrings } from "../provider";
import type { DateInput } from "../saudi/date-time";
import { buttonClass } from "./button-class";
import { EmptyState, StatusBadge, StatusDot } from "./feedback";
import { DropdownMenu, type MenuItem } from "./menus";
import { TimeText } from "./time-text";

export type AttentionItem = {
  id: string;
  level: "critical" | "important" | "other";
  title: ReactNode;
  href: string;
  detail?: ReactNode;
  area?: ReactNode;
  /** Client or project links, shown after the area. */
  context?: ReactNode;
  openedAt: DateInput;
  /** The one next action, for example a button. */
  action?: ReactNode;
  menu?: MenuItem[];
};

const TONE = { critical: "danger", important: "warning", other: "neutral" } as const;
const DOT = { critical: "danger", important: "warning", other: "idle" } as const;

/**
 * The items that need a person, for example open alerts: level, title link, area, age and one next action.
 * The caller sorts the items and drops the fixed ones. `compact` is the short form for a popover.
 */
export function AttentionList({
  label,
  items,
  compact = false,
  empty,
  className,
}: {
  label: string;
  items: AttentionItem[];
  compact?: boolean;
  empty?: ReactNode;
  className?: string;
}) {
  const s = useStrings();
  const L = useLinkComponent();
  const uid = useId();
  if (items.length === 0) return <div className={className}>{empty ?? <EmptyState variant="plain" title={s.noItems} />}</div>;
  const levels = { critical: s.levelCritical, important: s.levelImportant, other: s.levelOther };
  const joined = (parts: ReactNode[]) =>
    parts
      .filter(Boolean)
      .map((p, n) => (
        <span key={n}>
          {n > 0 && " · "}
          {p}
        </span>
      ));
  return (
    <ul aria-label={label} className={cn("divide-y divide-line border-y border-line", !compact && "md:grid md:grid-cols-[6.5rem_minmax(0,1fr)_7.5rem_auto_auto] md:gap-x-4", className)}>
      {items.map((i, n) =>
        compact ? (
          <li key={i.id} className="grid gap-0.5 py-2">
            <div className="flex items-center gap-2">
              <StatusDot status={DOT[i.level]} />
              <L href={i.href} className="min-w-0 font-medium">
                {i.title}
              </L>
            </div>
            {/* The level is a word too: the dots differ by colour only. */}
            <p className="ps-4 text-xs text-fg-3">{joined([levels[i.level], i.area, <TimeText key="t" value={i.openedAt} ago interactive={false} />])}</p>
          </li>
        ) : (
          // DOM order = tab order = desktop order. The phone places line 1 (level, age, menu; centred for a 44 px menu button), the main block, then the action.
          <li key={i.id} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-start gap-x-4 gap-y-1.5 py-3 md:col-span-full md:grid-cols-subgrid">
            <div className="max-md:col-start-1 max-md:row-start-1 max-md:self-center md:col-start-1">
              <StatusBadge tone={TONE[i.level]}>{levels[i.level]}</StatusBadge>
            </div>
            <div className="grid gap-0.5 max-md:col-span-3 max-md:row-start-2 md:col-start-2">
              <L id={`${uid}t${n}`} href={i.href} className="w-fit font-medium">
                {i.title}
              </L>
              {i.detail && <p className="text-sm text-fg-2">{i.detail}</p>}
              {(i.area || i.context) && <p className="text-xs text-fg-3">{joined([i.area, i.context])}</p>}
            </div>
            {/* Without a menu the age takes the empty menu column too, so it ends at the row end. */}
            <div className={cn("text-sm text-fg-3 max-md:col-start-2 max-md:row-start-1 max-md:self-center max-md:justify-self-end md:col-start-3 md:pt-0.5", !i.menu?.length && "max-md:col-span-2")}>
              <TimeText value={i.openedAt} ago />
            </div>
            {i.action && <div className="max-md:col-span-3 max-md:row-start-3 max-md:justify-self-stretch max-md:*:w-full md:col-start-4 md:justify-self-end">{i.action}</div>}
            {i.menu && i.menu.length > 0 && (
              <div className="max-md:col-start-3 max-md:row-start-1 max-md:self-center md:col-start-5">
                <DropdownMenu
                  align="end"
                  items={i.menu}
                  trigger={
                    // Named "More actions" + the title, like the DataTable row menu.
                    <button type="button" aria-labelledby={`${uid}m${n} ${uid}t${n}`} className={buttonClass("ghost", "sm", true)}>
                      <span id={`${uid}m${n}`} className="sr-only">
                        {s.moreActions}
                      </span>
                      <Ellipsis aria-hidden />
                    </button>
                  }
                />
              </div>
            )}
          </li>
        ),
      )}
    </ul>
  );
}
