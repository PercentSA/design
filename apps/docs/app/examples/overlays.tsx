import { useState } from "react";
import { Copy, Info, Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog,
  Button,
  ConsentBanner,
  ContextMenu,
  Dialog,
  DialogClose,
  DropdownMenu,
  Field,
  HoverCard,
  Inline,
  Input,
  Popover,
  Sheet,
  Slider,
  Stack,
  Text,
  toast,
  Tooltip,
  useStrings,
} from "@percentsa/ui";
import { useT } from "~/lib/t";

export function DialogExample() {
  const t = useT();
  return (
    <Dialog
      trigger={<Button>{t("Rename project", "إعادة تسمية المشروع")}</Button>}
      title={t("Rename project", "إعادة تسمية المشروع")}
      description={t("The new name shows everywhere.", "يظهر الاسم الجديد في كل مكان.")}
      footer={
        <>
          <DialogClose asChild>
            <Button variant="secondary">{t("Cancel", "إلغاء")}</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button>{t("Save", "حفظ")}</Button>
          </DialogClose>
        </>
      }
    >
      <Field label={t("Name", "الاسم")}>
        <Input defaultValue="Masar" />
      </Field>
    </Dialog>
  );
}

export function AlertDialogExample() {
  const t = useT();
  return (
    <AlertDialog
      trigger={<Button variant="danger">{t("Delete project", "حذف المشروع")}</Button>}
      title={t("Delete this project?", "حذف هذا المشروع؟")}
      description={t("Files and history are removed. This cannot be undone.", "تُحذف الملفات والسجل. لا يمكن التراجع.")}
      action={t("Delete", "حذف")}
      destructive
      // A Promise keeps the dialog open, with a loading button, until it resolves.
      onAction={async () => {
        await new Promise((done) => setTimeout(done, 1200));
        toast({ title: t("Project deleted", "حُذف المشروع") });
      }}
    />
  );
}

export function SheetExample() {
  const t = useT();
  return (
    <Inline gap={3}>
      <Sheet trigger={<Button variant="secondary">{t("Filters", "التصفية")}</Button>} title={t("Filters", "التصفية")}>
        <Field label={t("Budget", "الميزانية")}>
          <Slider min={10} max={500} step={10} defaultValue={[120, 360]} />
        </Field>
      </Sheet>
      <Sheet side="bottom" trigger={<Button variant="secondary">{t("From the bottom", "من الأسفل")}</Button>} title={t("Details", "التفاصيل")}>
        <Text tone="muted">{t("Good for phones. On touch, drag the handle down to close.", "مناسب للجوال. باللمس اسحب المقبض إلى الأسفل للإغلاق.")}</Text>
      </Sheet>
    </Inline>
  );
}

export function PopoverExample() {
  const t = useT();
  return (
    <Popover trigger={<Button variant="secondary">{t("Share", "مشاركة")}</Button>}>
      <Stack gap={3}>
        <Text size="sm">{t("Anyone with the link can view.", "يمكن لمن لديه الرابط العرض.")}</Text>
        <Input readOnly dir="ltr" defaultValue="https://percent.sa/p/masar" aria-label={t("Link", "الرابط")} />
      </Stack>
    </Popover>
  );
}

export function TooltipExample() {
  const t = useT();
  return (
    <Tooltip content={t("Copy link", "نسخ الرابط")}>
      <Button variant="secondary" iconOnly aria-label={t("Copy link", "نسخ الرابط")}>
        <Copy aria-hidden />
      </Button>
    </Tooltip>
  );
}

export function HoverCardExample() {
  const t = useT();
  return (
    <Text>
      {t("Built by ", "من بناء ")}
      <HoverCard trigger={<a href="https://percent.sa" className="underline underline-offset-4">Percent</a>}>
        <Stack gap={2}>
          <Text size="sm" className="font-medium">Percent</Text>
          <Text size="sm" tone="muted">{t("Software studio in Riyadh.", "استوديو برمجيات في الرياض.")}</Text>
        </Stack>
      </HoverCard>
    </Text>
  );
}

export function DropdownMenuExample() {
  const t = useT();
  return (
    <DropdownMenu
      trigger={<Button variant="secondary">{t("Actions", "الإجراءات")}</Button>}
      items={[
        { heading: t("Project", "المشروع") },
        { label: t("Rename", "إعادة تسمية"), icon: <Pencil aria-hidden />, shortcut: "R" },
        { label: t("Duplicate", "نسخ"), icon: <Copy aria-hidden />, shortcut: "⌘D" },
        "separator",
        { label: t("Delete", "حذف"), icon: <Trash2 aria-hidden />, danger: true },
      ]}
    />
  );
}

export function ContextMenuExample() {
  const t = useT();
  return (
    <ContextMenu items={[{ label: t("Open", "فتح") }, { label: t("Copy link", "نسخ الرابط") }, "separator", { label: t("Archive", "أرشفة") }]}>
      <div className="grid h-36 w-72 place-items-center rounded-card border border-dashed border-line-strong text-sm text-fg-3">
        {t("Right-click here", "انقر بالزر الأيمن هنا")}
      </div>
    </ContextMenu>
  );
}

export function ToastExample() {
  const t = useT();
  return (
    <Inline gap={3}>
      <Button variant="secondary" onClick={() => toast({ title: t("Saved", "تم الحفظ"), tone: "success" })}>
        {t("Success", "نجاح")}
      </Button>
      <Button
        variant="secondary"
        onClick={() => toast({ title: t("Upload failed", "فشل الرفع"), description: t("Check your connection.", "تحقق من الاتصال."), tone: "danger" })}
      >
        {t("Error", "خطأ")}
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          toast({
            title: t("Message deleted", "حُذفت الرسالة"),
            action: { label: t("Undo", "تراجع"), onClick: () => toast({ title: t("Message restored", "استُعيدت الرسالة") }) },
          })
        }
      >
        {t("With Undo", "مع تراجع")}
      </Button>
    </Inline>
  );
}

export function ConsentBannerExample() {
  const t = useT();
  const s = useStrings();
  const [key, setKey] = useState(0);
  return (
    <Stack gap={3}>
      <Text size="sm" tone="muted">
        <Info aria-hidden className="me-1 inline size-4" />
        {t("The banner shows at the bottom of the page until a choice is made.", "يظهر الشريط أسفل الصفحة حتى يُتخذ اختيار.")}
      </Text>
      <Button
        variant="secondary"
        onClick={() => {
          document.cookie = "consent=; Path=/; Max-Age=0";
          setKey(key + 1);
        }}
      >
        {t("Show it again", "أظهره مرة أخرى")} ({s.consentTitle})
      </Button>
      <ConsentBanner key={key} policyHref="#privacy" onChange={(c) => toast({ title: `consent=${c}` })} />
    </Stack>
  );
}
