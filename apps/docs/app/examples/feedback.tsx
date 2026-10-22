import { useEffect, useState } from "react";
import { FolderOpen } from "lucide-react";
import { Alert, Badge, Button, EmptyState, Forbidden, Inline, NotFound, Progress, ProgressRing, Skeleton, Spinner, Stack, StatusBadge, StatusDot, Tag } from "@percentsa/ui";
import { useT } from "~/lib/t";

export function AlertExample() {
  const t = useT();
  return (
    <Stack gap={3} className="w-full max-w-xl">
      <Alert title={t("New version", "إصدار جديد")}>{t("Version 2.4 is live.", "الإصدار 2.4 متاح الآن.")}</Alert>
      <Alert tone="success" title={t("Message sent", "أُرسلت الرسالة")} />
      <Alert tone="warning" title={t("Invoice due in 3 days", "تستحق الفاتورة خلال 3 أيام")} />
      <Alert tone="danger" title={t("Payment failed", "فشل الدفع")} action={<Button size="sm" variant="secondary">{t("Retry", "أعد المحاولة")}</Button>}>
        {t("The bank declined the card.", "رفض البنك البطاقة.")}
      </Alert>
    </Stack>
  );
}

export function BadgeExample() {
  const t = useT();
  return (
    <Inline gap={2}>
      <Badge variant="solid">{t("New", "جديد")}</Badge>
      <Badge>{t("Draft", "مسودة")}</Badge>
      <Badge variant="outline">v2.4</Badge>
    </Inline>
  );
}

export function TagExample() {
  const t = useT();
  const [tags, setTags] = useState([t("Design", "تصميم"), t("Web", "ويب"), t("Riyadh", "الرياض")]);
  return (
    <Inline gap={2}>
      {tags.map((tag) => (
        <Tag key={tag} onRemove={() => setTags(tags.filter((x) => x !== tag))}>
          {tag}
        </Tag>
      ))}
    </Inline>
  );
}

export function StatusDotExample() {
  const t = useT();
  return (
    <Stack gap={2}>
      <StatusDot status="live">{t("Live", "يعمل")}</StatusDot>
      <StatusDot status="idle">{t("Paused", "متوقف مؤقتًا")}</StatusDot>
      <StatusDot status="warning">{t("Degraded", "أداء منخفض")}</StatusDot>
      <StatusDot status="danger">{t("Down", "متوقف")}</StatusDot>
    </Stack>
  );
}

export function ProgressExample() {
  const t = useT();
  const [value, setValue] = useState(30);
  useEffect(() => {
    const id = setInterval(() => setValue((v) => (v >= 100 ? 0 : v + 10)), 800);
    return () => clearInterval(id);
  }, []);
  return (
    <Inline gap={8} className="w-full max-w-md">
      <Progress value={value} aria-label={t("Upload", "الرفع")} className="flex-1" />
      <ProgressRing value={value} aria-label={t("Upload", "الرفع")} showValue />
    </Inline>
  );
}

export function SpinnerExample() {
  return (
    <Inline gap={6}>
      <Spinner />
      <Spinner className="h-8" />
      <Spinner className="h-12" />
    </Inline>
  );
}

export function SkeletonExample() {
  return (
    <Stack gap={3} className="w-72">
      <Skeleton className="h-40 rounded-card" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </Stack>
  );
}

export function EmptyStateExample() {
  const t = useT();
  return (
    <div className="w-full max-w-lg">
      <EmptyState
        icon={<FolderOpen aria-hidden />}
        title={t("No projects yet", "لا توجد مشاريع بعد")}
        description={t("Projects you start appear here.", "تظهر هنا المشاريع التي تبدؤها.")}
        action={<Button>{t("Start a project", "ابدأ مشروعًا")}</Button>}
      />
    </div>
  );
}

export function StatusBadgeExample() {
  const t = useT();
  return (
    <Inline gap={2}>
      <StatusBadge>{t("Draft", "مسودة")}</StatusBadge>
      <StatusBadge tone="info">{t("Sent", "مُرسلة")}</StatusBadge>
      <StatusBadge tone="success">{t("Paid", "مدفوعة")}</StatusBadge>
      <StatusBadge tone="warning">{t("Due soon", "تستحق قريبًا")}</StatusBadge>
      <StatusBadge tone="danger">{t("Overdue", "متأخرة")}</StatusBadge>
    </Inline>
  );
}

export function EmptyStateErrorExample() {
  const t = useT();
  return (
    <div className="w-full max-w-lg">
      <EmptyState tone="error" title={t("The orders did not load", "تعذر تحميل الطلبات")} description={t("Check the connection and try again.", "تحقق من الاتصال وحاول مرة أخرى.")} onRetry={() => {}} />
    </div>
  );
}

export function PageStatesExample() {
  const t = useT();
  return (
    <Stack gap={4} className="w-full max-w-lg">
      <NotFound back={{ href: "#", label: t("Back to orders", "العودة إلى الطلبات") }} />
      <Forbidden permission={t("Export orders", "تصدير الطلبات")} />
    </Stack>
  );
}
