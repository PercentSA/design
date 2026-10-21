import { useEffect, type RefObject } from "react";

/**
 * Plays the CSS animations of `[data-picture]` inside `card` once when it comes on screen, and again
 * on hover or keyboard focus of the card. The animations run while `[data-play]` is set.
 */
export function usePlayOnce(card: RefObject<HTMLElement | null>, threshold = 0.35) {
  useEffect(() => {
    const el = card.current;
    const pic = el?.querySelector<HTMLElement>("[data-picture]");
    if (!el || !pic) return;
    const play = () => {
      pic.removeAttribute("data-play");
      void pic.offsetWidth; // restart the CSS animations
      pic.setAttribute("data-play", "");
    };
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return;
        play();
        io.disconnect();
      },
      { threshold },
    );
    io.observe(pic);
    el.addEventListener("pointerenter", play);
    el.addEventListener("focusin", play);
    return () => {
      io.disconnect();
      el.removeEventListener("pointerenter", play);
      el.removeEventListener("focusin", play);
    };
  }, [card, threshold]);
}
