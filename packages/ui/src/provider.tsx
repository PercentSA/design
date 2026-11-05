"use client";

import { createContext, useContext, useMemo, useState, type ComponentProps, type ComponentType, type MouseEvent, type ReactNode } from "react";
import { Direction } from "radix-ui";
import { dirOf, type Dir, type Lang } from "./i18n/localized";
import { STRINGS, type Strings } from "./i18n/strings";

/** The component that renders links (an adapter for the app's router). Gets `href` like an <a>. */
export type LinkComponent = ComponentType<ComponentProps<"a">>;

/** Renders a visible built-in string; the default shows it as plain text. */
export type TextRenderer = (s: string) => ReactNode;

const plain: TextRenderer = (s) => s;

/** A project's own logo and loading indicator. Components use Percent's where a slot is empty. */
export type BrandSlots = { mark?: ReactNode; wordmark?: ReactNode; spinner?: ReactNode };

type Ctx = { lang: Lang; dir: Dir; strings: Strings; link: LinkComponent | "a"; text: TextRenderer; brand?: BrandSlots };

/** Strings to replace; groups (errors, address, invoice) may replace single entries. */
type StringOverrides = {
  [K in keyof Strings]?: Strings[K] extends (...args: never[]) => unknown ? Strings[K] : Strings[K] extends object ? Partial<Strings[K]> : Strings[K];
};

const mergeStrings = (base: Strings, over: StringOverrides) => {
  const out: Record<string, unknown> = { ...base, ...over };
  for (const [k, v] of Object.entries(over)) if (v && typeof v === "object") out[k] = { ...(base[k as keyof Strings] as object), ...v };
  return out as Strings;
};

const PercentContext = createContext<Ctx>({ lang: "en", dir: "ltr", strings: STRINGS.en, link: "a", text: plain });

// Its own context, so a click does not render every component that reads the main one.
type Pending = { href: string | null; location?: string; start: (href: string) => void };
const PendingContext = createContext<Pending>({ href: null, start: () => {} });

// A plain left click on a link to another page: no new tab, window or download, not a part of this page.
const leaves = (e: MouseEvent<HTMLAnchorElement>, p: ComponentProps<"a">, location?: string) =>
  !e.defaultPrevented &&
  e.button === 0 &&
  !(e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) &&
  (!p.target || p.target === "_self") &&
  p.download == null &&
  !!p.href &&
  !p.href.startsWith("#") &&
  p.href.split("#")[0] !== location;

/** Wraps the app's link: a clicked link gets data-pending and aria-busy until the location changes. */
function pendingLink(Link: LinkComponent | "a"): LinkComponent {
  return function PendingLink(props) {
    const pending = useContext(PendingContext);
    const on = !!props.href && props.href === pending.href;
    return (
      <Link
        {...props}
        data-pending={on ? "" : undefined}
        aria-busy={on || undefined}
        onClick={(e) => {
          props.onClick?.(e);
          if (leaves(e, props, pending.location)) pending.start(props.href!);
        }}
      />
    );
  };
}

/**
 * Language, direction, built-in strings, the link component and the text renderer for every component below it.
 * Set `lang`/`dir` on <html> yourself; the provider does not render an element.
 */
export function PercentProvider({
  lang,
  strings,
  link = "a",
  text = plain,
  brand,
  location,
  children,
}: {
  lang: Lang;
  /** Replace single built-in strings, for example `{ close: "Dismiss" }` or `{ errors: { required: "Required" } }`. */
  strings?: StringOverrides;
  /** Router link, for example `({ href, ...p }) => <Link to={href!} {...p} />` with React Router. */
  link?: LinkComponent | "a";
  /** Renders the visible built-in strings, for example `(s) => <ScrambleText>{s}</ScrambleText>` so they scramble on a language switch. */
  text?: TextRenderer;
  /**
   * The project's logo (`mark`: compact, `wordmark`: with the name) and spinner. With a brand and no `spinner`, Spinner draws a plain ring.
   * A nested provider without `brand` keeps the outer one. Define the object outside render (a new object renders every component again).
   */
  brand?: BrandSlots;
  /**
   * The router's current path and search, for example `usePathname() + "?" + searchParams`. With it, a clicked link
   * (Sidebar, menus, Breadcrumbs, cards, list and table rows) shows a pending state from the click until the location changes.
   */
  location?: string;
  children: ReactNode;
}) {
  const outerBrand = useContext(PercentContext).brand;
  const tracked = location !== undefined;
  // Made once per link component, so links keep their DOM node.
  const shownLink = useMemo(() => (tracked ? pendingLink(link) : link), [link, tracked]);
  const value = useMemo<Ctx>(
    () => ({
      lang,
      dir: dirOf(lang),
      strings: strings ? mergeStrings(STRINGS[lang], strings) : STRINGS[lang],
      link: shownLink,
      text,
      // A brand with one logo uses it in both places, so Percent's never shows by accident.
      brand: brand ? { ...brand, mark: brand.mark ?? brand.wordmark, wordmark: brand.wordmark ?? brand.mark } : outerBrand,
    }),
    [lang, strings, shownLink, text, brand, outerBrand],
  );
  const [click, setClick] = useState<{ href: string; at: string } | null>(null);
  // A new location ends the pending state during render (no effect, so no frame with the old state).
  if (click && click.at !== location) setClick(null);
  const href = click && click.at === location ? click.href : null;
  const pending = useMemo<Pending>(() => ({ href, location, start: (h) => setClick({ href: h, at: location! }) }), [href, location]);
  return (
    <PercentContext.Provider value={value}>
      <PendingContext.Provider value={pending}>
        <Direction.DirectionProvider dir={value.dir}>{children}</Direction.DirectionProvider>
      </PendingContext.Provider>
    </PercentContext.Provider>
  );
}

export const useLang = () => useContext(PercentContext).lang;
export const useDir = () => useContext(PercentContext).dir;
export const useStrings = () => useContext(PercentContext).strings;
export const useLinkComponent = () => useContext(PercentContext).link;
export const useText = () => useContext(PercentContext).text;
export const useBrand = () => useContext(PercentContext).brand;
/** The href of the link that was clicked and waits for its page (PercentProvider `location`), else null. */
export const usePendingHref = () => useContext(PendingContext).href;
