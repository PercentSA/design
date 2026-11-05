import type { Localized } from "../i18n/localized";
import { toWesternDigits } from "./digits";

export type PhoneCountryCode = "SA" | "AE" | "QA" | "KW" | "BH" | "OM";

export interface PhoneCountry {
  code: PhoneCountryCode;
  /** The built-in names. PhoneInput shows `strings.countries` from the provider, so an app can give its own. */
  name: Localized;
  dialCode: string;
  length: number;
  /** First digit of a valid national number (mobile and landline). */
  starts: string[];
}

export const GCC_PHONE_COUNTRIES: PhoneCountry[] = [
  { code: "SA", name: { en: "Saudi Arabia", ar: "السعودية" }, dialCode: "966", length: 9, starts: ["5", "1"] },
  { code: "AE", name: { en: "UAE", ar: "الإمارات" }, dialCode: "971", length: 9, starts: ["5", "2", "3", "4", "6", "7", "9"] },
  { code: "QA", name: { en: "Qatar", ar: "قطر" }, dialCode: "974", length: 8, starts: ["3", "4", "5", "6", "7"] },
  { code: "KW", name: { en: "Kuwait", ar: "الكويت" }, dialCode: "965", length: 8, starts: ["5", "6", "9"] },
  { code: "BH", name: { en: "Bahrain", ar: "البحرين" }, dialCode: "973", length: 8, starts: ["3", "6"] },
  { code: "OM", name: { en: "Oman", ar: "عمان" }, dialCode: "968", length: 8, starts: ["7", "9"] },
];

export const getPhoneCountry = (code: PhoneCountryCode = "SA") =>
  GCC_PHONE_COUNTRIES.find((c) => c.code === code) ?? GCC_PHONE_COUNTRIES[0]!;

// Permit telephone formatting, but never silently discard letters.
const PHONE_CHARACTERS = /^\+?[0-9٠-٩۰-۹\s().-]+$/;

/** National number and its country, or null when the input is not a phone number at all. */
function parse(input: string, preferred: PhoneCountry) {
  const raw = input.trim();
  if (!PHONE_CHARACTERS.test(raw)) return null;
  let digits = toWesternDigits(raw).replace(/\D/g, "");
  const international = raw.startsWith("+") || digits.startsWith("00");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (!digits) return null;
  const byDial = GCC_PHONE_COUNTRIES.find((c) => digits.startsWith(c.dialCode));
  if (international && !byDial) return null;
  if ((international || digits.length > preferred.length) && byDial)
    return { country: byDial, national: digits.slice(byDial.dialCode.length).replace(/^0+/, "") };
  return { country: preferred, national: digits.replace(/^0+/, "") };
}

export type PhoneIssue = {
  type: "nonDigits" | "tooShort" | "tooLong" | "invalidStart";
  country: PhoneCountry;
};

/** What is wrong with a draft (null when empty or valid). The country may come from a +code in the draft. */
export function getPhoneIssue(draft: string, preferred: PhoneCountry): PhoneIssue | null {
  if (!draft.trim()) return null;
  const p = parse(draft, preferred);
  if (!p) return { type: PHONE_CHARACTERS.test(draft.trim()) ? "invalidStart" : "nonDigits", country: preferred };
  const { country, national } = p;
  if (national.length > country.length) return { type: "tooLong", country };
  if (national.length < country.length) return { type: "tooShort", country };
  if (!country.starts.includes(national[0]!)) return { type: "invalidStart", country };
  return null;
}

/** "966501234567" (dial code + national number, no +), or null when not valid. */
export function normalizePhone(input: string, preferred: PhoneCountryCode = "SA") {
  const country = getPhoneCountry(preferred);
  if (!input.trim() || getPhoneIssue(input, country)) return null;
  const p = parse(input, country)!;
  return p.country.dialCode + p.national;
}

/**
 * A phone number for display: "+966 55 000 0999" (international) or "055 000 0999" (national); "+974 3000 0999", "3000 0999".
 * A value that is not a valid GCC number is returned trimmed and unchanged: display never hides stored data.
 */
export function formatPhone(
  raw: string | null | undefined,
  { style = "international", country = "SA" }: { style?: "international" | "national"; country?: PhoneCountryCode } = {},
) {
  const digits = normalizePhone(raw ?? "", country);
  if (!digits) return (raw ?? "").trim();
  const c = GCC_PHONE_COUNTRIES.find((x) => digits.startsWith(x.dialCode))!;
  const n = digits.slice(c.dialCode.length);
  const grouped = n.length === 9 ? `${n.slice(0, 2)} ${n.slice(2, 5)} ${n.slice(5)}` : `${n.slice(0, 4)} ${n.slice(4)}`;
  if (style === "international") return `+${c.dialCode} ${grouped}`;
  // 9-digit numbers are dialled with a leading 0 inside the country (SA, AE); 8-digit numbers are not.
  return n.length === 9 ? `0${grouped}` : grouped;
}

/** Call and WhatsApp links, or null when the value is not a valid GCC number. */
export function phoneLinks(raw: string | null | undefined, country: PhoneCountryCode = "SA") {
  const digits = normalizePhone(raw ?? "", country);
  return digits ? { tel: `tel:+${digits}`, whatsapp: `https://wa.me/${digits}` } : null;
}
