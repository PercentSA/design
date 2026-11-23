"use client";

import { useId, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { Ellipsis } from "lucide-react";
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
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

/**
 * A secret setting. It shows only whether the value is set and when it changed; a new value is typed in a sheet.
 * The typed value stays in the sheet's state only and is emptied at each close.
 * The field has `autocomplete="off"`, not `new-password`: this is an API key, not an account password, and `new-password` makes browsers offer a generated password.
 */
export function SecretRow({ label, description, secret, canEdit, required, stops, owner, pem, onSave, onRemove, removeConfirm, open, onOpenChange }: SecretRowProps) {
  const s = useStrings();
  const id = useId();
  const [inner, setInner] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const [removing, setRemoving] = useState(false);
  const shown = open ?? inner;
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
                    items={[{ label: s.removeAction, danger: true, onSelect: () => setRemoving(true) }]}
                  />
                )}
              </>
            )}
          </div>
        }
      />
      {canEdit && (
        <FormSheet title={label} side="auto" open={shown} onOpenChange={setOpen} pending={pending} dirty={value !== ""} onSubmit={submit}>
          <Field id={`${id}-value`} label={s.newValue} error={error}>
            {pem ? (
              <Textarea rows={8} className="font-mono" {...MONO_INPUT} {...common} />
            ) : (
              <PasswordInput {...common} />
            )}
          </Field>
        </FormSheet>
      )}
      {canEdit && onRemove && (
        <AlertDialog
          open={removing}
          onOpenChange={setRemoving}
          title={removeConfirm?.title ?? s.removeValue(label)}
          description={removeConfirm?.description}
          action={s.removeAction}
          destructive
          onAction={onRemove}
        />
      )}
    </>
  );
}
