import type { Lang } from "../i18n/localized";
import { STRINGS, type Strings } from "../i18n/strings";
import type { PhoneIssue } from "./phone";
import { isAdditionalNumber, isBuildingNumber, isCrNumber, isNationalId, isPostalCode, isSaudiIban, isShortAddress, isVatNumber } from "./validators";

const CHECKS = {
  iban: isSaudiIban,
  nationalId: isNationalId,
  cr: isCrNumber,
  vat: isVatNumber,
  postalCode: isPostalCode,
  building: isBuildingNumber,
  additional: isAdditionalNumber,
  shortAddress: isShortAddress,
} as const;

export type SaudiField = keyof typeof CHECKS;

/** The error message for a Saudi field, or null when it is valid or empty (check "required" separately). Works on the server. */
export function saudiError(kind: SaudiField, value: string, lang: Lang = "en", strings: Strings = STRINGS[lang]) {
  return !value.trim() || CHECKS[kind](value) ? null : strings.errors[kind];
}

/** What to fix in a phone draft: digits only, the number of digits, or the first digit. */
export function phoneIssueMessage(issue: PhoneIssue, lang: Lang = "en", strings: Strings = STRINGS[lang]) {
  if (issue.type === "nonDigits") return strings.errors.phoneDigits;
  if (issue.type !== "invalidStart") return strings.errors.phoneLength(issue.country.length);
  return strings.errors.phoneStart(new Intl.ListFormat(lang, { type: "disjunction" }).format(issue.country.starts));
}
