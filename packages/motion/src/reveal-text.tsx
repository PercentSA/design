"use client";

import { useEffect, useRef, type ElementType, type HTMLAttributes } from "react";
import { useReveal } from "./reveal";

/**
 * Text whose words rise out of their own masks once, when on screen; line after line (60 ms), and
 * word after word in a line (15 ms). Words split on white space only (Arabic letters stay joined).
 * Screen readers read the text once, as normal text. Reduced motion: a short fade of the element.
 */
export function RevealText({ as: As = "p", children, ...rest }: Omit<HTMLAttributes<HTMLElement>, "children"> & { as?: ElementType; children: string }) {
  const ref = useRef<HTMLElement>(null);
  useReveal(ref);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const words = [...el.querySelectorAll<HTMLElement>(".p-rt-w")];
    // A word whose top is more than half a word below the line's top starts a new line.
    const measure = () => {
      // All reads before all writes, so the browser computes the layout once.
      const boxes = words.map((w) => [w.offsetTop, w.offsetHeight] as const);
      let line = -1;
      let top = -Infinity;
      let n = 0;
      words.forEach((w, i) => {
        const [wTop, height] = boxes[i]!;
        if (wTop - top > height / 2) [line, top, n] = [line + 1, wTop, 0];
        w.style.setProperty("--p-rt-delay", `${line * 60 + n++ * 15}ms`);
      });
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    // The words too: a font that loads late changes their sizes and the wrap, not always the element's size.
    const ro = new ResizeObserver(measure);
    [el, ...words].forEach((x) => ro.observe(x));
    return () => ro.disconnect();
  }, [children]);
  return (
    <As ref={ref} data-reveal="text" {...rest}>
      {children.split(/(\s+)/).map((part, i) =>
        i % 2 ? part : part && (
          <span key={i} className="p-rt-w">
            <span>{part}</span>
          </span>
        ),
      )}
    </As>
  );
}
