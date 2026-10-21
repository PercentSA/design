import { useEffect, useRef, useState } from "react";

const western = (n: number) => n.toLocaleString("en-US");
const STACK = "0\n1\n2\n3\n4\n5\n6\n7\n8\n9";

/** One digit: a hidden copy sizes the column and gives the baseline; the 0–9 stack moves over it. */
function Digit({ d, enter }: { d: string; enter: boolean }) {
  const [entering, setEntering] = useState(enter); // only a column added after the first render enters
  return (
    <span className="p-roll-d">
      <span>{d}</span>
      {/* Once: the roll-in ends, so the column does not replay it each time the number comes back on screen. */}
      <span className="p-roll-s" data-enter={entering || undefined} onAnimationEnd={() => setEntering(false)} style={{ ["--p-digit" as string]: d }}>
        {STACK}
      </span>
    </span>
  );
}

/**
 * A number whose digits roll to their new digits when `value` changes. The first render shows the
 * value as it is (the server and the first client render match). Columns match from the units,
 * so new digits enter at the front; other characters change in place. Screen readers get only the
 * value. Off screen and with reduced motion: no roll.
 */
export function NumberRoll({ value, format = western, className }: { value: number; format?: (n: number) => string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [live, setLive] = useState(false);
  useEffect(() => {
    const el = ref.current;
    setLive(true);
    if (!el) return;
    const io = new IntersectionObserver(([e]) => el.toggleAttribute("data-still", !e?.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const text = format(value);
  const chars = [...text];
  return (
    <span ref={ref} className={className ? `p-roll ${className}` : "p-roll"}>
      <span aria-hidden="true" className="p-roll-v tabular-nums" dir="ltr">
        {chars.map((c, i) => {
          // Keyed by place from the end, so the units column stays the units column.
          const at = chars.length - i;
          return /[0-9]/.test(c) ? <Digit key={`d${at}`} d={c} enter={live} /> : <span key={`c${at}`}>{c}</span>;
        })}
      </span>
      <span className="sr-only">{text}</span>
    </span>
  );
}
