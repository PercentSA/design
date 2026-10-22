"use client";

import { useEffect, useId, useState, type ComponentProps } from "react";
import { Eye, EyeOff, Minus, Plus, Search } from "lucide-react";
import { unstable_OneTimePasswordField as Otp } from "radix-ui";
import { cn } from "../lib/cn";
import { useLang, useStrings } from "../provider";
import { toWesternDigits } from "../saudi/digits";
import { RiyalSign } from "../saudi/money";
import { normalizeAmount, normalizeDigits, normalizeIban, normalizeSignedAmount, parseAmount, stepNumber } from "../saudi/normalize";
import { formatIban } from "../saudi/validators";
import { GCC_PHONE_COUNTRIES, getPhoneCountry, getPhoneIssue, type PhoneCountryCode } from "../saudi/phone";
import { phoneIssueMessage } from "../saudi/errors";
import { useFieldControl, useFieldLabelId } from "./field";
import { Input, Select } from "./inputs";

type InputProps = Omit<ComponentProps<"input">, "value" | "onChange" | "type">;
const ADORN_BTN =
  "grid size-8 place-items-center rounded-pill text-fg-3 transition-colors hover:bg-surface-2 hover:text-fg disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50";

/**
 * For inputs that reformat as you type: returns clean(text) and writes show(clean(text)) into the input now,
 * so React finds nothing to change and the caret stays after the same kept character. `show` may only add spaces.
 * An edit that would push kept characters past the limit of `clean` is refused: `prev` and the caret stay.
 */
export function reformat(input: HTMLInputElement, prev: string, clean: (raw: string) => string, show = (value: string) => value) {
  const raw = input.value;
  const caret = input.selectionStart;
  const value = clean(raw);
  // The two sides cleaned apart keep more than the whole: the limit cut a character.
  if (caret != null && clean(raw.slice(0, caret)).length + clean(raw.slice(caret)).length > value.length) {
    const old = show(prev);
    input.value = old;
    const at = Math.max(0, caret - (raw.length - old.length));
    input.setSelectionRange(at, at);
    return prev;
  }
  const text = show(value);
  if (text === raw) return value;
  input.value = text;
  if (caret != null && input === input.ownerDocument.activeElement) {
    let kept = clean(raw.slice(0, caret)).length;
    let i = 0;
    while (kept > 0 && i < text.length) if (text[i++] !== " ") kept--;
    input.setSelectionRange(i, i);
  }
  return value;
}

export function PasswordInput(props: Omit<ComponentProps<"input">, "type">) {
  const s = useStrings();
  const [shown, setShown] = useState(false);
  return (
    <Input
      type={shown ? "text" : "password"}
      autoComplete="current-password"
      end={
        <button type="button" className={ADORN_BTN} aria-label={shown ? s.hidePassword : s.showPassword} onClick={() => setShown(!shown)}>
          {shown ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
        </button>
      }
      {...props}
      className={cn("pe-1.5", props.className)}
    />
  );
}

/** Named "Search" only when no Field label and no aria-labelledby names it: aria-label would hide those. */
export function SearchInput(props: Omit<ComponentProps<"input">, "type">) {
  const s = useStrings();
  const named = useFieldLabelId() || props["aria-labelledby"];
  return <Input type="search" enterKeyHint="search" aria-label={named ? undefined : s.search} start={<Search aria-hidden />} {...props} />;
}

/** Number with step buttons. Accepts Arabic digits; `value` is null while the field is empty. `format` shows a set value ("05"). */
export function NumberInput({
  value,
  onValueChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  format = String,
  disabled,
  ...props
}: Omit<InputProps, "min" | "max" | "step"> & {
  value: number | null;
  onValueChange: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  format?: (value: number) => string;
}) {
  const s = useStrings();
  const [draft, setDraft] = useState(value == null ? "" : format(value));
  // Follow changes from outside (a reset) without fighting the draft while typing "1.".
  useEffect(() => {
    if (parseAmount(draft) !== value) setDraft(value == null ? "" : format(value));
  }, [value]);
  // At a limit the step button stays focusable (aria-disabled): a disabled button would drop focus.
  const atMin = (value ?? 0) <= min;
  const atMax = (value ?? 0) >= max;
  const set = (direction: 1 | -1) => {
    const v = stepNumber(value ?? 0, step, direction, { min, max });
    setDraft(format(v));
    onValueChange(v);
  };
  return (
    <Input
      {...props}
      dir="ltr"
      inputMode="decimal"
      value={draft}
      disabled={disabled}
      className={cn("ps-1.5 pe-1.5 text-center", props.className)}
      onChange={(e) => {
        const d = reformat(e.target, draft, (raw) => normalizeSignedAmount(raw, min < 0));
        setDraft(d);
        onValueChange(parseAmount(d));
      }}
      start={
        <button type="button" className={ADORN_BTN} aria-label={s.decrease} disabled={disabled || props.readOnly} aria-disabled={atMin || undefined} onClick={() => !atMin && set(-1)}>
          <Minus aria-hidden />
        </button>
      }
      end={
        <button type="button" className={ADORN_BTN} aria-label={s.increase} disabled={disabled || props.readOnly} aria-disabled={atMax || undefined} onClick={() => !atMax && set(1)}>
          <Plus aria-hidden />
        </button>
      }
    />
  );
}

/** Amount in riyals. `value` is the draft text (Western digits, "."); read the number with parseAmount(). */
export const MoneyInput = ({ value, onValueChange, ...props }: InputProps & { value: string; onValueChange: (draft: string) => void }) => (
  <Input
    {...props}
    dir="ltr"
    inputMode="decimal"
    autoComplete="off"
    value={value}
    onChange={(e) => onValueChange(reformat(e.target, value, normalizeAmount))}
    start={<RiyalSign label={useStrings().riyal} className="text-fg" />}
    // The whole box is left to right, so the Riyal sign stays left of the number in Arabic too.
    className={cn("[direction:ltr]", props.className)}
  />
);

/** Saudi IBAN, shown in groups of 4. `onValueChange` gets the compact value ("SA03…"). */
export const IbanInput = ({ value, onValueChange, ...props }: InputProps & { value: string; onValueChange: (iban: string) => void }) => (
  <Input
    placeholder="SA00 0000 0000 0000 0000 0000"
    {...props}
    dir="ltr"
    autoComplete="off"
    spellCheck={false}
    value={formatIban(value)}
    onChange={(e) => onValueChange(reformat(e.target, value, normalizeIban, formatIban))}
    className={cn("font-mono uppercase", props.className)}
  />
);

function DigitsInput({ length, value, onValueChange, ...props }: InputProps & { length: number; value: string; onValueChange: (digits: string) => void }) {
  return (
    <Input
      {...props}
      dir="ltr"
      inputMode="numeric"
      autoComplete="off"
      value={value}
      onChange={(e) => onValueChange(reformat(e.target, value, (raw) => normalizeDigits(raw, length)))}
      className={cn("font-mono tracking-wider", props.className)}
    />
  );
}

type DigitsProps = InputProps & { value: string; onValueChange: (digits: string) => void };
/** National ID or iqama number (10 digits). Check with isNationalId(), or getSaudiIdType() for "citizen" / "resident". */
export const NationalIdInput = (p: DigitsProps) => <DigitsInput length={10} {...p} />;
/** Commercial registration number (10 digits). */
export const CrInput = (p: DigitsProps) => <DigitsInput length={10} {...p} />;
/** VAT registration number (15 digits). */
export const VatInput = (p: DigitsProps) => <DigitsInput length={15} {...p} />;
export { DigitsInput };

/** One box per digit; pasting or SMS autofill fills all. Digits read left to right in Arabic too. */
export function OtpInput({
  length = 6,
  className,
  ...props
}: Omit<ComponentProps<typeof Otp.Root>, "children" | "dir"> & { length?: number }) {
  const s = useStrings();
  const labelledBy = useFieldLabelId();
  const field = useFieldControl({ id: undefined as string | undefined, "aria-describedby": props["aria-describedby"], "aria-invalid": props["aria-invalid"] });
  return (
    <Otp.Root
      dir="ltr"
      validationType="none"
      sanitizeValue={(v) => toWesternDigits(v).replace(/\D/g, "")}
      autoComplete="one-time-code"
      // Radix reads dir for arrow keys but does not render it; the class sets the box order.
      className={cn("flex gap-2 [direction:ltr]", className)}
      aria-labelledby={props["aria-label"] ? undefined : labelledBy}
      {...props}
      aria-describedby={field["aria-describedby"]}
    >
      {Array.from({ length }, (_, i) => (
        <Otp.Input
          key={i}
          // The field label points at the first box (a click on it starts there); the group carries the name.
          id={i === 0 ? field.id : undefined}
          inputMode="numeric"
          aria-label={s.otpDigit(i + 1, length)}
          aria-invalid={field["aria-invalid"]}
          // Radix checks typed characters only for its own validation types, so digits are kept here.
          // A refused key is default-prevented, which makes Radix skip its handler.
          onChange={(e) => {
            const d = toWesternDigits(e.target.value).replace(/\D/g, "");
            if (e.target.value && !d) e.preventDefault();
            else e.target.value = d;
          }}
          // In a filled box whose digit is not selected, Radix writes the raw key into the next box without onChange.
          onKeyDown={(e) => {
            const t = e.currentTarget;
            const filled = t.value && !(t.selectionStart === 0 && (t.selectionEnd ?? 0) > 0);
            if (filled && e.key.length === 1 && !/[0-9]/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) e.preventDefault();
          }}
          className="size-12 rounded-field border border-line-strong bg-surface text-center font-mono text-xl text-fg transition-colors hover:border-fg-3 focus-visible:border-fg aria-invalid:border-danger"
        />
      ))}
      <Otp.HiddenInput />
    </Otp.Root>
  );
}

/**
 * GCC phone number with a country menu. `value` is the raw draft (Arabic digits, spaces, +code allowed);
 * store normalizePhone(value, country). Shows what to fix after the field loses focus.
 * With a `name`, the form also posts the country code as `countryName` (default `${name}-country`).
 */
export function PhoneInput({
  value,
  onValueChange,
  country,
  onCountryChange,
  countryName,
  className,
  ...props
}: InputProps & {
  value: string;
  onValueChange: (draft: string) => void;
  country: PhoneCountryCode;
  onCountryChange: (code: PhoneCountryCode) => void;
  countryName?: string;
}) {
  const s = useStrings();
  const lang = useLang();
  const selectId = useId();
  const issueId = useId();
  const [touched, setTouched] = useState(false);
  const c = getPhoneCountry(country);
  const issue = touched ? getPhoneIssue(value, c) : null;
  const countryField = countryName ?? (props.name && `${props.name}-country`);
  return (
    <div className={cn("grid gap-2.5", className)}>
      <div className="flex gap-2">
        {/* A plain input, so the country posts without JavaScript too (the menu needs JavaScript). */}
        {countryField && <input type="hidden" name={countryField} value={country} form={props.form} disabled={props.disabled} />}
        <Select
          id={selectId}
          aria-label={s.country}
          value={country}
          onValueChange={(code) => onCountryChange(code as PhoneCountryCode)}
          disabled={props.disabled}
          className="w-auto shrink-0"
          valueText={<span dir="ltr">{c.code} +{c.dialCode}</span>}
          // dir="ltr" isolates the code, so Arabic shows "(+966)", not "(966+)".
          options={GCC_PHONE_COUNTRIES.map((g) => ({
            value: g.code,
            label: (
              <>
                {s.countries[g.code]} <span dir="ltr">(+{g.dialCode})</span>
              </>
            ),
          }))}
        />
        <Input
          {...props}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          dir="ltr"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onBlur={(e) => {
            setTouched(true);
            props.onBlur?.(e);
          }}
          aria-invalid={issue ? true : props["aria-invalid"]}
          aria-describedby={[props["aria-describedby"], issue ? issueId : undefined].filter(Boolean).join(" ") || undefined}
        />
      </div>
      {issue && (
        <p id={issueId} className="text-sm text-danger">
          {phoneIssueMessage(issue, lang, s)}
        </p>
      )}
    </div>
  );
}
