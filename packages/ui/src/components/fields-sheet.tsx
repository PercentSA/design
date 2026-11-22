"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { Field } from "./field";
import { Autocomplete } from "./autocomplete";
import type { AutocompleteSuggestion } from "./autocomplete-match";
import { FormSheet } from "./form-sheet";
import { Input } from "./inputs";
import { MONO_INPUT } from "./input-classes";
import { useMediaQuery } from "./utility";
import { cn } from "../lib/cn";

export type SheetField = {
  key: string;
  label: ReactNode;
  /** The saved text. The draft starts from it at each open. */
  value: string;
  hint?: ReactNode;
  mono?: boolean;
  /** Returns the error text, or nothing when the text is valid. There is no built-in required check. */
  check?: (text: string) => string | undefined;
  /** Shows the field as an Autocomplete. */
  suggestions?: AutocompleteSuggestion[];
};

const initial = (fields: SheetField[]) => Object.fromEntries(fields.map((f) => [f.key, f.value]));

/**
 * An edit sheet for one to three text fields. Errors show only after the first Save, then follow the input; a failed Save moves the
 * focus to the first error and does not call `onSubmit`. `onSubmit` returns nothing (the sheet closes) or a Promise (Save loads, the
 * sheet closes when it resolves and stays open when it is rejected: the app reports the error itself). It opens from the bottom below 768 px.
 */
export function FieldsSheet({
  title,
  description,
  fields,
  open,
  onOpenChange,
  onSubmit,
  submitLabel,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  fields: SheetField[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: Record<string, string>) => void | Promise<unknown>;
  submitLabel?: ReactNode;
  children?: ReactNode;
}) {
  const uid = useId();
  const wide = useMediaQuery("(min-width: 48rem)");
  const [draft, setDraft] = useState(() => initial(fields));
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);
  // Reset while rendering, not in an effect: StrictMode runs effects twice and would drop typed text.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setDraft(initial(fields));
      setSubmitted(false);
    }
  }
  const value = (f: SheetField) => draft[f.key] ?? f.value;
  const error = (f: SheetField) => (submitted ? f.check?.(value(f)) : undefined);
  const dirty = fields.some((f) => value(f) !== f.value);
  const idOf = (f: SheetField) => `${uid}-${f.key}`;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (pending) return;
    // flushSync: the field has its error (aria-invalid, aria-describedby) before it takes the focus
    flushSync(() => setSubmitted(true));
    const bad = fields.find((f) => f.check?.(value(f)));
    if (bad) return void document.getElementById(idOf(bad))?.focus();
    const result = onSubmit(Object.fromEntries(fields.map((f) => [f.key, value(f)])));
    if (!result || typeof (result as PromiseLike<unknown>).then !== "function") return onOpenChange(false);
    setPending(true);
    Promise.resolve(result).then(
      () => (setPending(false), onOpenChange(false)),
      // The sheet stays open; the app reports the error.
      () => setPending(false),
    );
  };

  return (
    <FormSheet title={title} description={description} open={open} onOpenChange={onOpenChange} side={wide ? "end" : "bottom"} dirty={dirty} pending={pending} submitLabel={submitLabel} onSubmit={submit}>
      {fields.map((f) => {
        const set = (text: string) => setDraft((d) => ({ ...d, [f.key]: text }));
        return (
          <Field key={f.key} id={idOf(f)} label={f.label} hint={f.hint} error={error(f)}>
            {f.suggestions ? (
              <Autocomplete value={value(f)} onValueChange={set} suggestions={f.suggestions} mono={f.mono} />
            ) : (
              <Input value={value(f)} onChange={(e) => set(e.target.value)} className={cn(f.mono && "font-mono")} {...(f.mono ? MONO_INPUT : {})} />
            )}
          </Field>
        );
      })}
      {children}
    </FormSheet>
  );
}
