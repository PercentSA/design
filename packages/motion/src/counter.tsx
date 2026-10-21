import { useEffect, useRef, useState } from "react";

/** Ease-out cubic from `from` to `to`; t is 0..1. Whole numbers. */
export const counterValue = (t: number, from: number, to: number) => {
  const k = 1 - (1 - Math.min(1, Math.max(0, t))) ** 3;
  return Math.round(from + (to - from) * k);
};

const western = (n: number) => n.toLocaleString("en-US");

/**
 * Counts up to `value` when it comes on screen. The server and pages without JavaScript show the
 * final number; screen readers always get only the final number. Reduced motion: no counting.
 * Under html.js the number is hidden until it starts counting, so the final number never jumps back to `from`.
 */
export function Counter({ value, from = 0, ms = 1200, format = western, className }: { value: number; from?: number; ms?: number; format?: (n: number) => string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);
  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return setShown(value);
    setShown(from);
    let raf = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return;
        io.disconnect();
        el.dataset.run = "";
        const start = performance.now();
        const tick = (now: number) => {
          const t = (now - start) / ms;
          setShown(counterValue(t, from, value));
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, from, ms]);
  return (
    <span ref={ref} data-counter="" className={className}>
      <span aria-hidden="true" className="tabular-nums" dir="ltr">
        {format(shown)}
      </span>
      <span className="sr-only">{format(value)}</span>
    </span>
  );
}
