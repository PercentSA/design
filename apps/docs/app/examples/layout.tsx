import { AspectRatio, Bleed, Card, Container, DescriptionList, DetailLayout, Grid, Inline, List, ListItem, Money, ScrollArea, Section, Separator, Split, Stack, Surface, Text } from "@percentsa/ui";
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

/** Six cards of very different heights, as on a record page. */
function ShiftCards() {
  const t = useT();
  const row = (term: string, termAr: string, amount: number) => ({ term: t(term, termAr), details: <Money amount={amount} /> });
  return (
    <>
      <Card title={t("Shift details", "تفاصيل الوردية")} headingLevel={4}>
        <DescriptionList
          density="compact"
          items={[
            { term: t("Branch", "الفرع"), details: t("Riyadh, Olaya", "الرياض، العليا") },
            { term: t("Cashier", "الكاشير"), details: t("Sara Alharbi", "سارة الحربي") },
            { term: t("Opened", "فُتحت"), details: "08:00" },
            { term: t("Closed", "أُغلقت"), details: "16:05" },
            { term: t("Register", "الصندوق"), details: t("Register 2", "الصندوق 2") },
            { term: t("Orders", "الطلبات"), details: "182" },
            { term: t("Voided", "الملغاة"), details: "3" },
            { term: t("Discounts", "الخصومات"), details: <Money amount={420} /> },
            { term: t("Tips", "الإكراميات"), details: <Money amount={310} /> },
            { term: t("Delivery orders", "طلبات التوصيل"), details: "27" },
          ]}
        />
      </Card>
      <Card title={t("Refunds", "المرتجعات")} headingLevel={4}>
        <DescriptionList density="compact" items={[row("Count", "العدد", 2), row("Total", "الإجمالي", 180)]} />
      </Card>
      <Card title={t("Cash", "النقد")} headingLevel={4}>
        <DescriptionList density="compact" items={[row("Opening", "الافتتاحي", 500), row("Sales", "المبيعات", 9120), row("Expected", "المتوقع", 9620), row("Counted", "المعدود", 9600)]} />
      </Card>
      <Card title={t("Closure", "الإقفال")} headingLevel={4}>
        <DescriptionList density="compact" items={[row("Difference", "الفرق", 20), row("Deposited", "المودع", 9000)]} />
      </Card>
      <Card title={t("Notes", "الملاحظات")} headingLevel={4}>
        <Text size="sm" tone="muted">
          {t(
            "The card terminal was offline from 11:20 to 11:45. Six orders were paid in cash instead. The manager approved the 20 difference and asked to check the drawer count again at the next opening. A supplier delivered milk at 13:00 and the invoice was filed with the shift.",
            "كان جهاز البطاقات خارج الخدمة من 11:20 إلى 11:45، فدُفعت ستة طلبات نقدًا. اعتمد المدير فرق 20 وطلب إعادة عدّ الدرج عند الافتتاح التالي. وصل المورّد بالحليب عند 13:00 وأُرفقت الفاتورة بالوردية.",
          )}
        </Text>
      </Card>
      <Card title={t("Activity", "النشاط")} headingLevel={4}>
        <List>
          {[
            ["08:00", "Shift opened", "فُتحت الوردية"],
            ["11:20", "Card terminal offline", "الجهاز خارج الخدمة"],
            ["11:45", "Card terminal back", "عاد الجهاز"],
            ["13:00", "Delivery received", "استلام توريد"],
            ["16:05", "Shift closed", "أُغلقت الوردية"],
          ].map(([time, en, ar]) => (
            <ListItem key={time} title={t(en!, ar!)} trailing={time} />
          ))}
        </List>
      </Card>
    </>
  );
}

export function GridMasonryExample() {
  const t = useT();
  return (
    <Stack gap={8} className="w-full">
      <Stack gap={3}>
        <Text size="sm" tone="muted">{t("masonry: each card moves up into the free space of its column.", "masonry: تصعد كل بطاقة إلى المساحة الفارغة في عمودها.")}</Text>
        <Grid masonry min="16rem" gap={4} data-testid="masonry-on">
          <ShiftCards />
        </Grid>
      </Stack>
      <Stack gap={3}>
        <Text size="sm" tone="muted">{t("The same cards without masonry: a short card leaves a gap under it.", "البطاقات نفسها بدون masonry: تترك البطاقة القصيرة فراغًا تحتها.")}</Text>
        <Grid min="16rem" gap={4} data-testid="masonry-off">
          <ShiftCards />
        </Grid>
      </Stack>
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
