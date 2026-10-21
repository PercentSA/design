import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { useStrings } from "../provider";
import { normalizeDigits } from "../saudi/normalize";
import { toWesternDigits } from "../saudi/digits";
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

/** All parts of a Saudi national address. Inputs post as `${name}.building`, `${name}.city`, … */
export function NationalAddress({
  value,
  onValueChange,
  errors = {},
  name = "address",
  required,
  className,
}: {
  value: NationalAddressValue;
  onValueChange: (value: NationalAddressValue) => void;
  errors?: Partial<Record<Part, ReactNode>>;
  name?: string;
  required?: boolean;
  className?: string;
}) {
  const s = useStrings();
  const set = (part: Part, input: HTMLInputElement) => {
    const digits = DIGITS[part];
    const v =
      part === "shortAddress"
        ? reformat(input, value[part] ?? "", (raw) => toWesternDigits(raw).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))
        : digits
          ? reformat(input, value[part] ?? "", (raw) => normalizeDigits(raw, digits))
          : input.value;
    onValueChange({ ...value, [part]: v });
  };
  return (
    <div className={cn("grid gap-6 sm:grid-cols-2", className)}>
      {ORDER.map((part) => {
        const digits = DIGITS[part];
        const latin = part === "shortAddress" || !!digits;
        return (
          <Field
            key={part}
            label={s.address[part]}
            error={errors[part]}
            required={required && part !== "shortAddress"}
            optional={part === "shortAddress"}
            className={part === "shortAddress" ? "sm:col-span-2" : undefined}
          >
            <Input
              name={`${name}.${part}`}
              value={value[part] ?? ""}
              onChange={(e) => set(part, e.target)}
              autoComplete={part === "postalCode" ? "postal-code" : part === "city" ? "address-level2" : "off"}
              {...(latin ? { dir: "ltr", className: "font-mono uppercase" } : {})}
              {...(digits ? { inputMode: "numeric" as const } : {})}
              {...(part === "shortAddress" ? { placeholder: "RRRD2929" } : {})}
            />
          </Field>
        );
      })}
    </div>
  );
}
