import { useLayoutEffect, useRef, type DependencyList, type RefObject } from "react";

type Before = { rects: Map<string, DOMRect>; focus: Element | null };

// The running glide of each item: stopped before the next measure, so the measure sees the layout.
const running = new WeakMap<Element, Animation>();

const items = (container: Element) => [...container.querySelectorAll<HTMLElement>("[data-flip]")];
const changed = (a: DependencyList, b: DependencyList) => a.length !== b.length || a.some((x, i) => !Object.is(x, b[i]));
const reduced = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const onScreen = (r: DOMRect) => r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
const ms = (v: string) => (v.endsWith("ms") ? parseFloat(v) : parseFloat(v) * 1000) || 250;

/**
 * Reorder glide (FLIP) for the container's items that have a stable `data-flip` id. When `deps` change, each moved
 * item glides from its old place to the new one, new items fade in and removed items leave at once.
 * The focused element keeps its focus. No animation on the first render, off screen or with reduced motion.
 */
export function useFlip(container: RefObject<HTMLElement | null>, deps: DependencyList) {
  const committed = useRef<DependencyList | null>(null);
  const before = useRef<Before | null>(null);
  const el = container.current;
  // Measured during render: a hook has no other moment before React changes the DOM. Includes a running glide's offset.
  if (el && committed.current && changed(committed.current, deps)) {
    const focus = document.activeElement;
    before.current = { rects: new Map(items(el).map((item) => [item.dataset.flip!, item.getBoundingClientRect()])), focus: el.contains(focus) ? focus : null };
  }

  useLayoutEffect(() => {
    committed.current = deps;
    const b = before.current;
    before.current = null;
    const el = container.current;
    if (!b || !el) return;
    // Moving a node in the DOM takes its focus away. Only then: an element that took focus in the same change (autoFocus) keeps it.
    const lost = !document.activeElement || document.activeElement === document.body;
    if (b.focus?.isConnected && lost) (b.focus as HTMLElement).focus({ preventScroll: true });
    if (reduced()) return;
    const style = getComputedStyle(el);
    const options = { duration: ms(style.getPropertyValue("--p-duration-base").trim()), easing: style.getPropertyValue("--p-ease-out").trim() || "cubic-bezier(0.2, 0.8, 0.2, 1)" };
    for (const item of items(el)) {
      if (typeof item.animate !== "function") return;
      running.get(item)?.cancel();
      const now = item.getBoundingClientRect();
      const old = b.rects.get(item.dataset.flip!);
      if (!old) {
        if (onScreen(now)) running.set(item, item.animate([{ opacity: 0 }, { opacity: 1 }], options));
        continue;
      }
      const dx = old.left - now.left;
      const dy = old.top - now.top;
      if ((Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) || (!onScreen(old) && !onScreen(now))) continue;
      running.set(item, item.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], options));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs when the caller's deps change
  }, deps);
}
