import { Badge, Button, Field, Inline, Invoice, LineItemsTable, QrCode, Stack, Text, Textarea, TicketView, TotalsList, ZatcaQr, zatcaTlv } from "@percentsa/ui";
import { useT } from "~/lib/t";

const SELLER_VAT = "310123456700003";

export function InvoiceExample() {
  const t = useT();
  return (
    <Invoice
      className="w-full max-w-4xl"
      type="standard"
      number="INV-2026-0042"
      issueDate="2026-02-18"
      showHijri
      seller={{ name: t("Percent Software Studio", "استوديو برسنت للبرمجيات"), vatNumber: SELLER_VAT, crNumber: "1010123456", address: t("Olaya, Riyadh 12211", "العليا، الرياض 12211") }}
      buyer={{ name: t("Najd Trading Co.", "شركة نجد التجارية"), vatNumber: "300987654300003", address: t("Al Malqa, Riyadh 13521", "الملقا، الرياض 13521") }}
      lines={[
        { description: t("Website design", "تصميم الموقع"), quantity: 1, unitPrice: 18_000 },
        { description: t("Development, hours", "التطوير، بالساعة"), quantity: 40, unitPrice: 350 },
        { description: t("Hosting, 12 months", "الاستضافة، 12 شهرًا"), quantity: 12, unitPrice: 99.99 },
      ]}
      notes={t("Payment within 30 days to IBAN SA03 8000 0000 6080 1016 7519.", "الدفع خلال 30 يومًا إلى الآيبان SA03 8000 0000 6080 1016 7519.")}
    />
  );
}

export function SimplifiedInvoiceExample() {
  const t = useT();
  return (
    <Invoice
      className="w-full max-w-4xl"
      type="simplified"
      number="S-10931"
      issueDate="2026-02-18"
      timestamp="2026-02-18T09:30:00Z"
      qr
      seller={{ name: t("Percent Coffee", "قهوة برسنت"), vatNumber: SELLER_VAT }}
      lines={[
        { description: t("Flat white", "فلات وايت"), quantity: 2, unitPrice: 18.26 },
        { description: t("Date cake", "كيكة التمر"), quantity: 1, unitPrice: 21.74 },
        { description: t("Bottled water", "مياه معبأة"), quantity: 1, unitPrice: 2, vatRate: 0 },
      ]}
    />
  );
}

export function LineItemsTableExample() {
  const t = useT();
  return (
    <LineItemsTable
      className="w-full max-w-4xl"
      caption={t("Order SO-1042", "الطلب SO-1042")}
      prices="incl"
      lines={[
        { id: "1", name: t("Arabic coffee, 1 kg", "قهوة عربية، 1 كغ"), sku: "COF-AR-1000", quantity: 4, unitPrice: 89.5, vat: 46.7, total: 358, href: "#COF-AR-1000" },
        { id: "2", name: t("Paper cups, 8 oz", "أكواب ورقية، 8 أونصات"), sku: "CUP-08", quantity: 500, unit: t("pcs", "قطعة"), unitPrice: 0.4565, discount: 10, vat: 28.47, total: 218.25, returned: 50 },
        { id: "3", name: t("Dates, Sukkari", "تمر سكري"), sku: "DAT-SUK", quantity: 2, unitPrice: 45, vat: 11.74, total: 90 },
      ]}
      rowActions={() => [{ label: t("Return", "إرجاع"), onSelect: () => {} }]}
    />
  );
}

export function TotalsListExample() {
  const t = useT();
  return (
    <TotalsList
      className="w-full max-w-sm"
      items={[
        { label: t("Subtotal", "المجموع"), amount: 21_190 },
        { label: t("Discount", "الخصم"), amount: -1_190, hint: t("Spring offer, 5%", "عرض الربيع، 5%") },
        { label: t("VAT", "الضريبة"), amount: 3_000, hint: "15%" },
        { label: t("Total", "الإجمالي"), amount: 23_000, total: true },
        { label: t("Paid", "المدفوع"), amount: 25_000 },
        { label: t("Balance", "الرصيد"), amount: -2_000, accounting: true },
      ]}
    />
  );
}

export function QrCodeExample() {
  const t = useT();
  const label = t("Link to percent.sa", "رابط percent.sa");
  return (
    <QrCode value="https://percent.sa" label={label} size={144} className="rounded-field" />
  );
}

export function ZatcaQrExample() {
  const t = useT();
  const fields = { seller: t("Percent Coffee", "قهوة برسنت"), vatNumber: SELLER_VAT, timestamp: "2026-02-18T09:30:00Z", total: 69, vat: 8.74 };
  return (
    <Stack gap={4} align="center" className="w-full max-w-md">
      <ZatcaQr {...fields} label={t("Invoice QR code", "رمز الاستجابة السريعة للفاتورة")} size={160} className="rounded-field" />
      <Text size="xs" tone="subtle" dir="ltr" className="w-full font-mono break-all">
        {zatcaTlv(fields)}
      </Text>
    </Stack>
  );
}

export function TicketViewExample() {
  const t = useT();
  const omar = { name: t("Omar Alharbi", "عمر الحربي") };
  return (
    <TicketView
      className="w-full max-w-5xl"
      subject={t("Cannot download last month's invoice", "لا أستطيع تنزيل فاتورة الشهر الماضي")}
      id="TCK-1024"
      status={<Badge variant="outline">{t("Open", "مفتوحة")}</Badge>}
      meta={[
        { term: t("Customer", "العميل"), details: t("Najd Trading Co.", "شركة نجد التجارية") },
        { term: t("Priority", "الأولوية"), details: t("High", "عالية") },
        { term: t("Assignee", "المسؤول"), details: omar.name },
        { term: t("Opened", "تاريخ الفتح"), details: t("18 February 2026", "18 فبراير 2026") },
      ]}
      messages={[
        {
          id: "1",
          author: { name: t("Sara Alqahtani", "سارة القحطاني") },
          time: <time dateTime="2026-02-18T09:30">09:30</time>,
          body: t("The download button shows an error for the January invoice.", "يظهر خطأ عند الضغط على زر التنزيل لفاتورة يناير."),
          attachments: [{ name: "error.png", href: "#error.png", size: 245_000 }],
        },
        {
          id: "2",
          author: omar,
          time: <time dateTime="2026-02-18T09:42">09:42</time>,
          body: t("The PDF job failed on the 31st. Running it again now.", "فشلت مهمة إنشاء ملف PDF يوم 31. أعيد تشغيلها الآن."),
          internal: true,
        },
        {
          id: "3",
          author: omar,
          time: <time dateTime="2026-02-18T09:55">09:55</time>,
          body: t("Thanks, Sara. The invoice is ready to download again.", "شكرًا يا سارة. الفاتورة جاهزة للتنزيل مرة أخرى."),
          attachments: [{ name: "INV-2026-0031.pdf", href: "#INV-2026-0031.pdf", size: 1_250_000 }],
        },
      ]}
      composer={
        <form onSubmit={(e) => e.preventDefault()} className="grid gap-3">
          <Field label={t("Reply", "الرد")}>
            <Textarea placeholder={t("Write a reply", "اكتب ردًا")} />
          </Field>
          <Inline justify="end">
            <Button type="submit">{t("Send", "إرسال")}</Button>
          </Inline>
        </form>
      }
    />
  );
}
