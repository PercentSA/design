import { useEffect, useId, useMemo, useRef, useState, type ComponentProps } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover } from "radix-ui";
import { cn } from "../lib/cn";
import { useDir, useLang, useStrings } from "../provider";
import {
  fromPlain,
  monthGrid,
  monthOf,
  moveFocus,
  partsOf,
  shiftView,
  todayPlain,
  viewLabel,
  weekdayNames,
  type PlainDate,
} from "../saudi/calendar";
import { formatDate, type CalendarKind } from "../saudi/date";
import { SegmentedControl } from "./actions";
import { useFieldControl, useFieldLabelId } from "./field";
import { TEXT_BOX } from "./inputs";

const NAV_BTN = "grid size-9 place-items-center rounded-pill text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg [&_svg]:size-4";

type CalendarProps = {
  value: PlainDate | null;
  onValueChange: (day: PlainDate) => void;
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

/**
 * Month grid in the Gregorian or Hijri (Umm al-Qura) calendar. Each day also shows its number in
 * the other calendar. Keyboard: arrows, Home/End, PageUp/PageDown (Shift: a year).
 */
export function Calendar({
  value,
  onValueChange,
  calendar: calendarProp,
  defaultCalendar = "gregorian",
  onCalendarChange,
  fixedCalendar,
  min,
  max,
  weekStart = 0,
  className,
}: CalendarProps) {
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
                  <td key={d} role="gridcell" aria-selected={d === value} className="p-0.5 text-center">
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
                        onValueChange(d);
                      }}
                      className={cn(
                        "grid size-10 place-content-center rounded-pill leading-none transition-colors hover:bg-surface-2 disabled:pointer-events-none disabled:opacity-30",
                        d === today && "ring-1 ring-line-strong",
                        d === value && "bg-primary text-primary-fg hover:bg-primary",
                      )}
                    >
                      <span className="text-sm tabular-nums">{partsOf(d, calendar).day}</span>
                      <span aria-hidden="true" className={cn("mt-0.5 text-[9px] tabular-nums", d === value ? "text-primary-fg/70" : "text-fg-3")}>
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
          // Grid pattern: focus starts on the chosen day (or today), not on the month buttons.
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            (e.currentTarget as HTMLElement).querySelector<HTMLElement>('[data-day][tabindex="0"]')?.focus();
          }}
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
