"use client";

import { MessageCircle } from "lucide-react";
import { cn } from "../lib/cn";
import { useStrings } from "../provider";
import { formatPhone, phoneLinks } from "../saudi/phone";

/** A phone number as a call link, left to right in both languages; `whatsapp` adds a WhatsApp link. An invalid number is plain text. */
export function PhoneText({
  value,
  style = "international",
  whatsapp,
  className,
}: {
  value: string | null | undefined;
  style?: "international" | "national";
  whatsapp?: boolean;
  className?: string;
}) {
  const s = useStrings();
  const text = formatPhone(value, { style });
  if (!text) return null;
  const links = phoneLinks(value);
  if (!links)
    return (
      <span dir="auto" className={className}>
        {text}
      </span>
    );
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap", className)}>
      <a href={links.tel} dir="ltr" className="tabular-nums underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-fg">
        {text}
      </a>
      {whatsapp && (
        <a
          href={links.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={s.whatsapp(text)}
          className="grid size-6 place-items-center rounded-pill text-fg-3 transition-colors hover:bg-surface-2 hover:text-fg"
        >
          <MessageCircle aria-hidden className="size-4" />
        </a>
      )}
    </span>
  );
}
