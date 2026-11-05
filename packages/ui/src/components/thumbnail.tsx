"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ImageIcon } from "lucide-react";
import { cn } from "../lib/cn";
import { useLinkComponent } from "../provider";

const SIZE = { sm: "size-10", md: "size-16", lg: "size-24" } as const;
const WIDTH = { sm: "w-10", md: "w-16", lg: "w-24" } as const;
const ICON = { sm: "[&>svg]:size-4", md: "[&>svg]:size-6", lg: "[&>svg]:size-8" } as const;

/**
 * A small square image with a fallback icon: product photos, line images, uploaded files. The icon shows when there is
 * no `src` or the image fails to load. `alt` names the image (and the icon, and the link). `caption` is one line under
 * the image, cut with the full text in `title`. With `href` the whole thumbnail is a link.
 */
export function Thumbnail({
  src,
  alt,
  size = "md",
  fallback,
  caption,
  href,
  className,
}: {
  src?: string | null;
  alt: string;
  size?: keyof typeof SIZE;
  fallback?: ReactNode;
  caption?: ReactNode;
  href?: string;
  className?: string;
}) {
  const L = useLinkComponent();
  const img = useRef<HTMLImageElement>(null);
  const [failed, setFailed] = useState<string | null | undefined>(undefined);
  const broken = !src || failed === src;
  // A load error before hydration fires no event: the image is complete but empty. Some browsers also report a width of 0
  // for a good SVG that has only a viewBox, so decode() decides: it rejects only for a broken image.
  useEffect(() => {
    const el = img.current;
    if (!el?.complete || el.naturalWidth !== 0 || !el.currentSrc) return;
    let live = true;
    (typeof el.decode === "function" ? el.decode() : Promise.reject()).catch(() => live && setFailed(src));
    return () => {
      live = false;
    };
  }, [src]);
  const box = (
    <span className={cn("grid shrink-0 place-items-center overflow-hidden rounded-field border border-line bg-surface-2 text-fg-3", SIZE[size])}>
      {broken ? (
        <span role="img" aria-label={alt} className={cn("grid size-full place-items-center", ICON[size])}>
          {fallback ?? <ImageIcon aria-hidden />}
        </span>
      ) : (
        <img ref={img} src={src} alt={alt} loading="lazy" onError={() => setFailed(src)} className="size-full object-cover" />
      )}
    </span>
  );
  const root = cn("inline-grid max-w-full content-start gap-1.5 align-top", href && "rounded-field focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg", className);
  const body = (
    <>
      {box}
      {caption != null && caption !== "" && (
        <span title={typeof caption === "string" ? caption : undefined} className={cn("block truncate text-xs text-fg-2", WIDTH[size])}>
          {caption}
        </span>
      )}
    </>
  );
  return href ? (
    <L href={href} className={root}>
      {body}
    </L>
  ) : (
    <span className={root}>{body}</span>
  );
}
