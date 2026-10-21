"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "./cn";

type Box = { x: number; y: number; w: number; h: number; slide: boolean };

/**
 * One indicator that moves to the active item of a list (Tabs, SegmentedControl, Sidebar).
 * The active item is the element in the list with `attr="value"`. Give the list `relative isolate`.
 * The item's box is measured in sub-pixels, from the list's padding edge and its scrolled content.
 * Until the first measure `indicator` is undefined and the active item draws its own state
 * (server HTML, no JavaScript, a hidden list). It slides when the active item changes and jumps
 * on a resize (font load, language switch, sidebar collapse). Measured with ResizeObserver on the
 * list and its children, and a MutationObserver for `attr` and added or removed items.
 */
export function useSlidingIndicator<T extends HTMLElement>(attr: string, value: string) {
  const ref = useRef<T>(null);
  const [box, setBox] = useState<Box>();
  useLayoutEffect(() => {
    const list = ref.current;
    if (!list || typeof ResizeObserver === "undefined") return;
    // slide: only when `attr` moved to another item. Remounted items (Sidebar rail) and resizes jump.
    const measure = (slide: boolean) => {
      const item = list.querySelector<HTMLElement>(`[${attr}="${value}"]`);
      // Not laid out (display: none): no box yet; the item keeps its own state.
      if (!item?.offsetWidth) return setBox(undefined);
      // Not offset*: they are whole pixels. k undoes a scale on an ancestor (a Dialog pops in from 0.97),
      // which ResizeObserver does not report; under 1 px of difference is offsetWidth's rounding.
      const l = list.getBoundingClientRect();
      const r = item.getBoundingClientRect();
      const k = Math.abs(l.width - list.offsetWidth) < 1 ? 1 : l.width / list.offsetWidth;
      const x = (r.left - l.left) / k - list.clientLeft + list.scrollLeft;
      const y = (r.top - l.top) / k - list.clientTop + list.scrollTop;
      const n = { x, y, w: r.width / k, h: r.height / k, slide };
      setBox((b) => (b && b.x === n.x && b.y === n.y && b.w === n.w && b.h === n.h ? b : n));
    };
    const ro = new ResizeObserver(() => measure(false));
    for (const el of [list, ...list.children]) ro.observe(el);
    const mo = new MutationObserver((records) => {
      for (const r of records) if (r.target === list) r.addedNodes.forEach((el) => el instanceof Element && ro.observe(el));
      measure(records.some((r) => r.type === "attributes"));
    });
    mo.observe(list, { subtree: true, childList: true, attributes: true, attributeFilter: [attr] });
    measure(false);
    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  }, [attr, value]);
  const indicator = box && {
    "aria-hidden": true as const,
    "data-indicator": "",
    // Physical left/top: the measures are physical, also in RTL.
    className: cn(
      "pointer-events-none absolute top-0 left-0 -z-10",
      box.slide && "transition-[transform,width,height] duration-(--p-duration-base) ease-(--p-ease-out) motion-reduce:transition-none",
    ),
    style: { transform: `translate(${box.x}px, ${box.y}px)`, width: box.w, height: box.h } satisfies CSSProperties,
  };
  return [ref, indicator] as const;
}
