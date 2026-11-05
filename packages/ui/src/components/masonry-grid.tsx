"use client";

import { useLayoutEffect, useRef, type HTMLAttributes } from "react";
import { cn } from "../lib/cn";

/**
 * The browser half of `<Grid masonry>`. The server renders a normal grid. Once mounted, the grid gets `data-masonry`
 * (rows of 1 px, no row gap) and each child gets `grid-row-end: span N` from its own height plus the gap, so a child
 * moves up into the free space of its column. Auto-placement and the DOM order are unchanged.
 * Children are measured with one ResizeObserver (never the grid), so a span change cannot start a loop:
 * a child is `align-self: start`, and its height does not depend on its span.
 * Spacing between children comes from the gap, not from margins (margins are not measured).
 */
export function MasonryGrid({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const grid = ref.current!;
    const kids = new Set<Element>();
    let gap = -1;
    const readGap = () => parseFloat(getComputedStyle(grid).columnGap) || 0; // "normal" is NaN: no gap
    const place = (el: HTMLElement) => {
      const span = `span ${Math.max(1, Math.ceil(el.offsetHeight + gap))}`;
      if (el.style.getPropertyValue("grid-row-end") !== span) el.style.setProperty("grid-row-end", span);
    };
    const placeAll = () => {
      gap = readGap();
      // The last child's gap would add space below the grid; this takes it back.
      if (grid.style.getPropertyValue("--p-masonry-gap") !== `${gap}px`) grid.style.setProperty("--p-masonry-gap", `${gap}px`);
      kids.forEach((el) => place(el as HTMLElement));
    };
    const ro = new ResizeObserver((entries) => {
      if (readGap() !== gap) return placeAll();
      entries.forEach((e) => place(e.target as HTMLElement));
    });
    const sync = () => {
      const now = new Set(Array.from(grid.children));
      kids.forEach((el) => now.has(el) || (ro.unobserve(el), kids.delete(el)));
      now.forEach((el) => kids.has(el) || (ro.observe(el), kids.add(el)));
      placeAll();
    };
    grid.setAttribute("data-masonry", "");
    sync();
    const mo = new MutationObserver(sync); // a child added or removed by a child component
    mo.observe(grid, { childList: true });
    const fonts = document.fonts;
    fonts?.addEventListener?.("loadingdone", placeAll);
    return () => {
      ro.disconnect();
      mo.disconnect();
      fonts?.removeEventListener?.("loadingdone", placeAll);
      grid.removeAttribute("data-masonry");
    };
  }, []);
  return <div ref={ref} className={cn(className, "data-masonry:-mb-(--p-masonry-gap) data-masonry:auto-rows-[1px] data-masonry:items-start data-masonry:gap-y-0")} {...rest} />;
}
