import { useRef, useState, type ReactNode } from "react";
import { useScrollBoost } from "./scroll-boost";

/**
 * A slow endless row (client logos). Pass <li> items. The second copy makes the loop seamless and is
 * inert. The loop speeds up with the page scroll and runs backwards when scrolling up. It pauses on
 * hover, on keyboard focus inside, and with its pause button (moving content needs one: WCAG 2.2.2).
 * Reduced motion: no movement and no button; the row scrolls by hand.
 */
export function Marquee({
  children,
  className,
  seconds = 45,
  labels = { pause: "Pause", play: "Play" },
}: {
  children: ReactNode;
  className?: string;
  seconds?: number;
  /** Names of the pause button, in the page language. */
  labels?: { pause: string; play: string };
}) {
  const row = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  useScrollBoost(row);
  return (
    <div className={className ? `p-marquee-box ${className}` : "p-marquee-box"} data-paused={paused || undefined}>
      <div ref={row} className="p-marquee" style={{ ["--p-marquee-s" as string]: `${seconds}s` }}>
        <ul className="p-marquee-list">{children}</ul>
        <ul className="p-marquee-list" aria-hidden="true" inert>
          {children}
        </ul>
      </div>
      <button type="button" className="p-marquee-pp" aria-label={paused ? labels.play : labels.pause} onClick={() => setPaused(!paused)}>
        <svg viewBox="0 0 12 12" aria-hidden="true">
          {paused ? (
            <path d="M3 1.2v9.6c0 .5.5.8.9.5l7-4.8a.6.6 0 0 0 0-1L3.9.7C3.5.4 3 .7 3 1.2Z" />
          ) : (
            <>
              <rect x="1.5" y="1" width="3" height="10" rx="1" />
              <rect x="7.5" y="1" width="3" height="10" rx="1" />
            </>
          )}
        </svg>
      </button>
    </div>
  );
}
