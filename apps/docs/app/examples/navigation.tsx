import { useState } from "react";
import { Globe, Rss } from "lucide-react";
import {
  Breadcrumbs,
  Button,
  CodeBlock,
  LangSwitch,
  MobileMenu,
  Pagination,
  SiteFooter,
  SiteHeader,
  SkipLink,
  Stack,
  Steps,
  Tabs,
  Text,
  ThemeSwitch,
  useLang,
} from "@percentsa/ui";
import { useLocation } from "react-router";
import { useT } from "~/lib/t";

function useLinks() {
  const t = useT();
  return [
    { href: "#work", label: t("Work", "أعمالنا") },
    { href: "#services", label: t("Services", "خدماتنا"), current: true },
    { href: "#clients", label: t("Clients", "عملاؤنا") },
  ];
}

/** The header is position: fixed; the transform keeps it inside this box for the example. */
export function SiteHeaderExample() {
  const t = useT();
  return (
    <div className="relative h-40 w-full overflow-hidden rounded-card border border-line [transform:translateZ(0)]">
      <SiteHeader homeHref="#" links={useLinks()} actions={<Button size="md">{t("Start a project", "ابدأ مشروعًا")}</Button>} />
    </div>
  );
}

export function MobileMenuExample() {
  const t = useT();
  return (
    <Stack gap={3}>
      <Text size="sm" tone="muted">{t("Shown below 768 px. Narrow the window to try it.", "يظهر تحت 768 بكسل. صغّر النافذة لتجربته.")}</Text>
      <MobileMenu links={useLinks()} footer={<Button>{t("Start a project", "ابدأ مشروعًا")}</Button>} />
    </Stack>
  );
}

export function TabsExample() {
  const t = useT();
  return (
    <Tabs
      className="w-full max-w-lg"
      defaultValue="overview"
      items={[
        { value: "overview", label: t("Overview", "نظرة عامة"), content: <Text tone="muted">{t("What the project is.", "ما هو المشروع.")}</Text> },
        { value: "scope", label: t("Scope", "النطاق"), content: <Text tone="muted">{t("What we build.", "ما نبنيه.")}</Text> },
        { value: "timeline", label: t("Timeline", "الجدول الزمني"), content: <Text tone="muted">{t("When it ships.", "متى يُطلق.")}</Text> },
      ]}
    />
  );
}

export function BreadcrumbsExample() {
  const t = useT();
  return <Breadcrumbs items={[{ href: "#", label: t("Home", "الرئيسية") }, { href: "#work", label: t("Work", "أعمالنا") }, { label: "Masar" }]} />;
}

export function PaginationExample() {
  const [page, setPage] = useState(5);
  return <Pagination page={page} total={12} onPageChange={setPage} />;
}

export function StepsExample() {
  const t = useT();
  const [step, setStep] = useState(1);
  return (
    <Stack gap={6} className="w-full max-w-xl">
      <Steps
        current={step}
        items={[
          { label: t("Details", "التفاصيل") },
          { label: t("Payment", "الدفع"), description: t("Card or bank transfer", "بطاقة أو تحويل") },
          { label: t("Done", "تم") },
        ]}
      />
      <Button variant="secondary" size="sm" onClick={() => setStep((step + 1) % 3)}>
        {t("Next step", "الخطوة التالية")}
      </Button>
    </Stack>
  );
}

export function SkipLinkExample() {
  const t = useT();
  return (
    <Stack gap={3}>
      <Text size="sm" tone="muted">{t("Press Tab inside this box to see it.", "اضغط Tab داخل هذا المربع لتراه.")}</Text>
      <div className="relative h-16 w-64 rounded-field border border-dashed border-line-strong [transform:translateZ(0)]">
        <SkipLink />
      </div>
    </Stack>
  );
}

export function LangSwitchExample() {
  const { pathname } = useLocation();
  const other = useLang() === "ar" ? "en" : "ar";
  return <LangSwitch href={pathname.replace(/^\/(en|ar)/, `/${other}`)} />;
}

export function SiteFooterExample() {
  const t = useT();
  return (
    <div className="w-full overflow-hidden rounded-card border border-line">
      <SiteFooter
        homeHref="#"
        email="contact@percent.sa"
        links={useLinks()}
        legal={[{ href: "#privacy", label: t("Privacy", "الخصوصية") }]}
        copyright={t("Percent. All rights reserved.", "برسنت. جميع الحقوق محفوظة.")}
      />
    </div>
  );
}

/** Another brand: its own logo, link groups, icon links, a notice and no "Made in KSA". */
export function SiteFooterSlotsExample() {
  const t = useT();
  return (
    <div className="w-full overflow-hidden rounded-card border border-line">
      <SiteFooter
        homeHref="#"
        brand={<span lang="en" className="text-2xl font-semibold">Acme</span>}
        contact={<Text tone="muted">{t("Questions? Write to us any day.", "لديك أسئلة؟ راسلنا في أي يوم.")}</Text>}
        groups={[
          { title: t("Product", "المنتج"), links: [{ href: "#features", label: t("Features", "المزايا") }, { href: "#pricing", label: t("Pricing", "الأسعار") }] },
          { title: t("Company", "الشركة"), links: [{ href: "#about", label: t("About", "من نحن") }, { href: "#jobs", label: t("Jobs", "الوظائف") }] },
          { title: t("Legal", "قانوني"), links: [{ href: "#privacy", label: t("Privacy", "الخصوصية") }, { href: "#terms", label: t("Terms", "الشروط") }] },
        ]}
        social={[
          { href: "https://example.com", label: t("Website", "الموقع"), icon: <Globe aria-hidden /> },
          { href: "https://example.com/feed", label: t("News feed", "موجز الأخبار"), icon: <Rss aria-hidden /> },
        ]}
        notice={t("© Acme. All rights reserved.", "© أكمي. جميع الحقوق محفوظة.")}
        badges={null}
      />
    </div>
  );
}

const HEAD = `import { THEME_SCRIPT } from "@percentsa/ui";

// app/root.tsx: no attribute = dark; the script applies the stored choice before first paint.
<html lang="en" data-theme="dark" suppressHydrationWarning>
  <head>
    <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
  </head>`;

export function ThemeSwitchExample() {
  return (
    <Stack gap={4} className="w-full max-w-xl">
      <ThemeSwitch />
      <CodeBlock code={HEAD} filename="app/root.tsx" />
    </Stack>
  );
}
