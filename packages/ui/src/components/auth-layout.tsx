"use client";

import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { useBrand, useLang, useStrings } from "../provider";
import { Logo } from "./brand";

/**
 * Sign-in, sign-up and verification pages: brand, h1 title, description, the form and footer links in a narrow centred column.
 * `aside` (a picture or a quote) fills the end half once the layout is 1024 px wide. Put it inside the page's <main>.
 */
export function AuthLayout({
  brand,
  title,
  description,
  children,
  footer,
  aside,
  className,
}: {
  brand?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  const logo = useBrand()?.wordmark;
  const lang = useLang();
  const s = useStrings();
  return (
    // A container query, not the viewport: the split also stays right inside a narrower frame.
    <div className={cn("@container flex min-h-dvh w-full flex-col", className)}>
      <div className={cn("grid flex-1", aside && "@5xl:grid-cols-2")}>
        <div className="flex flex-col items-center justify-center px-(--p-gutter) py-12">
          <div className="grid w-full max-w-sm gap-8">
            <div>{brand ?? logo ?? <Logo version={lang === "ar" ? "icon-ar" : "icon-en"} label={s.percent} />}</div>
            <div className="grid gap-2">
              <h1 className="heading text-3xl">{title}</h1>
              {description && <p className="text-fg-2">{description}</p>}
            </div>
            {children}
            {footer && <div className="text-sm text-fg-2">{footer}</div>}
          </div>
        </div>
        {aside && <div className="relative hidden overflow-hidden border-s border-line bg-surface @5xl:block">{aside}</div>}
      </div>
    </div>
  );
}
