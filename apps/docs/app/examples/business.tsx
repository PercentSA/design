import { Badge, Button, Inline, Invoice, LineItemsTable, QrCode, Stack, Text, Textarea, TicketView, TotalsList, ZatcaQr, zatcaTlv } from "@percentsa/ui";
import { useEffect, useRef, useState } from "react";
import { Combobox, Field, Input, invoiceTotals, LineItemsEditor, Money, MoneyInput, parseAmount, type LineEditorColumn, type MenuItem } from "@percentsa/ui";
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

export function LineItemsTableDetailsExample() {
  const t = useT();
  return (
    <Stack gap={6} className="w-full max-w-4xl">
      <LineItemsTable
        caption={t("Quote QT-318", "عرض السعر QT-318")}
        prices="excl"
        lines={[
          {
            id: "1",
            name: t("Front brake kit", "طقم فرامل أمامي"),
            sku: "KIT-FB-01",
            quantity: 1,
            unitPrice: 200,
            total: 200,
            media: { alt: t("Front brake kit", "طقم فرامل أمامي") },
            description: t("VAT 15%", "معدل الضريبة 15%"),
            parts: [
              { id: "a", name: t("Brake disc", "قرص فرامل"), sku: "BD-12", quantity: 2 },
              { id: "b", name: t("Pad set", "طقم فحمات"), sku: "BP-01", quantity: 1 },
            ],
            extra: (
              <Inline gap={2}>
                <Badge variant="outline">{t("Ceramic", "سيراميك")}</Badge>
                <Badge variant="outline">{t("Front axle", "المحور الأمامي")}</Badge>
              </Inline>
            ),
          },
          { id: "2", name: t("Brake fluid, 1 L", "زيت فرامل، 1 لتر"), sku: "BF-1", quantity: 2, unitPrice: 25, total: 50, description: t("VAT 15%", "معدل الضريبة 15%") },
        ]}
        totals={[
          { label: t("Subtotal", "المجموع"), amount: 250 },
          { label: t("VAT", "الضريبة"), amount: 37.5, hint: "15%" },
          { label: t("Total", "الإجمالي"), amount: 287.5, total: true },
        ]}
      />
      <LineItemsTable caption={t("Return RT-12", "المرتجع RT-12")} prices="incl" lines={[]} empty={t("No lines yet. Add a product to start.", "لا توجد بنود بعد. أضف منتجًا للبدء.")} />
    </Stack>
  );
}

const PRODUCTS = [
  { value: "COF", en: "Arabic coffee, 1 kg", ar: "قهوة عربية، 1 كغ", price: 89.5 },
  { value: "CUP", en: "Paper cups, 8 oz", ar: "أكواب ورقية، 8 أونصات", price: 0.46 },
  { value: "DAT", en: "Dates, Sukkari", ar: "تمر سكري", price: 45 },
];

type EditorLine = { id: string; product: string; qty: string; price: string; note: string };

/** An invoice line editor: product pick (the focus moves on), quantity, price, a computed total, line details, a menu and the totals. */
export function LineItemsEditorExample() {
  const t = useT();
  const nextId = useRef(3);
  const [lines, setLines] = useState<EditorLine[]>([
    { id: "1", product: "COF", qty: "4", price: "89.50", note: "" },
    { id: "2", product: "", qty: "1", price: "", note: "" },
  ]);
  const patch = (id: string, change: Partial<EditorLine>) => setLines((all) => all.map((l) => (l.id === id ? { ...l, ...change } : l)));
  const sums = invoiceTotals(lines.map((l) => ({ quantity: parseAmount(l.qty) ?? 0, unitPrice: parseAmount(l.price) ?? 0 })));
  const columns: LineEditorColumn<EditorLine>[] = [
    {
      key: "product",
      header: t("Product", "المنتج"),
      width: "fill",
      card: "title",
      cell: (l, ctx) => (
        <Field label={t("Product", "المنتج")}>
          <Combobox
            value={l.product}
            onValueChange={(value) => {
              const hit = PRODUCTS.find((p) => p.value === value);
              patch(l.id, { product: value, price: hit ? hit.price.toFixed(2) : l.price });
              ctx.next();
            }}
            options={PRODUCTS.map((p) => ({ value: p.value, label: t(p.en, p.ar) }))}
          />
        </Field>
      ),
    },
    {
      key: "qty",
      header: t("Quantity", "الكمية"),
      width: "xs",
      cell: (l) => (
        <Field label={t("Quantity", "الكمية")} error={(parseAmount(l.qty) ?? 0) <= 0 ? t("Enter a quantity", "أدخل الكمية") : undefined}>
          <Input inputMode="decimal" dir="ltr" value={l.qty} onChange={(e) => patch(l.id, { qty: e.target.value })} />
        </Field>
      ),
    },
    {
      key: "price",
      header: t("Unit price", "سعر الوحدة"),
      width: "sm",
      cell: (l) => (
        <Field label={t("Unit price", "سعر الوحدة")}>
          <MoneyInput value={l.price} onValueChange={(price) => patch(l.id, { price })} />
        </Field>
      ),
    },
    { key: "total", header: t("Total", "الإجمالي"), width: "sm", align: "end", readOnly: true, card: "end", cell: (_, ctx) => <Money amount={sums.lines[ctx.index]?.total ?? 0} decimals={2} /> },
  ];
  return (
    <form className="w-full max-w-4xl" onSubmit={(e) => e.preventDefault()}>
      <LineItemsEditor
        caption={t("Invoice lines", "بنود الفاتورة")}
        hideCaption
        lines={lines}
        getKey={(l) => l.id}
        columns={columns}
        onAdd={() => setLines((all) => [...all, { id: String(nextId.current++), product: "", qty: "1", price: "", note: "" }])}
        addLabel={t("Add a product", "إضافة منتج")}
        onRemove={(i) => setLines((all) => all.filter((_, j) => j !== i))}
        canRemove={() => lines.length > 1}
        lineActions={(l, i): MenuItem[] => [
          { label: t("Duplicate line", "تكرار البند"), onSelect: () => setLines((all) => [...all.slice(0, i + 1), { ...l, id: String(nextId.current++) }, ...all.slice(i + 1)]) },
        ]}
        detail={(l) => (
          <Field label={t("Line note", "ملاحظة البند")}>
            <Input value={l.note} onChange={(e) => patch(l.id, { note: e.target.value })} />
          </Field>
        )}
        totals={[
          { label: t("Subtotal", "المجموع قبل الضريبة"), amount: sums.subtotal },
          { label: t("VAT", "ضريبة القيمة المضافة"), hint: "15%", amount: sums.vat },
          { label: t("Total incl. VAT", "الإجمالي شامل الضريبة"), amount: sums.total, total: true },
        ]}
      />
    </form>
  );
}

type CountLine = { id: string; name: string; expected: number; counted: string };

/** A stocktake: no totals, read-only expected and difference. */
export function LineItemsEditorStocktakeExample() {
  const t = useT();
  const [lines, setLines] = useState<CountLine[]>([
    { id: "1", name: t("Arabic coffee, 1 kg", "قهوة عربية، 1 كغ"), expected: 24, counted: "22" },
    { id: "2", name: t("Dates, Sukkari", "تمر سكري"), expected: 40, counted: "40" },
  ]);
  const diff = (l: CountLine) => (parseAmount(l.counted) ?? 0) - l.expected;
  return (
    <form className="w-full max-w-3xl" onSubmit={(e) => e.preventDefault()}>
      <LineItemsEditor<CountLine>
        caption={t("Counted products", "المنتجات المجرودة")}
        lines={lines}
        getKey={(l) => l.id}
        onAdd={() => setLines((all) => [...all, { id: String(all.length + 1), name: t("New product", "منتج جديد"), expected: 0, counted: "" }])}
        addLabel={t("Add a product", "إضافة منتج")}
        onRemove={(i) => setLines((all) => all.filter((_, j) => j !== i))}
        columns={[
          { key: "name", header: t("Product", "المنتج"), width: "fill", card: "title", readOnly: true, cell: (l) => l.name },
          { key: "expected", header: t("Expected", "المتوقع"), width: "xs", align: "end", readOnly: true, cell: (l) => l.expected },
          {
            key: "counted",
            header: t("Counted", "المجرود"),
            width: "xs",
            cell: (l) => (
              <Field label={t("Counted", "المجرود")}>
                <Input inputMode="numeric" dir="ltr" value={l.counted} onChange={(e) => setLines((all) => all.map((x) => (x.id === l.id ? { ...x, counted: e.target.value } : x)))} />
              </Field>
            ),
          },
          { key: "diff", header: t("Difference", "الفرق"), width: "xs", align: "end", readOnly: true, card: "end", cell: (l) => <span dir="ltr">{diff(l)}</span> },
        ]}
      />
    </form>
  );
}

/** Lines that come from another document: no add, no remove, an empty text and a loading state. */
export function LineItemsEditorReturnExample() {
  const t = useT();
  const [state, setState] = useState<"empty" | "loading" | "ready">("empty");
  useEffect(() => {
    if (state !== "loading") return;
    const id = setTimeout(() => setState("ready"), 900);
    return () => clearTimeout(id);
  }, [state]);
  const lines = state === "ready" ? [{ id: "1", name: t("Paper cups, 8 oz", "أكواب ورقية، 8 أونصات"), qty: "50" }] : [];
  return (
    <div className="grid w-full max-w-3xl gap-4">
      <Button variant="secondary" size="sm" className="justify-self-start" onClick={() => setState(state === "ready" ? "empty" : "loading")}>
        {state === "ready" ? t("Clear the order", "مسح الطلب") : t("Choose purchase order PO-2041", "اختيار أمر الشراء PO-2041")}
      </Button>
      <LineItemsEditor<{ id: string; name: string; qty: string }>
        caption={t("Lines to return", "بنود الإرجاع")}
        lines={lines}
        getKey={(l) => l.id}
        loading={state === "loading"}
        empty={t("Choose a purchase order first.", "اختر أمر الشراء أولًا.")}
        columns={[
          { key: "name", header: t("Product", "المنتج"), width: "fill", card: "title", readOnly: true, cell: (l) => l.name },
          {
            key: "qty",
            header: t("Quantity to return", "كمية الإرجاع"),
            width: "sm",
            cell: (l) => (
              <Field label={t("Quantity to return", "كمية الإرجاع")}>
                <Input inputMode="numeric" dir="ltr" defaultValue={l.qty} />
              </Field>
            ),
          },
        ]}
      />
    </div>
  );
}
