import { useState } from "react";
import { ArrowLeft, Download, Ellipsis, Printer, RefreshCw } from "lucide-react";
import { AuthLayout, Blockquote, Button, Checkbox, ColumnsMenu, type DateRange, DateRangePicker, DropdownMenu, Field, FilterBar, type FilterValue, FormSheet, Input, Link, Mark, NumberInput, OtpInput, PasswordInput, PhoneText, RecordSection, Select, SettingsRow, SettingsSection, Stack, Switch, Textarea, toast } from "@percentsa/ui";
import { Card, FormBar, Money, PinPad, Text } from "@percentsa/ui";
import { useForm } from "react-hook-form";
import { FormSettingsRow } from "@percentsa/ui/react-hook-form";
import { useT } from "~/lib/t";

// The recipes show the layout only: the forms send nothing.
const noSubmit = (e: React.FormEvent) => e.preventDefault();

// min-h-0 because the example sits in a docs card. On a real page leave it out: the layout fills the screen.
const IN_CARD = "min-h-0";

export function SignInExample() {
  const t = useT();
  return (
    <AuthLayout
      className={IN_CARD}
      title={t("Sign in", "تسجيل الدخول")}
      description={t("Welcome back. Sign in to see your projects.", "مرحبًا بعودتك. سجّل الدخول لترى مشاريعك.")}
      footer={
        <>
          {t("No account yet? ", "ليس لديك حساب؟ ")}
          <Link href="#sign-up">{t("Create one", "أنشئ حسابًا")}</Link>
        </>
      }
      aside={
        <div className="flex h-full flex-col justify-between gap-12 p-12">
          <Mark className="h-8" />
          <Blockquote cite={t("Sara, product lead", "سارة، قائدة المنتج")}>
            {t("We shipped the new portal in eight weeks.", "أطلقنا البوابة الجديدة في ثمانية أسابيع.")}
          </Blockquote>
        </div>
      }
    >
      <form onSubmit={noSubmit} className="grid gap-5">
        <Field label={t("Email", "البريد الإلكتروني")}>
          <Input type="email" name="email" autoComplete="email" dir="ltr" />
        </Field>
        <Field label={t("Password", "كلمة المرور")}>
          <PasswordInput name="password" />
        </Field>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Checkbox name="remember" label={t("Remember me", "تذكرني")} />
          <Link href="#forgot" className="text-sm">
            {t("Forgot password?", "نسيت كلمة المرور؟")}
          </Link>
        </div>
        <Button type="submit" size="lg">
          {t("Sign in", "تسجيل الدخول")}
        </Button>
      </form>
    </AuthLayout>
  );
}

export function SignUpExample() {
  const t = useT();
  return (
    <AuthLayout
      className={IN_CARD}
      title={t("Create your account", "أنشئ حسابك")}
      footer={
        <>
          {t("Already have an account? ", "لديك حساب بالفعل؟ ")}
          <Link href="#sign-in">{t("Sign in", "سجّل الدخول")}</Link>
        </>
      }
    >
      <form onSubmit={noSubmit} className="grid gap-5">
        <Field label={t("Full name", "الاسم الكامل")}>
          <Input name="name" autoComplete="name" />
        </Field>
        <Field label={t("Work email", "البريد الإلكتروني للعمل")}>
          <Input type="email" name="email" autoComplete="email" dir="ltr" />
        </Field>
        <Field label={t("Password", "كلمة المرور")} hint={t("At least 12 characters.", "12 حرفًا على الأقل.")}>
          <PasswordInput name="password" autoComplete="new-password" minLength={12} />
        </Field>
        <Checkbox name="terms" label={t("I agree to the terms and the privacy policy", "أوافق على الشروط وسياسة الخصوصية")} />
        <Button type="submit" size="lg">
          {t("Create account", "إنشاء الحساب")}
        </Button>
      </form>
    </AuthLayout>
  );
}

export function ForgotPasswordExample() {
  const t = useT();
  return (
    <AuthLayout
      className={IN_CARD}
      title={t("Reset your password", "إعادة تعيين كلمة المرور")}
      description={t("Enter your email. We will send you a link to set a new password.", "أدخل بريدك الإلكتروني وسنرسل إليك رابطًا لتعيين كلمة مرور جديدة.")}
      footer={
        <Link href="#sign-in" className="inline-flex items-center gap-2">
          <ArrowLeft aria-hidden className="size-4 rtl:-scale-x-100" />
          {t("Back to sign in", "العودة إلى تسجيل الدخول")}
        </Link>
      }
    >
      <form onSubmit={noSubmit} className="grid gap-5">
        <Field label={t("Email", "البريد الإلكتروني")}>
          <Input type="email" name="email" autoComplete="email" dir="ltr" />
        </Field>
        <Button type="submit" size="lg">
          {t("Send link", "إرسال الرابط")}
        </Button>
      </form>
    </AuthLayout>
  );
}

export function OtpVerifyExample() {
  const t = useT();
  const [code, setCode] = useState("");
  return (
    <AuthLayout
      className={IN_CARD}
      title={t("Check your phone", "تحقق من جوالك")}
      description={
        <>
          {t("Enter the 6-digit code we sent to ", "أدخل الرمز المكوّن من 6 أرقام الذي أرسلناه إلى ")}
          <span dir="ltr">+966 5• ••• 1234</span>
        </>
      }
      footer={
        <>
          {t("No code? ", "لم يصلك الرمز؟ ")}
          <Button variant="link" size="lg">
            {t("Send it again", "أعد الإرسال")}
          </Button>
        </>
      }
    >
      <form onSubmit={noSubmit} className="grid gap-5">
        <OtpInput value={code} onValueChange={setCode} />
        <Button type="submit" size="lg" disabled={code.length < 6}>
          {t("Verify", "تحقق")}
        </Button>
      </form>
    </AuthLayout>
  );
}

export function FilterBarExample() {
  const t = useT();
  const [query, setQuery] = useState("");
  const [value, setValue] = useState<FilterValue>({ status: ["active"] });
  return (
    <FilterBar
      className="w-full"
      search={{ value: query, onValueChange: setQuery, placeholder: t("Search projects", "ابحث في المشاريع") }}
      value={value}
      onValueChange={setValue}
      filters={[
        {
          key: "status",
          label: t("Status", "الحالة"),
          multiple: true,
          options: [
            { value: "active", label: t("Active", "نشط") },
            { value: "paused", label: t("Paused", "متوقف") },
            { value: "done", label: t("Done", "مكتمل") },
          ],
        },
        {
          key: "owner",
          label: t("Owner", "المسؤول"),
          options: [
            { value: "sara", label: t("Sara", "سارة") },
            { value: "omar", label: t("Omar", "عمر") },
            { value: "lina", label: t("Lina", "لينا") },
          ],
        },
      ]}
    />
  );
}

/** The list toolbar: search and filters at the start; the date range, columns, refresh and "⋯" at the end. */
export function FilterBarToolbarExample() {
  const t = useT();
  const [query, setQuery] = useState("");
  const [value, setValue] = useState<FilterValue>({});
  const [range, setRange] = useState<DateRange>({ from: null, to: null });
  const [hidden, setHidden] = useState<string[]>([]);
  const done = (title: string) => () => toast({ title });
  return (
    <FilterBar
      className="w-full"
      search={{ value: query, onValueChange: setQuery, placeholder: t("Search orders", "ابحث في الطلبات") }}
      value={value}
      onValueChange={setValue}
      filters={[
        {
          key: "status",
          label: t("Status", "الحالة"),
          multiple: true,
          options: [
            { value: "open", label: t("Open", "مفتوح") },
            { value: "paid", label: t("Paid", "مدفوع") },
          ],
        },
      ]}
      actions={
        <>
          <DateRangePicker size="sm" className="w-60" value={range} onValueChange={setRange} />
          <ColumnsMenu
            columns={[
              { key: "number", header: t("Number", "الرقم"), hideable: false },
              { key: "customer", header: t("Customer", "العميل") },
              { key: "date", header: t("Date", "التاريخ") },
              { key: "total", header: t("Total", "الإجمالي") },
            ]}
            hidden={hidden}
            onHiddenChange={setHidden}
          />
          <Button variant="secondary" iconOnly aria-label={t("Refresh", "تحديث")} onClick={done(t("Refreshed", "تم التحديث"))}>
            <RefreshCw aria-hidden />
          </Button>
          <DropdownMenu
            align="end"
            items={[
              { label: t("Export", "تصدير"), icon: <Download />, onSelect: done(t("Export started", "بدأ التصدير")) },
              { label: t("Print", "طباعة"), icon: <Printer />, onSelect: done(t("Print", "طباعة")) },
            ]}
            trigger={
              <Button variant="secondary" iconOnly aria-label={t("More actions", "إجراءات أخرى")}>
                <Ellipsis aria-hidden />
              </Button>
            }
          />
        </>
      }
    />
  );
}

export function SettingsExample() {
  const t = useT();
  return (
    <SettingsSection
      className="w-full"
      title={t("Profile", "الملف الشخصي")}
      description={t("How your name and language appear to your team.", "كيف يظهر اسمك ولغتك لفريقك.")}
      footer={<Button>{t("Save", "حفظ")}</Button>}
    >
      {/* One field: give it an id and pass the same controlId, so the label names it. */}
      <SettingsRow label={t("Display name", "الاسم الظاهر")} controlId="display-name" control={<Input id="display-name" defaultValue={t("Sara", "سارة")} />} />
      <SettingsRow
        label={t("Language", "اللغة")}
        description={t("Emails use this language too.", "تصلك الرسائل بهذه اللغة أيضًا.")}
        controlId="language"
        control={
          <Select
            id="language"
            defaultValue="ar"
            options={[
              { value: "ar", label: "العربية" },
              { value: "en", label: "English" },
            ]}
          />
        }
      />
      {/* Several controls with their own labels: no controlId; the row label names the group. */}
      <SettingsRow
        label={t("Notifications", "الإشعارات")}
        control={
          <Stack gap={3}>
            <Switch label={t("Email", "البريد الإلكتروني")} defaultChecked />
            <Switch label={t("Text message", "رسالة نصية")} />
          </Stack>
        }
      />
    </SettingsSection>
  );
}

/** `status` at the start of the footer, and `error` on a row with `required` and `optional`. */
export function SettingsStatusExample() {
  const t = useT();
  const [name, setName] = useState("Sara");
  const [saved, setSaved] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const error = name.trim() ? undefined : t("Enter a name.", "أدخل اسمًا.");
  return (
    <SettingsSection
      className="w-full"
      title={t("Profile", "الملف الشخصي")}
      status={dirty ? t("Unsaved changes", "تغييرات غير محفوظة") : saved}
      footer={
        <Button
          disabled={!dirty || !!error}
          onClick={() => {
            setDirty(false);
            setSaved(t("Changes saved.", "حُفظت التغييرات."));
          }}
        >
          {t("Save", "حفظ")}
        </Button>
      }
    >
      <SettingsRow
        label={t("Display name", "الاسم الظاهر")}
        controlId="status-name"
        required
        error={error}
        control={
          <Input
            id="status-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setDirty(true);
            }}
          />
        }
      />
      <SettingsRow label={t("Job title", "المسمى الوظيفي")} controlId="status-title" optional control={<Input id="status-title" />} />
    </SettingsSection>
  );
}

export function FormSettingsRowExample() {
  const t = useT();
  const { control, handleSubmit } = useForm({ defaultValues: { days: 14 as number | null } });
  return (
    <form noValidate onSubmit={handleSubmit(() => {})} className="w-full">
      <SettingsSection title={t("Returns", "المرتجعات")} footer={<Button type="submit">{t("Save", "حفظ")}</Button>}>
        <FormSettingsRow
          control={control}
          name="days"
          label={t("Return period (days)", "مهلة إصدار المرتجع (بالأيام)")}
          description={t("After this the invoice cannot be returned.", "بعدها لا يمكن إرجاع الفاتورة.")}
          required
          rules={{ validate: (v) => (v != null && v >= 1 && v <= 365) || t("Enter 1 to 365.", "أدخل من 1 إلى 365.") }}
          render={({ field }) => <NumberInput value={field.value} onValueChange={field.onChange} onBlur={field.onBlur} name={field.name} min={1} max={365} />}
        />
      </SettingsSection>
    </form>
  );
}

export function FormSheetExample() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState({ name: "", note: "" });
  const [draft, setDraft] = useState(saved);
  const [pending, setPending] = useState(false);
  return (
    <FormSheet
      trigger={<Button variant="secondary">{t("Edit customer", "تعديل العميل")}</Button>}
      title={t("Edit customer", "تعديل العميل")}
      description={t("Close it after a change: it asks first.", "أغلقه بعد تعديل: سيسألك أولًا.")}
      open={open}
      onOpenChange={(o) => {
        if (o) setDraft(saved);
        setOpen(o);
      }}
      dirty={draft.name !== saved.name || draft.note !== saved.note}
      pending={pending}
      onSubmit={(e) => {
        e.preventDefault();
        setPending(true);
        // The app closes the sheet when the save succeeds.
        setTimeout(() => {
          setSaved(draft);
          setPending(false);
          setOpen(false);
          toast({ title: t("Saved", "تم الحفظ") });
        }, 800);
      }}
    >
      <Field label={t("Name", "الاسم")}>
        <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} autoComplete="name" />
      </Field>
      <Field label={t("Note", "ملاحظة")} optional>
        <Textarea value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
      </Field>
    </FormSheet>
  );
}

export function RecordSectionExample() {
  const t = useT();
  return (
    <RecordSection
      className="w-full max-w-2xl"
      title={t("Customer", "العميل")}
      action={<Button variant="secondary" size="sm">{t("Edit", "تعديل")}</Button>}
      items={[
        { term: t("Name", "الاسم"), details: t("Sara Al-Qahtani", "سارة القحطاني") },
        { term: t("Phone", "الجوال"), details: <PhoneText value="+966550000999" /> },
        { term: t("Email", "البريد الإلكتروني"), details: null },
        { term: t("City", "المدينة"), details: t("Riyadh", "الرياض") },
      ]}
    />
  );
}

export function RecordSectionAutoExample() {
  const t = useT();
  const items = [
    { term: t("Name", "الاسم"), details: t("Sara Al-Qahtani", "سارة القحطاني") },
    { term: t("Email", "البريد الإلكتروني"), details: null },
    { term: t("City", "المدينة"), details: t("Riyadh", "الرياض") },
  ];
  return (
    <div className="grid w-full gap-4 md:grid-cols-[18rem_1fr]">
      <RecordSection layout="auto" density="compact" title={t("Customer", "العميل")} items={items} />
      <RecordSection layout="auto" density="compact" title={t("Customer", "العميل")} items={items} />
    </div>
  );
}

/** `collapseOnPhone`: below 768 px the two filter menus become one "Filters" button with a count, which opens a bottom sheet. Narrow the window to see it. */
export function FilterBarCollapseExample() {
  const t = useT();
  const [value, setValue] = useState<FilterValue>({ status: ["paid"] });
  return (
    <FilterBar
      className="w-full"
      collapseOnPhone
      value={value}
      onValueChange={setValue}
      filters={[
        {
          key: "status",
          label: t("Status", "الحالة"),
          multiple: true,
          options: [
            { value: "paid", label: t("Paid", "مدفوع") },
            { value: "open", label: t("Open", "مفتوح") },
            { value: "void", label: t("Void", "ملغى") },
          ],
        },
        {
          key: "branch",
          label: t("Branch", "الفرع"),
          options: [
            { value: "riyadh", label: t("Riyadh", "الرياض") },
            { value: "jeddah", label: t("Jeddah", "جدة") },
          ],
        },
      ]}
      actions={
        <Button variant="secondary" iconOnly aria-label={t("Refresh", "تحديث")}>
          <RefreshCw aria-hidden />
        </Button>
      }
    />
  );
}

/** A form page: the fields in a card and the bar at the end. The box scrolls, so the bar sticks to its bottom as it would to the window. */
export function FormBarExample() {
  const t = useT();
  const [count, setCount] = useState(3);
  return (
    <form noValidate onSubmit={noSubmit} className="h-80 w-full max-w-3xl overflow-auto rounded-card border border-line bg-bg">
      <div className="grid gap-4 p-4">
        <Card title={t("Stocktake", "الجرد")}>
          <Stack gap={4}>
            <Field label={t("Warehouse", "المستودع")}>
              <Input defaultValue={t("Main warehouse", "المستودع الرئيسي")} />
            </Field>
            <Field label={t("Products that changed", "المنتجات التي تغيّرت")}>
              <Input inputMode="numeric" dir="ltr" value={count} onChange={(e) => setCount(Number(e.target.value.replace(/\D/g, "")) || 0)} />
            </Field>
            <Field label={t("Note", "ملاحظة")} optional>
              <Textarea rows={5} />
            </Field>
          </Stack>
        </Card>
      </div>
      <FormBar
        summary={
          <>
            {t("Products that change: ", "منتجات ستتغير: ")}
            <b>{count}</b>
          </>
        }
      >
        <Button variant="secondary">{t("Cancel", "إلغاء")}</Button>
        <Button type="submit">{t("Save stocktake", "حفظ الجرد")}</Button>
      </FormBar>
    </form>
  );
}

/** A bar with a money summary and no stickiness, as at the end of a short sheet form. */
export function FormBarTotalExample() {
  const t = useT();
  return (
    <FormBar
      sticky={false}
      className="w-full max-w-3xl rounded-card border"
      summary={
        <>
          {t("Total: ", "الإجمالي: ")}
          <b>
            <Money amount={1150} decimals={2} />
          </b>
        </>
      }
    >
      <Button variant="secondary">{t("Cancel", "إلغاء")}</Button>
      <Button type="submit">{t("Create quote", "إنشاء العرض")}</Button>
    </FormBar>
  );
}

/** A device lock: 1234 is the code in this example; other codes show the error. */
export function PinPadExample() {
  const t = useT();
  const [tries, setTries] = useState(3);
  const [open, setOpen] = useState(false);
  return (
    <Stack gap={4} className="w-full max-w-xs items-center">
      <Text tone="muted">{open ? t("Unlocked", "تم الفتح") : t("Enter the lock code", "أدخل رمز القفل")}</Text>
      <PinPad
        label={t("Enter the lock code", "أدخل رمز القفل")}
        disabled={open}
        error={tries < 3 && !open ? (tries > 0 ? t(`Wrong code. ${tries} tries left`, `رمز غير صحيح، بقيت ${tries} محاولات`) : t("Locked. Ask the office.", "مقفل. تواصل مع المكتب.")) : undefined}
        onStart={() => undefined}
        onComplete={(pin) => {
          if (pin === "1234") setOpen(true);
          else setTries((n) => Math.max(0, n - 1));
        }}
      />
      {open && (
        <Button variant="secondary" size="sm" onClick={() => (setOpen(false), setTries(3))}>
          {t("Lock again", "قفل مرة أخرى")}
        </Button>
      )}
    </Stack>
  );
}

/** Six digits, a slow check (the keys are off while it runs), and a note that drops at the first digit. */
export function PinPadCashierExample() {
  const t = useT();
  const [note, setNote] = useState<string | null>(null);
  return (
    <div className="w-full max-w-xs">
      <PinPad
        length={6}
        label={t("Cashier code", "رمز الكاشير")}
        error={note}
        onStart={() => setNote(null)}
        onComplete={async () => {
          await new Promise((r) => setTimeout(r, 900));
          setNote(t("This code is not a cashier code", "هذا الرمز ليس رمز كاشير"));
        }}
      />
    </div>
  );
}

/** Blocked: the button stays, disabled, with the reason above it. Danger and cancelLabel for a destructive sheet from the bottom. */
export function FormSheetBlockedExample() {
  const t = useT();
  const [paid, setPaid] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  return (
    <div className="flex flex-wrap gap-3">
      <FormSheet
        side="bottom"
        trigger={<Button variant="secondary">{t("Complete the job", "إنهاء المهمة")}</Button>}
        title={t("Complete the job", "إنهاء المهمة")}
        description={t("The customer is told that the car is ready.", "يُبلَّغ العميل أن السيارة جاهزة.")}
        submitLabel={t("Complete", "إنهاء")}
        blocked={paid ? null : t("A machining charge is not paid. Pay it or delete it before you complete.", "رسوم التشغيل غير مدفوعة. ادفعها أو احذفها قبل الإنهاء.")}
        onSubmit={(e) => (e.preventDefault(), setDone(t("Job completed", "اكتملت المهمة")))}
      >
        <Checkbox checked={paid} onCheckedChange={(v) => setPaid(v === true)} label={t("The machining charge is paid", "رسوم التشغيل مدفوعة")} />
      </FormSheet>
      <FormSheet
        side="bottom"
        trigger={<Button variant="secondary">{t("Cancel the appointment", "إلغاء الموعد")}</Button>}
        title={t("Cancel the appointment", "إلغاء الموعد")}
        description={t("The office is told. You cannot undo this.", "يُبلَّغ المكتب. لا يمكنك التراجع.")}
        cancelLabel={t("Go back", "تراجع")}
        submitLabel={t("Cancel the appointment", "إلغاء الموعد")}
        danger
        onSubmit={(e) => (e.preventDefault(), setDone(t("Appointment cancelled", "أُلغي الموعد")))}
      >
        <Field label={t("Reason", "السبب")}>
          <Input />
        </Field>
      </FormSheet>
      {done && <Text tone="muted" className="self-center">{done}</Text>}
    </div>
  );
}

/** A document made from another document opens in a large sheet. */
export function FormSheetLargeExample() {
  const t = useT();
  return (
    <FormSheet
      size="lg"
      trigger={<Button variant="secondary">{t("Convert to order", "تحويل إلى طلب")}</Button>}
      title={t("Convert to order", "تحويل إلى طلب")}
      description={t("The quote lines become the lines of the order.", "تصبح بنود العرض بنود الطلب.")}
      submitLabel={t("Create the order", "إنشاء الطلب")}
      onSubmit={noSubmit}
    >
      <Field label={t("Delivery date", "تاريخ التسليم")}>
        <Input type="date" dir="ltr" />
      </Field>
      <Field label={t("Note", "ملاحظة")} optional>
        <Textarea />
      </Field>
    </FormSheet>
  );
}
