"use client";

import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from "react";
import { Search } from "lucide-react";
import { Dialog as RadixDialog, Popover } from "radix-ui";
import { cn } from "../lib/cn";
import { useStrings, useText } from "../provider";
import { searchKey } from "../saudi/normalize";
import { MENU_ITEM } from "./input-classes";
import { SIDE } from "./overlays";
import { Spinner } from "./spinner";
import { Kbd } from "./text";
import { useMediaQuery, VisuallyHidden } from "./utility";

export type Command = {
  id: string;
  label: string;
  /** Heading of the group; commands with the same group show together. */
  group?: string;
  icon?: ReactNode;
  /** Shown only, for example "Ctrl N"; bind the keys yourself. */
  shortcut?: string;
  /** Other words that find the command. */
  keywords?: string[];
  /** One line under the label. A string is searched too; a node (for example an amount) only shows: put its words in `keywords`. */
  description?: ReactNode;
  /** The reason the command cannot run now. The row shows it and stays in the list, but cannot be chosen. */
  disabled?: string;
  /** Short text at the end of the row, for example "New". */
  badge?: string;
  onSelect: () => void;
};

/** Calls `onOpen` on Ctrl+K / ⌘K, except while typing in a field other than the palette. Pass `() => setOpen((o) => !o)` to toggle. */
export function useCommandShortcut(onOpen: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // e.code finds the K key on non-Latin layouts (Arabic gives "ن").
      const k = e.key.toLowerCase() === "k" || (!/^[a-z]$/i.test(e.key) && e.code === "KeyK");
      if (!k || !(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return;
      const t = e.target instanceof Element ? e.target : null;
      if (t?.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]') && !t.closest("[data-command-palette]")) return;
      e.preventDefault();
      onOpen();
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [onOpen]);
}

const matches = (c: Command, words: string[]) => {
  const hay = searchKey([c.label, !c.disabled && typeof c.description === "string" ? c.description : "", ...(c.keywords ?? [])].join(" "));
  return words.every((w) => hay.includes(w));
};

function Palette({
  commands,
  placeholder,
  close,
  onSearchChange,
  loading,
}: {
  commands: Command[];
  placeholder?: string;
  close: () => void;
  onSearchChange?: (text: string) => void;
  loading?: boolean | string;
}) {
  const s = useStrings();
  const t = useText();
  const id = useId();
  const [query, setQuery] = useState("");
  const [chosen, setActive] = useState(0);
  const words = searchKey(query).split(/\s+/).filter(Boolean);
  const shown = commands.filter((c) => matches(c, words));
  // Groups in order of first appearance; `shown` is reordered to match so arrow keys follow the screen.
  const groups = [...new Set(shown.map((c) => c.group ?? ""))].map((name) => ({ name, items: shown.filter((c) => (c.group ?? "") === name) }));
  const flat = groups.flatMap((g) => g.items);
  // `commands` can get shorter while the palette is open.
  const active = Math.min(chosen, Math.max(0, flat.length - 1));
  const optionId = (i: number) => `${id}-${i}`;

  // Once per open: the palette is mounted only while open.
  const first = useRef(onSearchChange);
  useEffect(() => {
    first.current?.("");
  }, []);

  useEffect(() => {
    document.getElementById(optionId(active))?.scrollIntoView?.({ block: "nearest" });
  });

  const run = (c: Command | undefined) => {
    if (!c || c.disabled) return;
    c.onSelect();
    close();
  };
  const move = (by: number) => setActive(flat.length ? (active + by + flat.length) % flat.length : 0);

  const option = (c: Command) => {
    const i = flat.indexOf(c);
    return (
      <li
        key={c.id}
        id={optionId(i)}
        role="option"
        aria-selected={i === active}
        aria-disabled={c.disabled ? true : undefined}
        data-highlighted={i === active ? "" : undefined}
        className={cn(MENU_ITEM, "pe-3")}
        // Keep focus in the input.
        onMouseDown={(e) => e.preventDefault()}
        onMouseMove={() => setActive(i)}
        onClick={() => run(c)}
      >
        {c.icon && <span className={cn("flex shrink-0 text-fg-3 [&_svg]:size-4", c.disabled && "opacity-50")}>{c.icon}</span>}
        <span className="min-w-0 flex-1">
          <span className={cn("block truncate", c.disabled && "opacity-50")}>{c.label}</span>
          {(c.disabled || c.description) && <span className="block truncate text-xs text-fg-3 [[data-highlighted]_&]:text-fg-2">{c.disabled || c.description}</span>}
        </span>
        {c.badge && <span className={cn("shrink-0 rounded-pill border border-line px-2 text-xs text-fg-2", c.disabled && "opacity-50")}>{c.badge}</span>}
        {c.shortcut && <Kbd>{c.shortcut}</Kbd>}
      </li>
    );
  };

  return (
    <>
      <div className="flex items-center gap-3 border-b border-line px-4">
        <Search aria-hidden className="size-4 shrink-0 text-fg-3" />
        <input
          data-command-palette=""
          role="combobox"
          aria-expanded="true"
          aria-controls={id}
          aria-autocomplete="list"
          aria-label={placeholder ?? s.searchCommands}
          aria-activedescendant={flat[active] ? optionId(active) : undefined}
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder ?? s.searchCommands}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onSearchChange?.(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") move(1);
            else if (e.key === "ArrowUp") move(-1);
            else if (e.key === "Enter") run(flat[active]);
            else return;
            e.preventDefault();
          }}
          className="h-14 min-w-0 flex-1 bg-transparent text-base text-fg outline-none placeholder:text-fg-3"
        />
      </div>
      <ul id={id} role="listbox" aria-label={s.commandPalette} className="max-h-[min(24rem,60dvh)] min-h-0 overflow-y-auto p-2 empty:hidden">
        {groups.map((g, gi) =>
          g.name ? (
            <li key={g.name} role="presentation" className="pt-1">
              <div id={`${id}-g${gi}`} role="presentation" className="label px-3 py-2">
                {g.name}
              </div>
              <ul role="group" aria-labelledby={`${id}-g${gi}`}>
                {g.items.map(option)}
              </ul>
            </li>
          ) : (
            g.items.map(option)
          ),
        )}
      </ul>
      {/* Always mounted: a live region announces only changes inside it. */}
      <div role="status" className="px-4 text-sm text-fg-3">
        {loading ? (
          <p className="flex items-center gap-2 py-3">
            <Spinner decorative className="size-4" />
            {t(loading === true ? s.searching : loading)}
          </p>
        ) : (
          flat.length === 0 && <p className="py-8 text-center">{t(s.noResults)}</p>
        )}
      </div>
    </>
  );
}

type PaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commands: Command[];
  placeholder?: string;
  /** Gets each typed text, and "" when the palette opens. Fetch server results there and pass them in `commands`. */
  onSearchChange?: (text: string) => void;
  /** A status row while results load: `true` shows "Searching", a string shows that text. */
  loading?: boolean | string;
};

/** Gives the focus back to `el` after the palette closes, only when it is lost: a command or an outside click that moved it keeps it. */
const returnFocus = (e: Event, el: Element | null | undefined) => {
  if (!(el instanceof HTMLElement)) return;
  e.preventDefault();
  if (!document.activeElement || document.activeElement === document.body) el.focus();
};

const palette = ({ commands, placeholder, onOpenChange, onSearchChange, loading }: PaletteProps) => (
  <Palette commands={commands} placeholder={placeholder} close={() => onOpenChange(false)} onSearchChange={onSearchChange} loading={loading} />
);

/** Search and run commands from the keyboard. Open it with `useCommandShortcut`. Matching ignores case, accents and Arabic letter forms. With `anchor` it opens next to that element from 768 px, and as a bottom sheet below. */
export function CommandPalette({
  anchor,
  ...props
}: PaletteProps & {
  /** Opens the palette next to this element (a bottom sheet below 768 px), and gives the focus back to it when the focus is lost. A press on it is not an outside press, so the app can toggle `open`. */
  anchor?: RefObject<HTMLElement | null>;
}) {
  return anchor ? <AnchoredPalette {...props} anchor={anchor} /> : <PaletteDialog {...props} />;
}

function PaletteDialog({ anchor, sheet, ...props }: PaletteProps & { anchor?: RefObject<HTMLElement | null>; sheet?: boolean }) {
  const s = useStrings();
  const back = useRef<Element | null>(null);
  return (
    <RadixDialog.Root open={props.open} onOpenChange={props.onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="p-overlay fixed inset-0 z-(--p-z-overlay) bg-bg/70 backdrop-blur-sm" />
        <RadixDialog.Content
          aria-describedby={undefined}
          data-side={sheet ? "bottom" : undefined}
          // Without a Radix trigger, focus would fall to <body> on close; return it to where it was (or to the anchor).
          onOpenAutoFocus={() => (back.current = document.activeElement)}
          onCloseAutoFocus={(e) => returnFocus(e, anchor?.current ?? back.current)}
          className={cn(
            "fixed z-(--p-z-overlay) overflow-hidden border-line bg-surface-2 text-fg shadow-overlay",
            sheet ? ["p-sheet overflow-y-auto", SIDE.bottom] : "p-pop start-1/2 top-[12dvh] w-[calc(100%-2rem)] max-w-xl rounded-panel border ltr:-translate-x-1/2 rtl:translate-x-1/2",
          )}
        >
          <VisuallyHidden asChild>
            <RadixDialog.Title>{s.commandPalette}</RadixDialog.Title>
          </VisuallyHidden>
          {/* Mounted only while open, so the query starts empty each time. */}
          {palette(props)}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

// A child, so the dialog without `anchor` never calls matchMedia.
function AnchoredPalette({ anchor, ...props }: PaletteProps & { anchor: RefObject<HTMLElement | null> }) {
  const s = useStrings();
  const wide = useMediaQuery("(min-width: 48rem)");
  if (!wide) return <PaletteDialog {...props} anchor={anchor} sheet />;
  return (
    <Popover.Root open={props.open} onOpenChange={props.onOpenChange}>
      <Popover.Anchor virtualRef={anchor} />
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="start"
          collisionPadding={16}
          aria-label={s.commandPalette}
          onCloseAutoFocus={(e) => returnFocus(e, anchor.current)}
          // The anchor is not a Radix trigger: without this, a press on it closes the popover and its click opens it again.
          onInteractOutside={(e) => anchor.current?.contains(e.target as Node) && e.preventDefault()}
          // The list scrolls inside the room that is left (a phone keyboard, a short window).
          className="p-pop z-(--p-z-overlay) flex max-h-[min(30rem,var(--radix-popover-content-available-height))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-panel border border-line bg-surface-2 text-fg shadow-overlay"
        >
          {palette(props)}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
