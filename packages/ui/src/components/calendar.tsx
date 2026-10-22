"use client";

import { useEffect, useId, useMemo, useRef, useState, type ComponentProps } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Popover } from "radix-ui";
import { cn } from "../lib/cn";
import { useDir, useLang, useStrings, useText } from "../provider";
import {
  fromPlain,
  monthGrid,
  monthOf,
  moveFocus,
  nextRange,
  partsOf,
  rangePreset,
  shiftView,
  todayPlain,
  viewLabel,
  weekdayNames,
  type DateRange,
  type DateRangePresetId,
  type PlainDate,
} from "../saudi/calendar";
import { formatDate, type CalendarKind } from "../saudi/date";
import { formatDateTime } from "../saudi/date-time";
import { SegmentedControl } from "./actions";
import { useFieldControl, useFieldLabelId } from "./field";
import { TEXT_BOX } from "./input-classes";

const NAV_BTN = "grid size-9 place-items-center rounded-pill text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg [&_svg]:size-4";

type CalendarBase = {
  /** Controlled calendar; leave out to let the person switch with the built-in control. */
  calendar?: CalendarKind;
  defaultCalendar?: CalendarKind;
  onCalendarChange?: (calendar: CalendarKind) => void;
  /** Hide the Gregorian/Hijri switch. */
  fixedCalendar?: boolean;
  min?: PlainDate;
  max?: PlainDate;
  /** 0 = Sunday (Saudi default). */
  weekStart?: number;
  className?: string;
};
type CalendarProps = CalendarBase & { value: PlainDate | null; onValueChange: (day: PlainDate) => void };
type RangeCalendarProps = CalendarBase & { mode: "range"; value: DateRange; onValueChange: (range: DateRange) => void };

/**
 * Month grid in the Gregorian or Hijri (Umm al-Qura) calendar. Each day also shows its number in
 * the other calendar. Keyboard: arrows, Home/End, PageUp/PageDown (Shift: a year).
 * `mode="range"`: `value` is a DateRange; the first chosen day sets `from`, the second `to` (see nextRange).
 */
export function Calendar(props: (CalendarProps & { mode?: "single" }) | RangeCalendarProps) {
  const { calendar: calendarProp, defaultCalendar = "gregorian", onCalendarChange, fixedCalendar, min, max, weekStart = 0, className } = props;
  const range = props.mode === "range" ? props.value : null;
  // The day the calendar shows and focuses first: the chosen day, or the start of the range.
  const value = props.mode === "range" ? (props.value.from ?? props.value.to) : props.value;
  const choose = (d: PlainDate) => (props.mode === "range" ? props.onValueChange(nextRange(props.value, d)) : props.onValueChange(d));
  const lo = range?.from ?? range?.to;
  const hi = range?.to ?? range?.from;
  const selected = (d: PlainDate) => (range ? !!lo && !!hi && d >= lo && d <= hi : d === value);
  const isEnd = (d: PlainDate) => (range ? d === range.from || d === range.to : d === value);
  // A band behind the days of a closed range; at the two ends it fills only the half towards the other end.
  const band = (d: PlainDate) =>
    range?.from && range.to && range.from !== range.to && d >= range.from && d <= range.to
      ? d === range.from
        ? "from-transparent from-50% to-fg/10 to-50% ltr:bg-linear-to-r rtl:bg-linear-to-l"
        : d === range.to
          ? "from-transparent from-50% to-fg/10 to-50% ltr:bg-linear-to-l rtl:bg-linear-to-r"
          : "bg-fg/10"
      : undefined;
  const lang = useLang();
  const rtl = useDir() === "rtl";
  const s = useStrings();
  const [calendarInner, setCalendarInner] = useState(defaultCalendar);
  const calendar = calendarProp ?? calendarInner;
  const other: CalendarKind = calendar === "hijri" ? "gregorian" : "hijri";
  const today = useMemo(todayPlain, []);
  const outOfRange = (d: PlainDate) => (min !== undefined && d < min) || (max !== undefined && d > max);
  // Start on a day that can be chosen: a disabled button cannot take focus.
  const clamp = (d: PlainDate) => (min !== undefined && d < min ? min : max !== undefined && d > max ? max : d);
  const [focus, setFocus] = useState(() => clamp(value ?? today));
  const [view, setView] = useState(() => monthOf(focus, calendar));
  const grid = useMemo(() => monthGrid(view, weekStart), [view.calendar, view.year, view.month, weekStart]);
  const table = useRef<HTMLTableElement>(null);
  const fromKeyboard = useRef(false);

  useEffect(() => {
    if (view.calendar !== calendar) setView(monthOf(focus, calendar));
  }, [calendar]);
  // A new value from outside shows its month. Only on a value change, so the month buttons keep working.
  useEffect(() => {
    if (value === null) return;
    const d = clamp(value);
    setFocus(d);
    if (!inView(d)) setView(monthOf(d, calendar));
  }, [value]);
  useEffect(() => {
    if (!fromKeyboard.current) return;
    fromKeyboard.current = false;
    table.current?.querySelector<HTMLElement>(`[data-day="${focus}"]`)?.focus();
  }, [focus, grid]);

  const inView = (d: PlainDate) => grid.days.includes(d);
  // The focusable day: the focused day when it is in this month, else the first day that can be chosen.
  const tabDay = inView(focus) && !outOfRange(focus) ? focus : (grid.days.find((d) => !outOfRange(d)) ?? grid.days[0]);
  const go = (d: PlainDate) => {
    if (outOfRange(d)) return;
    fromKeyboard.current = true;
    setFocus(d);
    if (!inView(d)) setView(monthOf(d, calendar));
  };
  const switchCalendar = (c: CalendarKind) => {
    setCalendarInner(c);
    onCalendarChange?.(c);
  };

  return (
    <div className={cn("grid w-fit gap-3 rounded-card border border-line bg-surface p-4 text-fg", className)}>
      <div className="flex items-center justify-between gap-2">
        <button type="button" className={NAV_BTN} aria-label={s.previousMonth} onClick={() => setView(shiftView(view, -1))}>
          <ChevronLeft aria-hidden className="rtl:-scale-x-100" />
        </button>
        <p aria-live="polite" className="text-sm font-medium">
          {viewLabel(view, lang)}
        </p>
        <button type="button" className={NAV_BTN} aria-label={s.nextMonth} onClick={() => setView(shiftView(view, 1))}>
          <ChevronRight aria-hidden className="rtl:-scale-x-100" />
        </button>
      </div>
      <table
        ref={table}
        role="grid"
        aria-label={viewLabel(view, lang)}
        aria-multiselectable={range ? true : undefined}
        className="border-collapse"
        onKeyDown={(e) => {
          const next = moveFocus(focus, e.key, { calendar, rtl, weekStart, shift: e.shiftKey });
          if (next === focus) return;
          e.preventDefault();
          go(next);
        }}
      >
        <thead>
          <tr>
            {weekdayNames(lang, weekStart).map((w) => (
              <th key={w.long} scope="col" abbr={w.long} className="pb-2 text-xs font-normal text-fg-3">
                {w.short}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.weeks.map((week) => (
            <tr key={week[0]}>
              {week.map((d) =>
                inView(d) ? (
                  <td key={d} role="gridcell" aria-selected={selected(d)} className={cn("p-0.5 text-center", band(d))}>
                    <button
                      type="button"
                      data-day={d}
                      tabIndex={d === tabDay ? 0 : -1}
                      disabled={outOfRange(d)}
                      aria-current={d === today ? "date" : undefined}
                      aria-label={formatDate(fromPlain(d), { lang, calendar })}
                      // Keys move from the day that has focus, also after the month buttons changed the view.
                      onFocus={() => setFocus(d)}
                      onClick={() => {
                        setFocus(d);
                        choose(d);
                      }}
                      className={cn(
                        "grid size-10 place-content-center rounded-pill leading-none transition-colors hover:bg-surface-2 disabled:pointer-events-none disabled:opacity-30",
                        d === today && "ring-1 ring-line-strong",
                        isEnd(d) && "bg-primary text-primary-fg hover:bg-primary",
                      )}
                    >
                      <span className="text-sm tabular-nums">{partsOf(d, calendar).day}</span>
                      <span aria-hidden="true" className={cn("mt-0.5 text-[9px] tabular-nums", isEnd(d) ? "text-primary-fg/70" : "text-fg-3")}>
                        {partsOf(d, other).day}
                      </span>
                    </button>
                  </td>
                ) : (
                  <td key={d} role="gridcell" />
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {!fixedCalendar && (
        <SegmentedControl
          className="w-full [&>button]:flex-1"
          value={calendar}
          onValueChange={(v) => switchCalendar(v as CalendarKind)}
          options={[
            { value: "gregorian", label: s.gregorian },
            { value: "hijri", label: s.hijri },
          ]}
        />
      )}
    </div>
  );
}

// Grid pattern: focus starts on the chosen day (or today), not on the month buttons.
const focusDay = (e: Event) => {
  e.preventDefault();
  (e.currentTarget as HTMLElement).querySelector<HTMLElement>('[data-day][tabindex="0"]')?.focus();
};

/** A field that opens a Calendar. `name` posts the ISO date ("2026-02-18") whatever calendar is shown. */
export function DatePicker({
  value,
  onValueChange,
  name,
  placeholder,
  defaultCalendar = "gregorian",
  min,
  max,
  weekStart,
  fixedCalendar,
  className,
  ...props
}: Omit<CalendarProps, "calendar" | "onCalendarChange" | "className"> & {
  name?: string;
  placeholder?: string;
  className?: string;
} & Pick<ComponentProps<"button">, "id" | "aria-describedby" | "aria-invalid" | "disabled" | "form">) {
  const lang = useLang();
  const s = useStrings();
  const valueId = useId();
  const [open, setOpen] = useState(false);
  const [calendar, setCalendar] = useState(defaultCalendar);
  const { required, ...trigger } = useFieldControl<typeof props & { required?: boolean }>(props);
  // The field label names the trigger and hides its text, so the date is read as its description.
  const labelled = !!useFieldLabelId();
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        {...trigger}
        aria-describedby={[labelled ? valueId : undefined, trigger["aria-describedby"]].filter(Boolean).join(" ") || undefined}
        aria-required={required || undefined}
        className={cn(TEXT_BOX, "flex items-center justify-between gap-2 text-start", className)}
      >
        <span id={valueId} className={cn(!value && "text-fg-3")}>{value ? formatDate(fromPlain(value), { lang, calendar }) : (placeholder ?? s.chooseDate)}</span>
        <CalendarDays aria-hidden className="size-4 shrink-0 text-fg-3" />
      </Popover.Trigger>
      {name && <input type="hidden" name={name} value={value ?? ""} form={props.form} disabled={props.disabled} />}
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className="z-(--p-z-overlay) rounded-card shadow-overlay"
          onOpenAutoFocus={focusDay}
        >
          <Calendar
            value={value}
            onValueChange={(d) => {
              onValueChange(d);
              setOpen(false);
            }}
            calendar={calendar}
            onCalendarChange={setCalendar}
            min={min}
            max={max}
            weekStart={weekStart}
            fixedCalendar={fixedCalendar}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

const PRESETS: DateRangePresetId[] = ["today", "yesterday", "thisWeek", "thisMonth", "lastMonth"];

/**
 * A field that opens range presets beside a range Calendar. A preset commits and closes. A day commits at once
 * (a range open at one end is a valid filter); the popover closes when both ends are set. The range reads
 * "12/09/2026 – 15/09/2026" left to right in both languages. A clear button shows when a date is set.
 */
export function DateRangePicker({
  value,
  onValueChange,
  presets = PRESETS,
  min,
  max,
  weekStart,
  fixedCalendar,
  placeholder,
  className,
  ...props
}: {
  value: DateRange;
  onValueChange: (range: DateRange) => void;
  presets?: DateRangePresetId[];
  min?: PlainDate;
  max?: PlainDate;
  weekStart?: number;
  fixedCalendar?: boolean;
  placeholder?: string;
  className?: string;
} & Pick<ComponentProps<"button">, "id" | "aria-describedby" | "disabled">) {
  const s = useStrings();
  const t = useText();
  const valueId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [calendar, setCalendar] = useState<CalendarKind>("gregorian");
  const { required, ...trigger } = useFieldControl<typeof props & { required?: boolean }>(props);
  // As in DatePicker: the field label names the trigger, so the range is read as its description.
  const labelled = !!useFieldLabelId();
  const { from, to } = value;
  const day = (d: PlainDate) => formatDateTime(d, { style: "numeric" });
  const text =
    from && to ? (
      from === to ? day(from) : <span dir="ltr">{`${day(from)} – ${day(to)}`}</span>
    ) : from ? s.rangeFrom(day(from)) : to ? s.rangeUntil(day(to)) : (placeholder ?? s.dateRange);
  const set = !!(from || to);
  return (
    <div className={cn("relative", className)}>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger
          ref={triggerRef}
          {...trigger}
          aria-describedby={[labelled ? valueId : undefined, trigger["aria-describedby"]].filter(Boolean).join(" ") || undefined}
          aria-required={required || undefined}
          className={cn(TEXT_BOX, "flex items-center justify-between gap-2 text-start", set && "pe-11")}
        >
          <span id={valueId} className={cn("truncate", !set && "text-fg-3")}>
            {text}
          </span>
          {!set && <CalendarDays aria-hidden className="size-4 shrink-0 text-fg-3" />}
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={6}
            className="z-(--p-z-overlay) flex rounded-card border border-line bg-surface text-fg shadow-overlay max-sm:flex-col"
            onOpenAutoFocus={focusDay}
          >
            <div className="flex flex-wrap gap-1 border-line p-2 max-sm:border-b sm:grid sm:min-w-36 sm:content-start sm:border-e">
              {presets.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    onValueChange(rangePreset(id, todayPlain(), weekStart));
                    setOpen(false);
                  }}
                  className="rounded-field px-3 py-2 text-start text-sm text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg"
                >
                  {t(s[id])}
                </button>
              ))}
            </div>
            <Calendar
              mode="range"
              value={value}
              onValueChange={(range) => {
                onValueChange(range);
                if (range.from && range.to) setOpen(false);
              }}
              calendar={calendar}
              onCalendarChange={setCalendar}
              min={min}
              max={max}
              weekStart={weekStart}
              fixedCalendar={fixedCalendar}
              className="border-0"
            />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      {set && (
        <button
          type="button"
          aria-label={s.clearDates}
          disabled={props.disabled}
          onClick={() => {
            onValueChange({ from: null, to: null });
            triggerRef.current?.focus();
          }}
          className="absolute end-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-pill text-fg-3 transition-colors hover:bg-surface-2 hover:text-fg disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4"
        >
          <X aria-hidden />
        </button>
      )}
    </div>
  );
}
