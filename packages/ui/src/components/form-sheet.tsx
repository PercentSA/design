"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useStrings } from "../provider";
import { Button } from "./actions";
import { AlertDialog, Sheet } from "./overlays";

/**
 * An edit form in a Sheet, with Cancel and Save in a footer that stays at the bottom. `pending` shows Save
 * loading and refuses every close. With `dirty`, each close (Escape, outside click, the close button, a drag,
 * Cancel) asks first, and leaving the page asks the browser's question. The sheet does not close itself after a
 * submit: close it (`open`, `onOpenChange`) when the save succeeds.
 */
export function FormSheet({
  title,
  description,
  trigger,
  open,
  onOpenChange,
  onSubmit,
  pending,
  dirty,
  submitLabel,
  side = "end",
  className,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  pending?: boolean;
  dirty?: boolean;
  submitLabel?: ReactNode;
  side?: "end" | "bottom";
  className?: string;
  children: ReactNode;
}) {
  const s = useStrings();
  const [inner, setInner] = useState(false);
  const [asking, setAsking] = useState(false);
  const shown = open ?? inner;
  const setOpen = (o: boolean) => {
    if (open === undefined) setInner(o);
    onOpenChange?.(o);
  };
  const request = (o: boolean) => {
    if (o) setOpen(true);
    else if (pending) return;
    else if (dirty) setAsking(true);
    else setOpen(false);
  };

  useEffect(() => {
    if (!shown || !dirty) return;
    const ask = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", ask);
    return () => window.removeEventListener("beforeunload", ask);
  }, [shown, dirty]);

  return (
    <>
      <Sheet trigger={trigger} title={title} description={description} side={side} open={shown} onOpenChange={request} className={className}>
        <form noValidate onSubmit={onSubmit} className="flex flex-1 flex-col gap-6">
          {children}
          <div className="sticky bottom-0 -mx-6 -mb-6 mt-auto flex flex-wrap justify-end gap-2 border-t border-line bg-surface-2 px-6 py-4">
            <Button variant="secondary" disabled={pending} onClick={() => request(false)}>
              {s.cancel}
            </Button>
            <Button type="submit" loading={pending}>
              {submitLabel ?? s.save}
            </Button>
          </div>
        </form>
      </Sheet>
      <AlertDialog
        open={asking}
        onOpenChange={setAsking}
        title={s.discardTitle}
        description={s.discardBody}
        action={s.discard}
        cancel={s.keepEditing}
        destructive
        onAction={() => setOpen(false)}
      />
    </>
  );
}
