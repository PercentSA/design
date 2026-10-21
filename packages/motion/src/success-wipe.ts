import { useEffect, useRef, type RefObject } from "react";
import { SLASH_RUN } from "./slash";

/**
 * The percent.sa contact success: a band at the slash angle sweeps across `box` in the reading
 * direction; when it covers the box, `onCovered` swaps the content (form → message), then the band
 * leaves. The box keeps its height, so the page does not jump. Reduced motion: swap at once.
 * Render `<span ref={band} className="p-wipe" aria-hidden="true" />` inside the box.
 */
export function useSuccessWipe(box: RefObject<HTMLElement | null>, band: RefObject<HTMLElement | null>) {
  const running = useRef<Animation[]>([]);
  useEffect(() => () => running.current.forEach((a) => a.cancel()), []);
  return (onCovered: () => void) => {
    const el = box.current;
    const b = band.current;
    if (!el || !b) return onCovered();
    el.style.minHeight = `${el.offsetHeight}px`;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return onCovered();
    const w = el.offsetWidth;
    const cs = getComputedStyle(el);
    // A brand sets the angle with --p-slash-run; without tokens.css the JS value applies.
    const angle = parseFloat(cs.getPropertyValue("--p-slash-run"));
    const run = el.offsetHeight * (Number.isNaN(angle) ? SLASH_RUN : angle);
    const s = cs.direction === "rtl" ? -1 : 1;
    Object.assign(b.style, {
      width: `${w + 2 * run}px`,
      insetInlineStart: `${-run}px`,
      clipPath: `polygon(${run}px 0, 100% 0, calc(100% - ${run}px) 100%, 0 100%)`,
    });
    el.dataset.wiping = "";
    const opts = { duration: 380, easing: "cubic-bezier(0.6, 0, 0.4, 1)", fill: "forwards" } as const;
    const into = b.animate([{ transform: `translateX(${-s * (w + run)}px)` }, { transform: "translateX(0)" }], opts);
    running.current = [into];
    into.finished
      .then(() => {
        onCovered();
        const out = b.animate([{ transform: "translateX(0)" }, { transform: `translateX(${s * (w + run)}px)` }], opts);
        running.current = [out];
        return out.finished;
      })
      .then(() => {
        delete el.dataset.wiping;
        b.getAnimations().forEach((a) => a.cancel());
      })
      .catch(() => {});
  };
}
