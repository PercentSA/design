import type { Lang } from "../i18n/localized";

/** Western digits in both languages; Arabic words for compact units ("1.3 مليون"). */
export const formatNumber = (value: number, lang: Lang = "en", options?: Intl.NumberFormatOptions) =>
  new Intl.NumberFormat(lang === "ar" ? "ar-SA-u-nu-latn" : "en-US", options).format(value);
