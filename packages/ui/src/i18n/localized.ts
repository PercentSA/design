export const LANGS = ["en", "ar"] as const;
export type Lang = (typeof LANGS)[number];
export type Dir = "ltr" | "rtl";

/** A value in both languages, side by side: `{ en: "Work", ar: "أعمالنا" }`. */
export type Localized<T = string> = Record<Lang, T>;

export const localize = <T,>(value: Localized<T>, lang: Lang): T => value[lang];
export const dirOf = (lang: Lang): Dir => (lang === "ar" ? "rtl" : "ltr");

/** Left-to-right isolate: ids, codes and English words keep their order inside Arabic text. */
export const isolate = (s: string) => `⁦${s}⁩`;
