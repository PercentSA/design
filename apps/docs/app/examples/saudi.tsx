import { useState } from "react";
import {
  Field,
  formatDate,
  formatIban,
  formatMoney,
  Input,
  isCrNumber,
  isNationalId,
  isolate,
  isSaudiIban,
  isVatNumber,
  Money,
  Stack,
  Text,
  useLang,
} from "@percentsa/ui";
import { useT } from "~/lib/t";

export function MoneyExample() {
  return (
    <Stack gap={3}>
      <Money amount={1250} className="text-3xl font-semibold" />
      <Money amount={99.5} />
      <Text size="sm" tone="subtle" dir="ltr">formatMoney(1250, {"{ decimals: 2 }"}) = {formatMoney(1250, { decimals: 2 })}</Text>
    </Stack>
  );
}

export function DatesExample() {
  const lang = useLang();
  const day = new Date("2026-02-18T12:00:00Z");
  return (
    <Stack gap={2}>
      <Text>{formatDate(day, { lang })}</Text>
      <Text>{formatDate(day, { lang, calendar: "hijri" })}</Text>
      <Text tone="muted">{formatDate(day, { lang, calendar: "hijri", style: "short" })}</Text>
    </Stack>
  );
}

export function ValidatorsExample() {
  const t = useT();
  const [value, setValue] = useState("SA0380000000608010167519");
  const checks = [
    ["IBAN", isSaudiIban(value)],
    [t("National ID", "رقم الهوية"), isNationalId(value)],
    [t("CR", "السجل التجاري"), isCrNumber(value)],
    [t("VAT", "الرقم الضريبي"), isVatNumber(value)],
  ] as const;
  return (
    <Stack gap={4} className="w-full max-w-sm">
      <Field label={t("Any number", "أي رقم")}>
        <Input dir="ltr" value={value} onChange={(e) => setValue(e.target.value)} className="font-mono" />
      </Field>
      <ul className="grid gap-1 text-sm">
        {checks.map(([name, ok]) => (
          <li key={name} className={ok ? "text-fg" : "text-fg-3"}>
            {ok ? "✓" : "✗"} {name}
          </li>
        ))}
      </ul>
      {isSaudiIban(value) && <Text size="sm" tone="muted" dir="ltr">{formatIban(value)}</Text>}
    </Stack>
  );
}

export function IsolateExample() {
  return (
    <Stack gap={2}>
      <Text>رقم الطلب {isolate("#4821-B")} جاهز للاستلام.</Text>
      <Text tone="subtle">رقم الطلب #4821-B جاهز للاستلام.</Text>
    </Stack>
  );
}
