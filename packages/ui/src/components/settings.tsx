"use client";

import { useId, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { useStrings, useText } from "../provider";
import { fieldContext } from "./field";

/**
 * A group of settings: h2 title, description, rows divided by lines, and an optional footer (a Save button) at the end.
 * `status` is a short state at the start of the footer ("Unsaved changes", "Changes saved."), read politely. It shows with
 * `footer`. Pass `null` while there is nothing to say, so the region exists before the first change and the change is announced.
 */
export function SettingsSection({
  title,
  description,
  children,
  footer,
  status,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  status?: ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <section aria-labelledby={id} className={cn("grid gap-6", className)}>
      <div className="grid gap-1.5">
        <h2 id={id} className="heading text-xl">
          {title}
        </h2>
        {description && <p className="text-sm text-fg-2">{description}</p>}
      </div>
      <div className="divide-y divide-line border-y border-line">{children}</div>
      {footer &&
        (status === undefined ? (
          <div className="flex flex-wrap justify-end gap-2">{footer}</div>
        ) : (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <div role="status" className="min-w-0 basis-full text-sm text-fg-2 sm:flex-1 sm:basis-0">
              {status}
            </div>
            <div className="flex flex-wrap justify-end gap-2 max-sm:w-full">{footer}</div>
          </div>
        ))}
    </section>
  );
}

/**
 * One setting: label and description on the start side, the control on the end side from 768 px; stacked on phones.
 * For a single field, give the control an `id` and pass the same `controlId`: the label then names the field.
 * Without it the row is a group named by the label (for switches or checkboxes that have their own labels).
 * With it the row is not a group (its name would repeat the label); controls that use useFieldControl get the description.
 * `error` shows under the control and is announced at once. With `controlId` the control gets `aria-invalid` and the error in
 * `aria-describedby`; a group row names the error in its own description. `required` and `optional` mark the label, as Field does.
 */
export function SettingsRow({
  label,
  description,
  control,
  controlId,
  error,
  required,
  optional,
  className,
}: {
  label: ReactNode;
  description?: ReactNode;
  control: ReactNode;
  controlId?: string;
  error?: ReactNode;
  required?: boolean;
  optional?: boolean;
  className?: string;
}) {
  const s = useStrings();
  const t = useText();
  const id = useId();
  const errorId = error ? `${id}-error` : undefined;
  const Label = controlId ? "label" : "p";
  return (
    <div
      role={controlId ? undefined : "group"}
      aria-labelledby={controlId ? undefined : `${id}-label`}
      aria-describedby={controlId ? undefined : [description && `${id}-description`, errorId].filter(Boolean).join(" ") || undefined}
      className={cn("grid gap-3 py-5 md:grid-cols-2 md:items-center md:gap-8", className)}
    >
      <div className="grid gap-1">
        <Label id={`${id}-label`} htmlFor={controlId} className="text-sm font-medium text-fg">
          {label}
          {required && <span aria-hidden="true" className="text-fg-3"> *</span>}
          {optional && <span className="ms-2 text-xs font-normal text-fg-3">{t(s.optional)}</span>}
        </Label>
        {description && (
          <p id={`${id}-description`} className="text-sm text-fg-3">
            {description}
          </p>
        )}
      </div>
      <div className="grid min-w-0 gap-3 md:justify-items-end">
        {controlId ? (
          <fieldContext.Provider value={{ id: controlId, labelId: `${id}-label`, describedBy: [description && `${id}-description`, errorId].filter(Boolean).join(" ") || undefined, invalid: !!error, required }}>
            {control}
          </fieldContext.Provider>
        ) : (
          control
        )}
        {error && (
          <p id={errorId} role="alert" className="text-sm text-danger md:text-end">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
