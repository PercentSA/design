import { useEffect, useRef, type ElementType, type HTMLAttributes, type ReactNode, type RefObject } from "react";
import { SLASH_RUN } from "./slash";

/**
 * Marks the element `data-shown` once, when a fifth of it is on screen, or when it fills a fifth of
 * the screen (an element taller than five screens never shows a fifth of itself). CSS does the rest.
 */
export function useReveal(ref: RefObject<HTMLElement | null>, threshold = 0.2) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const show = (entries: IntersectionObserverEntry[]) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      el.dataset.shown = "";
      stop();
    };
    const observers = [
      new IntersectionObserver(show, { threshold }),
      new IntersectionObserver(show, { rootMargin: `0px 0px ${-threshold * 100}% 0px` }),
    ];
    const stop = () => observers.forEach((io) => io.disconnect());
    observers.forEach((io) => io.observe(el));
    return stop;
  }, [ref, threshold]);
}

/**
 * Rises into view once. `stagger`: the children rise one after another. Hidden only under html.js,
 * so pages without JavaScript show everything. Reduced motion: a short fade.
 */
export function Reveal({ as: As = "div", stagger, className, ...rest }: HTMLAttributes<HTMLElement> & { as?: ElementType; stagger?: boolean }) {
  const ref = useRef<HTMLElement>(null);
  useReveal(ref);
  return <As ref={ref} data-reveal={stagger ? "stagger" : "rise"} className={className} {...rest} />;
}

/** Horizontal run of the % slash over a box of this aspect (width / height), in % of the width. */
export const slashRunPercent = (aspect: number) => Math.round((SLASH_RUN / aspect) * 10000) / 100;

/**
 * Media that opens with a wipe whose edge has the angle of the % slash (never mirrored), moving in
 * the reading direction. `aspect` = width / height of the box. The CSS computes the run from
 * --p-slash-run and --p-aspect, so a brand sets the angle with one variable.
 */
export function SlashReveal({ aspect, children, className }: { aspect: number; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useReveal(ref);
  const a = Number(aspect.toFixed(4));
  // The observed box has no clip-path: IntersectionObserver sees a fully clipped element as off screen.
  return (
    <div
      ref={ref}
      data-reveal="slash"
      className={className}
      style={{ aspectRatio: a, ["--p-aspect" as string]: a }}
    >
      <div className="p-slash">{children}</div>
    </div>
  );
}
