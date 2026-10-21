import type { ComponentProps, CSSProperties, ElementType, HTMLAttributes } from "react";
import { AspectRatio as RadixAspectRatio, ScrollArea as RadixScrollArea, Separator as RadixSeparator } from "radix-ui";
import { cn } from "../lib/cn";

type Div = HTMLAttributes<HTMLDivElement>;

const WIDTH = { sm: "max-w-3xl", md: "max-w-5xl", lg: "max-w-7xl", xl: "max-w-[1440px]", full: "" } as const;

/** Page width + the page gutter (`--p-gutter`, 5vw). */
export const Container = ({ size = "xl", className, ...rest }: Div & { size?: keyof typeof WIDTH }) => (
  <div className={cn("mx-auto w-full px-(--p-gutter)", WIDTH[size], className)} {...rest} />
);

const SECTION = { sm: "py-12 md:py-16", md: "py-20 md:py-28", lg: "py-24 md:py-36" } as const;

export const Section = ({ space = "md", className, ...rest }: HTMLAttributes<HTMLElement> & { space?: keyof typeof SECTION }) => (
  <section className={cn(SECTION[space], className)} {...rest} />
);

// Static class names, so Tailwind finds them when it scans this package.
const GAP = {
  0: "gap-0", 1: "gap-1", 2: "gap-2", 3: "gap-3", 4: "gap-4", 5: "gap-5", 6: "gap-6",
  8: "gap-8", 10: "gap-10", 12: "gap-12", 16: "gap-16", 20: "gap-20", 24: "gap-24",
} as const;
type Gap = keyof typeof GAP;
const ALIGN = { start: "items-start", center: "items-center", end: "items-end", stretch: "items-stretch", baseline: "items-baseline" } as const;
const JUSTIFY = { start: "justify-start", center: "justify-center", end: "justify-end", between: "justify-between" } as const;
type FlexProps = Div & { as?: ElementType; gap?: Gap; align?: keyof typeof ALIGN; justify?: keyof typeof JUSTIFY };

export const Stack = ({ as: As = "div", gap = 4, align, justify, className, ...rest }: FlexProps) => (
  <As className={cn("flex flex-col", GAP[gap], align && ALIGN[align], justify && JUSTIFY[justify], className)} {...rest} />
);

/** A row that wraps. */
export const Inline = ({ as: As = "div", gap = 2, align = "center", justify, className, ...rest }: FlexProps) => (
  <As className={cn("flex flex-wrap", GAP[gap], ALIGN[align], justify && JUSTIFY[justify], className)} {...rest} />
);

const COLS = { 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-2 lg:grid-cols-4", 6: "md:grid-cols-3 lg:grid-cols-6", 12: "md:grid-cols-12" } as const;

/** `cols`: fixed columns from 768 px (one column on phones). `min`: as many columns of at least `min` as fit. */
export function Grid({ cols, min, gap = 6, className, style, ...rest }: Div & { cols?: keyof typeof COLS; min?: string; gap?: Gap }) {
  return (
    <div
      className={cn("grid", GAP[gap], cols && COLS[cols], min && "grid-cols-[repeat(auto-fill,minmax(min(var(--min),100%),1fr))]", className)}
      style={min ? ({ "--min": min, ...style } as CSSProperties) : style}
      {...rest}
    />
  );
}

const RATIO = { "1:1": "md:grid-cols-2", "1:2": "md:grid-cols-[1fr_2fr]", "2:1": "md:grid-cols-[2fr_1fr]", "5:7": "md:grid-cols-[5fr_7fr]", "7:5": "md:grid-cols-[7fr_5fr]" } as const;

/** Two columns from 768 px; stacked on phones. */
export const Split = ({ ratio = "1:1", gap = 12, className, ...rest }: Div & { ratio?: keyof typeof RATIO; gap?: Gap }) => (
  <div className={cn("grid", GAP[gap], RATIO[ratio], className)} {...rest} />
);

export const AspectRatio = RadixAspectRatio.Root;

export const Separator = ({ className, orientation = "horizontal", ...rest }: ComponentProps<typeof RadixSeparator.Root>) => (
  <RadixSeparator.Root
    orientation={orientation}
    className={cn("shrink-0 bg-line", orientation === "horizontal" ? "h-px w-full" : "w-px self-stretch", className)}
    {...rest}
  />
);

export function ScrollArea({ className, children, ...rest }: ComponentProps<typeof RadixScrollArea.Root>) {
  return (
    <RadixScrollArea.Root className={cn("relative overflow-hidden", className)} {...rest}>
      <RadixScrollArea.Viewport className="size-full rounded-[inherit]">{children}</RadixScrollArea.Viewport>
      {(["vertical", "horizontal"] as const).map((o) => (
        <RadixScrollArea.Scrollbar
          key={o}
          orientation={o}
          className={cn("flex touch-none p-0.5 select-none", o === "vertical" ? "h-full w-2.5" : "h-2.5 flex-col")}
        >
          <RadixScrollArea.Thumb className="relative flex-1 rounded-pill bg-line-strong hover:bg-fg-3" />
        </RadixScrollArea.Scrollbar>
      ))}
      <RadixScrollArea.Corner />
    </RadixScrollArea.Root>
  );
}

const SURFACE = { surface: "bg-surface border-line", raised: "bg-surface-2 border-line", outline: "border-line-strong" } as const;
const RADIUS = { field: "rounded-field", card: "rounded-card", panel: "rounded-panel" } as const;

export const Surface = ({
  variant = "surface",
  radius = "card",
  className,
  ...rest
}: Div & { variant?: keyof typeof SURFACE; radius?: keyof typeof RADIUS }) => (
  <div className={cn("border", SURFACE[variant], RADIUS[radius], className)} {...rest} />
);

/** Full width inside a Container: cancels the page gutter. */
export const Bleed = ({ className, ...rest }: Div) => <div className={cn("-mx-(--p-gutter)", className)} {...rest} />;
