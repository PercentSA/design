"use client";

import { useEffect, useId, useState, type FormEvent, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { useStrings } from "../provider";
import { Button } from "./actions";
import { blockedProps } from "./button-class";
import { BlockedStatus } from "./dialog-parts";
import { AlertDialog, Sheet } from "./overlays";
import { useMediaQuery } from "./utility";

function FormSheetInner({
  title,
  description,
  trigger,
  open,
  onOpenChange,
  onSubmit,
  pending,
  dirty,
  submitLabel,
  cancelLabel,
  blocked,
  danger,
  side = "end",
  size,
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
  /** The close button's text. Default: Cancel. */
  cancelLabel?: ReactNode;
  /** Why the submit is refused now (empty: nothing is refused). Shown above the buttons with a warning icon; the submit is disabled. */
  blocked?: ReactNode;
  /** The submit is a danger button (cancel an appointment, delete). */
  danger?: boolean;
  side?: "end" | "bottom";
  size?: "md" | "lg";
  className?: string;
  children: ReactNode;
}) {
  const s = useStrings();
  const [inner, setInner] = useState(false);
  const [asking, setAsking] = useState(false);
  const reasonId = useId();
  const refused = blocked != null && blocked !== false && blocked !== "";
  const bottom = side === "bottom";
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
      <Sheet trigger={trigger} title={title} description={description} side={side} size={size} open={shown} onOpenChange={request} className={className}>
        <form
          noValidate
          // Enter in a field cannot reach a disabled submit button; this also covers a script.
          onSubmit={(e) => (refused && !pending ? e.preventDefault() : onSubmit(e))}
          className="flex flex-1 flex-col gap-6"
        >
          {children}
          {/* -bottom-6, not bottom-0: a sticky footer stops at the scroller's padding (p-6), and the content would show under it. */}
          <div className="sticky -bottom-6 -mx-6 -mb-6 mt-auto grid gap-3 border-t border-line bg-surface-2 px-6 py-4">
            <BlockedStatus id={reasonId}>{refused && !pending ? blocked : undefined}</BlockedStatus>
            <div className={cn(bottom ? "flex flex-wrap gap-3 *:grow *:basis-[calc(50%-0.375rem)]" : "flex flex-wrap justify-end gap-2")}>
              <Button variant="secondary" size={bottom ? "lg" : undefined} disabled={pending} onClick={() => request(false)}>
                {cancelLabel ?? s.cancel}
              </Button>
              <Button
                type="submit"
                variant={danger ? "danger" : undefined}
                size={bottom ? "lg" : undefined}
                loading={pending}
                // aria-disabled, not disabled: the button keeps its focus and can be read with the reason.
                {...(refused && !pending ? blockedProps(reasonId) : {})}
              >
                {submitLabel ?? s.save}
              </Button>
            </div>
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

type Props = Omit<Parameters<typeof FormSheetInner>[0], "side"> & { side?: "end" | "bottom" | "auto" };

// A child, so a sheet without `side="auto"` never calls matchMedia.
function AutoSide(props: Props) {
  const wide = useMediaQuery("(min-width: 48rem)");
  return <FormSheetInner {...props} side={wide ? "end" : "bottom"} />;
}

/**
 * An edit form in a Sheet, with Cancel and Save in a footer that stays at the bottom. `pending` shows Save
 * loading and refuses every close. With `dirty`, each close (Escape, outside click, the close button, a drag,
 * Cancel) asks first, and leaving the page asks the browser's question. The sheet does not close itself after a
 * submit: close it (`open`, `onOpenChange`) when the save succeeds.
 * `blocked`: why the submit is refused now. It shows above the buttons (announced), and the submit stays visible but disabled;
 * `pending` wins over it. `danger`: the submit is a danger button. `cancelLabel`: the close button's text (default Cancel).
 * `side="auto"`: the end from 768 px, the bottom below. `side="bottom"`: the two buttons fill the footer in two equal columns, large. `size="lg"`: a wider sheet (see Sheet).
 */
export function FormSheet(props: Props) {
  return props.side === "auto" ? <AutoSide {...props} /> : <FormSheetInner {...props} side={props.side} />;
}
