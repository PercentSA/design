"use client";

import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { createSwitchController, type ScrambleTarget, type SwitchController } from "./switch-controller";

export interface ScrambleApi {
  /** Scramble the text on screen, then call `navigate(next)` from the provider. */
  request(next: string): void;
  decode: SwitchController["decode"];
  onStart: SwitchController["onStart"];
  register(t: ScrambleTarget): () => void;
  resolve: SwitchController["resolve"];
  active(): boolean;
}

const ScrambleContext = createContext<ScrambleApi | null>(null);

/**
 * Language-switch scramble for every <ScrambleText> below. `navigate` changes the language
 * (router navigation + cookie); it runs 360 ms into the scramble, or at once with reduced motion.
 * `noise`: the characters Latin text scrambles through (default LATIN_NOISE, with "%"); read once.
 */
export function ScrambleProvider({ navigate, noise, children }: { navigate: (next: string) => void; noise?: string; children: ReactNode }) {
  const latest = useRef(navigate);
  latest.current = navigate;
  const [api] = useState<ScrambleApi>(() => {
    const targets = new Set<ScrambleTarget>();
    let raf = 0;
    const loop = () => {
      controller.tick(performance.now());
      raf = controller.hasJobs() ? requestAnimationFrame(loop) : 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const controller = createSwitchController({
      now: () => performance.now(),
      schedule: (fn, ms) => void setTimeout(fn, ms),
      navigate: (next) => latest.current(next),
      reducedMotion: () => matchMedia("(prefers-reduced-motion: reduce)").matches,
      targets: () => targets,
      rand: Math.random,
      noise,
    });
    return {
      request(next) {
        if (controller.request(next)) kick();
      },
      decode(...args) {
        controller.decode(...args);
        // Hide the real text now, not one frame later.
        controller.tick(performance.now());
        kick();
      },
      onStart: controller.onStart,
      register(t) {
        targets.add(t);
        return () => targets.delete(t);
      },
      resolve: controller.resolve,
      active: controller.active,
    };
  });
  return <ScrambleContext.Provider value={api}>{children}</ScrambleContext.Provider>;
}

export function useScramble(): ScrambleApi {
  const api = useContext(ScrambleContext);
  if (!api) throw new Error("useScramble must be used inside <ScrambleProvider>");
  return api;
}

/**
 * onClick for a language link (LangSwitch from @percentsa/ui): a plain click plays the scramble;
 * a click with a modifier key opens the link as usual.
 */
export function useScrambleSwitch(next: string) {
  const { request } = useScramble();
  return (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    request(next);
  };
}

/**
 * Text that takes part in the language-switch scramble. The real text stays in the DOM (and in the
 * accessibility tree); the scrambled copy is an aria-hidden overlay. Use `block` for paragraphs.
 * `targetRef` gets the scramble target, for `decode()` (text that types itself in on first paint).
 */
export function ScrambleText({
  children,
  block,
  className,
  targetRef,
}: {
  children: string;
  block?: boolean;
  className?: string;
  targetRef?: (t: ScrambleTarget | null) => void;
}) {
  const { register, resolve } = useScramble();
  const ref = useRef<HTMLSpanElement>(null);
  const [target] = useState<ScrambleTarget>(() => ({
    text: () => ref.current?.firstElementChild?.textContent ?? "",
    top: () => (ref.current ? ref.current.getBoundingClientRect().top / innerHeight : 0),
    onScreen: () => {
      const r = ref.current?.getBoundingClientRect();
      return !!r && r.bottom > 0 && r.top < innerHeight && r.width > 0;
    },
    write: (s) => {
      const el = ref.current;
      const overlay = el?.lastElementChild;
      if (!el || !overlay) return;
      if (s === null) {
        el.removeAttribute("data-busy");
        overlay.textContent = "";
      } else {
        el.setAttribute("data-busy", "");
        if (overlay.textContent !== s) overlay.textContent = s;
      }
    },
  }));
  useEffect(() => register(target), [register, target]);
  useEffect(() => {
    targetRef?.(target);
    return () => targetRef?.(null);
  }, [targetRef, target]);
  const mounted = useRef(false);
  useLayoutEffect(() => {
    if (mounted.current) resolve(target, children);
    mounted.current = true;
  }, [children, resolve, target]);
  return (
    <span ref={ref} data-sx={block ? "block" : "inline"} className={`p-sx ${block ? "block" : "inline-block"}${className ? ` ${className}` : ""}`}>
      <span className="p-sx-r">{children}</span>
      <span className="p-sx-f" aria-hidden="true" />
    </span>
  );
}
