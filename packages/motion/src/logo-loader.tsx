import { useEffect, useId, useRef, useState } from "react";
import { LOADER_LOOP_MS, LOADER_VIEWBOX, LOGO_STROKE, logoLoaderFrame } from "@percentsa/tokens";

/**
 * The loader: the % icon turns into the Arabic wordmark, back, into the English wordmark and back (7.2 s loop).
 * It plays only on screen with the tab visible. The server and reduced motion show the still icon.
 * Without `className` it is 48 px high.
 */
export function LogoLoader({ className, label }: { className?: string; label?: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const [ms, setMs] = useState(0);
  const id = useId().replace(/\W/g, "");
  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0, last: number | null = null, onScreen = false, t = 0;
    const tick = (now: number) => {
      t = (t + now - (last ?? now)) % LOADER_LOOP_MS;
      last = now;
      setMs(t);
      raf = requestAnimationFrame(tick);
    };
    // Paused time is not counted: the first frame after a pause starts from where it stopped.
    const update = () => {
      cancelAnimationFrame(raf);
      last = null;
      raf = onScreen && document.visibilityState === "visible" ? requestAnimationFrame(tick) : 0;
    };
    const io = new IntersectionObserver((entries) => {
      onScreen = !!entries.at(-1)?.isIntersecting;
      update();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", update);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", update);
      cancelAnimationFrame(raf);
    };
  }, []);
  const f = logoLoaderFrame(ms);
  return (
    <svg
      ref={ref}
      viewBox={LOADER_VIEWBOX.join(" ")}
      className={className ?? "block h-12 w-auto"}
      focusable="false"
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      <defs>
        <clipPath id={`${id}-l`}>
          <polygon points={f.clipLeft} />
        </clipPath>
        <clipPath id={`${id}-r`}>
          <polygon points={f.clipRight} />
        </clipPath>
      </defs>
      <g transform={`translate(${f.camera.toFixed(2)} 0)`} fill="currentColor" stroke="currentColor" strokeWidth={LOGO_STROKE} strokeLinejoin="round">
        {f.main.map((d, i) => (
          <path key={i} d={d} />
        ))}
        <g clipPath={`url(#${id}-l)`}>
          {f.left.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        <g clipPath={`url(#${id}-r)`}>
          {f.right.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
      </g>
    </svg>
  );
}
