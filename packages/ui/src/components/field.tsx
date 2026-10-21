"use client";

import { createContext, useContext, useId, type AriaAttributes, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { useStrings, useText } from "../provider";

type FieldCtx = { id: string; labelId: string; describedBy?: string; invalid: boolean; required?: boolean };
export const fieldContext = createContext<FieldCtx | null>(null);

const join = (...ids: (string | undefined)[]) => ids.filter(Boolean).join(" ") || undefined;

/** Props a control inside <Field> needs: id, description, invalid and required state. Its own props win. */
export function useFieldControl<P extends { id?: string; "aria-describedby"?: string; "aria-invalid"?: AriaAttributes["aria-invalid"]; required?: boolean }>(
  props: P,
): P {
  const f = useContext(fieldContext);
  if (!f) return props;
  return {
    ...props,
    id: props.id ?? f.id,
    "aria-describedby": join(f.describedBy, props["aria-describedby"]),
    "aria-invalid": props["aria-invalid"] ?? (f.invalid || undefined),
    required: props.required ?? f.required,
  };
}

/** The label id of the surrounding <Field>, for controls that are not labelable elements (sliders, groups). */
export const useFieldLabelId = () => useContext(fieldContext)?.labelId;

const LABEL = "text-sm font-medium text-fg-2";
const HINT = "text-sm text-fg-3";
const ERROR = "text-sm text-danger";

/**
 * Label + control + hint + error. The control inside gets the id, `aria-describedby` and
 * `aria-invalid` automatically. `count`/`max` show a character counter.
 */
export function Field({
  label,
  hint,
  error,
  required,
  optional,
  count,
  max,
  id,
  className,
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  optional?: boolean;
  count?: number;
  max?: number;
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  const s = useStrings();
  const t = useText();
  const auto = useId();
  const cid = id ?? auto;
  const ids = { hint: hint ? `${cid}-hint` : undefined, count: max != null ? `${cid}-count` : undefined, error: error ? `${cid}-error` : undefined };
  const ctx: FieldCtx = { id: cid, labelId: `${cid}-label`, describedBy: join(ids.hint, ids.count, ids.error), invalid: !!error, required };
  return (
    <div className={cn("grid gap-2.5", className)}>
      <div className="flex items-baseline justify-between gap-4">
        <label id={ctx.labelId} htmlFor={cid} className={LABEL}>
          {label}
          {required && <span aria-hidden="true" className="text-fg-3"> *</span>}
        </label>
        {optional && <span className="text-xs text-fg-3">{t(s.optional)}</span>}
        {max != null && (
          <span aria-hidden="true" className="text-xs text-fg-3 tabular-nums" dir="ltr">
            {count ?? 0}/{max}
          </span>
        )}
      </div>
      <fieldContext.Provider value={ctx}>{children}</fieldContext.Provider>
      {hint && <p id={ids.hint} className={HINT}>{hint}</p>}
      {max != null && <span id={ids.count} className="sr-only">{s.characters(count ?? 0, max)}</span>}
      {error && <p id={ids.error} className={ERROR}>{error}</p>}
    </div>
  );
}

/** A group of choices (checkboxes, radios, chips, cards) with a legend, hint and error. */
export function Fieldset({
  legend,
  hint,
  error,
  className,
  children,
}: {
  legend: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <fieldset aria-describedby={join(hintId, errorId)} aria-invalid={error ? true : undefined} className={cn("min-w-0", className)}>
      <legend className={cn(LABEL, "mb-4")}>{legend}</legend>
      {children}
      {hint && <p id={hintId} className={cn(HINT, "mt-2.5")}>{hint}</p>}
      {error && <p id={errorId} className={cn(ERROR, "mt-2.5")}>{error}</p>}
    </fieldset>
  );
}

/** Bots fill every field; people never see this one. Reject the form on the server when it has a value. */
export function Honeypot({ name, label = "Company website" }: { name: string; label?: string }) {
  return (
    <div aria-hidden="true" className="absolute -start-[9999px] top-0 size-px overflow-hidden">
      <label>
        {label}
        <input type="text" name={name} tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}
