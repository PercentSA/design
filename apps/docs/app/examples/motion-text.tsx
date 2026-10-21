import { useState } from "react";
import { NumberRoll, RevealText } from "@percentsa/motion";
import { Button, RiyalSign, SegmentedControl, Stack, Text, useStrings } from "@percentsa/ui";
import { useT } from "~/lib/t";

export function RevealTextExample() {
  const t = useT();
  const [key, setKey] = useState(0);
  return (
    <Stack gap={6} className="w-full max-w-2xl">
      <RevealText key={key} as="h2" className="display text-5xl">
        {t("We design, build and run software for companies in Saudi Arabia.", "نصمّم البرمجيات ونبنيها ونشغّلها للشركات في السعودية.")}
      </RevealText>
      <Button variant="secondary" size="sm" className="w-fit" onClick={() => setKey(key + 1)}>
        {t("Replay", "أعد التشغيل")}
      </Button>
    </Stack>
  );
}

export function NumberRollExample() {
  const t = useT();
  const strings = useStrings();
  const [period, setPeriod] = useState("month");
  const yearly = period === "year";
  return (
    <Stack gap={6} align="start">
      <SegmentedControl
        aria-label={t("Billing period", "فترة الفوترة")}
        value={period}
        onValueChange={setPeriod}
        options={[
          { value: "month", label: t("Monthly", "شهري") },
          { value: "year", label: t("Yearly", "سنوي") },
        ]}
      />
      <div>
        {/* The Riyal sign stays left of the number, also in Arabic. */}
        <p dir="ltr" className="display text-6xl">
          <RiyalSign label={strings.riyal} /> <NumberRoll value={yearly ? 12500 : 1250} />
        </p>
        <Text size="sm" tone="muted">
          {yearly ? t("per year, two months free", "في السنة، مع شهرين مجانًا") : t("per month", "في الشهر")}
        </Text>
      </div>
    </Stack>
  );
}
