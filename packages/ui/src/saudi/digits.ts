const EASTERN_DIGIT = /[٠-٩۰-۹]/g;

/** Arabic-Indic (٠–٩) and Persian (۰–۹) digits → 0–9. Other characters are kept. */
export const toWesternDigits = (s: string) =>
  // Both ranges start at a code point ending in 0, so the low 4 bits are the digit.
  s.replace(EASTERN_DIGIT, (c) => String(c.charCodeAt(0) & 0xf));
