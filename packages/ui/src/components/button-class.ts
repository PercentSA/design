import { cn } from "../lib/cn";

const VARIANT = {
  primary: "bg-primary text-primary-fg font-semibold hover:bg-primary/85",
  secondary: "border border-line-strong text-fg-2 hover:border-fg-3 hover:text-fg",
  ghost: "text-fg-2 hover:bg-surface-2 hover:text-fg",
  danger: "bg-danger text-danger-fg font-semibold hover:bg-danger/85",
  link: "text-fg underline decoration-line-strong underline-offset-4 hover:decoration-fg",
} as const;

// md and lg follow the density tokens (smaller in data-density="compact").
const SIZE = {
  sm: "h-8 px-3 text-xs",
  md: "h-(--p-control-h-sm) px-[18px] text-[13px]",
  lg: "h-(--p-control-h) px-6 text-sm",
} as const;
const ICON_SIZE = { sm: "size-8", md: "size-(--p-control-h-sm)", lg: "size-(--p-control-h)" } as const;
const LINK_SIZE = { sm: "text-xs", md: "text-[13px]", lg: "text-sm" } as const;

export type ButtonVariant = keyof typeof VARIANT;
export type ButtonSize = keyof typeof SIZE;

export const buttonClass = (variant: ButtonVariant = "primary", size: ButtonSize = "md", iconOnly = false) =>
  cn(
    "relative inline-flex shrink-0 items-center justify-center gap-2 rounded-pill font-medium whitespace-nowrap transition-colors",
    "disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
    VARIANT[variant],
    variant === "link" ? cn("h-auto p-0", LINK_SIZE[size]) : iconOnly ? cn(ICON_SIZE[size], "p-0") : SIZE[size],
  );
