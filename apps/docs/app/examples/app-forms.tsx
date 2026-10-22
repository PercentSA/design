import { useState } from "react";
import { ArrowLeft, Download, Ellipsis, Printer, RefreshCw } from "lucide-react";
import { AuthLayout, Blockquote, Button, Checkbox, ColumnsMenu, type DateRange, DateRangePicker, DropdownMenu, Field, FilterBar, type FilterValue, FormSheet, Input, Link, Mark, OtpInput, PasswordInput, PhoneText, RecordSection, Select, SettingsRow, SettingsSection, Stack, Switch, Textarea, toast } from "@percentsa/ui";
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
