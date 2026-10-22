"use client";

import { useId, useState } from "react";
import { cn } from "../lib/cn";
import { useStrings } from "../provider";
import type { PlainDate } from "../saudi/calendar";
import { joinTime, splitTime } from "../saudi/date-time";
import { SegmentedControl } from "./actions";
import { DatePicker } from "./calendar";
import { useFieldControl, useFieldLabelId } from "./field";
import { NumberInput } from "./special-inputs";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * A time of day on the 12-hour clock: hour 1–12, minute, AM/PM (ص/م in Arabic). Always left to right, hour first.
 * The value is "HH:mm" (24 hours), null while empty; `name` posts it. A step from 11 to 12 crosses noon or midnight.
 */
export function TimeInput({
  value,
  onValueChange,
  minuteStep = 5,
  name,
  disabled,
  id,
  "aria-describedby": describedBy,
  className,
}: {
  value: string | null;
  onValueChange: (time: string) => void;
  minuteStep?: number;
  name?: string;
  disabled?: boolean;
  id?: string;
  "aria-describedby"?: string;
  className?: string;
}) {
  const s = useStrings();
  const minuteId = useId();
  const labelledBy = useFieldLabelId();
  // The field label points at the hour box (a click on it starts there); the group carries the name.
  const field = useFieldControl({ id, "aria-describedby": describedBy });
  const time = value ? splitTime(value) : null;
  const { hour12, minute, pm } = time ?? { hour12: 12, minute: 0, pm: false };
  const set = (h: number, m: number, p: boolean) => onValueChange(joinTime(h, m, p));
  return (
    <div
      role="group"
      dir="ltr"
      aria-labelledby={labelledBy}
      aria-describedby={field["aria-describedby"]}
      className={cn("flex flex-wrap items-center gap-2", className)}
    >
      <NumberInput
        id={field.id}
        aria-label={s.hour}
        value={time && hour12}
        min={1}
        max={12}
        disabled={disabled}
        className="w-30"
        onValueChange={(h) => {
          if (h == null || !Number.isInteger(h) || h < 1 || h > 12) return;
          // As on a clock: between 11 and 12 the time crosses noon or midnight.
          const crosses = time != null && ((hour12 === 11 && h === 12) || (hour12 === 12 && h === 11));
          set(h, minute, crosses ? !pm : pm);
        }}
      />
      <span aria-hidden="true" className="text-fg-3">
        :
      </span>
      <NumberInput
        id={minuteId}
        aria-label={s.minute}
        value={time && minute}
        min={0}
        // The last minute on the step grid, so a step never lands on 59 from 55.
        max={Math.floor(59 / minuteStep) * minuteStep}
        step={minuteStep}
        format={pad}
        disabled={disabled}
        className="w-30"
        onValueChange={(m) => {
          if (m != null && Number.isInteger(m) && m >= 0 && m <= 59) set(hour12, m, pm);
        }}
      />
      <SegmentedControl
        value={time ? (pm ? "pm" : "am") : ""}
        onValueChange={(v) => set(hour12, minute, v === "pm")}
        disabled={disabled}
        options={[
          { value: "am", label: s.am },
          { value: "pm", label: s.pm },
        ]}
      />
      {name && <input type="hidden" name={name} value={value ?? ""} disabled={disabled} />}
    </div>
  );
}

type DateTime = { date: PlainDate; time: string };

/**
 * DatePicker + TimeInput. It sends a value only when both parts are set; `name` posts "YYYY-MM-DDTHH:mm",
 * a wall time with no zone (the app owns the zone).
 */
export function DateTimePicker({
  value,
  onValueChange,
  minuteStep,
  name,
  min,
  max,
  disabled,
  className,
}: {
  value: DateTime | null;
  onValueChange: (value: DateTime) => void;
  minuteStep?: number;
  name?: string;
  min?: PlainDate;
  max?: PlainDate;
  disabled?: boolean;
  className?: string;
}) {
  const timeId = useId();
  // The part chosen first, while the other is still empty.
  const [draft, setDraft] = useState<{ date: PlainDate | null; time: string | null }>({ date: null, time: null });
  const date = value?.date ?? draft.date;
  const time = value?.time ?? draft.time;
  const set = (next: { date: PlainDate | null; time: string | null }) => {
    if (!next.date || !next.time) return setDraft(next);
    setDraft({ date: null, time: null });
    onValueChange({ date: next.date, time: next.time });
  };
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <DatePicker value={date} onValueChange={(d) => set({ date: d, time })} min={min} max={max} disabled={disabled} className="w-auto min-w-40 flex-1" />
      {/* Its own id: the field id goes to the date button. */}
      <TimeInput id={timeId} value={time} onValueChange={(t) => set({ date, time: t })} minuteStep={minuteStep} disabled={disabled} />
      {name && <input type="hidden" name={name} value={value ? `${value.date}T${value.time}` : ""} disabled={disabled} />}
    </div>
  );
}
