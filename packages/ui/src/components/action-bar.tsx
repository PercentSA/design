"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Ellipsis } from "lucide-react";
import { cn } from "../lib/cn";
import { useStrings } from "../provider";
import { DropdownMenu } from "./menus";
import { Kbd } from "./text";

export type ActionBarItem = {
  id: string;
  label: string;
  icon: ReactNode;
  /** For example "F2". A `Kbd` under the label; hidden on a coarse pointer. The app binds the key. */
  keyHint?: string;
  onSelect: () => void;
  tone?: "default" | "danger";
  disabled?: boolean;
  /** "end": after a separator at the end side, and never in the overflow menu. Default "main". */
  group?: "main" | "end";
};

const TILE =
  "flex min-w-0 flex-1 basis-0 flex-col items-center justify-center gap-0.5 rounded-field border px-1 text-xs transition-colors disabled:opacity-50 [&_svg]:size-5 [&_svg]:shrink-0";
// 56 px (64 px in touch density). When any tile shows a key hint (a fine pointer) every tile is 4.5rem (72 px) and the icon, label and key are spaced evenly, so the key never touches the edge or the label.
const HEIGHT = "h-14 in-data-[density=touch]:h-16";
const HEIGHT_KEYS = "h-14 in-data-[density=touch]:h-16 pointer-fine:h-18 pointer-fine:in-data-[density=touch]:h-18 pointer-fine:justify-evenly pointer-fine:gap-1 pointer-fine:py-1";
const TONE = {
  default: "border-line text-fg-2 hover:border-fg-3 hover:text-fg",
  danger: "border-danger text-danger hover:bg-danger/10",
} as const;
// A tile is never narrower than 5rem; the gap between tiles is 0.5rem (gap-2).
const MIN_TILE_REM = 5;
const GAP_REM = 0.5;

/**
 * The bottom bar of a work tool (a till, a kiosk, a picking tool): equal tiles with an icon, a label and a key hint.
 * `group: "end"` items follow a separator at the end side (a danger item such as "Close shift"). When a tile would be narrower
 * than 5rem, the last `main` items move into a "More" menu; `end` items stay. No items: nothing renders. Tab moves between the tiles.
 * The bar shows the hints; the app binds the keys.
 */
export function ActionBar({ items, label, className }: { items: ActionBarItem[]; label: string; className?: string }) {
  const s = useStrings();
  const nav = useRef<HTMLElement>(null);
  const [fit, setFit] = useState(Infinity);
  const main = items.filter((i) => i.group !== "end");
  const end = items.filter((i) => i.group === "end");
  const has = items.length > 0;
  const tall = items.some((i) => i.keyHint);
  const height = tall ? HEIGHT_KEYS : HEIGHT;
  // Tiles that fit in the width; measured, so the server render shows everything and the bar adjusts after hydration.
  useLayoutEffect(() => {
    const el = nav.current;
    if (!el) return;
    const measure = () => {
      // Not laid out (a server render, a hidden parent): show everything.
      if (!el.clientWidth) return;
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const tile = (MIN_TILE_REM + GAP_REM) * rem;
      setFit(Math.max(1, Math.floor((el.clientWidth + GAP_REM * rem) / tile)));
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [has]);
  if (!has) return null;

  const overflow = main.length + end.length > fit;
  // One tile is the "More" button; the rest of the room goes to the end items first.
  const shown = overflow ? Math.max(0, fit - end.length - 1) : main.length;
  const visible = main.slice(0, shown);
  const hidden = main.slice(shown);

  const tile = (i: ActionBarItem) => (
    <button key={i.id} type="button" disabled={i.disabled} onClick={i.onSelect} title={i.label} className={cn(TILE, height, TONE[i.tone ?? "default"])}>
      {i.icon}
      <span className="block w-full truncate text-center">{i.label}</span>
      {i.keyHint && <Kbd className="h-4 min-w-4 border-line px-1 text-[10px] pointer-coarse:hidden">{i.keyHint}</Kbd>}
    </button>
  );
  return (
    <nav ref={nav} aria-label={label} className={cn("flex items-stretch gap-2", className)}>
      {visible.map(tile)}
      {hidden.length > 0 && (
        <DropdownMenu
          align="end"
          trigger={
            <button type="button" aria-label={s.moreActions} className={cn(TILE, height, TONE.default)}>
              <Ellipsis aria-hidden />
              <span className="block w-full truncate text-center">{s.more}</span>
            </button>
          }
          items={hidden.map((i) => ({ label: i.label, icon: i.icon, shortcut: i.keyHint, onSelect: i.onSelect, danger: i.tone === "danger", disabled: i.disabled }))}
        />
      )}
      {end.length > 0 && (visible.length > 0 || hidden.length > 0) && <span aria-hidden="true" className="w-px shrink-0 self-stretch bg-line" />}
      {end.map(tile)}
    </nav>
  );
}
