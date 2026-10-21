import { useEffect, useState } from "react";
import { cn } from "../lib/cn";
import { useStrings, useText } from "../provider";
import { Button } from "./actions";

export type Consent = "granted" | "denied";
const COOKIE = "consent";

/** The visitor's choice from a Cookie header (server) or document.cookie; null when not chosen yet. */
export function readConsent(cookie: string): Consent | null {
  const v = cookie.match(/(?:^|;\s*)consent=(granted|denied)/)?.[1];
  return (v as Consent | undefined) ?? null;
}

/**
 * Cookie consent for analytics (PDPL). Rejecting is as easy as accepting. The choice is kept for
 * 180 days in the `consent` cookie, so the server can read it with readConsent().
 */
export function ConsentBanner({ policyHref, onChange, className }: { policyHref?: string; onChange?: (choice: Consent) => void; className?: string }) {
  const s = useStrings();
  const t = useText();
  // Hidden on the server and until the cookie is read, so a chosen visitor never sees it flash.
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(readConsent(document.cookie) === null), []);
  if (!open) return null;
  const choose = (c: Consent) => {
    document.cookie = `${COOKIE}=${c}; Path=/; Max-Age=${60 * 60 * 24 * 180}; SameSite=Lax`;
    setOpen(false);
    onChange?.(c);
  };
  return (
    <div
      role="region"
      aria-label={s.consentTitle}
      className={cn(
        "p-float fixed inset-x-4 bottom-4 z-(--p-z-toast) mx-auto grid max-w-2xl gap-4 rounded-card border border-line bg-surface-2 p-5 text-fg shadow-overlay md:flex md:items-center",
        className,
      )}
    >
      <p className="flex-1 text-sm text-fg-2">
        {t(s.consentBody)}{" "}
        {policyHref && (
          <a href={policyHref} className="text-fg underline decoration-line-strong underline-offset-4 hover:decoration-fg">
            {t(s.privacyPolicy)}
          </a>
        )}
      </p>
      <div className="flex shrink-0 gap-2">
        <Button variant="secondary" onClick={() => choose("denied")}>
          {t(s.reject)}
        </Button>
        <Button onClick={() => choose("granted")}>{t(s.accept)}</Button>
      </div>
    </div>
  );
}
