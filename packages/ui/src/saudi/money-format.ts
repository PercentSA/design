// The Saudi Riyal sign (SAMA glyph, Unicode U+20C1). Most fonts have no glyph for it yet,
// so it is drawn as SVG. Path data from the MIT npm package `riyal` (src/svelte/glyph.ts).
export const RIYAL_VIEWBOX = "0 0 1124.14 1256.39";
export const RIYAL_W = 1124.14;
export const RIYAL_H = 1256.39;
export const RIYAL_PATHS = [
  "M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z",
  "M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z",
] as const;

/** Options of formatMoney and <Money>. */
export type MoneyOptions = {
  /** Fixed decimals. Default: 2 when the amount has a fraction, else 0. */
  decimals?: 0 | 2;
  /** Unit prices: at least 2 and at most this many decimals, trailing zeros trimmed. */
  maxDecimals?: 3 | 4 | 5 | 6;
  /** A negative amount in brackets: "(1,234.50)". */
  accounting?: boolean;
};

/**
 * The number part of an amount: Western digits and grouping in both languages.
 * A result of zero has no minus sign; a non-finite amount shows "—", so a broken value never looks like 0.
 * The sign is not text (fonts lack U+20C1): render amounts with <Money>.
 */
export function formatMoney(amount: number, { decimals, maxDecimals, accounting }: MoneyOptions = {}) {
  if (!Number.isFinite(amount)) return "—";
  const min = maxDecimals ? 2 : (decimals ?? (Number.isInteger(amount) ? 0 : 2));
  const text = amount.toLocaleString("en-US", { minimumFractionDigits: min, maximumFractionDigits: maxDecimals ?? min, signDisplay: "negative" });
  return accounting && text.startsWith("-") ? `(${text.slice(1)})` : text;
}
