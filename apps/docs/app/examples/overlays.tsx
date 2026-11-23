import { useRef, useState } from "react";
import { Copy, Info, Pencil, Trash2 } from "lucide-react";
import {
  ActionDialog,
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
  Money,
  OnceValueDialog,
  Popover,
  RadioGroup,
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

export function DialogFullScreenExample() {
  const t = useT();
  return (
    <Dialog
      fullScreenOnPhone
      trigger={<Button>{t("Edit profile", "تعديل الملف")}</Button>}
      title={t("Edit profile", "تعديل الملف")}
      footer={
        <DialogClose asChild>
          <Button>{t("Save", "حفظ")}</Button>
        </DialogClose>
      }
    >
      <Field label={t("Name", "الاسم")}>
        <Input defaultValue="Sara Al Noor" />
      </Field>
      <Field label={t("Job title", "المسمى الوظيفي")}>
        <Input defaultValue="Designer" />
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

export function SheetLargeExample() {
  const t = useT();
  return (
    <Sheet size="lg" trigger={<Button variant="secondary">{t("Convert to order", "تحويل إلى طلب")}</Button>} title={t("Convert to order", "تحويل إلى طلب")}>
      <Text tone="muted">{t("56rem wide on a wide screen, the full width on a phone.", "بعرض 56rem على الشاشة العريضة، وبالعرض الكامل على الجوال.")}</Text>
    </Sheet>
  );
}

export function PopoverExample() {
  const t = useT();
  return (
    <Popover label={t("Share options", "خيارات المشاركة")} trigger={<Button variant="secondary">{t("Share", "مشاركة")}</Button>}>
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

export function ActionDialogExample() {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>{t("Redeploy", "إعادة النشر")}</Button>
      <ActionDialog
        open={open}
        onOpenChange={setOpen}
        title={t("Redeploy Caddy edge?", "إعادة نشر Caddy edge؟")}
        subject={{ title: "Caddy edge", meta: "203.0.113.10", facts: [{ term: t("Status", "الحالة"), value: t("Live", "يعمل") }] }}
        effects={[t("The service restarts and is down for about 10 seconds.", "يُعاد تشغيل الخدمة وتتوقف نحو 10 ثوانٍ."), t("Open connections end.", "تنتهي الاتصالات المفتوحة.")]}
        action={t("Redeploy", "إعادة النشر")}
        onAction={() => setOpen(false)}
      />
    </>
  );
}

export function ActionDialogChoiceExample() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<string>();
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>{t("Refund", "استرداد")}</Button>
      <ActionDialog
        open={open}
        onOpenChange={setOpen}
        title={t("Refund this payment?", "استرداد هذه الدفعة؟")}
        subject={{ title: "Al Noor", value: <Money amount={40} />, meta: t("Paid by card", "مدفوعة بالبطاقة") }}
        effects={
          kind === "twice"
            ? [t("The second payment goes back to the card.", "تعود الدفعة الثانية إلى البطاقة.")]
            : kind === "request"
              ? [t("The full amount goes back to the card.", "يعود المبلغ كاملًا إلى البطاقة.")]
              : null
        }
        effectsEmpty={t("Choose a reason first.", "اختر السبب أولًا.")}
        reason={{ label: t("Note for the record", "ملاحظة للسجل"), required: true, maxLength: 200 }}
        action={t("Refund", "استرداد")}
        destructive
        onAction={() => setOpen(false)}
      >
        <RadioGroup
          aria-label={t("Refund reason", "سبب الاسترداد")}
          value={kind}
          onValueChange={setKind}
          options={[
            { value: "twice", label: t("Paid twice", "دُفعت مرتين") },
            { value: "request", label: t("Customer asked", "طلب العميل") },
          ]}
        />
      </ActionDialog>
    </>
  );
}

export function ActionDialogDeleteExample() {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>{t("Delete site", "حذف الموقع")}</Button>
      <ActionDialog
        open={open}
        onOpenChange={setOpen}
        title={t("Delete Main website?", "حذف Main website؟")}
        subject={{ title: "Main website", meta: "shop.example.com" }}
        effects={[t("The site and its files are deleted.", "يُحذف الموقع وملفاته."), t("This cannot be undone.", "لا يمكن التراجع.")]}
        stays={[t("The backups stay for 30 days.", "تبقى النسخ الاحتياطية 30 يومًا.")]}
        confirmName="Main website"
        confirmLabel={t("Type the site name to delete it.", "اكتب اسم الموقع لحذفه.")}
        action={t("Delete", "حذف")}
        cancelLabel={t("Keep site", "إبقاء الموقع")}
        destructive
        onAction={() => setOpen(false)}
      />
    </>
  );
}

export function OnceValueDialogExample() {
  const t = useT();
  const [value, setValue] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const rotate = useRef<HTMLButtonElement>(null);
  return (
    <>
      <Button ref={rotate} onClick={() => setConfirm(true)}>{t("Rotate token", "تدوير الرمز")}</Button>
      {/* The confirm dialog closes when the once dialog opens, so the focus at open is lost: returnFocusTo gives it back to the button. */}
      <AlertDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={t("Rotate the token?", "تدوير الرمز؟")}
        description={t("The old token stops working.", "يتوقف الرمز القديم عن العمل.")}
        action={t("Rotate", "تدوير")}
        onAction={() => (setConfirm(false), setValue("pt_example_1234"))}
      />
      <OnceValueDialog
        returnFocusTo={rotate}
        open={value !== null}
        title={t("Server token", "رمز الخادم")}
        description={t("Copy the new token now.", "انسخ الرمز الجديد الآن.")}
        note={t("You cannot see this value again.", "لا يمكنك رؤية هذه القيمة مرة أخرى.")}
        value={value ?? ""}
        onDone={() => setValue(null)}
      />
    </>
  );
}
