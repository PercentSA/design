import { FileText, Folder } from "lucide-react";
import { Accordion, Avatar, AvatarGroup, FormattedNumber, Inline, Money, RecordSummary, Stack, Stat, Thumbnail, Timeline, Tree } from "@percentsa/ui";
import { useT } from "~/lib/t";

export function StatExample() {
  const t = useT();
  return (
    <div className="grid w-full grid-cols-[repeat(auto-fit,minmax(min(12rem,100%),1fr))] gap-3">
      <Stat label={t("Revenue", "الإيرادات")} value={<Money amount={184250} />} change={{ value: "+12.4%", direction: "up" }} hint={t("vs last month", "مقارنة بالشهر الماضي")} />
      <Stat label={t("Active users", "المستخدمون النشطون")} value={<FormattedNumber value={12480} />} change={{ value: "0%", direction: "flat" }} />
      <Stat label={t("Churn", "معدل الإلغاء")} value="2.4%" change={{ value: "+0.6%", direction: "up", tone: "danger" }} hint={t("Higher is worse", "الارتفاع سيئ")} />
    </div>
  );
}

export function TimelineExample() {
  const t = useT();
  return (
    <Timeline
      className="w-full max-w-sm"
      items={[
        { id: "placed", time: "09:12", title: t("Order placed", "تم الطلب"), status: "done" },
        { id: "paid", time: "09:14", title: t("Paid with mada", "تم الدفع عبر مدى"), status: "done" },
        { id: "packed", time: "11:40", title: t("Packed", "تم التغليف"), description: t("Riyadh warehouse", "مستودع الرياض"), status: "current" },
        { id: "out", time: t("Tomorrow", "غدًا"), title: t("Out for delivery", "خرج للتوصيل"), status: "next" },
        { id: "delivered", time: t("Tomorrow", "غدًا"), title: t("Delivered", "تم التسليم"), status: "next" },
      ]}
    />
  );
}

export function AccordionExample() {
  const t = useT();
  return (
    <Accordion
      className="w-full max-w-xl"
      defaultValue="time"
      items={[
        {
          value: "time",
          title: t("How long does a project take?", "كم يستغرق المشروع؟"),
          content: t("Most websites take four to eight weeks.", "تستغرق معظم المواقع من أربعة إلى ثمانية أسابيع."),
        },
        {
          value: "price",
          title: t("How do you price work?", "كيف تحددون السعر؟"),
          content: t("A fixed price per project, agreed before we start.", "سعر ثابت لكل مشروع نتفق عليه قبل البدء."),
        },
        {
          value: "support",
          title: t("Do you support the site after launch?", "هل تدعمون الموقع بعد الإطلاق؟"),
          content: t("Yes, with a monthly plan.", "نعم، عبر خطة شهرية."),
        },
      ]}
    />
  );
}

export function TreeExample() {
  const t = useT();
  const file = <FileText />;
  const folder = <Folder />;
  return (
    <Tree
      aria-label={t("Files", "الملفات")}
      className="w-full max-w-xs"
      defaultExpanded={["contracts"]}
      items={[
        {
          id: "contracts",
          label: t("Contracts", "العقود"),
          icon: folder,
          children: [
            { id: "nda", label: "NDA.pdf", icon: file },
            { id: "2026", label: "2026", icon: folder, children: [{ id: "masar", label: "Masar.pdf", icon: file }] },
          ],
        },
        { id: "invoices", label: t("Invoices", "الفواتير"), icon: folder, children: [{ id: "inv", label: "INV-1042.pdf", icon: file }] },
        { id: "brief", label: "Brief.docx", icon: file },
      ]}
    />
  );
}

export function AvatarExample() {
  const t = useT();
  return (
    <Inline gap={4}>
      <Avatar size="sm" name={t("Sara Ahmed", "سارة أحمد")} />
      <Avatar name={t("Mohammed Alotaibi", "محمد العتيبي")} />
      <Avatar size="lg" name={t("Nora Alqahtani", "نورة القحطاني")} />
    </Inline>
  );
}

export function AvatarGroupExample() {
  const t = useT();
  const people = [
    t("Sara Ahmed", "سارة أحمد"),
    t("Mohammed Alotaibi", "محمد العتيبي"),
    t("Nora Alqahtani", "نورة القحطاني"),
    t("Omar Fahd", "عمر فهد"),
    t("Lina Adel", "لينا عادل"),
    t("Khalid Saleh", "خالد صالح"),
  ];
  return (
    <Stack gap={4}>
      <AvatarGroup max={4}>
        {people.map((name) => (
          <Avatar key={name} name={name} />
        ))}
      </AvatarGroup>
      <AvatarGroup max={3} size="sm">
        {people.map((name) => (
          <Avatar key={name} size="sm" name={name} />
        ))}
      </AvatarGroup>
    </Stack>
  );
}

export function RecordSummaryExample() {
  const t = useT();
  return (
    <RecordSummary
      className="w-full"
      items={[
        { id: "total", label: t("Total", "الإجمالي"), value: <Money amount={1150} /> },
        { id: "paid", label: t("Paid", "المدفوع"), value: <Money amount={500} /> },
        { id: "due", label: t("Balance", "المتبقي"), value: <Money amount={650} />, hint: t("Due 3 Mar", "الاستحقاق 3 مارس") },
        { id: "customer", label: t("Customer", "العميل"), value: t("Al Rayan Trading Est.", "مؤسسة الريان للتجارة"), href: "#customer" },
        { id: "branch", label: t("Branch", "الفرع"), value: null },
        { id: "note", label: t("Note", "ملاحظة"), value: t("Deliver to the side entrance of the warehouse before noon", "التسليم عند المدخل الجانبي للمستودع قبل الظهر") },
      ]}
    />
  );
}

export function RecordSummaryMediaExample() {
  const t = useT();
  return (
    <Stack gap={4} className="w-full">
      <RecordSummary
        className="w-full"
        media={<Thumbnail alt={t("Brake pad set", "طقم فحمات")} size="lg" />}
        items={[
          { id: "stock", label: t("Available", "المتوفر"), value: "12" },
          { id: "price", label: t("Price incl. VAT", "السعر شامل الضريبة"), value: <Money amount={230} />, hint: t("Before VAT: 200.00", "قبل الضريبة: 200.00") },
          { id: "category", label: t("Category", "التصنيف"), value: t("Brake pads", "فحمات الفرامل") },
        ]}
      />
      <RecordSummary className="w-full" loading items={[{ id: "a", label: t("Total", "الإجمالي"), value: null }, { id: "b", label: t("Paid", "المدفوع"), value: null }, { id: "c", label: t("Balance", "المتبقي"), value: null }]} />
    </Stack>
  );
}

export function ThumbnailExample() {
  const t = useT();
  // data: URL, so the example needs no file.
  const photo = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><rect width="8" height="8" fill="#888"/><circle cx="4" cy="4" r="2.5" fill="#ccc"/></svg>');
  return (
    <Inline gap={6} align="start" className="w-full">
      <Thumbnail src={photo} alt={t("Product photo", "صورة المنتج")} size="sm" />
      <Thumbnail src={photo} alt={t("Product photo", "صورة المنتج")} size="md" />
      <Thumbnail src={photo} alt={t("Product photo", "صورة المنتج")} size="lg" />
      <Thumbnail src={null} alt={t("Brake pad set", "طقم فحمات")} size="md" />
      <Thumbnail alt="supplier-invoice.pdf" fallback={<FileText />} caption="supplier-invoice.pdf" href="#file" size="md" />
    </Inline>
  );
}
