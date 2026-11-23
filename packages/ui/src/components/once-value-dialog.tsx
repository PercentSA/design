"use client";

import { useRef, type ReactNode } from "react";
import { AlertDialog as RadixAlert } from "radix-ui";
import { cn } from "../lib/cn";
import { useStrings } from "../provider";
import { Button, CopyButton } from "./actions";
import { useFocusReturn } from "./dialog-parts";
import { BACKDROP, PANEL } from "./overlay-classes";

/**
 * Shows a new value one time, for example a token, with a Copy button. It closes only with Done: Escape and a click outside do nothing.
 * The first focus is on Copy. `open` and `onDone` are the app's: the app closes the dialog and forgets the value in `onDone`.
 */
export function OnceValueDialog({
  open,
  title,
  value,
  description,
  note,
  onDone,
}: {
  open: boolean;
  title: ReactNode;
  value: string;
  description?: ReactNode;
  /** A line under the value, for example "You cannot see this value again." */
  note?: ReactNode;
  onDone: () => void;
}) {
  const s = useStrings();
  const focus = useFocusReturn();
  const copy = useRef<HTMLDivElement>(null);
  return (
    <RadixAlert.Root open={open}>
      <RadixAlert.Portal>
        <RadixAlert.Overlay className={BACKDROP} />
        <RadixAlert.Content
          {...(description ? {} : { "aria-describedby": undefined })}
          {...focus}
          onOpenAutoFocus={(e) => {
            focus.onOpenAutoFocus();
            e.preventDefault();
            copy.current?.querySelector("button")?.focus();
          }}
          onEscapeKeyDown={(e) => e.preventDefault()}
          className={cn(
            "p-pop fixed start-1/2 top-1/2 z-(--p-z-overlay) grid w-[calc(100%-2rem)] max-w-md -translate-y-1/2 gap-6 rounded-panel p-6 md:p-8 ltr:-translate-x-1/2 rtl:translate-x-1/2",
            PANEL,
          )}
        >
          <div className="grid gap-2">
            <RadixAlert.Title className="heading text-xl">{title}</RadixAlert.Title>
            {description && <RadixAlert.Description className="text-sm text-fg-2">{description}</RadixAlert.Description>}
          </div>
          <div className="grid gap-2">
            <div className="flex items-center gap-2 rounded-field border border-line bg-surface p-3">
              <code dir="ltr" className="min-w-0 flex-1 break-all font-mono text-sm">
                {value}
              </code>
              <div ref={copy} className="shrink-0">
                <CopyButton value={value} />
              </div>
            </div>
            {note && <p className="text-sm text-fg-2">{note}</p>}
          </div>
          <div className="flex justify-end">
            <Button onClick={onDone}>{s.done}</Button>
          </div>
        </RadixAlert.Content>
      </RadixAlert.Portal>
    </RadixAlert.Root>
  );
}
