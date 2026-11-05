"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { useStrings } from "../provider";
import { KeyGrid } from "./keypad";
import { LiveRegion } from "./utility";

/**
 * A short numeric code on screen with large keys (a device lock, a cashier switch). Masked dots and a 3 x 4 key grid; both keep
 * left-to-right order in Arabic, like a phone keypad. The keys are buttons, and digit keys and Backspace on a hardware keyboard
 * work too (only while the focus is on the page or in the pad, never in a text field, dialog or menu; see `KeyGrid`). `onComplete` gets the code once, when the last digit is typed; while its
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
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);
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

  // Only a new error clears the dots (a JSX node is a new value on every parent render).
  useEffect(() => {
    const had = lastError.current;
    lastError.current = error;
    if (error && !had) reset();
  }, [error]);

  const off = disabled || busy;
  return (
    <div role="group" aria-label={label} aria-busy={busy || undefined} className={cn("mx-auto grid w-full max-w-72 justify-items-center gap-5", className)}>
      <div aria-hidden="true" dir="ltr" className="flex gap-3">
        {Array.from({ length }, (_, i) => (
          <span key={i} className={cn("size-3.5 rounded-pill border transition-colors", i < count ? "border-fg bg-fg" : "border-line-strong")} />
        ))}
      </div>
      <LiveRegion>{count > 0 && !busy ? s.progress(count, length) : ""}</LiveRegion>
      <p role="alert" className="min-h-5 text-center text-sm text-danger">
        {error}
      </p>
      <KeyGrid mode="pin" off={off} onKey={(k) => (k === "back" ? back() : push(k))} back={s.clear} />
    </div>
  );
}
