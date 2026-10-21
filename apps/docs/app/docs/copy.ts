import type { Localized } from "@percentsa/ui";

export const COPY = {
  title: { en: "Percent Design System", ar: "نظام تصميم برسنت" },
  short: { en: "Design", ar: "التصميم" },
  lead: {
    en: "One design language for every Percent project: tokens, React components, the Saudi kit and signature motion. Black and white, English and Arabic, dark and light.",
    ar: "لغة تصميم واحدة لكل مشاريع برسنت: الرموز ومكونات React والأدوات السعودية والحركة المميزة. أبيض وأسود، عربي وإنجليزي، داكن وفاتح.",
  },
  install: { en: "Install", ar: "التثبيت" },
  foundations: { en: "Foundations", ar: "الأساسيات" },
  components: { en: "Components", ar: "المكونات" },
  overview: { en: "Overview", ar: "نظرة عامة" },
  all: { en: "All components", ar: "كل المكونات" },
  allLead: {
    en: "Every component on one page, with its first example. Open a name for all its examples and the code.",
    ar: "كل المكونات في صفحة واحدة مع أول مثال لكل مكون. افتح اسم المكون لترى كل أمثلته والشيفرة.",
  },
  changelog: { en: "Changelog", ar: "سجل التغييرات" },
  changelogLead: {
    en: "What each version changes, in plain words. The technical list is in CHANGELOG.md in the repository.",
    ar: "ما يغيّره كل إصدار بكلمات بسيطة، باللغة الإنجليزية. القائمة التقنية في ملف CHANGELOG.md في المستودع.",
  },
  examples: { en: "Examples", ar: "أمثلة" },
  code: { en: "Code", ar: "الشيفرة" },
  usage: { en: "Usage", ar: "الاستخدام" },
  theme: { en: "Theme", ar: "المظهر" },
  notFound: { en: "Page not found", ar: "الصفحة غير موجودة" },
  backHome: { en: "Back to the overview", ar: "العودة إلى النظرة العامة" },
  pages: { en: "pages", ar: "صفحة" },
} satisfies Record<string, Localized>;
