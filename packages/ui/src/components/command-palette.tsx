"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import { Dialog as RadixDialog } from "radix-ui";
import { cn } from "../lib/cn";
import { useStrings, useText } from "../provider";
import { searchKey } from "../saudi/normalize";
import { MENU_ITEM } from "./input-classes";
import { Kbd } from "./text";
import { VisuallyHidden } from "./utility";

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
  const hay = searchKey([c.label, ...(c.keywords ?? [])].join(" "));
  return words.every((w) => hay.includes(w));
};

function Palette({ commands, placeholder, close }: { commands: Command[]; placeholder?: string; close: () => void }) {
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

  useEffect(() => {
    document.getElementById(optionId(active))?.scrollIntoView?.({ block: "nearest" });
  });

  const run = (c: Command | undefined) => {
    if (!c) return;
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
        data-highlighted={i === active ? "" : undefined}
        className={cn(MENU_ITEM, "pe-3")}
        // Keep focus in the input.
        onMouseDown={(e) => e.preventDefault()}
        onMouseMove={() => setActive(i)}
        onClick={() => run(c)}
      >
        {c.icon && <span className="flex shrink-0 text-fg-3 [&_svg]:size-4">{c.icon}</span>}
        <span className="min-w-0 flex-1 truncate">{c.label}</span>
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
      <ul id={id} role="listbox" aria-label={s.commandPalette} className="max-h-[min(24rem,60dvh)] overflow-y-auto p-2 empty:hidden">
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
        {flat.length === 0 && <p className="py-8 text-center">{t(s.noResults)}</p>}
      </div>
    </>
  );
}

/** Search and run commands from the keyboard. Open it with `useCommandShortcut`. Matching ignores case, accents and Arabic letter forms. */
export function CommandPalette({
  open,
  onOpenChange,
  commands,
  placeholder,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commands: Command[];
  placeholder?: string;
}) {
  const s = useStrings();
  const back = useRef<Element | null>(null);
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="p-overlay fixed inset-0 z-(--p-z-overlay) bg-bg/70 backdrop-blur-sm" />
        <RadixDialog.Content
          aria-describedby={undefined}
          // Without a Radix trigger, focus would fall to <body> on close; return it to where it was.
          onOpenAutoFocus={() => (back.current = document.activeElement)}
          onCloseAutoFocus={(e) => {
            if (!(back.current instanceof HTMLElement)) return;
            e.preventDefault();
            back.current.focus();
          }}
          className="p-pop fixed start-1/2 top-[12dvh] z-(--p-z-overlay) w-[calc(100%-2rem)] max-w-xl overflow-hidden rounded-panel border border-line bg-surface-2 text-fg shadow-overlay ltr:-translate-x-1/2 rtl:translate-x-1/2"
        >
          <VisuallyHidden asChild>
            <RadixDialog.Title>{s.commandPalette}</RadixDialog.Title>
          </VisuallyHidden>
          {/* Mounted only while open, so the query starts empty each time. */}
          <Palette commands={commands} placeholder={placeholder} close={() => onOpenChange(false)} />
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
