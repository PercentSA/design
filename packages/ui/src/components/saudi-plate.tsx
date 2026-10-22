"use client";

import { useId, type ComponentProps } from "react";
import { cn } from "../lib/cn";
import { useLang, useStrings } from "../provider";
import { parsePlate, plateDigitsAr, plateIssueMessage, plateLabel, plateLatin } from "../saudi/plate-rules";
import { Input } from "./inputs";

const SIZE = { sm: "w-40", md: "w-52", lg: "w-80" };
const ROW = "flex min-h-0 items-center justify-center overflow-hidden whitespace-nowrap font-bold";

/**
 * A Saudi private plate (520 × 110 mm): the digits on the left, the middle strip (emblem, «السعودية», K S A, the
 * private-car circle), the letters on the right; Arabic on the top row, Western digits and Latin letters below. Left to
 * right on every page, sized in container units.
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
        <span className="flex flex-col items-center justify-between border-x-[0.5cqw] border-fg py-[0.7cqw] font-bold leading-none">
          <Emblem />
          <span dir="rtl" className="text-[1.9cqw]">
            السعودية
          </span>
          <span className="flex flex-col items-center text-[2.4cqw] leading-[0.95]">
            <span>K</span>
            <span>S</span>
            <span>A</span>
          </span>
          <span className="size-[1.9cqw] rounded-full border-[0.35cqw] border-current" />
        </span>
        <Panel top={[...letters].join(" ")} bottom={plateLatin(letters)} arabic />
      </span>
    </span>
  );
}

/** A palm over two crossed swords, simplified for small sizes, in the text colour. */
function Emblem() {
  return (
    <svg viewBox="0 0 24 24" className="size-[5.2cqw]" fill="currentColor">
      <path d="M11.4 6.2h1.2v8.6h-1.2z" />
      <path d="M12 6.4c-1.6-2.6-4.4-3.2-6.6-2.2 2.3.1 4.1 1 5.4 2.6-2.1-.8-4.3-.3-5.8 1 2.2-.5 4.3 0 6 1.1L12 6.4z" />
      <path d="M12 6.4c1.6-2.6 4.4-3.2 6.6-2.2-2.3.1-4.1 1-5.4 2.6 2.1-.8 4.3-.3 5.8 1-2.2-.5-4.3 0-6 1.1L12 6.4z" />
      <path d="M12 6.2c-.3-1.9.4-3.6 1.8-4.8-.4 1.6-.4 3 .2 4.6L12 6.2z" />
      <path d="M4.2 21.2c3.3-3.6 8.4-5 15.2-4.5-6.4.4-10.9 2-13.6 4.8L4.2 21.2z" />
      <path d="M19.8 21.2c-3.3-3.6-8.4-5-15.2-4.5 6.4.4 10.9 2 13.6 4.8l1.6-.3z" />
      <path d="M3.3 21.6l1.6-1.2.7.9-1.6 1.2zM20.7 21.6l-1.6-1.2-.7.9 1.6 1.2z" />
    </svg>
  );
}

function Panel({ top, bottom, arabic = false }: { top: string; bottom: string; arabic?: boolean }) {
  return (
    // leading-none sits here: cn() drops it from a row that also sets a text size, and the rows then overflow the plate.
    <span className="grid grid-rows-2 leading-none">
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
