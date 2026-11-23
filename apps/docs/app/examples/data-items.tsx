import { useState } from "react";
import { Ellipsis, FileText, Folder } from "lucide-react";
import { Accordion, Avatar, AvatarGroup, Button, ChangeList, ConnectionCard, DropdownMenu, FormBar, FormattedNumber, Inline, MaskedValue, Money, RecordSummary, Stack, Stat, Thumbnail, Timeline, Tree, UsageMeter, useLang } from "@percentsa/ui";
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

/** Four money tiles in a row: the value size follows the tile width (a container query on the tile), so an amount with decimals fits at 158 px. */
export function StatMoneyRowExample() {
  const t = useT();
  return (
    <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Stat label={t("Collected", "المبالغ المحصلة")} value={<Money amount={123456.78} decimals={2} />} change={{ value: "12.5%", direction: "up" }} hint={t("Yesterday: 98,000.00", "أمس: 98,000.00")} />
      <Stat label={t("Sales", "المبيعات")} value={<Money amount={248910.5} decimals={2} />} change={{ value: "3.0%", direction: "down" }} />
      <Stat label={t("Refunds", "المرتجعات")} value={<Money amount={4120} decimals={2} />} change={{ value: "0.4%", direction: "up", tone: "danger" }} />
      <Stat label={t("Orders", "الطلبات")} value="1,284" change={{ value: "3.0%", direction: "down" }} hint={t("Yesterday: 1,324", "أمس: 1,324")} />
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

export function TimelineStepsExample() {
  const t = useT();
  const [selected, setSelected] = useState("build");
  const names: Record<string, string> = { clone: t("Clone", "استنساخ"), build: t("Build", "بناء"), start: t("Start", "تشغيل"), check: t("Check", "فحص") };
  return (
    <div className="grid w-full max-w-sm gap-4">
    <Timeline
      onSelect={setSelected}
      items={[
        { id: "clone", title: t("Clone", "استنساخ"), status: "done", duration: t("4 s", "4 ث") },
        {
          id: "build",
          title: t("Build", "بناء"),
          status: "failed",
          duration: t("1 min 12 s", "1 د 12 ث"),
          detail: (
            <pre dir="ltr" className="font-mono text-xs whitespace-pre-wrap">
              {"$ bun run build\nerror: Cannot find module './shop'\nexit code 1"}
            </pre>
          ),
        },
        { id: "start", title: t("Start", "تشغيل"), status: "skipped" },
        { id: "check", title: t("Check", "فحص"), status: "waiting" },
      ]}
    />
    <p className="text-sm text-fg-2">
      {t("Selected: ", "المحدد: ")}
      {names[selected]}
    </p>
    </div>
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

/** A report: the totals of a period (a month), with a link on the largest figure. */
export function RecordSummaryReportExample() {
  const t = useT();
  return (
    <RecordSummary
      className="w-full"
      label={t("Totals of September 2026", "إجماليات سبتمبر 2026")}
      items={[
        { id: "sales", label: t("Sales", "المبيعات"), value: <Money amount={248910.5} decimals={2} />, hint: t("1,284 invoices", "1,284 فاتورة"), href: "#sales" },
        { id: "returns", label: t("Returns", "المرتجعات"), value: <Money amount={4120} decimals={2} />, hint: t("23 credit notes", "23 إشعار دائن") },
        { id: "vat", label: t("VAT collected", "الضريبة المحصلة"), value: <Money amount={32466.58} decimals={2} /> },
        { id: "net", label: t("Net", "الصافي"), value: <Money amount={212323.92} decimals={2} />, hint: t("Cash and cards", "نقدًا وبطاقات") },
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

/** A state at value size: a dot and a word. */
export function RecordSummaryStatusExample() {
  const t = useT();
  return (
    <RecordSummary
      className="w-full"
      items={[
        { id: "production", label: t("Production now", "الإنتاج الآن"), status: { tone: "live", label: t("Live", "يعمل") } },
        { id: "backup", label: t("Backup", "النسخ الاحتياطي"), status: { tone: "danger", label: t("Down", "متوقف") }, hint: t("Since 09:40", "منذ 09:40") },
      ]}
    />
  );
}

export function MaskedValueExample() {
  const t = useT();
  return (
    <MaskedValue
      label={t("Password", "كلمة المرور")}
      canReveal
      confirm={{ title: t("Show the password?", "عرض كلمة المرور؟"), description: t("The reveal is recorded.", "يُسجَّل الإظهار.") }}
      onReveal={() => new Promise((r) => setTimeout(() => r("p4ss-example-only"), 600))}
    />
  );
}

export function MaskedValueOpenExample() {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <Inline gap={3}>
      <MaskedValue
        label={t("Password", "كلمة المرور")}
        canReveal
        open={open}
        onOpenChange={setOpen}
        confirm={{ title: t("Show the password?", "عرض كلمة المرور؟"), action: t("Show the password", "اعرض كلمة المرور") }}
        onReveal={async () => "p4ss-example-only"}
      />
      <DropdownMenu
        align="end"
        trigger={<Button size="sm" variant="ghost" iconOnly aria-label={t("Row actions", "إجراءات الصف")}><Ellipsis aria-hidden /></Button>}
        items={[{ label: t("Reveal Password", "إظهار كلمة المرور"), onSelect: () => setOpen(true) }]}
      />
    </Inline>
  );
}

export function ConnectionCardExample() {
  const t = useT();
  return (
    <ConnectionCard
      className="w-full max-w-lg"
      title={t("Connect", "الاتصال")}
      rows={[
        { term: t("Host and port", "المضيف والمنفذ"), copy: "203.0.113.10:5432", copyLabel: t("Copy host and port", "انسخ المضيف والمنفذ") },
        { term: t("User", "المستخدم"), copy: "app_user", copyLabel: t("Copy user", "انسخ المستخدم") },
        { term: t("Password", "كلمة المرور"), masked: { label: t("Password", "كلمة المرور"), canReveal: true, onReveal: async () => "p4ss-example-only" } },
        { term: t("Command", "الأمر"), copy: "psql -h 203.0.113.10 -p 5432 -U app_user -d shop_example" },
      ]}
    />
  );
}

export function UsageMeterExample() {
  const t = useT();
  const ar = useLang() === "ar";
  // The number with its unit is isolated, so it keeps its order inside an Arabic sentence.
  const limit = { value: 90, label: ar ? <>تنبيه عند <bdi dir="ltr">90 %</bdi></> : "Alert at 90 %" };
  return (
    <div className="grid w-full max-w-md gap-5">
      <UsageMeter label={t("CPU", "المعالج")} value={42} limit={limit} />
      <UsageMeter label={t("Memory", "الذاكرة")} value={93} limit={limit} />
      <UsageMeter
        label={t("Disk", "القرص")}
        value={null}
        max={200}
        format={(n) => `${n} GB`}
        parts={[
          { label: t("Used", "مستخدم"), value: 120, tone: "used" },
          { label: t("Held", "محجوز"), value: 40, tone: "held" },
        ]}
      />
      <UsageMeter label={t("Network", "الشبكة")} value={61} at={new Date(Date.now() - 3 * 3600_000)} stale />
    </div>
  );
}

export function ChangeListExample() {
  const t = useT();
  const items = [
    { group: t("Main website", "الموقع الرئيسي"), label: t("Domain", "النطاق"), before: "old.example.com", after: "shop.example.com" },
    { group: t("Main website", "الموقع الرئيسي"), label: t("Memory", "الذاكرة"), before: "512 MB", after: "1 GB" },
    { group: t("Shop", "المتجر"), label: t("Port", "المنفذ"), before: null, after: "8080" },
    { group: t("Shop", "المتجر"), label: t("API key", "مفتاح الواجهة"), before: "", after: "", hidden: true },
  ];
  return (
    <div className="grid w-full max-w-xl gap-6">
      <ChangeList items={items} note={t("The site restarts after saving.", "يعاد تشغيل الموقع بعد الحفظ.")} />
      <FormBar sticky={false} summary={<ChangeList compact items={items} />}>
        <Button variant="ghost">{t("Cancel", "إلغاء")}</Button>
        <Button>{t("Save", "حفظ")}</Button>
      </FormBar>
    </div>
  );
}
