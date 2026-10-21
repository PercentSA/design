import { Logo, MadeInKsa, Mark, RiyalSign, Text } from "@percentsa/ui";
import { LOGO_VERSIONS } from "@percentsa/tokens";
import { useT } from "~/lib/t";

export function MarkExample() {
  return (
    <div className="flex items-end gap-8">
      <Mark className="h-5" />
      <Mark className="h-10" />
      <Mark className="h-20" label="Percent" />
    </div>
  );
}

export function LogoExample() {
  return (
    <div className="grid gap-8">
      {LOGO_VERSIONS.map((v) => (
        <figure key={v} className="grid justify-items-start gap-2">
          <Logo version={v} className="h-12 w-auto max-w-full" />
          <figcaption className="label text-fg-2" dir="ltr">
            {v}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

export function RiyalSignExample() {
  const t = useT();
  return (
    <div className="grid gap-3">
      <Text size="lg">
        <RiyalSign label={t("Saudi riyal", "ريال سعودي")} /> 1,250
      </Text>
      <p className="display text-5xl">
        <RiyalSign /> 48,000
      </p>
    </div>
  );
}

export function MadeInKsaExample() {
  return <MadeInKsa />;
}
