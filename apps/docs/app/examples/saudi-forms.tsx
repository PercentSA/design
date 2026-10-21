import { useState } from "react";
import {
  Calendar,
  CrInput,
  DatePicker,
  Field,
  FileDrop,
  IbanInput,
  isNationalId,
  MoneyInput,
  NationalAddress,
  NationalIdInput,
  normalizePhone,
  OtpInput,
  parseAmount,
  PhoneInput,
  saudiError,
  Stack,
  Text,
  useLang,
  VatInput,
  type NationalAddressValue,
  type PhoneCountryCode,
  type PlainDate,
} from "@percentsa/ui";
import { useT } from "~/lib/t";

export function PhoneInputExample() {
  const t = useT();
  const [draft, setDraft] = useState("");
  const [country, setCountry] = useState<PhoneCountryCode>("SA");
  return (
    <Stack gap={3} className="w-full max-w-sm">
      <Field label={t("Mobile number", "رقم الجوال")}>
        <PhoneInput value={draft} onValueChange={setDraft} country={country} onCountryChange={setCountry} />
      </Field>
      <Text size="sm" tone="subtle">
        {t("Stored as: ", "يُحفظ كالتالي: ")}
        <span dir="ltr">{normalizePhone(draft, country) ?? "—"}</span>
      </Text>
    </Stack>
  );
}

export function OtpInputExample() {
  const t = useT();
  const [code, setCode] = useState("");
  return (
    <Stack gap={3}>
      <Text size="sm" tone="muted">{t("Enter the code we sent to your phone", "أدخل الرمز الذي أرسلناه إلى جوالك")}</Text>
      <OtpInput value={code} onValueChange={setCode} />
    </Stack>
  );
}

export function MoneyInputExample() {
  const t = useT();
  const [amount, setAmount] = useState("");
  return (
    <Stack gap={3} className="w-full max-w-xs">
      <Field label={t("Budget", "الميزانية")} hint={t("Arabic digits work too", "تعمل الأرقام العربية أيضًا")}>
        <MoneyInput value={amount} onValueChange={setAmount} />
      </Field>
      <Text size="sm" tone="subtle">parseAmount: {String(parseAmount(amount))}</Text>
    </Stack>
  );
}

export function IbanInputExample() {
  const t = useT();
  const lang = useLang();
  const [iban, setIban] = useState("");
  const [touched, setTouched] = useState(false);
  return (
    <Field label="IBAN" error={touched ? saudiError("iban", iban, lang) : null} className="w-full max-w-sm">
      <IbanInput value={iban} onValueChange={setIban} onBlur={() => setTouched(true)} aria-label={t("IBAN", "الآيبان")} />
    </Field>
  );
}

export function IdInputsExample() {
  const t = useT();
  const lang = useLang();
  const [id, setId] = useState("");
  // The first digit names the ID (1 national ID, 2 iqama); all 10 digits are checked.
  const idError = id.length === 10 && !isNationalId(id) ? saudiError("nationalId", id, lang) : null;
  const idHint = idError ? null : id[0] === "1" ? t("National ID", "هوية وطنية") : id[0] === "2" ? t("Iqama", "إقامة") : null;
  const [cr, setCr] = useState("");
  const [vat, setVat] = useState("");
  return (
    <Stack gap={6} className="w-full max-w-sm">
      <Field label={t("National ID or iqama", "رقم الهوية أو الإقامة")} hint={idHint} error={idError}>
        <NationalIdInput value={id} onValueChange={setId} />
      </Field>
      <Field label={t("Commercial registration", "السجل التجاري")} error={cr.length === 10 ? saudiError("cr", cr, lang) : null}>
        <CrInput value={cr} onValueChange={setCr} />
      </Field>
      <Field label={t("VAT number", "الرقم الضريبي")} error={vat.length === 15 ? saudiError("vat", vat, lang) : null}>
        <VatInput value={vat} onValueChange={setVat} />
      </Field>
    </Stack>
  );
}

export function NationalAddressExample() {
  const lang = useLang();
  const [address, setAddress] = useState<NationalAddressValue>({});
  const errors = {
    building: saudiError("building", address.building ?? "", lang),
    postalCode: saudiError("postalCode", address.postalCode ?? "", lang),
    additional: saudiError("additional", address.additional ?? "", lang),
    shortAddress: saudiError("shortAddress", address.shortAddress ?? "", lang),
  };
  return <NationalAddress value={address} onValueChange={setAddress} errors={errors} required className="w-full max-w-2xl" />;
}

export function FileDropExample() {
  const t = useT();
  return (
    <Field label={t("Attachments", "المرفقات")} className="w-full max-w-md">
      <FileDrop name="files" accept=".pdf,image/*" multiple maxSizeMb={5} />
    </Field>
  );
}

export function CalendarExample() {
  const [day, setDay] = useState<PlainDate | null>("2026-02-18");
  return (
    <Stack gap={3}>
      <Calendar value={day} onValueChange={setDay} defaultCalendar="hijri" />
      <Text size="sm" tone="subtle" dir="ltr">value: {day}</Text>
    </Stack>
  );
}

export function DatePickerExample() {
  const t = useT();
  const [day, setDay] = useState<PlainDate | null>(null);
  return (
    <Field label={t("Start date", "تاريخ البدء")} className="w-full max-w-xs">
      <DatePicker value={day} onValueChange={setDay} name="start" />
    </Field>
  );
}
