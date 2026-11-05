"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { useStrings } from "../provider";
import { toWesternDigits } from "../saudi/digits";
import { Button } from "./actions";
import { LiveRegion } from "./utility";

const EDITABLE = "input, textarea, select, [contenteditable]";
const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

const claimed = new WeakSet<Event>();
/**
 * May this pad act on a key? Only when the pad holds the focus, or nothing does (body focus); then only the first pad that
 * asks, even if it refuses the key, so two pads on one page never both take it.
 */
export function mayTakeKey(e: Event, group: Element | null) {
  const at = document.activeElement;
  if (at && at !== document.body) return !!group?.contains(at);
  if (claimed.has(e)) return false;
  claimed.add(e);
  return true;
}

/**
 * A short numeric code on screen with large keys (a device lock, a cashier switch). Masked dots and a 3 x 4 key grid; both keep
 * left-to-right order in Arabic, like a phone keypad. The keys are buttons, and digit keys and Backspace on a hardware keyboard
 * work too (not while the focus is in a text field). `onComplete` gets the code once, when the last digit is typed; while its
 * promise runs the keys are off, then the pad clears. Screen readers hear a count ("2 of 4"), never the digits.
 * `error` shows under the dots (an alert) and clears them.
 */
export function PinPad({
  length = 4,
  label,
  onComplete,
  onStart,
  error,
  disabled,
  className,
}: {
  /** Digits of the code. Default 4. */
  length?: number;
  /** Accessible name of the pad, for example the prompt above it. */
  label: string;
  onComplete: (pin: string) => void | Promise<void>;
  /** Called at the first digit of a new entry (for example to drop an old warning). */
  onStart?: () => void;
  error?: ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  const s = useStrings().pinPad;
  // The entry lives in a ref, so two taps in one frame both count.
  const entry = useRef("");
  const working = useRef(false);
  const lastKey = useRef<HTMLElement | null>(null);
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const latest = useRef<{ push: (d: string) => boolean; back: () => boolean }>({ push: () => false, back: () => false });
  const group = useRef<HTMLDivElement>(null);
  const lastError = useRef<ReactNode>(null);

  const reset = () => {
    entry.current = "";
    setCount(0);
  };
  /** Each returns whether it did something (the keyboard handler only then takes the key). */
  const back = () => {
    if (disabled || working.current || !entry.current) return false;
    entry.current = entry.current.slice(0, -1);
    setCount(entry.current.length);
    return true;
  };
  const finish = async (pin: string) => {
    working.current = true;
    setBusy(true);
    try {
      await onComplete(pin);
    } finally {
      working.current = false;
      setBusy(false);
      reset();
    }
  };
  const push = (digit: string) => {
    if (disabled || working.current || entry.current.length >= length) return false;
    if (!entry.current) onStart?.();
    entry.current += digit;
    setCount(entry.current.length);
    if (entry.current.length === length) void finish(entry.current);
    return true;
  };
  latest.current = { push, back };

  // Only a new error clears the dots (a JSX node is a new value on every parent render).
  useEffect(() => {
    const had = lastError.current;
    lastError.current = error;
    if (error && !had) reset();
  }, [error]);

  // The pressed key was disabled while the code was checked: give the focus back to it.
  useEffect(() => {
    if (!busy && lastKey.current?.isConnected && document.activeElement === document.body) lastKey.current.focus();
  }, [busy]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented || (e.target as Element | null)?.closest?.(EDITABLE)) return;
      // Only when nothing else has the focus (the page) or the pad itself has it: a dialog or menu over the pad keeps its keys.
      if (!mayTakeKey(e, group.current)) return;
      const d = toWesternDigits(e.key);
      const took = /^[0-9]$/.test(d) ? latest.current.push(d) : e.key === "Backspace" ? latest.current.back() : false;
      if (took) e.preventDefault();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const off = disabled || busy;
  const key = (digit: string) => (
    <Button
      key={digit}
      variant="secondary"
      disabled={off}
      className="h-14 w-full text-xl tabular-nums"
      onClick={(e) => {
        lastKey.current = e.currentTarget;
        push(digit);
      }}
    >
      {digit}
    </Button>
  );
  return (
    <div ref={group} role="group" aria-label={label} aria-busy={busy || undefined} className={cn("mx-auto grid w-full max-w-72 justify-items-center gap-5", className)}>
      <div aria-hidden="true" dir="ltr" className="flex gap-3">
        {Array.from({ length }, (_, i) => (
          <span key={i} className={cn("size-3.5 rounded-pill border transition-colors", i < count ? "border-fg bg-fg" : "border-line-strong")} />
        ))}
      </div>
      <LiveRegion>{count > 0 && !busy ? s.progress(count, length) : ""}</LiveRegion>
      <p role="alert" className="min-h-5 text-center text-sm text-danger">
        {error}
      </p>
      <div dir="ltr" className="grid w-full grid-cols-3 gap-3">
        {DIGITS.map(key)}
        <span aria-hidden="true" />
        {key("0")}
        <Button
          variant="secondary"
          disabled={off}
          className="h-14 w-full text-sm"
          onClick={(e) => {
            lastKey.current = e.currentTarget;
            back();
          }}
        >
          {s.clear}
        </Button>
      </div>
    </div>
  );
}
