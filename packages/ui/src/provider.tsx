"use client";

import { createContext, useContext, useMemo, type ComponentProps, type ComponentType, type ReactNode } from "react";
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
  children: ReactNode;
}) {
  const outerBrand = useContext(PercentContext).brand;
  const value = useMemo<Ctx>(
    () => ({
      lang,
      dir: dirOf(lang),
      strings: strings ? mergeStrings(STRINGS[lang], strings) : STRINGS[lang],
      link,
      text,
      // A brand with one logo uses it in both places, so Percent's never shows by accident.
      brand: brand ? { ...brand, mark: brand.mark ?? brand.wordmark, wordmark: brand.wordmark ?? brand.mark } : outerBrand,
    }),
    [lang, strings, link, text, brand, outerBrand],
  );
  return (
    <PercentContext.Provider value={value}>
      <Direction.DirectionProvider dir={value.dir}>{children}</Direction.DirectionProvider>
    </PercentContext.Provider>
  );
}

export const useLang = () => useContext(PercentContext).lang;
export const useDir = () => useContext(PercentContext).dir;
export const useStrings = () => useContext(PercentContext).strings;
export const useLinkComponent = () => useContext(PercentContext).link;
export const useText = () => useContext(PercentContext).text;
export const useBrand = () => useContext(PercentContext).brand;
