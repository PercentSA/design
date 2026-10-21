import type { ComponentProps, ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Select as RadixSelect, Slider as RadixSlider } from "radix-ui";
import { cn } from "../lib/cn";
import { useStrings } from "../provider";
import { useFieldControl, useFieldLabelId } from "./field";

/** The box every text control shares. Height and padding follow the density tokens. */
export const FIELD_BOX =
  "w-full min-w-0 rounded-field border border-line-strong bg-surface text-base text-fg transition-colors hover:border-fg-3 aria-invalid:border-danger disabled:cursor-not-allowed disabled:opacity-50";
export const TEXT_BOX = cn(FIELD_BOX, "h-(--p-control-h) px-(--p-control-px) placeholder:text-fg-3");

export function Input({
  start,
  end,
  className,
  ...props
}: ComponentProps<"input"> & {
  /** Content before the text (icon, country code, Riyal sign); the box grows around it. */
  start?: ReactNode;
  end?: ReactNode;
}) {
  const p = useFieldControl(props);
  if (!start && !end) return <input className={cn(TEXT_BOX, className)} {...p} />;
  return (
    <div
      className={cn(
        TEXT_BOX,
        "flex items-center gap-2 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-3 has-[input:focus-visible]:outline-fg",
        (p["aria-invalid"] === true || p["aria-invalid"] === "true") && "border-danger",
        p.disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      {start && <span className="flex shrink-0 items-center text-fg-3 [&_svg]:size-4">{start}</span>}
      <input className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-fg-3" {...p} />
      {end && <span className="flex shrink-0 items-center text-fg-3 [&_svg]:size-4">{end}</span>}
    </div>
  );
}

/** Grows with its text up to 24 rem, then scrolls. */
export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      rows={4}
      className={cn(FIELD_BOX, "field-sizing-content max-h-96 min-h-32 px-(--p-control-px) py-3 [overflow-wrap:anywhere] placeholder:text-fg-3", className)}
      {...useFieldControl(props)}
    />
  );
}

export type SelectOption = { value: string; label: ReactNode; disabled?: boolean };

const MENU = "z-(--p-z-overlay) overflow-hidden rounded-field border border-line bg-surface-2 text-fg shadow-overlay";
export const MENU_ITEM =
  "relative flex cursor-default items-center gap-2 rounded-lg py-2 ps-3 pe-8 text-sm text-fg-2 outline-none select-none data-disabled:opacity-50 data-highlighted:bg-fg/10 data-highlighted:text-fg";

export function Select({
  options,
  placeholder,
  valueText,
  className,
  id,
  "aria-label": label,
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
  ...root
}: ComponentProps<typeof RadixSelect.Root> & {
  options: SelectOption[];
  placeholder?: ReactNode;
  /** What the closed menu shows instead of the chosen item's text (a short code, for example). */
  valueText?: ReactNode;
  className?: string;
  id?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}) {
  const { required, ...trigger } = useFieldControl({ id, "aria-describedby": describedBy, "aria-invalid": invalid, required: root.required });
  return (
    <RadixSelect.Root {...root} required={required}>
      <RadixSelect.Trigger
        {...trigger}
        aria-label={label}
        className={cn(TEXT_BOX, "group flex items-center justify-between gap-2 text-start data-placeholder:text-fg-3", className)}
      >
        <RadixSelect.Value placeholder={placeholder}>{valueText}</RadixSelect.Value>
        <RadixSelect.Icon>
          <ChevronDown aria-hidden className="size-4 text-fg-3 transition-transform group-data-[state=open]:rotate-180" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content position="popper" sideOffset={6} className={cn(MENU, "max-h-(--radix-select-content-available-height) min-w-(--radix-select-trigger-width)")}>
          <RadixSelect.Viewport className="p-1.5">
            {options.map((o) => (
              <RadixSelect.Item key={o.value} value={o.value} disabled={o.disabled} className={MENU_ITEM}>
                <RadixSelect.ItemText>{o.label}</RadixSelect.ItemText>
                <RadixSelect.ItemIndicator className="absolute end-3">
                  <Check aria-hidden className="size-4" />
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}

/**
 * One or two thumbs (a range). Inside <Field> one thumb takes the field label. A range is a group with the
 * field label (or `aria-label`); its thumbs are named Minimum and Maximum, or `thumbLabels`.
 */
export function Slider({
  className,
  "aria-label": label,
  thumbLabels,
  ...props
}: ComponentProps<typeof RadixSlider.Root> & { /** One name per thumb. */ thumbLabels?: string[] }) {
  const s = useStrings();
  const labelledBy = useFieldLabelId();
  const thumbs = (props.value ?? props.defaultValue ?? [0]).length;
  const range = thumbs > 1;
  const names = thumbLabels ?? (thumbs === 2 ? [s.minimum, s.maximum] : []);
  return (
    <RadixSlider.Root
      role={range ? "group" : undefined}
      aria-label={range ? label : undefined}
      aria-labelledby={range && !label ? labelledBy : undefined}
      className={cn("relative flex h-6 w-full touch-none items-center select-none data-disabled:opacity-50", className)}
      {...props}
    >
      <RadixSlider.Track className="relative h-1 grow overflow-hidden rounded-pill bg-line-strong">
        <RadixSlider.Range className="absolute h-full bg-primary" />
      </RadixSlider.Track>
      {Array.from({ length: thumbs }, (_, i) => (
        <RadixSlider.Thumb
          key={i}
          aria-label={names[i] ?? label}
          aria-labelledby={names[i] || label ? undefined : labelledBy}
          className="block size-5 rounded-pill border-2 border-primary bg-bg transition-transform hover:scale-110"
        />
      ))}
    </RadixSlider.Root>
  );
}
