"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Delete } from "lucide-react";
import { cn } from "../lib/cn";
import { useStrings } from "../provider";
import { toWesternDigits } from "../saudi/digits";
import { Button } from "./actions";

const EDITABLE = "input, textarea, select, [contenteditable]";
const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
const KEY = "h-14 w-full tabular-nums";
// Events a grid has already looked at: with the focus on the page only the first mounted grid may act on a key, even when it refused it.
const seen = new WeakSet<Event>();

/** A key of the grid: "0" to "9", "00", "." or "back". */
export type KeyName = string;

/**
 * The key grid that PinPad and Keypad share: a 3-column grid of secondary buttons that keeps left-to-right order in Arabic (like a
 * phone keypad), and the hardware keyboard. `onKey` returns whether the key did something. Keyboard rule: the keys act only when the
 * focus is on the page body or inside the grid (a text field, dialog or menu keeps its keys), never on a key repeat or with Ctrl,
 * Meta or Alt, and the key is taken (preventDefault) only when it did something. `off` turns keys and keyboard off.
 */
export function KeyGrid({
  mode,
  off,
  onKey,
  back,
  backLabel,
  point,
  pointLabel,
  doubleZeroLabel,
  className,
}: {
  mode: "pin" | "amount";
  off?: boolean;
  onKey: (key: KeyName) => boolean;
  back: ReactNode;
  /** Accessible name of the back key when `back` is an icon. */
  backLabel?: string;
  /** "amount" only: shows the "." key. */
  point?: boolean;
  pointLabel?: string;
  doubleZeroLabel?: string;
  className?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const lastKey = useRef<HTMLElement | null>(null);
  const latest = useRef({ onKey, off, mode });
  latest.current = { onKey, off, mode };

  // The pressed key was disabled for a while (a code being checked): give the focus back to it.
  useEffect(() => {
    if (!off && lastKey.current?.isConnected && document.activeElement === document.body) lastKey.current.focus();
  }, [off]);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const now = latest.current;
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented || (e.target as Element | null)?.closest?.(EDITABLE)) return;
      // Only when nothing else has the focus (the page) or the grid itself has it: a dialog or menu over the pad keeps its keys.
      const at = document.activeElement;
      if (at && at !== document.body && !root.current?.contains(at)) return;
      if (seen.has(e)) return;
      seen.add(e);
      if (now.off) return;
      const d = toWesternDigits(e.key);
      const key = /^[0-9]$/.test(d) ? d : e.key === "Backspace" ? "back" : now.mode === "amount" && (e.key === "." || e.key === "٫") ? "." : null;
      if (key && now.onKey(key)) e.preventDefault();
    };
    document.addEventListener("keydown", onDown);
    return () => document.removeEventListener("keydown", onDown);
  }, []);

  const key = (name: KeyName, label: ReactNode = name, aria?: string) => (
    <Button
      key={name}
      variant="secondary"
      disabled={off}
      aria-label={aria}
      className={cn(KEY, "text-xl", name === "back" && "text-sm [&_svg]:size-6")}
      onClick={(e) => {
        lastKey.current = e.currentTarget;
        onKey(name);
      }}
    >
      {label}
    </Button>
  );
  return (
    <div ref={root} dir="ltr" className={cn("grid w-full grid-cols-3 gap-3", className)}>
      {DIGITS.map((d) => key(d))}
      {mode === "pin" ? (
        <>
          <span aria-hidden="true" />
          {key("0")}
          {key("back", back, backLabel)}
        </>
      ) : (
        <>
          {point ? key(".", ".", pointLabel) : <span aria-hidden="true" />}
          {key("0")}
          {key("00", "00", doubleZeroLabel)}
          <div className="col-span-3">{key("back", back, backLabel)}</div>
        </>
      )}
    </div>
  );
}

/**
 * Digit keys on a touch screen for an amount or a code, so the system keyboard does not cover a dialog. `value` is the draft text of the
 * field it serves (Western digits and "."), as `MoneyInput`; the keypad writes the next draft with `onValueChange`.
 * `mode="amount"`: 1 to 9, ".", 0, "00" and a backspace key (the "." key only with `decimals` above 0); a leading zero is replaced by the next
 * digit and a third decimal is refused. `mode="pin"`: 1 to 9, 0, backspace. At `maxLength` the digit keys do nothing. Left-to-right in both languages.
 * A value the keypad did not write (a prefilled total, a value set by the app) is replaced by the first key, as on a calculator; backspace clears it.
 * The hardware keyboard works too (digits, ".", Backspace) while the focus is on the page or in the keypad, never in a text field, dialog or menu.
 */
export function Keypad({
  value,
  onValueChange,
  mode = "amount",
  decimals = 2,
  maxLength,
  disabled,
  label,
  className,
}: {
  /** The draft text of the field it serves (Western digits and "."), as `MoneyInput`. */
  value: string;
  onValueChange: (draft: string) => void;
  /** "amount": 1 to 9, 0, "00", "." and backspace. "pin": 1 to 9, 0 and backspace. Default "amount". */
  mode?: "amount" | "pin";
  /** Digits after "." ("amount"); a further one is refused. 0: no "." key. Default 2. */
  decimals?: number;
  /** The most characters in the draft (the "." counts). */
  maxLength?: number;
  disabled?: boolean;
  /** Accessible name of the group ("Amount keypad"). */
  label: string;
  className?: string;
}) {
  const s = useStrings().keypad;
  // The draft lives in a ref, so two taps in one frame both count.
  const draft = useRef(value);
  draft.current = value;
  // The last draft the keypad wrote: any other non-empty value came from outside and the first key replaces it.
  const written = useRef<string | null>(null);
  const room = (d: string) => maxLength === undefined || d.length < maxLength;
  const add = (d: string, token: string) => {
    if (!room(d)) return null;
    if (token === ".") return mode === "amount" && decimals > 0 && !d.includes(".") ? (d === "" ? "0." : d + ".") : null;
    const dot = d.indexOf(".");
    if (dot >= 0) return d.length - dot - 1 < decimals ? d + token : null;
    if (mode === "amount" && d === "0") return token === "0" ? null : token;
    return d + token;
  };
  const press = (key: string) => {
    if (disabled) return false;
    const fresh = draft.current !== "" && draft.current !== written.current;
    const from = fresh ? "" : draft.current;
    let next: string | null = from;
    if (key === "back") next = fresh ? "" : from ? from.slice(0, -1) : null;
    else if (key === "00") {
      // Two zeros, as far as the room goes; on an empty draft one.
      const one = add(from, "0");
      next = one === null ? null : (add(one, "0") ?? one);
    } else next = add(from, key);
    if (next === null) return false;
    draft.current = next;
    written.current = next;
    onValueChange(next);
    return true;
  };
  return (
    <div role="group" aria-label={label} className={cn("mx-auto w-full max-w-72", className)}>
      <KeyGrid
        mode={mode}
        off={disabled}
        onKey={press}
        back={<Delete aria-hidden />}
        backLabel={s.backspace}
        point={decimals > 0}
        pointLabel={s.point}
        doubleZeroLabel={s.doubleZero}
      />
    </div>
  );
}
