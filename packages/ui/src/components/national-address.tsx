"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { useStrings } from "../provider";
import type { Lang } from "../i18n/localized";
import { normalizeDigits } from "../saudi/normalize";
import { toWesternDigits } from "../saudi/digits";
import { isShortAddress } from "../saudi/validators";
import { Field } from "./field";
import { Input } from "./inputs";
import { reformat } from "./special-inputs";

export type NationalAddressValue = {
  shortAddress?: string;
  building?: string;
  street?: string;
  district?: string;
  city?: string;
  postalCode?: string;
  additional?: string;
};
type Part = keyof NationalAddressValue;

// Saudi National Address (SPL): digits parts are fixed length; the short address is optional.
const DIGITS: Partial<Record<Part, number>> = { building: 4, postalCode: 5, additional: 4 };
const ORDER: Part[] = ["shortAddress", "building", "street", "district", "city", "postalCode", "additional"];

// autoFetch: a full short address (4 letters + 4 digits) fills the other parts. 200 = the address, 404 = not found.
// The API reads the language from its `lang` cookie, so the request sends credentials; `lang` overrides it.
const LOOKUP_URL = "https://api.percent.sa/v1/address/short";
type Found = { building?: string | null; street?: string | null; district?: string | null; city?: string | null; postal?: string | null; additional?: string | null };

/** All parts of a Saudi national address. Inputs post as `${name}.building`, `${name}.city`, … */
export function NationalAddress({
  value,
  onValueChange,
  errors = {},
  name = "address",
  required,
  autoFetch = false,
  lang,
  className,
}: {
  value: NationalAddressValue;
  onValueChange: (value: NationalAddressValue) => void;
  errors?: Partial<Record<Part, ReactNode>>;
  name?: string;
  required?: boolean;
  /** Look up the short address and fill the other parts. Off by default. */
  autoFetch?: boolean;
  /** Language of the looked-up address. Without it, the API uses its `lang` cookie. */
  lang?: Lang;
  className?: string;
}) {
  const s = useStrings();
  const [lookup, setLookup] = useState<"loading" | "notFound" | null>(null);
  const latest = useRef(value);
  latest.current = value;
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);

  const fetchAddress = async (code: string) => {
    request.current?.abort();
    const controller = (request.current = new AbortController());
    setLookup("loading");
    try {
      const url = `${LOOKUP_URL}?code=${encodeURIComponent(code)}${lang ? `&lang=${lang}` : ""}`;
      const res = await fetch(url, { credentials: "include", signal: controller.signal });
      const found: Found | null = res.ok ? await res.json() : null;
      if (controller.signal.aborted) return;
      setLookup(res.status === 404 ? "notFound" : null);
      if (!found) return;
      const parts: NationalAddressValue = {
        building: found.building ?? undefined,
        street: found.street ?? undefined,
        district: found.district ?? undefined,
        city: found.city ?? undefined,
        postalCode: found.postal ?? undefined,
        additional: found.additional ?? undefined,
      };
      // Parts the API does not know (null) keep what the person typed.
      const next = { ...latest.current };
      for (const [part, v] of Object.entries(parts) as [Part, string | undefined][]) if (v) next[part] = v;
      onValueChange(next);
    } catch {
      // A network error leaves the form as it is: every part can still be typed.
      if (!controller.signal.aborted) setLookup(null);
    }
  };

  const set = (part: Part, input: HTMLInputElement) => {
    const digits = DIGITS[part];
    const v =
      part === "shortAddress"
        ? reformat(input, value[part] ?? "", (raw) => toWesternDigits(raw).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))
        : digits
          ? reformat(input, value[part] ?? "", (raw) => normalizeDigits(raw, digits))
          : input.value;
    onValueChange({ ...value, [part]: v });
    if (autoFetch && part === "shortAddress" && v !== value.shortAddress) {
      if (isShortAddress(v)) void fetchAddress(v);
      else {
        request.current?.abort();
        setLookup(null);
      }
    }
  };
  return (
    <div className={cn("grid gap-6 sm:grid-cols-2", className)} aria-busy={lookup === "loading" || undefined}>
      {ORDER.map((part) => {
        const digits = DIGITS[part];
        const latin = part === "shortAddress" || !!digits;
        const short = part === "shortAddress";
        return (
          <Field
            key={part}
            label={s.address[part]}
            hint={short && lookup === "loading" ? s.addressLookup.loading : undefined}
            error={errors[part] ?? (short && lookup === "notFound" ? s.addressLookup.notFound : undefined)}
            required={required && !short}
            optional={short}
            className={short ? "sm:col-span-2" : undefined}
          >
            <Input
              name={`${name}.${part}`}
              value={value[part] ?? ""}
              onChange={(e) => set(part, e.target)}
              autoComplete={part === "postalCode" ? "postal-code" : part === "city" ? "address-level2" : "off"}
              {...(latin ? { dir: "ltr", className: "font-mono uppercase" } : {})}
              {...(digits ? { inputMode: "numeric" as const } : {})}
              {...(short ? { placeholder: "RRRD2929" } : {})}
            />
          </Field>
        );
      })}
    </div>
  );
}
