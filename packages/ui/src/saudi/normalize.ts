import { toWesternDigits } from "./digits";

/** Digits only (Arabic digits converted), cut to `length`. For ID, CR, VAT, postal code fields. */
export const normalizeDigits = (raw: string, length?: number) => toWesternDigits(raw).replace(/\D/g, "").slice(0, length);

/** An amount as typed: Western digits, "." decimal point, no grouping, 2 decimals at most. */
export function normalizeAmount(raw: string) {
  const s = toWesternDigits(raw).replace(/٫/g, ".").replace(/[^\d.]/g, "");
  const dot = s.indexOf(".");
  return dot < 0 ? s : s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, "").slice(0, 2);
}

/** normalizeAmount, keeping a leading minus sign when negative numbers are allowed. */
export const normalizeSignedAmount = (raw: string, allowNegative: boolean) =>
  (allowNegative && /^\s*[-\u2212]/.test(raw) ? "-" : "") + normalizeAmount(raw);

/**
 * The next (direction 1) or previous (-1) value on the step grid, kept in [min, max], without float noise (0.1 + 0.2).
 * The grid starts at `min` when given, else at 0; a value off the grid goes to the nearest grid value that way.
 */
export function stepNumber(value: number, step: number, direction: 1 | -1, { min = -Infinity, max = Infinity }: { min?: number; max?: number } = {}) {
  const base = Number.isFinite(min) ? min : 0;
  const decimals = Math.max(...[step, base].map((n) => (String(n).split(".")[1] ?? "").length));
  // Rounded so that 0.3 / 0.1 (2.9999…) counts as on the grid.
  const k = Number(((value - base) / step).toFixed(9));
  const next = base + (direction > 0 ? Math.floor(k) + 1 : Math.ceil(k) - 1) * step;
  return Math.min(max, Math.max(min, Number(next.toFixed(decimals))));
}

export function parseAmount(draft: string) {
  const n = Number.parseFloat(normalizeSignedAmount(draft, true));
  return Number.isFinite(n) ? n : null;
}

/** Upper case letters and Western digits, no spaces, 24 characters at most (Saudi IBAN length). */
export const normalizeIban = (raw: string) => toWesternDigits(raw).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 24);

/** Text for search matching: no case, no accents or harakat, one form of alef, ta marbuta and ya. */
export const searchKey = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ًͯ-ٰٟ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .toLowerCase()
    .trim();
