import { toWesternDigits } from "./digits";

// Every check accepts spaces and Arabic digits, as people type them.
const clean = (s: string) => toWesternDigits(s).replace(/\s+/g, "").toUpperCase();

/** Saudi IBAN: SA + 2 check digits + 2-digit bank code + 18 letters or digits (SWIFT registry), ISO 13616 mod-97 check. */
export function isSaudiIban(input: string) {
  const s = clean(input);
  if (!/^SA\d{4}[A-Z0-9]{18}$/.test(s)) return false;
  // Move the first 4 characters to the end, letters → numbers (A=10 … Z=35), then mod 97.
  const digits = (s.slice(4) + s.slice(0, 4)).replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let rest = 0;
  for (const d of digits) rest = (rest * 10 + Number(d)) % 97;
  return rest === 1;
}

/** "SA03 8000 0000 6080 1016 7519" */
export const formatIban = (input: string) => clean(input).replace(/(.{4})(?=.)/g, "$1 ");

/** "citizen": Saudi national ID. "resident": iqama. */
export type SaudiIdType = "citizen" | "resident";

/** National ID (starts with 1) or iqama (starts with 2): 10 digits, Luhn check digit. Returns its type, or null when invalid. */
export function getSaudiIdType(input: string): SaudiIdType | null {
  const s = clean(input);
  if (!/^[12]\d{9}$/.test(s)) return null;
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    // Even positions are doubled and their two digits added (14 → 1 + 4).
    const d = Number(s[i]) * (i % 2 === 0 ? 2 : 1);
    sum += d > 9 ? d - 9 : d;
  }
  if (sum % 10 !== 0) return null;
  return s[0] === "1" ? "citizen" : "resident";
}

/** True for a valid national ID or iqama. Use getSaudiIdType() to tell them apart. */
export const isNationalId = (input: string) => getSaudiIdType(input) !== null;

/** Commercial registration number: 10 digits. */
export const isCrNumber = (input: string) => /^\d{10}$/.test(clean(input));

/** VAT registration number: 15 digits, first and last digit 3. */
export const isVatNumber = (input: string) => /^3\d{13}3$/.test(clean(input));

/** National address short address: 4 letters + 4 digits, for example RRRD2929. */
export const isShortAddress = (input: string) => /^[A-Z]{4}\d{4}$/.test(clean(input));
export const isBuildingNumber = (input: string) => /^\d{4}$/.test(clean(input));
export const isAdditionalNumber = (input: string) => /^\d{4}$/.test(clean(input));
export const isPostalCode = (input: string) => /^\d{5}$/.test(clean(input));
