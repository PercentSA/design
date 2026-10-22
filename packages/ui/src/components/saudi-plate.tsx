"use client";

import { useId, type ComponentProps } from "react";
import { cn } from "../lib/cn";
import { useLang, useStrings } from "../provider";
import { parsePlate, plateDigitsAr, plateIssueMessage, plateLabel, plateLatin } from "../saudi/plate-rules";
import { Input } from "./inputs";

const SIZE = { sm: "w-40", md: "w-52", lg: "w-80" };
const ROW = "flex min-h-0 items-center justify-center overflow-hidden whitespace-nowrap leading-none font-bold";

/**
 * A Saudi private plate (520 × 110 mm): the digits on the left, the middle strip, the letters on the right; Arabic on
 * the top row, Western digits and Latin letters below. Left to right on every page, sized in container units.
 */
export function SaudiPlate({ letters, digits, size = "md", className }: { letters: string; digits: string; size?: keyof typeof SIZE; className?: string }) {
  const lang = useLang();
  const s = useStrings();
  return (
    <span role="img" aria-label={plateLabel(letters, digits, lang, s)} dir="ltr" className={cn("@container inline-block shrink-0 align-middle select-none", SIZE[size], className)}>
      <span
        aria-hidden="true"
        className="grid aspect-[520/110] w-full grid-cols-[44fr_11fr_45fr] overflow-hidden rounded-[2.2cqw] border-[0.8cqw] border-fg bg-surface text-fg"
      >
        <Panel top={plateDigitsAr(digits)} bottom={digits} />
        {/* No national emblem: the owner has not decided on its use yet. */}
        <span className="flex flex-col items-center justify-center gap-[1.4cqw] border-x-[0.5cqw] border-fg font-bold leading-none">
          <span dir="rtl" className="text-[1.9cqw]">
            السعودية
          </span>
          <span className="flex flex-col items-center text-[2.4cqw] leading-[0.95]">
            <span>K</span>
            <span>S</span>
            <span>A</span>
          </span>
        </span>
        <Panel top={[...letters].join(" ")} bottom={plateLatin(letters)} arabic />
      </span>
    </span>
  );
}

function Panel({ top, bottom, arabic = false }: { top: string; bottom: string; arabic?: boolean }) {
  return (
    <span className="grid grid-rows-2">
      <span dir={arabic ? "rtl" : "ltr"} className={cn(ROW, "border-b-[0.5cqw] border-fg", arabic ? "text-[6.2cqw] tracking-[1.2cqw]" : "text-[6.6cqw] tracking-[0.5cqw]")}>
        {top}
      </span>
      <span className={cn(ROW, "text-[6.2cqw] tabular-nums", arabic ? "tracking-[1.1cqw]" : "tracking-[0.8cqw]")}>{bottom}</span>
    </span>
  );
}

/**
 * One text for the whole plate: letters and digits in any order, Arabic or English. A live SaudiPlate shows under it.
 * Keep the text; read it with parsePlate().
 */
export function PlateInput({
  value,
  onValueChange,
  className,
  ...props
}: Omit<ComponentProps<"input">, "value" | "onChange" | "type"> & { value: string; onValueChange: (text: string) => void }) {
  const s = useStrings();
  const lang = useLang();
  const noteId = useId();
  const parsed = parsePlate(value);
  const issue = parsed.ok ? null : plateIssueMessage(parsed.issue, lang, s);
  const note = issue ?? (value.trim() ? null : s.plateHint);
  return (
    // min-w-0: in a grid the live plate must not widen its column.
    <div className={cn("grid min-w-0 gap-2.5", className)}>
      <Input
        autoComplete="off"
        spellCheck={false}
        {...props}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        aria-invalid={issue ? true : props["aria-invalid"]}
        aria-describedby={[props["aria-describedby"], note ? noteId : undefined].filter(Boolean).join(" ") || undefined}
      />
      {note && (
        <p id={noteId} className={cn("text-sm", issue ? "text-danger" : "text-fg-3")}>
          {note}
        </p>
      )}
      {parsed.ok && !parsed.empty && <SaudiPlate letters={parsed.letters} digits={parsed.digits} size="lg" className="max-w-full" />}
    </div>
  );
}
