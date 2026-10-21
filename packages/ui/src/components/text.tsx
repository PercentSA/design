import type { ComponentProps, ElementType, HTMLAttributes, ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { Slot } from "radix-ui";
import { cn } from "../lib/cn";
import type { Lang } from "../i18n/localized";
import { useLang, useLinkComponent, useStrings } from "../provider";

type Poly<E extends ElementType> = HTMLAttributes<HTMLElement> & { as?: E };

const DISPLAY = {
  xl: "text-[clamp(3rem,8vw,7.5rem)]",
  lg: "text-[clamp(2.5rem,6vw,5rem)]",
  md: "text-[clamp(2rem,4.5vw,3.75rem)]",
} as const;

/** Page and section titles. Do not add leading-* or tracking-*: the Arabic rules live in .display. */
export function Display({ as: As = "h1", size = "lg", className, ...rest }: Poly<ElementType> & { size?: keyof typeof DISPLAY }) {
  return <As className={cn("display", DISPLAY[size], className)} {...rest} />;
}

const HEADING = { 1: "text-4xl", 2: "text-3xl", 3: "text-2xl", 4: "text-xl", 5: "text-lg", 6: "text-base" } as const;
type Level = keyof typeof HEADING;

export function Heading({ level = 2, size, className, ...rest }: HTMLAttributes<HTMLHeadingElement> & { level?: Level; size?: Level }) {
  const As = `h${level}` as const;
  return <As className={cn("heading", HEADING[size ?? level], className)} {...rest} />;
}

const TEXT_SIZE = { lg: "text-lg", md: "text-base", sm: "text-sm", xs: "text-xs" } as const;
const TONE = { default: "text-fg", muted: "text-fg-2", subtle: "text-fg-3" } as const;

export function Text({
  as: As = "p",
  size = "md",
  tone = "default",
  className,
  ...rest
}: Poly<ElementType> & { size?: keyof typeof TEXT_SIZE; tone?: keyof typeof TONE }) {
  return <As className={cn(TEXT_SIZE[size], TONE[tone], className)} {...rest} />;
}

/** Small uppercase label (mono in English, plain in Arabic). */
export const Label = ({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn("label", className)} {...rest} />
);

export function Link({
  external,
  asChild,
  className,
  children,
  ...rest
}: ComponentProps<"a"> & { external?: boolean; asChild?: boolean }) {
  const s = useStrings();
  const RouterLink = useLinkComponent();
  const As = asChild ? Slot.Root : external ? "a" : RouterLink;
  return (
    <As
      className={cn(
        "underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-fg",
        external && "inline-flex items-center gap-1",
        className,
      )}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...rest}
    >
      {/* With asChild, Slottable marks the child that takes the props; the icon goes inside it. */}
      <Slot.Slottable>{children}</Slot.Slottable>
      {external && <ArrowUpRight aria-hidden className="size-[1em] rtl:-scale-x-100" />}
      {external && <span className="sr-only">{s.newTab}</span>}
    </As>
  );
}

/** Code is left to right in every language; dir on an inline element also isolates it. */
export const Code = ({ className, ...rest }: HTMLAttributes<HTMLElement>) => (
  <code dir="ltr" className={cn("rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[0.875em]", className)} {...rest} />
);

export const Kbd = ({ className, ...rest }: HTMLAttributes<HTMLElement>) => (
  <kbd
    dir="ltr"
    className={cn("inline-flex min-w-6 items-center justify-center rounded-md border border-line-strong bg-surface px-1.5 font-mono text-xs text-fg-2", className)}
    {...rest}
  />
);

export function Blockquote({ cite, className, children }: { cite?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <figure className={cn("border-s-2 border-line-strong ps-5", className)}>
      <blockquote className="text-lg text-fg">{children}</blockquote>
      {cite && <figcaption className="mt-3 text-sm text-fg-3">{cite}</figcaption>}
    </figure>
  );
}

/** Rich text (privacy pages, case studies, articles): headings, lists, links and code inside get Percent styles. */
export const Prose = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-prose", className)} {...rest} />
);

/** Inverted text, like a selection. */
export const Highlight = ({ className, ...rest }: HTMLAttributes<HTMLElement>) => (
  <mark className={cn("rounded-sm bg-fg px-0.5 text-bg", className)} {...rest} />
);

/** Western digits in both languages; Arabic words for compact units ("1.3 مليون"). */
export const formatNumber = (value: number, lang: Lang = "en", options?: Intl.NumberFormatOptions) =>
  new Intl.NumberFormat(lang === "ar" ? "ar-SA-u-nu-latn" : "en-US", options).format(value);

export function FormattedNumber({ value, options, className }: { value: number; options?: Intl.NumberFormatOptions; className?: string }) {
  return (
    <span dir="ltr" className={cn("tabular-nums", className)}>
      {formatNumber(value, useLang(), options)}
    </span>
  );
}
