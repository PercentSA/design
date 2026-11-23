"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useStrings } from "../provider";
import { Button, CopyButton } from "./actions";
import { AlertDialog } from "./overlays";

export type MaskedValueProps = {
  /** Names the buttons: "Reveal Password". */
  label: string;
  canReveal: boolean;
  /** Reads the value (and records the reveal). A rejection keeps the value hidden. */
  onReveal: () => Promise<string>;
  /** Asks before the reveal. */
  confirm?: { title: ReactNode; description?: ReactNode; /** The confirm button's text (default "Show"). */ action?: ReactNode };
  /** Controls the confirm dialog (for example, opened from a row menu). Works only with `confirm`; without `confirm` it is ignored. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

/**
 * A secret value shown as dots. Reveal can ask first (`confirm`). The value lives only in this component's state
 * while it is shown: Hide removes it. After a reveal the focus is on Hide; after Hide it is on Reveal.
 */
export function MaskedValue({ label, canReveal, onReveal, confirm, open: openProp, onOpenChange }: MaskedValueProps) {
  const s = useStrings();
  const [value, setValue] = useState<string | null>(null);
  const [inner, setInner] = useState(false);
  const open = confirm && openProp !== undefined ? openProp : inner;
  const setOpen = (o: boolean) => {
    setInner(o);
    onOpenChange?.(o);
  };
  const [loading, setLoading] = useState(false);
  const reveal = useRef<HTMLButtonElement>(null);
  const hide = useRef<HTMLButtonElement>(null);
  // Set by the handlers, so the focus moves only after a reveal or a Hide (never at mount, also in StrictMode).
  const moveFocus = useRef(false);
  useEffect(() => {
    if (!moveFocus.current || open) return;
    moveFocus.current = false;
    // A timer, so this runs after the dialog gave the focus back (it has no trigger to take it).
    setTimeout(() => (value === null ? reveal : hide).current?.focus());
  }, [value, open]);

  if (value !== null)
    return (
      <span className="inline-flex min-w-0 items-center gap-1">
        <span className="min-w-0 break-all font-mono text-sm">{value}</span>
        <CopyButton value={value} iconOnly />
        <Button ref={hide} variant="ghost" size="sm" aria-label={s.hideValue(label)} onClick={() => ((moveFocus.current = true), setValue(null))}>
          <EyeOff aria-hidden />
          {s.hide}
        </Button>
      </span>
    );
  if (!canReveal) return <span className="text-fg-3">{s.maskedHidden}</span>;

  // The dialog closes itself when its action resolves; a rejection keeps it open.
  const ask = () => Promise.resolve().then(onReveal).then((v) => ((moveFocus.current = true), setValue(v)));
  const quiet = () => {
    setLoading(true);
    // The value stays hidden on a failure: the app reports the error itself.
    ask().catch(() => {}).finally(() => setLoading(false));
  };
  return (
    <span className="inline-flex items-center gap-1">
      <span aria-hidden className="font-mono text-sm">••••••••</span>
      <span className="sr-only">{s.maskedHidden}</span>
      <Button ref={reveal} variant="ghost" size="sm" loading={loading} aria-label={s.revealValue(label)} onClick={confirm ? () => setOpen(true) : quiet}>
        <Eye aria-hidden />
        {s.reveal}
      </Button>
      {confirm && <AlertDialog open={open} onOpenChange={setOpen} title={confirm.title} description={confirm.description} action={confirm.action ?? s.show} onAction={ask} />}
    </span>
  );
}
