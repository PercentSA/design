import { FileText, Folder } from "lucide-react";
import { Accordion, Avatar, AvatarGroup, FormattedNumber, Inline, Money, Stack, Stat, Timeline, Tree } from "@percentsa/ui";
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
