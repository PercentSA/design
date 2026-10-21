"use client";

import { useEffect, useRef, useState, type ComponentProps, type HTMLAttributes } from "react";
import { ArrowUp, Check, Copy } from "lucide-react";
import { Slot, Toggle as RadixToggle, ToggleGroup as RadixToggleGroup } from "radix-ui";
import { cn } from "../lib/cn";
import { useSlidingIndicator } from "../lib/sliding-indicator";
import { useStrings, useText } from "../provider";
import { Spinner } from "./spinner";
import { buttonClass } from "./button-class";
import type { ButtonVariant, ButtonSize } from "./button-class";

type ButtonProps = Omit<ComponentProps<"button">, "aria-label"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Disables the button and shows the spinner; the label keeps the width. */
  loading?: boolean;
  /** Renders the child element (a link) with button styles. */
  asChild?: boolean;
} & ({ iconOnly?: false; "aria-label"?: string } | { iconOnly: true; "aria-label": string });

export function Button({ variant, size, loading, asChild, iconOnly, className, children, disabled, type = "button", ...rest }: ButtonProps) {
  const s = useStrings();
  if (asChild) return <Slot.Root className={cn(buttonClass(variant, size, iconOnly), className)} {...rest}>{children}</Slot.Root>;
  return (
    <button
      type={type}
      disabled={disabled}
      // Loading: aria-disabled, not disabled, so the button keeps focus and its name; clicks do nothing.
      aria-disabled={loading || undefined}
      aria-busy={loading || undefined}
      className={cn(buttonClass(variant, size, iconOnly), loading && "cursor-progress", className)}
      {...rest}
      onClick={loading ? (e) => e.preventDefault() : rest.onClick}
    >
      {loading ? (
        <>
          <span className="inline-flex items-center gap-2 opacity-0">{children}</span>
          <span className="absolute inset-0 grid place-items-center">
            <Spinner decorative />
          </span>
          <span className="sr-only">{s.loading}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

export const ButtonGroup = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div role="group" className={cn("inline-flex flex-wrap items-center gap-2", className)} {...rest} />
);

const TOGGLE_ITEM =
  "inline-flex h-8 min-w-8 items-center justify-center gap-2 rounded-pill px-3 text-[13px] font-medium text-fg-2 transition-colors hover:text-fg data-[state=on]:bg-surface-2 data-[state=on]:text-fg disabled:opacity-50 [&_svg]:size-4";

export const Toggle = ({ className, ...rest }: ComponentProps<typeof RadixToggle.Root>) => (
  <RadixToggle.Root className={cn(TOGGLE_ITEM, className)} {...rest} />
);

type Option = { value: string; label: React.ReactNode; disabled?: boolean };
type GroupBase = { options: Option[]; className?: string; "aria-label"?: string; disabled?: boolean };

const GROUP = "inline-flex items-center gap-1 rounded-pill border border-line bg-surface p-1";

/** One choice out of a few, always one chosen (billing period, view mode). */
export function SegmentedControl({
  options,
  value,
  defaultValue,
  onValueChange,
  className,
  ...rest
}: GroupBase & { value?: string; defaultValue?: string; onValueChange?: (value: string) => void }) {
  // Radix clears the choice when the chosen item is clicked; a segmented control keeps one chosen,
  // so the component holds the value itself when the app does not.
  const [inner, setInner] = useState(defaultValue);
  // After the first measure one pill slides between the options; before it, the chosen option draws its own.
  const [ref, pill] = useSlidingIndicator<HTMLDivElement>("data-state", "on");
  return (
    <RadixToggleGroup.Root
      ref={ref}
      type="single"
      value={value ?? inner ?? ""}
      onValueChange={(v) => {
        if (!v) return;
        setInner(v);
        onValueChange?.(v);
      }}
      className={cn(GROUP, "relative isolate", className)}
      {...rest}
    >
      {pill && <span {...pill} className={cn(pill.className, "rounded-pill bg-primary")} />}
      {options.map((o) => (
        <RadixToggleGroup.Item
          key={o.value}
          value={o.value}
          disabled={o.disabled}
          // The label colour changes with the pill's time and easing: the chosen label does not turn primary-fg before the pill is under it.
          className={cn(
            TOGGLE_ITEM,
            "duration-(--p-duration-base) ease-(--p-ease-out) data-[state=on]:text-primary-fg",
            pill ? "data-[state=on]:bg-transparent" : "data-[state=on]:bg-primary",
          )}
        >
          {o.label}
        </RadixToggleGroup.Item>
      ))}
    </RadixToggleGroup.Root>
  );
}

/** Several on/off choices side by side (days of the week, text styles). */
export function ToggleGroup({
  options,
  className,
  ...rest
}: GroupBase & { value?: string[]; defaultValue?: string[]; onValueChange?: (value: string[]) => void }) {
  return (
    <RadixToggleGroup.Root type="multiple" className={cn(GROUP, className)} {...rest}>
      {options.map((o) => (
        <RadixToggleGroup.Item key={o.value} value={o.value} disabled={o.disabled} className={TOGGLE_ITEM}>
          {o.label}
        </RadixToggleGroup.Item>
      ))}
    </RadixToggleGroup.Root>
  );
}

/** Copies `value`; shows "Copied" for 2 s and announces it. */
export function CopyButton({ value, iconOnly, className }: { value: string; iconOnly?: boolean; className?: string }) {
  const s = useStrings();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      return; // no clipboard on http pages or without permission: keep "Copy"
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  };
  const label = copied ? s.copied : s.copy;
  const icon = copied ? <Check aria-hidden /> : <Copy aria-hidden />;
  return (
    <>
      {iconOnly ? (
        <Button variant="ghost" size="sm" iconOnly aria-label={label} onClick={copy} className={className}>
          {icon}
        </Button>
      ) : (
        <Button variant="ghost" size="sm" onClick={copy} className={className}>
          {icon}
          {label}
        </Button>
      )}
      <span role="status" className="sr-only">
        {copied ? s.copied : ""}
      </span>
    </>
  );
}

/** A plain link to #top: the browser scrolls to the top without JavaScript. */
export function BackToTop({ className }: { className?: string }) {
  return (
    <a href="#top" className={cn(buttonClass("secondary", "sm"), className)}>
      <ArrowUp aria-hidden />
      {useText()(useStrings().backToTop)}
    </a>
  );
}
