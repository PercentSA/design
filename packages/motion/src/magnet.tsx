"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { magnetOffset } from "./math";

const ZONE = 24;

/** The element follows a nearby mouse pointer by a few pixels and springs back (CSS transition). */
export function useMagnetic(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!el || !fine || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let off = { x: 0, y: 0 };
    const set = (next: { x: number; y: number }) => {
      off = next;
      el.style.transform = next.x || next.y ? `translate(${next.x}px, ${next.y}px)` : "";
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      // The rect includes the current offset; remove it to get the resting position.
      const r = el.getBoundingClientRect();
      const left = r.left - off.x;
      const top = r.top - off.y;
      const near =
        e.clientX > left - ZONE && e.clientX < left + r.width + ZONE && e.clientY > top - ZONE && e.clientY < top + r.height + ZONE;
      if (near) set(magnetOffset(e.clientX - (left + r.width / 2), e.clientY - (top + r.height / 2)));
      else if (off.x || off.y) set({ x: 0, y: 0 });
    };
    // Listen only while the element is on screen: every pointer move reads its position.
    const io = new IntersectionObserver((entries) => {
      const e = entries.at(-1);
      if (e?.isIntersecting) document.addEventListener("pointermove", move, { passive: true });
      else {
        document.removeEventListener("pointermove", move);
        set({ x: 0, y: 0 });
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      document.removeEventListener("pointermove", move);
      set({ x: 0, y: 0 });
    };
  }, [ref]);
}

/** Wraps a primary button or link so it leans toward a nearby mouse. Not on touch, not with reduced motion. */
export function Magnetic({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useMagnetic(ref);
  return (
    <span ref={ref} className={className ? `p-magnetic ${className}` : "p-magnetic"}>
      {children}
    </span>
  );
}
