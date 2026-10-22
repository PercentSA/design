import type { Lang } from "../i18n/localized";
import { STRINGS, type Strings } from "../i18n/strings";
import { toWesternDigits } from "./digits";

// Saudi plates: 1 to 3 of the 17 plate letters and 1 to 4 digits (not all zero). The Arabic row reads right to left
// and the Latin row left to right, so both have the same order: «ا ب ح» is "A B J".

/** The plate letters, in the traffic department's order. */
export const PLATE_LETTERS: readonly { ar: string; en: string }[] = [
  { ar: "ا", en: "A" },
  { ar: "ب", en: "B" },
  { ar: "ح", en: "J" },
  { ar: "د", en: "D" },
  { ar: "ر", en: "R" },
  { ar: "س", en: "S" },
  { ar: "ص", en: "X" },
  { ar: "ط", en: "T" },
  { ar: "ع", en: "E" },
  { ar: "ق", en: "G" },
  { ar: "ك", en: "K" },
  { ar: "ل", en: "L" },
  { ar: "م", en: "Z" },
  { ar: "ن", en: "N" },
  { ar: "ه", en: "H" },
  { ar: "و", en: "U" },
  { ar: "ى", en: "V" },
];

const fromLatin = new Map(PLATE_LETTERS.map((l) => [l.en, l.ar]));
const toLatin = new Map(PLATE_LETTERS.map((l) => [l.ar, l.en]));
/** Letters that look the same to the person typing. */
const LOOK_ALIKE: Record<string, string> = { أ: "ا", إ: "ا", آ: "ا", ة: "ه", ي: "ى" };
/** The allowed letters as a message lists them («هـ» is how plates print it). */
const ALLOWED: Record<Lang, string> = {
  ar: PLATE_LETTERS.map((l) => (l.ar === "ه" ? "هـ" : l.ar)).join(" "),
  en: PLATE_LETTERS.map((l) => l.en).join(" "),
};

export type PlateIssue = { type: "letter"; char: string } | { type: "letterCount" } | { type: "digits" };
export type ParsedPlate = { ok: true; empty: true } | { ok: true; empty: false; letters: string; digits: string } | { ok: false; issue: PlateIssue };

/**
 * Reads a plate typed in any order, Arabic or Latin letters, Western or Arabic-Indic digits. Spaces, "-", "_", "."
 * and the tatweel are ignored. The result has Arabic letters and Western digits; leading zeros stay.
 */
export function parsePlate(text: string): ParsedPlate {
  let letters = "";
  let digits = "";
  for (const char of toWesternDigits(text.replace(/ـ/g, ""))) {
    if (/[\s\-_.·]/.test(char)) continue;
    if (char >= "0" && char <= "9") {
      digits += char;
      continue;
    }
    const letter = fromLatin.get(char.toUpperCase()) ?? LOOK_ALIKE[char] ?? char;
    if (!toLatin.has(letter)) return { ok: false, issue: { type: "letter", char } };
    letters += letter;
  }
  if (!letters && !digits) return { ok: true, empty: true };
  if (letters.length > 3 || !letters) return { ok: false, issue: { type: "letterCount" } };
  if (!digits || digits.length > 4 || Number(digits) === 0) return { ok: false, issue: { type: "digits" } };
  return { ok: true, empty: false, letters, digits };
}

/** What to fix in a typed plate. Works on the server. */
export function plateIssueMessage(issue: PlateIssue, lang: Lang = "en", strings: Strings = STRINGS[lang]): string {
  if (issue.type === "letter") return strings.errors.plateLetter(issue.char, ALLOWED[lang]);
  return issue.type === "letterCount" ? strings.errors.plateLetterCount : strings.errors.plateDigits;
}

/** The Latin row, in the same order as the Arabic letters: "ابح" → "A B J". */
export const plateLatin = (letters: string) => [...letters].map((l) => toLatin.get(l) ?? l).join(" ");

/** Western digits as Arabic-Indic digits, for the top row: "0123" → "٠١٢٣". */
export const plateDigitsAr = (digits: string) => digits.replace(/[0-9]/g, (d) => String.fromCharCode(0x0660 + Number(d)));

/** What a screen reader says: "لوحة ا ب ح 1234" or "Plate A B J 1234". Works on the server. */
export const plateLabel = (letters: string, digits: string, lang: Lang = "en", strings: Strings = STRINGS[lang]) =>
  `${strings.plate} ${lang === "ar" ? [...letters].join(" ") : plateLatin(letters)} ${digits}`;

/** The plate as one search text: the Arabic letters (joined and spaced), the Latin letters, the digits in both forms. */
export function plateSearchText(letters: string | null, digits: string | null): string {
  if (!letters || !digits) return "";
  return [letters, [...letters].join(" "), plateLatin(letters).replace(/ /g, ""), digits, plateDigitsAr(digits)].join(" ");
}
