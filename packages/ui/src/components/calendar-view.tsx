"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../lib/cn";
import { useLang, useStrings, useText } from "../provider";
import { fromPlain, monthGrid, monthOf, partsOf, shiftView, todayPlain, viewLabel, weekdayNames, type MonthView, type PlainDate } from "../saudi/calendar";
import { formatDate, type CalendarKind } from "../saudi/date";
import { Button } from "./actions";
import { Popover } from "./overlays";

export type CalendarEvent = { id: string; title: string; start: PlainDate; end?: PlainDate; tone?: "default" | "muted" };

const MAX = 3;
const TONE = { default: "border-fg bg-surface-2 text-fg", muted: "border-line-strong text-fg-2" } as const;

function EventBar({ event, onClick }: { event: CalendarEvent; onClick?: (event: CalendarEvent) => void }) {
  const cls = cn("block w-full truncate rounded-e-md border-s-2 px-1.5 py-0.5 text-start text-xs", TONE[event.tone ?? "default"]);
  return onClick ? (
    <button
      type="button"
      data-event
      title={event.title}
      onClick={() => onClick(event)}
      className={cn(cls, "pointer-events-auto transition-colors hover:border-fg hover:bg-surface focus-visible:outline-offset-0")}
    >
      {event.title}
    </button>
  ) : (
    <span data-event title={event.title} className={cls}>
      {event.title}
    </span>
  );
}

const EventList = ({ events, onClick }: { events: CalendarEvent[]; onClick?: (event: CalendarEvent) => void }) => (
  <ul className="grid gap-0.5">
    {events.map((e) => (
      <li key={e.id} className="min-w-0">
        <EventBar event={e} onClick={onClick} />
      </li>
    ))}
  </ul>
);

/**
 * Month of events in the Gregorian or Hijri (Umm al-Qura) calendar. Up to 3 events per day, the rest
 * in a "N more" popover; multi-day events show on each day. Below 768 px: a list of the days with events.
 */
export function CalendarView({
  events,
  month,
  defaultMonth,
  onMonthChange,
  calendar,
  weekStart = 0,
  onDayClick,
  onEventClick,
  className,
}: {
  events: CalendarEvent[];
  month?: MonthView;
  defaultMonth?: MonthView;
  onMonthChange?: (month: MonthView) => void;
  /** Default: the calendar of the month shown. */
  calendar?: CalendarKind;
  /** 0 = Sunday (Saudi default). */
  weekStart?: number;
  onDayClick?: (day: PlainDate) => void;
  onEventClick?: (event: CalendarEvent) => void;
  className?: string;
}) {
  const lang = useLang();
  const s = useStrings();
  const t = useText();
  const today = useMemo(todayPlain, []);
  const [inner, setInner] = useState(() => defaultMonth ?? monthOf(today, calendar ?? "gregorian"));
  const view = month ?? inner;
  const grid = useMemo(() => {
    // A `calendar` that differs from the month's: show the month that holds the middle of it.
    const v = calendar && calendar !== view.calendar ? monthOf(monthGrid(view).days[14]!, calendar) : view;
    return { view: v, ...monthGrid(v, weekStart) };
  }, [view.calendar, view.year, view.month, calendar, weekStart]);
  const shown = grid.view;
  const other: CalendarKind = shown.calendar === "hijri" ? "gregorian" : "hijri";
  const names = weekdayNames(lang, weekStart);
  const dateOf = (d: PlainDate) => formatDate(fromPlain(d), { lang, calendar: shown.calendar });
  const on = (d: PlainDate) => events.filter((e) => e.start <= d && d <= (e.end ?? e.start));
  const go = (m: MonthView) => {
    setInner(m);
    onMonthChange?.(m);
  };

  return (
    <div className={cn("grid gap-4 text-fg", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="text-lg font-medium">
          {viewLabel(shown, lang)}
        </p>
        <div className="flex items-center gap-1">
          <Button variant="secondary" size="sm" onClick={() => go(monthOf(today, shown.calendar))}>
            {t(s.today)}
          </Button>
          <Button variant="ghost" size="sm" iconOnly aria-label={s.previousMonth} onClick={() => go(shiftView(shown, -1))}>
            <ChevronLeft aria-hidden className="rtl:-scale-x-100" />
          </Button>
          <Button variant="ghost" size="sm" iconOnly aria-label={s.nextMonth} onClick={() => go(shiftView(shown, 1))}>
            <ChevronRight aria-hidden className="rtl:-scale-x-100" />
          </Button>
        </div>
      </div>

      <div className="hidden overflow-hidden rounded-card border border-line bg-bg md:block">
        <table className="w-full table-fixed border-collapse">
          <thead>
            <tr>
              {names.map((w) => (
                <th key={w.long} scope="col" abbr={w.long} className="py-2 text-xs font-normal text-fg-3">
                  {w.short}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.weeks.map((week) => (
              <tr key={week[0]}>
                {week.map((d) => {
                  const cell = "h-28 border-s border-t border-line p-1 align-top first:border-s-0";
                  if (!grid.days.includes(d)) return <td key={d} data-day={d} className={cell} />;
                  const list = on(d);
                  return (
                    <td key={d} data-day={d} aria-current={d === today ? "date" : undefined} className={cn(cell, "relative")}>
                      {onDayClick && (
                        <button
                          type="button"
                          aria-label={dateOf(d)}
                          onClick={() => onDayClick(d)}
                          className="absolute inset-0 transition-colors hover:bg-surface focus-visible:-outline-offset-2"
                        />
                      )}
                      <div className={cn("relative grid gap-1", onDayClick && "pointer-events-none")}>
                        <div aria-hidden className="flex items-center justify-between ps-0.5 pe-1">
                          <span data-number className={cn("grid size-6 place-items-center rounded-pill text-sm tabular-nums", d === today && "ring-1 ring-line-strong")}>
                            {partsOf(d, shown.calendar).day}
                          </span>
                          <span className="text-[10px] text-fg-3 tabular-nums">{partsOf(d, other).day}</span>
                        </div>
                        {!onDayClick && <span className="sr-only">{dateOf(d)}</span>}
                        <EventList events={list.slice(0, MAX)} onClick={onEventClick} />
                        {list.length > MAX && (
                          <Popover
                            trigger={
                              <button
                                type="button"
                                className="pointer-events-auto w-full truncate rounded-md px-1.5 text-start text-xs text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-offset-0"
                              >
                                {t(s.moreEvents(list.length - MAX))}
                              </button>
                            }
                          >
                            <p className="mb-2 text-xs text-fg-3">{dateOf(d)}</p>
                            <EventList events={list} onClick={onEventClick} />
                          </Popover>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ol className="grid gap-4 md:hidden">
        {grid.days.map((d) => {
          const list = on(d);
          if (!list.length) return null;
          const label = (
            <>
              <span className="text-fg-3">{names[(fromPlain(d).getUTCDay() - weekStart + 7) % 7]!.long}</span> {dateOf(d)}
            </>
          );
          return (
            <li key={d} data-day={d} className="grid gap-2 border-t border-line pt-3">
              {onDayClick ? (
                <button type="button" onClick={() => onDayClick(d)} className="justify-self-start text-sm font-medium hover:underline">
                  {label}
                </button>
              ) : (
                <p className="text-sm font-medium">{label}</p>
              )}
              <EventList events={list} onClick={onEventClick} />
            </li>
          );
        })}
      </ol>
      {!grid.days.some((d) => on(d).length) && <p className="text-sm text-fg-3 md:hidden">{t(s.noResults)}</p>}
    </div>
  );
}
