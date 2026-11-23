"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { Ellipsis, Upload } from "lucide-react";
import { useStrings } from "../provider";
import type { DateInput } from "../saudi/date-time";
import { Button } from "./actions";
import { Field } from "./field";
import { FormSheet } from "./form-sheet";
import { MONO_INPUT } from "./input-classes";
import { Textarea } from "./inputs";
import { PasswordInput } from "./special-inputs";
import { DropdownMenu } from "./menus";
import { AlertDialog } from "./overlays";
import { SettingsRow } from "./settings";
import { TimeText } from "./time-text";
import { cn } from "../lib/cn";
import { acceptsFile } from "../lib/files";

// A key or a certificate is a few KB; a larger file is not a secret text file.
const MAX_FILE_BYTES = 1_000_000;

export type SecretRowProps = {
  label: string;
  description?: ReactNode;
  /** Only whether the value is set, and when and by whom it changed. The value itself never comes to the browser. */
  secret: { set: boolean; changedAt?: DateInput; changedBy?: ReactNode };
  canEdit: boolean;
  /** A missing required value shows in the warning color. */
  required?: boolean;
  /** What a missing value stops. */
  stops?: ReactNode;
  /** Who may set it. Shown when `canEdit` is false. */
  owner?: ReactNode;
  /** A long text (a certificate key): the field is a text area of 8 rows. */
  pem?: boolean;
  /** Saves the new value. A rejected Promise keeps the sheet open and shows the error's `message` under the field. */
  onSave: (value: string) => Promise<void>;
  /** Shows "Remove" in a "⋯" menu while the value is set. A rejected Promise only stops the confirm dialog's spinner: the app shows the error (for example a toast). */
  onRemove?: () => Promise<void>;
  removeConfirm?: { title: ReactNode; description?: ReactNode };
  /** The word for the menu item and the confirm action. Default: the provider string "Remove". */
  removeLabel?: ReactNode;
  /** A line under the sheet title. */
  sheetDescription?: ReactNode;
  /** A line under the field. */
  hint?: ReactNode;
  /** A button in the sheet that reads a chosen text file into the field (a certificate, a key file). `accept` is the file input's `accept`. Another type or a file over 1 MB is refused. The content goes only into the field. */
  file?: { accept: string; label: ReactNode };
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

/**
 * A secret setting. It shows only whether the value is set and when it changed; a new value is typed in a sheet.
 * The typed value stays in the sheet's state only and is emptied at each close.
 * The field has `autocomplete="off"`, not `new-password`: this is an API key, not an account password, and `new-password` makes browsers offer a generated password.
 */
export function SecretRow({ label, description, secret, canEdit, required, stops, owner, pem, onSave, onRemove, removeConfirm, removeLabel, sheetDescription, hint, file, open, onOpenChange }: SecretRowProps) {
  const s = useStrings();
  const id = useId();
  const [inner, setInner] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const [removing, setRemoving] = useState(false);
  const picker = useRef<HTMLInputElement>(null);
  // A file read that ends after the sheet closed (or closed and opened again) is ignored.
  const reads = useRef(0);
  const shown = open ?? inner;
  useEffect(() => void reads.current++, [shown]);
  const [wasShown, setWasShown] = useState(shown);
  // Empty the typed value at each open and close, while rendering (not in an effect).
  if (shown !== wasShown) {
    setWasShown(shown);
    setValue("");
    setError(undefined);
  }
  const setOpen = (o: boolean) => {
    if (open === undefined) setInner(o);
    onOpenChange?.(o);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (pending) return;
    if (value === "") return setError(s.enterValue);
    setPending(true);
    setError(undefined);
    // A throw at once acts as a rejected save.
    Promise.resolve().then(() => onSave(value)).then(
      () => (setPending(false), setOpen(false)),
      (err: unknown) => (setPending(false), setError(err instanceof Error ? err.message : String(err))),
    );
  };

  const readFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const chosen = input.files?.[0];
    // Emptied, so the same file can be chosen again.
    input.value = "";
    if (!chosen || !file) return;
    if (!acceptsFile(chosen, file.accept)) return setError(s.errors.fileType);
    if (chosen.size > MAX_FILE_BYTES) return setError(s.errors.fileTooLarge(MAX_FILE_BYTES / 1_000_000));
    const mine = ++reads.current;
    try {
      const text = await chosen.text();
      if (mine !== reads.current) return;
      setValue(text);
      setError(undefined);
    } catch {
      if (mine === reads.current) setError(s.errors.fileRead);
    }
  };

  const common = { value, onChange: (e: ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => setValue(e.target.value), autoComplete: "off", spellCheck: false } as const;
  const missing = !secret.set;
  const status = (
    <div className="grid gap-0.5 text-sm md:justify-items-end">
      <span className={cn(missing ? (required ? "text-warning" : "text-fg-3") : "text-fg")}>{secret.set ? s.secretSet : s.secretNotSet}</span>
      {secret.set && secret.changedAt != null && (
        <span className="text-fg-3">
          {s.changed} <TimeText value={secret.changedAt} ago />
          {secret.changedBy != null && secret.changedBy !== "" && (
            <>
              {" "}
              {s.by} {secret.changedBy}
            </>
          )}
        </span>
      )}
      {missing && stops != null && stops !== "" && (
        <span className="text-fg-3">
          {s.withoutIt} {stops}
        </span>
      )}
      {!canEdit && owner != null && owner !== "" && <span className="text-fg-3">{owner}</span>}
    </div>
  );

  return (
    <>
      <SettingsRow
        label={label}
        description={description}
        required={required}
        control={
          <div className="flex min-w-0 items-center gap-2 max-md:flex-wrap">
            {status}
            {canEdit && (
              <>
                <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
                  {secret.set ? s.changeValue : s.setValue}
                </Button>
                {onRemove && secret.set && (
                  <DropdownMenu
                    align="end"
                    trigger={
                      <Button variant="ghost" size="sm" iconOnly aria-label={s.moreActions}>
                        <Ellipsis aria-hidden />
                      </Button>
                    }
                    items={[{ label: removeLabel ?? s.removeAction, danger: true, onSelect: () => setRemoving(true) }]}
                  />
                )}
              </>
            )}
          </div>
        }
      />
      {canEdit && (
        <FormSheet title={`${secret.set ? s.changeValue : s.setValue} ${label}`} submitLabel={secret.set ? s.changeValue : s.setValue} description={sheetDescription} side="auto" open={shown} onOpenChange={setOpen} pending={pending} dirty={value !== ""} onSubmit={submit}>
          <Field id={`${id}-value`} label={s.newValue} hint={hint} error={error}>
            {pem ? (
              <Textarea rows={8} className="font-mono" {...MONO_INPUT} {...common} />
            ) : (
              <PasswordInput {...common} />
            )}
          </Field>
          {file && (
            <>
              <input ref={picker} type="file" accept={file.accept} tabIndex={-1} aria-hidden className="sr-only" onChange={readFile} />
              <Button type="button" variant="secondary" size="sm" className="justify-self-start" onClick={() => picker.current?.click()}>
                <Upload aria-hidden />
                {file.label}
              </Button>
            </>
          )}
        </FormSheet>
      )}
      {canEdit && onRemove && (
        <AlertDialog
          open={removing}
          onOpenChange={setRemoving}
          title={removeConfirm?.title ?? s.removeValue(label)}
          description={removeConfirm?.description}
          action={removeLabel ?? s.removeAction}
          destructive
          onAction={onRemove}
        />
      )}
    </>
  );
}
