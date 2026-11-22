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
  if (items.length === 0) return <>{empty ?? <EmptyState variant="plain" title={s.noItems} />}</>;
  const levels = { critical: s.levelCritical, important: s.levelImportant, other: s.levelOther };
  const areaLine = (i: AttentionItem, age: ReactNode) => {
    const parts = [i.area, i.context, age].filter(Boolean);
    return parts.map((p, n) => (
      <span key={n}>
        {n > 0 && " · "}
        {p}
      </span>
    ));
  };
  return (
    <ul aria-label={label} className={cn("divide-y divide-line border-y border-line", className)}>
      {items.map((i, n) =>
        compact ? (
          <li key={i.id} className="grid gap-0.5 py-2">
            <div className="flex items-center gap-2">
              <StatusDot status={DOT[i.level]}>
                <span className="sr-only">{levels[i.level]}</span>
              </StatusDot>
              <L href={i.href} className="min-w-0 font-medium">
                {i.title}
              </L>
            </div>
            <p className="ps-4 text-xs text-fg-3">{areaLine({ ...i, context: undefined }, <TimeText value={i.openedAt} ago interactive={false} />)}</p>
          </li>
        ) : (
          <li key={i.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-1.5 py-3 md:grid-cols-[6.5rem_minmax(0,1fr)_7.5rem_auto_auto]">
            <div className="order-1 md:order-1">
              <StatusBadge tone={TONE[i.level]}>{levels[i.level]}</StatusBadge>
            </div>
            <div className="order-3 col-span-2 grid gap-0.5 md:order-2 md:col-span-1">
              <L id={`${uid}t${n}`} href={i.href} className="w-fit font-medium">
                {i.title}
              </L>
              {i.detail && <p className="text-sm text-fg-2">{i.detail}</p>}
              {(i.area || i.context) && <p className="text-xs text-fg-3">{areaLine(i, null)}</p>}
            </div>
            {/* On a phone the age and the menu share line 1; from 768 px they are grid cells of the row. */}
            <div className="order-2 flex items-center justify-self-end md:contents">
              <div className="pt-0.5 text-sm text-fg-3 md:order-3 md:pt-0.5">
                <TimeText value={i.openedAt} ago />
              </div>
              {i.menu && i.menu.length > 0 && (
                <div className="md:order-5">
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
            </div>
            {i.action && <div className="order-4 max-md:col-span-2 md:order-4 md:justify-self-end">{i.action}</div>}
          </li>
        ),
      )}
    </ul>
  );
}
