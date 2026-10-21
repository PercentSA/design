import { useId, useState, type ComponentProps, type ReactNode } from "react";
import { Check } from "lucide-react";
import { Checkbox as RadixCheckbox, RadioGroup as RadixRadioGroup, Switch as RadixSwitch } from "radix-ui";
import { cn } from "../lib/cn";

const ROW = "inline-flex cursor-pointer items-start gap-3 text-sm text-fg-2 has-disabled:cursor-not-allowed has-disabled:opacity-50";

function RowText({ id, label, description }: { id: string; label: ReactNode; description?: ReactNode }) {
  return (
    <span className="grid gap-0.5">
      <span id={`${id}-label`} className="text-fg">{label}</span>
      {description && <span id={`${id}-desc`} className="text-fg-3">{description}</span>}
    </span>
  );
}

// With a description, the label text alone names the control (unless the app named it) and the description is read after the name.
const rowAria = (id: string, description?: ReactNode, describedBy?: string, ownName?: string) => ({
  "aria-labelledby": description && !ownName ? `${id}-label` : undefined,
  "aria-describedby": [description ? `${id}-desc` : undefined, describedBy].filter(Boolean).join(" ") || undefined,
});

export function Checkbox({
  label,
  description,
  className,
  "aria-describedby": describedBy,
  ...props
}: ComponentProps<typeof RadixCheckbox.Root> & { label: ReactNode; description?: ReactNode }) {
  const id = useId();
  return (
    <label className={cn(ROW, className)}>
      <RadixCheckbox.Root
        className="mt-px grid size-5 shrink-0 place-items-center rounded-md border border-line-strong bg-surface text-primary-fg transition-colors data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary"
        {...rowAria(id, description, describedBy, props["aria-label"])}
        {...props}
      >
        <RadixCheckbox.Indicator>
          {props.checked === "indeterminate" ? <span className="block h-0.5 w-2.5 bg-current" /> : <Check aria-hidden className="size-3.5" strokeWidth={3} />}
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
      <RowText id={id} label={label} description={description} />
    </label>
  );
}

export function Switch({
  label,
  description,
  className,
  "aria-describedby": describedBy,
  ...props
}: ComponentProps<typeof RadixSwitch.Root> & { label: ReactNode; description?: ReactNode }) {
  const id = useId();
  return (
    <label className={cn(ROW, "items-center", className)}>
      <RadixSwitch.Root
        className="inline-flex h-6 w-10 shrink-0 items-center rounded-pill bg-line-strong p-0.5 transition-colors data-[state=checked]:bg-primary"
        {...rowAria(id, description, describedBy, props["aria-label"])}
        {...props}
      >
        <RadixSwitch.Thumb className="block size-5 rounded-pill bg-fg transition-transform duration-(--p-duration-fast) data-[state=checked]:translate-x-4 data-[state=checked]:bg-primary-fg rtl:data-[state=checked]:-translate-x-4" />
      </RadixSwitch.Root>
      <RowText id={id} label={label} description={description} />
    </label>
  );
}

export type ChoiceOption = { value: string; label: ReactNode; description?: ReactNode; disabled?: boolean };

export function RadioGroup({ options, className, ...props }: ComponentProps<typeof RadixRadioGroup.Root> & { options: ChoiceOption[] }) {
  const id = useId();
  return (
    <RadixRadioGroup.Root className={cn("grid gap-3", className)} {...props}>
      {options.map((o, i) => (
        <label key={o.value} className={ROW}>
          <RadixRadioGroup.Item
            value={o.value}
            disabled={o.disabled}
            className="mt-px grid size-5 shrink-0 place-items-center rounded-pill border border-line-strong bg-surface data-[state=checked]:border-primary"
            {...rowAria(`${id}-${i}`, o.description)}
          >
            <RadixRadioGroup.Indicator className="block size-2.5 rounded-pill bg-primary" />
          </RadixRadioGroup.Item>
          <RowText id={`${id}-${i}`} label={o.label} description={o.description} />
        </label>
      ))}
    </RadixRadioGroup.Root>
  );
}

type NativeChoiceProps = {
  type: "checkbox" | "radio";
  name: string;
  options: ChoiceOption[];
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  /** Radio only: a second click clears the choice (for optional questions). */
  clearable?: boolean;
  className?: string;
};

// Native inputs, so the choices post with the form even before JavaScript loads.
function useNativeChoices({ type, value, defaultValue, onValueChange, clearable }: NativeChoiceProps) {
  const [inner, setInner] = useState(defaultValue ?? []);
  const current = value ?? inner;
  const set = (next: string[]) => {
    if (value === undefined) setInner(next);
    onValueChange?.(next);
  };
  return (o: ChoiceOption) => ({
    checked: current.includes(o.value),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      set(type === "radio" ? [o.value] : e.target.checked ? [...current, o.value] : current.filter((v) => v !== o.value)),
    onClick: () => type === "radio" && clearable && current.includes(o.value) && set([]),
  });
}

const PEER_FOCUS = "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-fg";

/** Pill-shaped choices in a row (services, topics). Put it in a <Fieldset> with a legend. */
export function ChipGroup(props: NativeChoiceProps) {
  const state = useNativeChoices(props);
  return (
    <div className={cn("flex flex-wrap gap-2", props.className)}>
      {props.options.map((o) => (
        <label key={o.value} className="cursor-pointer has-disabled:cursor-not-allowed has-disabled:opacity-50">
          <input type={props.type} name={props.name} value={o.value} disabled={o.disabled} className="peer sr-only" {...state(o)} />
          <span
            className={cn(
              "inline-flex rounded-pill border border-line-strong px-4 py-2.5 text-sm text-fg-2 transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-fg [input:not(:checked)+&]:hover:border-fg-3 [input:not(:checked)+&]:hover:text-fg",
              PEER_FOCUS,
            )}
          >
            {o.label}
          </span>
        </label>
      ))}
    </div>
  );
}

/** Large choices with a description (plans, engagement types). Put it in a <Fieldset> with a legend. */
export function ChoiceCardGroup(props: NativeChoiceProps) {
  const state = useNativeChoices(props);
  const id = useId();
  return (
    <div className={cn("grid gap-3 sm:grid-cols-[repeat(auto-fill,minmax(16rem,1fr))]", props.className)}>
      {props.options.map((o, i) => (
        <label key={o.value} className="cursor-pointer has-disabled:cursor-not-allowed has-disabled:opacity-50">
          <input
            type={props.type}
            name={props.name}
            value={o.value}
            disabled={o.disabled}
            className="peer sr-only"
            {...rowAria(`${id}-${i}`, o.description)}
            {...state(o)}
          />
          <span
            className={cn(
              "relative flex h-full flex-col gap-1 rounded-card border border-line bg-surface p-5 pe-12 transition-colors peer-checked:border-primary [input:not(:checked)+&]:hover:border-line-strong",
              "[input:checked+&_.p-check]:border-primary [input:checked+&_.p-check]:bg-primary [input:checked+&_.p-check]:text-primary-fg",
              PEER_FOCUS,
            )}
          >
            <span className="p-check absolute end-5 top-5 grid size-5 place-items-center rounded-pill border border-line-strong text-transparent">
              <Check aria-hidden className="size-3" strokeWidth={3} />
            </span>
            <span id={o.description ? `${id}-${i}-label` : undefined} className="text-base font-medium text-fg">
              {o.label}
            </span>
            {o.description && (
              <span id={`${id}-${i}-desc`} className="text-sm text-fg-2">
                {o.description}
              </span>
            )}
          </span>
        </label>
      ))}
    </div>
  );
}
