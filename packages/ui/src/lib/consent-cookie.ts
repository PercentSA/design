export type Consent = "granted" | "denied";
export const CONSENT_COOKIE = "consent";

/** The visitor's choice from a Cookie header (server) or document.cookie; null when not chosen yet. */
export function readConsent(cookie: string): Consent | null {
  const v = cookie.match(/(?:^|;\s*)consent=(granted|denied)/)?.[1];
  return (v as Consent | undefined) ?? null;
}
