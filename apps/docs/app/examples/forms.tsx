import { useEffect, useRef, useState } from "react";
import { AtSign, MapPin } from "lucide-react";
import { useForm } from "react-hook-form";
import {
  Autocomplete,
  Button,
  Checkbox,
  ChipGroup,
  ChoiceCardGroup,
  Combobox,
  Field,
  searchKey,
  Fieldset,
  Honeypot,
  Input,
  NumberInput,
  PasswordInput,
  RadioGroup,
  SearchInput,
  Select,
  Slider,
  Stack,
  Switch,
  Textarea,
  type AutocompleteSuggestion,
  type ComboboxOption,
  UnitInput,
} from "@percentsa/ui";
import { FormField } from "@percentsa/ui/react-hook-form";
import { useT } from "~/lib/t";

export function FieldExample() {
  const t = useT();
  return (
    <Stack gap={8} className="w-full max-w-md">
      <Field label={t("Name", "الاسم")} required hint={t("As on your ID", "كما في الهوية")}>
        <Input autoComplete="name" />
      </Field>
      <Field label={t("Email", "البريد الإلكتروني")} error={t("Enter a valid email address.", "أدخل بريدًا إلكترونيًا صحيحًا.")}>
        <Input type="email" dir="ltr" defaultValue="name@" />
      </Field>
      <Field label={t("Company", "الشركة")} optional>
        <Input />
      </Field>
    </Stack>
  );
}

export function FormFieldExample() {
  const t = useT();
  const { control, handleSubmit } = useForm({ defaultValues: { name: "", bank: "", note: "" } });
  return (
    <form noValidate onSubmit={handleSubmit(() => {})} className="grid w-full max-w-md gap-8">
      <FormField
        control={control}
        name="name"
        label={t("Name", "الاسم")}
        required
        rules={{ required: t("Enter your name.", "أدخل اسمك.") }}
        render={({ field }) => <Input {...field} autoComplete="name" />}
      />
      <FormField
        control={control}
        name="bank"
        label={t("Bank", "البنك")}
        rules={{ required: t("Choose a bank.", "اختر بنكًا.") }}
        render={({ field }) => (
          <Combobox value={field.value} onValueChange={field.onChange} onBlur={field.onBlur} name={field.name} options={BANKS.map(([value, en, ar]) => ({ value, label: t(en, ar) }))} />
        )}
      />
      <FormField control={control} name="note" label={t("Note", "ملاحظة")} optional max={200} render={({ field }) => <Textarea {...field} maxLength={200} />} />
      <Button type="submit" className="justify-self-start">{t("Save", "حفظ")}</Button>
    </form>
  );
}

export function InputExample() {
  const t = useT();
  return (
    <Stack gap={4} className="w-full max-w-md">
      <Input placeholder={t("Plain", "عادي")} aria-label={t("Plain", "عادي")} />
      <Input start={<AtSign aria-hidden />} placeholder="username" dir="ltr" aria-label={t("User name", "اسم المستخدم")} />
      <Input disabled placeholder={t("Disabled", "معطّل")} aria-label={t("Disabled", "معطّل")} />
    </Stack>
  );
}

export function TextareaExample() {
  const t = useT();
  const [text, setText] = useState("");
  return (
    <Field label={t("Message", "الرسالة")} count={text.length} max={500} className="w-full max-w-md">
      <Textarea maxLength={500} value={text} onChange={(e) => setText(e.target.value)} placeholder={t("Tell us about the project", "أخبرنا عن المشروع")} />
    </Field>
  );
}

export function SelectExample() {
  const t = useT();
  return (
    <Field label={t("City", "المدينة")} className="w-full max-w-xs">
      <Select
        placeholder={t("Choose a city", "اختر مدينة")}
        options={[
          { value: "ruh", label: t("Riyadh", "الرياض") },
          { value: "jed", label: t("Jeddah", "جدة") },
          { value: "dmm", label: t("Dammam", "الدمام") },
        ]}
      />
    </Field>
  );
}

const BANKS = [
  ["rajhi", "Al Rajhi Bank", "مصرف الراجحي"],
  ["snb", "Saudi National Bank", "البنك الأهلي السعودي"],
  ["riyad", "Riyad Bank", "بنك الرياض"],
  ["alinma", "Alinma Bank", "مصرف الإنماء"],
  ["albilad", "Bank Albilad", "بنك البلاد"],
  ["sab", "SAB", "البنك السعودي البريطاني"],
] as const;

export function ComboboxExample() {
  const t = useT();
  const [bank, setBank] = useState<string | null>(null);
  return (
    <Field label={t("Bank", "البنك")} hint={t("Type to filter", "اكتب للتصفية")} className="w-full max-w-xs">
      <Combobox value={bank} onValueChange={setBank} name="bank" options={BANKS.map(([value, en, ar]) => ({ value, label: t(en, ar) }))} />
    </Field>
  );
}

const CITIES = [
  ["Riyadh", "الرياض"],
  ["Jeddah", "جدة"],
  ["Makkah", "مكة المكرمة"],
  ["Madinah", "المدينة المنورة"],
  ["Dammam", "الدمام"],
  ["Khobar", "الخبر"],
  ["Dhahran", "الظهران"],
  ["Taif", "الطائف"],
  ["Tabuk", "تبوك"],
  ["Abha", "أبها"],
  ["Khamis Mushait", "خميس مشيط"],
  ["Buraidah", "بريدة"],
  ["Hail", "حائل"],
  ["Jazan", "جازان"],
  ["Najran", "نجران"],
  ["Al Ahsa", "الأحساء"],
] as const;

export function ComboboxAsyncExample() {
  const t = useT();
  const [added, setAdded] = useState<string[]>([]);
  const all: ComboboxOption[] = [...CITIES.map(([en, ar]) => t(en, ar)), ...added].map((label) => ({ value: label, label }));
  const [results, setResults] = useState<ComboboxOption[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [city, setCity] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Stands in for a server search. A real app debounces the query in its data hook.
  const search = (query: string) => {
    clearTimeout(timer.current);
    setLoading(true);
    timer.current = setTimeout(() => {
      setResults(all.filter((o) => searchKey(o.label).includes(searchKey(query))));
      setLoading(false);
    }, 400);
  };
  return (
    <Field label={t("City", "المدينة")} hint={t("8 results at a time; type a new city to add it", "8 نتائج في كل مرة؛ اكتب مدينة جديدة لإضافتها")} className="w-full max-w-xs">
      <Combobox
        value={city}
        onValueChange={setCity}
        options={results ?? all}
        onQueryChange={search}
        loading={loading}
        valueLabel={city ?? undefined}
        limit={8}
        onCreate={(name) => {
          setAdded((list) => [...list, name]);
          setCity(name);
        }}
        name="city"
      />
    </Field>
  );
}

const CITY_DETAILS = [
  ["Riyadh", "الرياض", "Riyadh Province", "منطقة الرياض"],
  ["Jeddah", "جدة", "Makkah Province", "منطقة مكة المكرمة"],
  ["Dammam", "الدمام", "Eastern Province", "المنطقة الشرقية"],
  ["Khobar", "الخبر", "Eastern Province", "المنطقة الشرقية"],
  ["Abha", "أبها", "Asir Province", "منطقة عسير"],
  ["Tabuk", "تبوك", "Tabuk Province", "منطقة تبوك"],
] as const;

const useCitySuggestions = (): AutocompleteSuggestion[] => {
  const t = useT();
  return CITY_DETAILS.map(([en, ar, detailEn, detailAr]) => ({ value: t(en, ar), detail: t(detailEn, detailAr) }));
};

export function AutocompleteExample() {
  const t = useT();
  const [city, setCity] = useState("");
  const cities = useCitySuggestions();
  return (
    <Field label={t("City", "المدينة")} hint={t("Type any text; suggestions open on focus", "اكتب أي نص؛ تظهر الاقتراحات عند التركيز على الحقل")} className="w-full max-w-xs">
      <Autocomplete value={city} onValueChange={setCity} suggestions={cities} openOnFocus name="city" start={<MapPin aria-hidden />} />
    </Field>
  );
}

export function AutocompleteAsyncExample() {
  const t = useT();
  const [value, setValue] = useState("");
  const [results, setResults] = useState<AutocompleteSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const cities = useCitySuggestions();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  // Stands in for a server search. A real app debounces the query in its data hook.
  const search = (query: string) => {
    clearTimeout(timer.current);
    setLoading(true);
    timer.current = setTimeout(() => {
      setResults(cities.filter((o) => searchKey(o.value).includes(searchKey(query))));
      setLoading(false);
    }, 600);
  };
  return (
    <Stack gap={4} className="w-full max-w-xs">
      <Field label={t("City", "المدينة")}>
        <Autocomplete
          value={value}
          onValueChange={setValue}
          suggestions={unavailable ? [] : results}
          onQueryChange={search}
          loading={loading}
          unavailable={unavailable}
          emptyText={t("No city with this name. Your text stays as typed.", "لا توجد مدينة بهذا الاسم. يبقى نصك كما كتبته.")}
          name="city-search"
        />
      </Field>
      <Switch label={t("Search is unavailable", "البحث غير متاح")} checked={unavailable} onCheckedChange={setUnavailable} />
    </Stack>
  );
}

const TAGS: AutocompleteSuggestion[] = [{ value: "alpha" }, { value: "beta" }, { value: "stable" }, { value: "staging" }, { value: "release" }];

/** The range of the comma-separated item at the cursor, without the spaces around it. */
const tagAt = (text: string, cursor: number) => {
  let start = text.lastIndexOf(",", cursor - 1) + 1;
  while (text[start] === " ") start++;
  let end = text.indexOf(",", cursor);
  if (end === -1) end = text.length;
  while (end > start && text[end - 1] === " ") end--;
  return { start: Math.min(start, cursor), end: Math.max(end, cursor) };
};

export function AutocompleteTokenExample() {
  const t = useT();
  const [tags, setTags] = useState("alpha, st");
  return (
    <Field label={t("Tags", "الوسوم")} hint={t("Separate with commas; each item gets suggestions", "افصل بفواصل؛ يحصل كل عنصر على اقتراحات")} className="w-full max-w-xs">
      <Autocomplete value={tags} onValueChange={setTags} suggestions={TAGS} token={tagAt} mono name="tags" />
    </Field>
  );
}

export function CheckboxExample() {
  const t = useT();
  return (
    <Stack gap={4}>
      <Checkbox label={t("Send me project updates", "أرسل لي تحديثات المشروع")} defaultChecked />
      <Checkbox label={t("I agree to the terms", "أوافق على الشروط")} description={t("You can withdraw at any time.", "يمكنك الانسحاب في أي وقت.")} />
      <Checkbox label={t("Unavailable", "غير متاح")} disabled />
    </Stack>
  );
}

export function RadioGroupExample() {
  const t = useT();
  return (
    <RadioGroup
      aria-label={t("Plan", "الخطة")}
      defaultValue="team"
      options={[
        { value: "project", label: t("Project", "مشروع"), description: t("Fixed scope and price", "نطاق وسعر ثابتان") },
        { value: "team", label: t("Team", "فريق"), description: t("A team that works with yours", "فريق يعمل مع فريقك") },
        { value: "support", label: t("Support", "دعم"), description: t("We run what we built", "نشغّل ما بنيناه") },
      ]}
    />
  );
}

export function ChoiceCardsExample() {
  const t = useT();
  return (
    <Fieldset legend={t("How do you want to work?", "كيف تريد أن نعمل؟")} className="w-full">
      <ChoiceCardGroup
        type="radio"
        name="engagement"
        clearable
        defaultValue={["project"]}
        options={[
          { value: "project", label: t("Project", "مشروع"), description: t("Fixed scope, fixed price", "نطاق ثابت وسعر ثابت") },
          { value: "team", label: t("Team", "فريق"), description: t("Monthly, flexible scope", "شهري ونطاق مرن") },
          { value: "support", label: t("Support", "دعم"), description: t("Run and improve", "تشغيل وتحسين") },
        ]}
      />
    </Fieldset>
  );
}

export function ChipGroupExample() {
  const t = useT();
  return (
    <Fieldset legend={t("Services", "الخدمات")} hint={t("Choose any", "اختر ما يناسبك")}>
      <ChipGroup
        type="checkbox"
        name="services"
        defaultValue={["web"]}
        options={[
          { value: "web", label: t("Websites", "مواقع") },
          { value: "apps", label: t("Apps", "تطبيقات") },
          { value: "design", label: t("Product design", "تصميم المنتجات") },
          { value: "ai", label: t("AI features", "مزايا الذكاء الاصطناعي") },
        ]}
      />
    </Fieldset>
  );
}

export function SwitchExample() {
  const t = useT();
  return (
    <Stack gap={4}>
      <Switch label={t("Email notifications", "إشعارات البريد")} defaultChecked />
      <Switch label={t("Weekly report", "تقرير أسبوعي")} description={t("Every Sunday at 9:00", "كل أحد الساعة 9:00")} />
    </Stack>
  );
}

export function SliderExample() {
  const t = useT();
  const [range, setRange] = useState([40, 120]);
  return (
    <Stack gap={8} className="w-full max-w-sm">
      <Field label={t("Budget (thousand riyals)", "الميزانية (ألف ريال)")} hint={`${range[0]} – ${range[1]}`}>
        <Slider min={10} max={500} step={10} value={range} onValueChange={setRange} />
      </Field>
    </Stack>
  );
}

export function UnitInputExample() {
  const t = useT();
  const [delay, setDelay] = useState<{ value: number | null; unit: string }>({ value: 30, unit: "s" });
  return (
    <Field label={t("Request timeout", "مهلة الطلب")} className="w-60">
      <UnitInput
        value={delay.value}
        unit={delay.unit}
        onValueChange={(value, unit) => setDelay({ value, unit })}
        min={0}
        units={[
          { value: "ms", label: t("milliseconds", "ملّي ثانية") },
          { value: "s", label: t("seconds", "ثوانٍ") },
          { value: "min", label: t("minutes", "دقائق") },
        ]}
        unitLabel={t("Unit", "الوحدة")}
      />
    </Field>
  );
}

export function NumberInputExample() {
  const t = useT();
  const [seats, setSeats] = useState<number | null>(3);
  return (
    <Field label={t("Seats", "المقاعد")} className="w-40">
      <NumberInput value={seats} onValueChange={setSeats} min={1} max={50} />
    </Field>
  );
}

export function PasswordInputExample() {
  const t = useT();
  return (
    <Field label={t("Password", "كلمة المرور")} className="w-full max-w-xs">
      <PasswordInput />
    </Field>
  );
}

export function SearchInputExample() {
  const t = useT();
  return <SearchInput placeholder={t("Search projects", "ابحث في المشاريع")} className="w-full max-w-sm" />;
}

export function FieldsetExample() {
  const t = useT();
  return (
    <Fieldset legend={t("Contact preference", "طريقة التواصل")} error={t("Choose one.", "اختر واحدة.")}>
      <Stack gap={3}>
        <Checkbox label={t("Email", "البريد")} />
        <Checkbox label={t("Phone", "الهاتف")} />
      </Stack>
    </Fieldset>
  );
}

export function HoneypotExample() {
  const t = useT();
  return (
    <form className="relative grid w-full max-w-xs gap-4" onSubmit={(e) => e.preventDefault()}>
      <Field label={t("Email", "البريد الإلكتروني")}>
        <Input type="email" name="email" dir="ltr" />
      </Field>
      {/* Invisible: reject the form on the server when "website" has a value. */}
      <Honeypot name="website" />
    </form>
  );
}
