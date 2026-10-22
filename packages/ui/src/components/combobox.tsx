"use client";

import { useId, useRef, useState, type ComponentProps } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Popover } from "radix-ui";
import { cn } from "../lib/cn";
import { useStrings, useText } from "../provider";
import { searchKey } from "../saudi/normalize";
import { Input } from "./inputs";
import { MENU_ITEM } from "./input-classes";

// The highlighted option of a long list stays in view (runs when the highlight lands on an option).
const inView = (el: HTMLElement | null) => el?.scrollIntoView?.({ block: "nearest" });

export type ComboboxOption = { value: string; label: string; disabled?: boolean };

/**
 * A select you can type into (long lists: cities, banks, countries). Matching ignores case,
 * accents and Arabic letter forms. `name` posts the chosen value with the form. The list is a
 * popover layer: it is not clipped by its parents, and Escape inside a dialog closes only the list.
 * Server search: `onQueryChange` gets each typed query and `options` are its results, shown as given
 * (the app debounces). `limit` shows the first matches only; `onCreate` adds an "Add" option last.
 */
export function Combobox({
  options,
  value,
  onValueChange,
  name,
  onQueryChange,
  loading,
  valueLabel,
  limit,
  onCreate,
  className,
  ...props
}: Omit<ComponentProps<"input">, "value" | "onChange" | "name"> & {
  options: ComboboxOption[];
  value: string | null;
  onValueChange: (value: string) => void;
  name?: string;
  /** Server search: each typed query is passed on, and `options` are the results (no local filter). */
  onQueryChange?: (query: string) => void;
  /** Shows a "Searching" row and sets aria-busy on the list. */
  loading?: boolean;
  /** The label of the chosen value when it is not in `options` (server search). */
  valueLabel?: string;
  /** Shows the first `limit` matches and a row that says how many more there are. */
  limit?: number;
  /** Adds a last option, Add «query», when no option has the typed text as its label. */
  onCreate?: (query: string) => void;
}) {
  const s = useStrings();
  const t = useText();
  const listId = useId();
  const anchor = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  // Server search: the option chosen last keeps its label in the input when new results do not contain it.
  const [chosen, setChosen] = useState<ComboboxOption | null>(null);
  const label = options.find((o) => o.value === value)?.label ?? (onQueryChange && chosen?.value === value ? chosen.label : valueLabel) ?? "";
  const key = searchKey(query);
  const matches = key && !onQueryChange ? options.filter((o) => searchKey(o.label).includes(key)) : options;
  const shown = limit === undefined ? matches : matches.slice(0, limit);
  const create = onCreate && key && !loading && !options.some((o) => searchKey(o.label) === key) ? query.trim() : null;
  // Rows the arrows reach: the shown options, then the Add option.
  const count = shown.length + (create ? 1 : 0);

  const close = () => {
    setOpen(false);
    setQuery("");
    if (query) onQueryChange?.("");
  };
  const choose = (o: ComboboxOption | undefined) => {
    if (!o || o.disabled) return;
    setChosen(o);
    onValueChange(o.value);
    close();
  };
  // A closed list opens on the chosen item, else from the arrow keys on the first (ArrowUp: the last) item;
  // a click highlights nothing, so Enter does not pick an item the person did not point at.
  const openList = (by?: number) => {
    const chosen = shown.findIndex((o) => o.value === value);
    setActive(chosen >= 0 ? chosen : by === undefined ? -1 : by < 0 ? shown.length - 1 : 0);
    setOpen(true);
  };
  const move = (by: number) => {
    if (!open) return openList(by);
    // From no highlight, ArrowDown goes to the first item and ArrowUp to the last.
    setActive((i) => (count ? ((i < 0 && by < 0 ? 0 : i) + by + count) % count : 0));
  };

  return (
    <Popover.Root open={open} onOpenChange={(o) => !o && close()}>
      <Popover.Anchor asChild>
        <div ref={anchor} className={cn("relative", className)}>
          <Input
            {...props}
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={open && active >= 0 && active < count ? `${listId}-${active}` : undefined}
            autoComplete="off"
            value={open ? query : label}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(e.target.value ? 0 : -1);
              setOpen(true);
              onQueryChange?.(e.target.value);
            }}
            onClick={() => !open && openList()}
            onBlur={(e) => {
              close();
              props.onBlur?.(e);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") move(1);
              else if (e.key === "ArrowUp") move(-1);
              else if (e.key === "Enter" && open && create && active === shown.length) {
                onCreate?.(create);
                close();
              } else if (e.key === "Enter" && open && !query && !shown[active]) {
                // No text and no highlighted item: Enter clears the value.
                if (value) onValueChange("");
                close();
              } else if (e.key === "Enter" && open) choose(shown[active]);
              else if (e.key === "Escape" && open) close();
              else return props.onKeyDown?.(e);
              e.preventDefault();
            }}
            end={<ChevronDown aria-hidden className={cn("transition-transform", open && "rotate-180")} />}
          />
          {name && <input type="hidden" name={name} value={value ?? ""} form={props.form} disabled={props.disabled} />}
        </div>
      </Popover.Anchor>
      <Popover.Portal>
        <Popover.Content
          id={listId}
          role="listbox"
          aria-busy={loading || undefined}
          align="start"
          sideOffset={6}
          // Focus stays in the input; the list is pointed at with aria-activedescendant.
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => anchor.current?.contains(e.target as Node) && e.preventDefault()}
          // Keep focus in the input, so a click on an option or on the list padding does not close the list.
          onMouseDown={(e) => e.preventDefault()}
          className="z-(--p-z-overlay) max-h-72 w-(--radix-popover-trigger-width) overflow-auto rounded-field border border-line bg-surface-2 p-1.5 shadow-overlay"
        >
          {loading ? (
            <div className="px-3 py-2 text-sm text-fg-3">{t(s.searching)}</div>
          ) : (
            shown.length === 0 && !create && <div className="px-3 py-2 text-sm text-fg-3">{t(s.noResults)}</div>
          )}
          {shown.map((o, i) => (
            <div
              key={o.value}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={o.value === value}
              aria-disabled={o.disabled || undefined}
              data-highlighted={i === active ? "" : undefined}
              data-disabled={o.disabled ? "" : undefined}
              ref={i === active ? inView : undefined}
              className={MENU_ITEM}
              onMouseMove={() => setActive(i)}
              onClick={() => choose(o)}
            >
              {o.label}
              {o.value === value && <Check aria-hidden className="absolute end-3 size-4" />}
            </div>
          ))}
          {matches.length > shown.length && <div className="px-3 py-2 text-sm text-fg-3">{t(s.typeToNarrow(matches.length - shown.length))}</div>}
          {create && (
            <div
              id={`${listId}-${shown.length}`}
              role="option"
              aria-selected={false}
              data-highlighted={active === shown.length ? "" : undefined}
              ref={active === shown.length ? inView : undefined}
              className={MENU_ITEM}
              onMouseMove={() => setActive(shown.length)}
              onClick={() => {
                onCreate?.(create);
                close();
              }}
            >
              {t(s.addNew(create))}
            </div>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
