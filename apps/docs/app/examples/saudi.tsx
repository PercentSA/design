import { useState } from "react";
import {
  Field,
  formatDate,
  formatDateTime,
  formatIban,
  formatMoney,
  formatRelative,
  Input,
  isCrNumber,
  isNationalId,
  isolate,
  isSaudiIban,
  isVatNumber,
  Money,
  PhoneText,
  SaudiPlate,
  Stack,
  Text,
  TimeText,
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

export function MoneyOptionsExample() {
  return (
    <Stack gap={2}>
      <Money amount={314.7826} maxDecimals={6} />
      <Money amount={-1234.5} decimals={2} accounting />
      <Text size="sm" tone="subtle" dir="ltr">formatMoney(-0.004, {"{ decimals: 2 }"}) = {formatMoney(-0.004, { decimals: 2 })}</Text>
    </Stack>
  );
}

export function PhoneTextExample() {
  return (
    <Stack gap={2}>
      <PhoneText value="0550000999" whatsapp />
      <PhoneText value="+97430000999" style="national" />
      <PhoneText value="12" />
    </Stack>
  );
}

export function SaudiPlateExample() {
  return (
    <Stack gap={3}>
      <SaudiPlate letters="ابح" digits="1234" size="lg" />
      <SaudiPlate letters="ه" digits="55" />
      <SaudiPlate letters="لم" digits="0123" size="sm" />
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

// A fixed "now" (Sunday 27 September 2026, 3:45 PM in Riyadh), so the server and the browser show the same text.
const NOW = new Date("2026-09-27T12:45:00Z");

export function TimeTextExample() {
  const lang = useLang();
  return (
    <Stack gap={2}>
      <TimeText value="2026-09-27T09:10:00Z" now={NOW} />
      <TimeText value="2026-09-26T18:30:00Z" now={NOW} />
      <TimeText value="2026-09-12T12:45:00Z" now={NOW} />
      <TimeText value="2025-03-02T08:00:00Z" now={NOW} />
      <TimeText value="2026-09-28" kind="date" now={NOW} />
      <TimeText value="2026-09-27T12:40:00Z" ago now={NOW} />
      <Text size="sm" tone="muted">{formatRelative("2026-07-29T12:45:00Z", { lang, now: NOW })}</Text>
      <Text size="sm" tone="muted">{formatDateTime("2026-09-27 12:45:12", { lang, style: "full" })}</Text>
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
