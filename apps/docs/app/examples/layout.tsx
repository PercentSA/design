import { AspectRatio, Bleed, Container, DetailLayout, Grid, Inline, ScrollArea, Section, Separator, Split, Stack, Surface, Text } from "@percentsa/ui";
import { useT } from "~/lib/t";

const Box = ({ children = "", className = "" }: { children?: React.ReactNode; className?: string }) => (
  <div className={`grid min-h-12 place-items-center rounded-field border border-line bg-surface-2 px-4 text-sm text-fg-2 ${className}`}>{children}</div>
);

export function ContainerExample() {
  return (
    <div className="w-full border border-dashed border-line-strong">
      <Container size="sm">
        <Box>Container size="sm"</Box>
      </Container>
    </div>
  );
}

export function SectionExample() {
  const t = useT();
  return (
    <div className="w-full border border-dashed border-line-strong">
      <Section space="sm">
        <Box>{t("Section with small spacing", "قسم بمسافة صغيرة")}</Box>
      </Section>
    </div>
  );
}

export function StackInlineExample() {
  return (
    <Split>
      <Stack gap={3}>
        <Box>1</Box>
        <Box>2</Box>
        <Box>3</Box>
      </Stack>
      <Inline gap={3}>
        <Box>1</Box>
        <Box>2</Box>
        <Box>3</Box>
      </Inline>
    </Split>
  );
}

export function GridExample() {
  return (
    <Stack gap={6} className="w-full">
      <Grid cols={3} gap={3}>
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <Box key={n}>{n}</Box>
        ))}
      </Grid>
      <Grid min="10rem" gap={3}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Box key={n}>min 10rem</Box>
        ))}
      </Grid>
    </Stack>
  );
}

export function SplitExample() {
  return (
    <Split ratio="5:7" className="w-full">
      <Box className="h-32">5</Box>
      <Box className="h-32">7</Box>
    </Split>
  );
}

export function DetailLayoutExample() {
  const t = useT();
  return (
    <DetailLayout
      className="w-full"
      main={
        <Stack gap={3}>
          <Box className="h-32">{t("Main: lines, history", "الرئيسي: البنود، السجل")}</Box>
          <Box>{t("Notes", "ملاحظات")}</Box>
        </Stack>
      }
      side={
        <Stack gap={3}>
          <Box>{t("Customer", "العميل")}</Box>
          <Box className="h-20">{t("Totals", "الإجماليات")}</Box>
        </Stack>
      }
      sideLabel={t("Order details", "تفاصيل الطلب")}
    />
  );
}

export function AspectRatioExample() {
  return (
    <div className="w-72">
      <AspectRatio ratio={16 / 9}>
        <Box className="size-full">16 : 9</Box>
      </AspectRatio>
    </div>
  );
}

export function SeparatorExample() {
  const t = useT();
  return (
    <Stack gap={4} className="w-full">
      <Text size="sm">{t("Above", "فوق")}</Text>
      <Separator />
      <Inline gap={4} className="h-6">
        <Text size="sm">{t("Start", "البداية")}</Text>
        <Separator orientation="vertical" />
        <Text size="sm">{t("End", "النهاية")}</Text>
      </Inline>
    </Stack>
  );
}

export function ScrollAreaExample() {
  return (
    <ScrollArea className="h-48 w-64 rounded-field border border-line">
      <div className="grid gap-2 p-4">
        {Array.from({ length: 20 }, (_, i) => (
          <Text key={i} size="sm">
            Item {i + 1}
          </Text>
        ))}
      </div>
    </ScrollArea>
  );
}

export function SurfaceExample() {
  return (
    <Inline gap={4}>
      <Surface className="p-6">surface</Surface>
      <Surface variant="raised" className="p-6">raised</Surface>
      <Surface variant="outline" radius="field" className="p-6">outline</Surface>
    </Inline>
  );
}

export function BleedExample() {
  const t = useT();
  return (
    <div className="w-full border border-dashed border-line-strong">
      <Container>
        <Box>{t("Inside the gutter", "داخل الهامش")}</Box>
        <Bleed className="mt-3">
          <Box className="rounded-none">{t("Full width", "بعرض كامل")}</Box>
        </Bleed>
      </Container>
    </div>
  );
}
