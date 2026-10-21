import { useEffect, useRef } from "react";

const TARGET = '[data-cursor="view"]';

/**
 * A circle with `label` ("View") that follows a mouse over `[data-cursor="view"]` links.
 * Decoration only: the links keep their own accessible names. Fine pointers only.
 */
export function ViewCursor({ label }: { label: string }) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const c = el.current!;
    const root = document.documentElement;
    let x = 0;
    let y = 0;
    let tx = 0;
    let ty = 0;
    let raf = 0;
    let on = false;
    // The page scrolls under a still mouse; a keyboard scroll with the mouse outside the window must not show the circle.
    let inside = false;
    const loop = () => {
      const k = reduce ? 1 : 0.2;
      x += (tx - x) * k;
      y += (ty - y) * k;
      c.style.transform = `translate(${x}px, ${y}px)`;
      raf = Math.hypot(tx - x, ty - y) > 0.5 ? requestAnimationFrame(loop) : 0;
    };
    const set = (next: boolean) => {
      if (next === on) return;
      on = next;
      if (on) {
        x = tx;
        y = ty;
      }
      c.toggleAttribute("data-on", on);
      root.toggleAttribute("data-cursor-view", on);
    };
    const check = () => inside && set(!!document.elementFromPoint(tx, ty)?.closest(TARGET));
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      inside = true;
      tx = e.clientX;
      ty = e.clientY;
      set(!!(e.target as Element).closest?.(TARGET));
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const leave = () => {
      inside = false;
      set(false);
    };
    document.addEventListener("pointermove", move, { passive: true });
    addEventListener("scroll", check, { passive: true });
    root.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("pointermove", move);
      removeEventListener("scroll", check);
      root.removeEventListener("pointerleave", leave);
      set(false);
    };
  }, []);
  return (
    <div ref={el} aria-hidden="true" className="p-view-cursor">
      <span>{label}</span>
    </div>
  );
}
