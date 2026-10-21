import { useEffect, type RefObject } from "react";

/** Loop speed for a scroll speed in px/ms: faster in the scroll direction, backwards when scrolling up. */
export const boostTarget = (pxPerMs: number) => Math.min(4, Math.max(-4, 1 + pxPerMs * 3));

/** Move `rate` toward `target` (time constant 150 ms), so the loop slows back to normal in about 0.5 s. */
export const easeRate = (rate: number, target: number, dtMs: number) => target + (rate - target) * Math.exp(-dtMs / 150);

/** The same frame of a loop, `1000` loops later: backwards playback then never reaches time 0, where it would stop. */
export const loopHeadroom = (time: number, duration: number) => time + duration * 1000;

/**
 * Couples the CSS loops inside `root` (`.p-marquee-list`) to the page scroll. It never changes the scroll.
 * Frames run only from a scroll on screen until the speed is back to normal, so a still page costs nothing.
 */
export function useScrollBoost(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lists = [...el.querySelectorAll<HTMLElement>(".p-marquee-list")];
    for (const a of lists.flatMap((l) => l.getAnimations())) {
      const duration = a.effect?.getComputedTiming().duration;
      if (typeof duration === "number") a.currentTime = loopHeadroom(Number(a.currentTime ?? 0), duration);
    }
    let raf = 0;
    let onScreen = false;
    let rate = 1;
    // Scroll position at the last frame; while no frames run, the position before the next scroll.
    let lastY = scrollY;
    let lastT = 0;
    const tick = (now: number) => {
      const dt = lastT ? Math.min(100, now - lastT) : 16;
      rate = easeRate(rate, boostTarget((scrollY - lastY) / dt), dt);
      if (Math.abs(rate - 1) <= 0.01) rate = 1;
      lastY = scrollY;
      lastT = now;
      for (const a of lists.flatMap((l) => l.getAnimations())) a.playbackRate = rate;
      raf = rate === 1 ? 0 : requestAnimationFrame(tick);
    };
    const onScroll = () => {
      if (!onScreen || raf) return;
      lastT = 0;
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver((entries) => {
      onScreen = entries.at(-1)!.isIntersecting;
      // CSS pauses the loops off screen (animations run only on screen).
      el.toggleAttribute("data-offscreen", !onScreen);
      // Scrolls off screen start no frames, so the last position is old.
      if (!raf) lastY = scrollY;
    });
    io.observe(el);
    addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [root]);
}
