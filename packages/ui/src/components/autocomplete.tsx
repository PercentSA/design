"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode, type Ref } from "react";
import { Popover } from "radix-ui";
import { cn } from "../lib/cn";
import { useStrings, useText } from "../provider";
import { boldRange, matchSuggestions, type AutocompleteSuggestion } from "./autocomplete-match";
import { Input } from "./inputs";
import { MENU_ITEM, inView } from "./input-classes";

export type AutocompleteProps = Omit<ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "ref"> & {
  value: string;
  onValueChange: (value: string) => void;
  suggestions: AutocompleteSuggestion[];
  /** Server search: each typed query is passed on, and `suggestions` are shown as given (no local filter). */
  onQueryChange?: (query: string) => void;
  /** Shows a "Searching" row and sets aria-busy on the list. */
  loading?: boolean;
  /** Shows "Suggestions are not available now"; a string replaces the text. */
  unavailable?: boolean | string;
  /** The row text when nothing matches. Without it, the list closes when nothing matches. */
  emptyText?: string;
  /** Opens the list when focus comes from a pointer press or the Tab key. */
  openOnFocus?: boolean;
  /** Suggest for one part of the text: the query is that part, and a chosen row replaces only that part. `null`: no list. */
  token?: (text: string, cursor: number) => { start: number; end: number } | null;
  /** Rows shown before the "N more" row. Default 8. */
  limit?: number;
  onSuggestionSelect?: (suggestion: AutocompleteSuggestion) => void;
  /** Monospace, left-to-right text without corrections (names, hashes, paths). */
  mono?: boolean;
  ref?: Ref<HTMLInputElement>;
};

const LIVE_DELAY_MS = 400;

/**
 * A text input with suggestions. The text stays free: no row is chosen until the person presses Down
 * and Enter (or clicks), so Enter with no highlighted row still submits the form. Matching ignores case,
 * accents and Arabic letter forms. Server search: `onQueryChange` and `suggestions` as given (the app
 * debounces). `token` suggests for one part of the text. Passes input props, so it works in `Field`
 * and `FormField` as `Input` does.
 */
export function Autocomplete({
  value,
  onValueChange,
  suggestions,
  onQueryChange,
  loading,
  unavailable,
  emptyText,
  openOnFocus,
  token,
  limit = 8,
  onSuggestionSelect,
  mono,
  className,
  ref,
  ...props
}: AutocompleteProps) {
  const s = useStrings();
  const t = useText();
  const listId = useId();
  const inputEl = useRef<HTMLInputElement | null>(null);
  const userFocus = useRef(false);
  const pendingCursor = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [cursor, setCursor] = useState<number | null>(null);
  const [announced, setAnnounced] = useState<ReactNode>("");

  const range = token ? token(value, cursor ?? value.length) : { start: 0, end: value.length };
  const query = range ? value.slice(range.start, range.end) : "";
  const matches = range ? (onQueryChange ? suggestions : matchSuggestions(suggestions, query)) : [];
  const shown = matches.slice(0, limit);
  const status = loading ? "loading" : unavailable ? "unavailable" : null;
  const emptyRow = !status && range && matches.length === 0 ? emptyText : undefined;
  const hasContent = !!range && (shown.length > 0 || !!status || emptyRow !== undefined);
  const expanded = open && hasContent;
  const unavailableText = typeof unavailable === "string" ? unavailable : t(s.suggestionsUnavailable);

  useLayoutEffect(() => {
    if (pendingCursor.current === null) return;
    inputEl.current?.setSelectionRange(pendingCursor.current, pendingCursor.current);
    pendingCursor.current = null;
  }, [value]);

  // Moving in with a pointer or Tab opens the list; a programmatic focus (a dialog opening) does not. The flag is set by a Tab key, or by a press on the field or its label while the field has no focus. A focus change, a cancelled press or a window blur clears it.
  useEffect(() => {
    if (!openOnFocus) return;
    const key = (e: KeyboardEvent) => (userFocus.current = e.key === "Tab");
    const press = (e: Event) => {
      const el = inputEl.current;
      const target = e.target as Node;
      userFocus.current = !!el && document.activeElement !== el && (el.contains(target) || [...(el.labels ?? [])].some((l) => l.contains(target)));
    };
    const clear = () => (userFocus.current = false);
    document.addEventListener("keydown", key, true);
    document.addEventListener("pointerdown", press, true);
    document.addEventListener("pointercancel", clear, true);
    document.addEventListener("focusin", clear);
    window.addEventListener("blur", clear);
    return () => {
      document.removeEventListener("keydown", key, true);
      document.removeEventListener("pointerdown", press, true);
      document.removeEventListener("pointercancel", clear, true);
      document.removeEventListener("focusin", clear);
      window.removeEventListener("blur", clear);
    };
  }, [openOnFocus]);

  // The live region says the result once typing settles.
  const message = !open || loading || !range ? "" : unavailable ? unavailableText : matches.length ? t(s.suggestionCount(matches.length)) : (emptyText ?? t(s.noSuggestions));
  useEffect(() => {
    const id = setTimeout(() => setAnnounced(message), LIVE_DELAY_MS);
    return () => clearTimeout(id);
  }, [message]);

  const close = () => {
    setOpen(false);
    setActive(-1);
  };
  const choose = (row: AutocompleteSuggestion | undefined) => {
    if (!row || !range) return;
    const next = value.slice(0, range.start) + row.value + value.slice(range.end);
    const at = range.start + row.value.length;
    setCursor(at);
    // The layout effect runs only when the text changes; otherwise set the caret now.
    if (next === value) inputEl.current?.setSelectionRange(at, at);
    else pendingCursor.current = at;
    onValueChange(next);
    onSuggestionSelect?.(row);
    close();
  };
  const move = (by: number) => setActive((i) => ((i < 0 && by < 0 ? 0 : i) + by + shown.length) % shown.length);

  const text = (str: string) => {
    const r = boldRange(str, query);
    if (!r) return str;
    return (
      <>
        {str.slice(0, r[0])}
        <b className="font-semibold text-fg">{str.slice(r[0], r[1])}</b>
        {str.slice(r[1])}
      </>
    );
  };

  return (
    <>
      <Popover.Root open={expanded} onOpenChange={(o) => !o && close()}>
        <Popover.Anchor asChild>
          <Input
            {...(mono ? { dir: "ltr", autoCapitalize: "none", autoCorrect: "off", spellCheck: false } : {})}
            {...props}
            ref={(el) => {
              inputEl.current = el;
              if (typeof ref === "function") return ref(el);
              if (ref) ref.current = el;
            }}
            className={cn(mono && "font-mono", className)}
            role="combobox"
            aria-expanded={expanded}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={expanded && active >= 0 && active < shown.length ? `${listId}-${active}` : undefined}
            autoComplete="off"
            value={value}
            onChange={(e) => {
              const at = e.target.selectionStart ?? e.target.value.length;
              const r = token ? token(e.target.value, at) : { start: 0, end: e.target.value.length };
              setCursor(at);
              setActive(-1);
              setOpen(true);
              onValueChange(e.target.value);
              if (r) onQueryChange?.(e.target.value.slice(r.start, r.end));
            }}
            onClick={(e) => {
              setCursor(e.currentTarget.selectionStart);
              props.onClick?.(e);
            }}
            onKeyUp={(e) => {
              setCursor(e.currentTarget.selectionStart);
              props.onKeyUp?.(e);
            }}
            onFocus={(e) => {
              if (openOnFocus && userFocus.current) {
                setCursor(e.currentTarget.selectionStart);
                setActive(-1);
                setOpen(true);
              }
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              close();
              props.onBlur?.(e);
            }}
            onKeyDown={(e) => {
              const down = e.key === "ArrowDown";
              if ((down || e.key === "ArrowUp") && hasContent) {
                if (!expanded) {
                  setOpen(true);
                  setActive(e.altKey ? -1 : down ? 0 : shown.length - 1);
                } else if (shown.length) move(down ? 1 : -1);
              } else if (e.key === "Enter" && expanded && shown[active] && !e.nativeEvent.isComposing && e.keyCode !== 229) choose(shown[active]);
              else if (e.key === "Escape" && expanded) close();
              else {
                if (e.key === "Tab") close();
                return props.onKeyDown?.(e);
              }
              e.preventDefault();
            }}
          />
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
            onInteractOutside={(e) => inputEl.current?.contains(e.target as Node) && e.preventDefault()}
            // Keep focus in the input, so a click on a row or on the list padding does not close the list.
            onMouseDown={(e) => e.preventDefault()}
            // The list stays above a phone keyboard: Radix measures the room that is left.
            className="z-(--p-z-overlay) max-h-[min(18rem,var(--radix-popover-content-available-height))] w-(--radix-popover-trigger-width) overflow-auto rounded-field border border-line bg-surface-2 p-1.5 shadow-overlay"
          >
            {loading && <div className="px-3 py-2 text-sm text-fg-3">{t(s.searching)}</div>}
            {!loading && unavailable && <div className="px-3 py-2 text-sm text-fg-3">{unavailableText}</div>}
            {emptyRow !== undefined && <div className="px-3 py-2 text-sm text-fg-3">{emptyRow}</div>}
            {shown.map((row, i) => (
              <div
                key={row.value}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                data-highlighted={i === active ? "" : undefined}
                ref={i === active ? inView : undefined}
                className={cn(MENU_ITEM, "pe-3")}
                onMouseMove={() => setActive(i)}
                onClick={() => choose(row)}
              >
                <span className={cn("min-w-0 flex-1 truncate", mono && "font-mono")} dir={mono ? "ltr" : undefined}>
                  {text(row.label ?? row.value)}
                </span>
                {row.detail && <span className="shrink-0 text-fg-3">{row.detail}</span>}
              </div>
            ))}
            {matches.length > shown.length && <div className="px-3 py-2 text-sm text-fg-3">{t(s.typeToNarrow(matches.length - shown.length))}</div>}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      <span role="status" className="sr-only">
        {announced}
      </span>
    </>
  );
}
