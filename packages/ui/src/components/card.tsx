"use client";

import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { useLinkComponent } from "../provider";
import { Surface } from "./layout";

// A title link whose ::after covers its positioned parent, so the whole block is one link.
// The focus ring moves to the ::after to outline the whole block.
export const STRETCHED_LINK =
  "after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-3 focus-visible:after:outline-fg";
// On the positioned parent: other controls inside sit above the ::after, so they stay clickable.
export const ABOVE_STRETCHED_LINK =
  "[&_:is(a,button,input,select,textarea,label):not([data-stretched],.sr-only,.absolute)]:relative [&_:is(a,button,input,select,textarea,label):not([data-stretched],.sr-only,.absolute)]:z-1";

type CardProps = {
  description?: ReactNode;
  /** At the end of the header, for example a menu button or a badge. */
  action?: ReactNode;
  footer?: ReactNode;
  /** Level of the title heading. Default 3. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  children?: ReactNode;
  /** `compact` for dense records: less padding, a smaller title. Default: `default`. */
  density?: "default" | "compact";
  className?: string;
} & ({ href: string; title: ReactNode } | { href?: undefined; title?: ReactNode });

/** A block of content on a Surface. With `href` the whole card is one link (the title is its text); buttons and links inside still work. */
export function Card({ title, description, action, footer, href, headingLevel = 3, children, density = "default", className }: CardProps) {
  const L = useLinkComponent();
  const H = `h${headingLevel}` as const;
  const compact = density === "compact";
  return (
    <Surface className={cn("relative flex flex-col gap-4 [--p-avatar-ring:var(--p-surface)]", compact ? "p-4" : "p-6", href && cn("transition-colors hover:border-fg-3", ABOVE_STRETCHED_LINK), className)}>
      {(title || description || action) && (
        <div className={cn("flex items-start", compact ? "gap-3" : "gap-4")}>
          <div className="grid flex-1 gap-1">
            {title && (
              <H className={cn("heading text-fg", compact ? "text-base" : "text-lg")}>
                {href ? (
                  <L href={href} data-stretched="" className={cn(STRETCHED_LINK, "after:rounded-card")}>
                    {title}
                  </L>
                ) : (
                  title
                )}
              </H>
            )}
            {description && <div className="text-sm text-fg-2">{description}</div>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
      {footer && <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-line pt-4 text-sm text-fg-2">{footer}</div>}
    </Surface>
  );
}
