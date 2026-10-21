import { useState } from "react";
import { ArrowRight, Bold, Italic, Plus, Trash2 } from "lucide-react";
import { BackToTop, Button, ButtonGroup, CopyButton, Inline, SegmentedControl, Stack, Toggle, ToggleGroup } from "@percentsa/ui";
import { useT } from "~/lib/t";

export function ButtonVariants() {
  const t = useT();
  return (
    <Inline gap={3}>
      <Button>{t("Start a project", "ابدأ مشروعًا")}</Button>
      <Button variant="secondary">{t("See our work", "شاهد أعمالنا")}</Button>
      <Button variant="ghost">{t("Cancel", "إلغاء")}</Button>
      <Button variant="danger">
        <Trash2 aria-hidden />
        {t("Delete", "حذف")}
      </Button>
      <Button variant="link">{t("Read more", "اقرأ المزيد")}</Button>
    </Inline>
  );
}

export function ButtonSizes() {
  const t = useT();
  return (
    <Inline gap={3}>
      <Button size="sm">{t("Small", "صغير")}</Button>
      <Button>{t("Medium", "متوسط")}</Button>
      <Button size="lg">{t("Large", "كبير")}</Button>
    </Inline>
  );
}

export function ButtonStates() {
  const t = useT();
  const [loading, setLoading] = useState(false);
  return (
    <Inline gap={3}>
      <Button loading={loading} onClick={() => (setLoading(true), setTimeout(() => setLoading(false), 1500))}>
        {t("Send message", "أرسل الرسالة")}
      </Button>
      <Button disabled>{t("Disabled", "معطّل")}</Button>
      <Button variant="secondary" iconOnly aria-label={t("Add", "إضافة")}>
        <Plus aria-hidden />
      </Button>
      <Button asChild variant="secondary">
        <a href="#contact">
          {t("Talk to us", "تحدّث معنا")}
          <ArrowRight aria-hidden className="rtl:-scale-x-100" />
        </a>
      </Button>
    </Inline>
  );
}

export function ButtonGroupExample() {
  const t = useT();
  return (
    <ButtonGroup aria-label={t("Project actions", "إجراءات المشروع")}>
      <Button variant="secondary">{t("Edit", "تعديل")}</Button>
      <Button variant="secondary">{t("Share", "مشاركة")}</Button>
      <Button>{t("Publish", "نشر")}</Button>
    </ButtonGroup>
  );
}

export function ToggleExample() {
  const t = useT();
  return (
    <Inline gap={1}>
      <Toggle aria-label={t("Bold", "عريض")}>
        <Bold aria-hidden />
      </Toggle>
      <Toggle aria-label={t("Italic", "مائل")} defaultPressed>
        <Italic aria-hidden />
      </Toggle>
    </Inline>
  );
}

export function SegmentedControlExample() {
  const t = useT();
  const [billing, setBilling] = useState("year");
  return (
    <SegmentedControl
      aria-label={t("Billing period", "فترة الفوترة")}
      value={billing}
      onValueChange={setBilling}
      options={[
        { value: "month", label: t("Monthly", "شهري") },
        { value: "year", label: t("Yearly", "سنوي") },
      ]}
    />
  );
}

export function ToggleGroupExample() {
  const t = useT();
  return (
    <ToggleGroup
      aria-label={t("Working days", "أيام العمل")}
      defaultValue={["sun", "mon"]}
      options={[
        { value: "sun", label: t("Sun", "الأحد") },
        { value: "mon", label: t("Mon", "الإثنين") },
        { value: "tue", label: t("Tue", "الثلاثاء") },
      ]}
    />
  );
}

export function CopyButtonExample() {
  return (
    <Inline gap={3}>
      <code dir="ltr" className="font-mono text-sm">SA03 8000 0000 6080 1016 7519</code>
      <CopyButton value="SA0380000000608010167519" />
      <CopyButton value="SA0380000000608010167519" iconOnly />
    </Inline>
  );
}

export function BackToTopExample() {
  return (
    <Stack>
      <BackToTop />
    </Stack>
  );
}
