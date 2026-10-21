import { useId, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { fieldContext } from "./field";

/** A group of settings: h2 title, description, rows divided by lines, and an optional footer (a Save button) at the end. */
export function SettingsSection({
  title,
  description,
  children,
  footer,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
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
      {footer && <div className="flex flex-wrap justify-end gap-2">{footer}</div>}
    </section>
  );
}

/**
 * One setting: label and description on the start side, the control on the end side from 768 px; stacked on phones.
 * For a single field, give the control an `id` and pass the same `controlId`: the label then names the field.
 * Without it the row is a group named by the label (for switches or checkboxes that have their own labels).
 * With it the row is not a group (its name would repeat the label); controls that use useFieldControl get the description.
 */
export function SettingsRow({
  label,
  description,
  control,
  controlId,
  className,
}: {
  label: ReactNode;
  description?: ReactNode;
  control: ReactNode;
  controlId?: string;
  className?: string;
}) {
  const id = useId();
  const Label = controlId ? "label" : "p";
  return (
    <div
      role={controlId ? undefined : "group"}
      aria-labelledby={controlId ? undefined : `${id}-label`}
      aria-describedby={description && !controlId ? `${id}-description` : undefined}
      className={cn("grid gap-3 py-5 md:grid-cols-2 md:items-center md:gap-8", className)}
    >
      <div className="grid gap-1">
        <Label id={`${id}-label`} htmlFor={controlId} className="text-sm font-medium text-fg">
          {label}
        </Label>
        {description && (
          <p id={`${id}-description`} className="text-sm text-fg-3">
            {description}
          </p>
        )}
      </div>
      <div className="grid min-w-0 gap-3 md:justify-items-end">
        {controlId ? (
          <fieldContext.Provider value={{ id: controlId, labelId: `${id}-label`, describedBy: description ? `${id}-description` : undefined, invalid: false }}>
            {control}
          </fieldContext.Provider>
        ) : (
          control
        )}
      </div>
    </div>
  );
}
