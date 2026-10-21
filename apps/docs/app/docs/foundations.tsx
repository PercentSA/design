import type { ReactNode } from "react";
import { BrandPage } from "./brand-page";
import { Desc } from "./desc";
import { ServerComponentsPage } from "./server-components-page";
import { brandCss, COLOR_TOKENS, color, contrast, density, duration, easing, layer, radius, SLASH_RUN, THEMES, type Brand } from "@percentsa/tokens";
import { Code, Display, Grid, Heading, isolate, Label, Mark, Stack, STRINGS, Surface, Text, useLang, type Localized } from "@percentsa/ui";

type Foundation = { slug: string; title: Localized; desc: Localized; Page: () => ReactNode };

function useL() {
  const lang = useLang();
  return (v: Localized) => v[lang];
}

const Mono = ({ children }: { children: ReactNode }) => (
  <span dir="ltr" className="font-mono text-xs text-fg-3">
    {children}
  </span>
);

function Colors() {
  const l = useL();
  const onText = ["fg", "fg-2", "fg-3", "danger", "warning", "success"] as const;
  return (
    <Stack gap={12}>
      <Text tone="muted">
        {l({
          en: "Black and white first. Green (live) only for small status dots. Danger and warning only for errors and warnings. Text tokens show their contrast on bg.",
          ar: "الأبيض والأسود أولًا. الأخضر (live) لنقاط الحالة الصغيرة فقط. لون الخطر والتحذير للأخطاء والتحذيرات فقط. تُظهر ألوان النص تباينها على الخلفية.",
        })}
      </Text>
      {THEMES.map((theme) => (
        <section key={theme} data-theme={theme} className="rounded-panel border border-line bg-bg p-6 text-fg md:p-8">
          <Label>{theme}</Label>
          <Grid min="11rem" gap={3} className="mt-5">
            {COLOR_TOKENS.map((name) => (
              <div key={name} className="overflow-hidden rounded-field border border-line">
                <div className="h-16 border-b border-line" style={{ background: `var(--p-${name})` }} />
                <div className="grid gap-0.5 p-3">
                  <span className="text-sm font-medium">{name}</span>
                  <Mono>{color[theme][name]}</Mono>
                  {(onText as readonly string[]).includes(name) && <Mono>{contrast(color[theme][name], color[theme].bg).toFixed(1)} : 1</Mono>}
                </div>
              </div>
            ))}
          </Grid>
        </section>
      ))}
      <Text size="sm" tone="subtle">
        {l({ en: "Utilities: ", ar: "الأصناف: " })}
        <Code>bg-bg</Code> <Code>bg-surface</Code> <Code>text-fg-2</Code> <Code>border-line</Code> <Code>bg-primary text-primary-fg</Code>
      </Text>
    </Stack>
  );
}

function Typography() {
  const l = useL();
  return (
    <Stack gap={10}>
      <Text tone="muted">
        <Desc
          text={l({
            en: "Fonts are a brand setting. The packages ship no font files: without a brand, text uses the device's fonts. A brand sets `--p-font-sans`, `--p-font-sans-ar` (Arabic pages) and `--p-font-mono`, and loads its own font files. This site uses Geist, IBM Plex Sans Arabic and Geist Mono. Western digits in both languages.",
            ar: "الخطوط من إعدادات الهوية. لا تتضمن الحزم ملفات خطوط: دون هوية يظهر النص بخطوط الجهاز. تحدد الهوية `--p-font-sans` و`--p-font-sans-ar` (للصفحات العربية) و`--p-font-mono`، وتحمّل ملفات خطوطها بنفسها. يستخدم هذا الموقع Geist وIBM Plex Sans Arabic وGeist Mono. الأرقام غربية في اللغتين.",
          })}
        />
      </Text>
      <Stack gap={4}>
        <Label>display</Label>
        <Display size="lg">{l({ en: "Software, built with care", ar: "برمجيات مبنية بعناية" })}</Display>
        <Mono>.display — 600, line-height 1, tracking -0.045em · ar: 700, 1.28, 0</Mono>
      </Stack>
      <Stack gap={4}>
        <Label>heading</Label>
        <Heading level={2}>{l({ en: "How we work with you", ar: "كيف نعمل معك" })}</Heading>
        <Mono>.heading — 600, 1.2, -0.02em · ar: 700, 1.45, 0</Mono>
      </Stack>
      <Stack gap={4}>
        <Label>body</Label>
        <Text size="lg" className="max-w-2xl">
          {l({
            en: "Body text uses a line-height of 1.6 in English and 1.8 in Arabic, so both scripts breathe the same.",
            ar: "يستخدم نص المحتوى ارتفاع سطر 1.6 بالإنجليزية و1.8 بالعربية ليتنفس النصان بالقدر نفسه.",
          })}
        </Text>
      </Stack>
      <Stack gap={4}>
        <Label>label</Label>
        <Label>{l({ en: "Selected work", ar: "أعمال مختارة" })}</Label>
        <Mono>.label — mono 12px, 0.16em, uppercase · ar: sans 14px</Mono>
      </Stack>
      <Stack gap={2}>
        <Label>scale (px)</Label>
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
          {[12, 13, 14, 16, 18, 20, 24, 30, 36, 48, 60].map((s) => (
            <span key={s} style={{ fontSize: s }}>
              {s}
            </span>
          ))}
        </div>
      </Stack>
    </Stack>
  );
}

function Spacing() {
  const l = useL();
  return (
    <Stack gap={10}>
      <Stack gap={4}>
        <Heading level={3}>{l({ en: "Radius", ar: "الانحناء" })}</Heading>
        <div className="flex flex-wrap gap-4">
          {Object.entries(radius).map(([k, v]) => (
            <div key={k} className="grid gap-2">
              <div className="size-24 border border-line-strong bg-surface-2" style={{ borderRadius: `var(--p-radius-${k})` }} />
              <Mono>
                rounded-{k} · {v}
              </Mono>
            </div>
          ))}
        </div>
      </Stack>
      <Stack gap={4}>
        <Heading level={3}>{l({ en: "Density", ar: "الكثافة" })}</Heading>
        <Text tone="muted">
          {l({
            en: "Websites use comfortable controls. Apps set data-density=\"compact\" on a container.",
            ar: "تستخدم المواقع عناصر مريحة. تضبط التطبيقات data-density=\"compact\" على الحاوية.",
          })}
        </Text>
        <Grid cols={2} gap={4}>
          {(["comfortable", "compact"] as const).map((d) => (
            <Surface key={d} className="grid gap-3 p-5" data-density={d === "compact" ? "compact" : undefined}>
              <Label>{d}</Label>
              <div className="flex h-(--p-control-h) items-center rounded-field border border-line-strong px-(--p-control-px) text-sm text-fg-3">
                {density[d]["control-h"]}
              </div>
            </Surface>
          ))}
        </Grid>
      </Stack>
      <Stack gap={4}>
        <Heading level={3}>{l({ en: "Layers", ar: "الطبقات" })}</Heading>
        <div className="flex flex-wrap gap-3">
          {Object.entries(layer).map(([k, v]) => (
            <Mono key={k}>
              z-(--p-z-{k}) · {v}
            </Mono>
          ))}
        </div>
      </Stack>
      <Stack gap={4}>
        <Heading level={3}>{l({ en: "Elevation", ar: "الارتفاع" })}</Heading>
        <Text tone="muted">
          {l({ en: "Flat. Only overlays have a shadow (shadow-overlay).", ar: "مسطح. الظل للنوافذ المنبثقة فقط (shadow-overlay)." })}
        </Text>
        <div className="h-24 w-64 rounded-card border border-line bg-surface-2 shadow-overlay" />
      </Stack>
      <Text size="sm" tone="subtle">
        {l({
          en: "Spacing is the Tailwind 4 px scale. Page gutter: 5vw (px-(--p-gutter)). Breakpoints: 640, 768, 1024, 1280, 1536.",
          ar: "المسافات من مقياس Tailwind بخطوة 4 بكسل. الهامش الجانبي: 5vw. نقاط التوقف: 640 و768 و1024 و1280 و1536.",
        })}
      </Text>
    </Stack>
  );
}

function Motion() {
  const l = useL();
  return (
    <Stack gap={10}>
      <Text tone="muted">
        {l({
          en: "Calm and precise. Motion runs only on screen and while the tab is visible. With reduced motion: no scramble, no marquee, no magnet; reveals become fades. No scroll-driven or pinned sections.",
          ar: "هادئة ودقيقة. تعمل الحركة فقط عندما تكون ظاهرة والتبويب مرئي. مع تقليل الحركة: لا تشويش ولا شريط متحرك ولا جذب؛ ويصبح الظهور تلاشيًا. لا أقسام مثبتة أو مرتبطة بالتمرير.",
        })}
      </Text>
      <Grid min="12rem" gap={4}>
        {Object.entries(duration).map(([k, v]) => (
          <Surface key={k} className="grid gap-1 p-5">
            <span className="font-medium">{k}</span>
            <Mono>{v}</Mono>
          </Surface>
        ))}
      </Grid>
      <Grid min="16rem" gap={4}>
        {Object.entries(easing).map(([k, v]) => (
          <Surface key={k} className="grid gap-1 p-5">
            <span className="font-medium">ease-{k}</span>
            <Mono>{v}</Mono>
          </Surface>
        ))}
      </Grid>
      <Stack gap={4}>
        <Heading level={3}>{l({ en: "The slash angle", ar: "زاوية الخط المائل" })}</Heading>
        <Text tone="muted">
          {l({
            en: `Wipes use the angle of the slash in the % mark: a run of ${SLASH_RUN} per unit of height. The angle never mirrors; the wipe moves in the reading direction.`,
            ar: `تستخدم حركات المسح زاوية الخط المائل في علامة %: إزاحة ${SLASH_RUN} لكل وحدة ارتفاع. لا تنعكس الزاوية، ويتحرك المسح في اتجاه القراءة.`,
          })}
        </Text>
        <Mark className="h-24" />
      </Stack>
    </Stack>
  );
}

function Language() {
  const l = useL();
  const lang = useLang();
  const rules: Localized[] = [
    { en: "English is the main language; Arabic is right to left. Set lang and dir on <html> and lang on PercentProvider.", ar: "الإنجليزية هي اللغة الرئيسية، والعربية من اليمين إلى اليسار. اضبط lang وdir على ‎<html>‎ وlang على PercentProvider." },
    { en: "Use logical utilities only: ms-, pe-, start-, text-start. Never ml-, pr-, left-.", ar: "استخدم الأصناف المنطقية فقط: ms- وpe- وstart- وtext-start. لا تستخدم ml- أو pr- أو left-." },
    { en: "Direction icons (arrows, chevrons) mirror with rtl:-scale-x-100. Nothing else mirrors: not the % mark, not the slash angle.", ar: "تنعكس أيقونات الاتجاه (الأسهم) بالصنف rtl:-scale-x-100. لا ينعكس شيء آخر: لا علامة % ولا زاوية الخط." },
    { en: "Digits are Western in both languages. Money: the Riyal sign left of the number, never “SAR”.", ar: "الأرقام غربية في اللغتين. المبالغ: رمز الريال يسار الرقم، ولا تكتب «SAR»." },
    { en: "Wrap ids, codes and English inside Arabic text with isolate().", ar: "أحِط المعرّفات والرموز والإنجليزية داخل النص العربي بالدالة isolate()." },
    { en: "Built-in strings (Close, Next, …) come from useStrings(); override single ones with <PercentProvider strings>.", ar: "النصوص المضمنة (إغلاق، التالي…) من useStrings()؛ ويمكن تغيير أي منها عبر ‎<PercentProvider strings>‎." },
    { en: "To scramble the visible built-in strings on a language switch too, pass <PercentProvider text={(s) => <ScrambleText>{s}</ScrambleText>}>.", ar: "لتشويش النصوص المضمنة الظاهرة أيضًا عند تبديل اللغة، مرّر ‎<PercentProvider text={(s) => <ScrambleText>{s}</ScrambleText>}>‎." },
  ];
  const sample = Object.entries(STRINGS[lang]).filter(([, v]) => typeof v === "string").slice(0, 12);
  return (
    <Stack gap={10}>
      <ul className="grid list-disc gap-3 ps-5 text-fg-2">
        {rules.map((r, i) => (
          <li key={i}>{l(r)}</li>
        ))}
      </ul>
      <Stack gap={3}>
        <Heading level={3}>isolate()</Heading>
        <Text>رقم الطلب {isolate("#4821-B")} جاهز.</Text>
      </Stack>
      <Stack gap={3}>
        <Heading level={3}>{l({ en: "Built-in strings", ar: "النصوص المضمنة" })}</Heading>
        <div className="grid gap-1 text-sm">
          {sample.map(([k, v]) => (
            <div key={k} className="flex gap-4">
              <Mono>{k}</Mono>
              <span>{v as string}</span>
            </div>
          ))}
        </div>
      </Stack>
    </Stack>
  );
}

const BRAND: Brand = {
  dark: { primary: "#3ecf8e", "primary-fg": "#000000" },
  light: { primary: "#0f5b4a", "primary-fg": "#ffffff" },
  vars: { "font-sans": '"Brand Sans", system-ui, sans-serif', "font-sans-ar": '"Brand Arabic", "Brand Sans", sans-serif', "radius-card": "8px" },
};
const BRAND_TS = `import { brandCss, checkBrand } from "@percentsa/tokens";

export const brand = ${JSON.stringify(BRAND, null, 2)};

// scripts/brand.ts: write the file once, commit it, load it after the design-system CSS.
await Bun.write("app/brand.css", brandCss(brand));
// In a test: expect(checkBrand(brand)).toEqual([]);`;
const BRAND_CSS = brandCss(BRAND);
// This page shows the brand on the sample only: its selectors move under .brand-demo.
const DEMO_CSS = `${BRAND_CSS.replaceAll(":root", ".brand-demo").replaceAll("[data-theme=", ".brand-demo [data-theme=")}
[lang="ar"] .brand-demo { --p-font-sans: var(--p-font-sans-ar); }`;

function Theming() {
  const l = useL();
  const pre = "overflow-x-auto rounded-card border border-line bg-surface p-5 font-mono text-xs leading-relaxed text-fg-2";
  return (
    <Stack gap={8}>
      <Text tone="muted">
        {l({
          en: "Percent's look is the default. data-theme sets the mode of any element: dark (also without the attribute), light, or system (follows the device). A project writes its brand as one object; brandCss() from @percentsa/tokens turns it into a CSS file, which the project loads after the design-system CSS. Components do not change. checkBrand() returns the color pairs that fail WCAG AA.",
          ar: "مظهر برسنت هو الافتراضي. تحدد السمة data-theme وضع أي عنصر: داكن (وهو الوضع دون السمة) أو فاتح أو system (يتبع إعداد الجهاز). يكتب المشروع هويته في كائن واحد، وتحوّله الدالة brandCss()‎ من ‎@percentsa/tokens‎ إلى ملف CSS يحمّله المشروع بعد CSS نظام التصميم. لا تتغير المكونات. وتعيد الدالة checkBrand()‎ أزواج الألوان التي لا تحقق WCAG AA.",
        })}
      </Text>
      <pre dir="ltr" className={pre}>
        {BRAND_TS}
      </pre>
      <pre dir="ltr" className={pre}>
        {BRAND_CSS}
      </pre>
      <style>{DEMO_CSS}</style>
      <Grid min="14rem" gap={4} className="brand-demo">
        {(["dark", "light", "system"] as const).map((mode) => (
          <section key={mode} data-theme={mode} className="grid gap-4 rounded-card border border-line bg-bg p-6 font-sans text-fg">
            <Label>{mode}</Label>
            <Display size="md">{l({ en: "Same components", ar: "المكونات نفسها" })}</Display>
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex h-10 items-center rounded-field bg-primary px-5 text-sm font-semibold text-primary-fg">
                {l({ en: "Primary", ar: "أساسي" })}
              </span>
              <span className="inline-flex h-10 items-center rounded-field border border-line-strong px-5 text-sm text-fg-2">
                {l({ en: "Secondary", ar: "ثانوي" })}
              </span>
            </div>
          </section>
        ))}
      </Grid>
    </Stack>
  );
}

export const FOUNDATIONS: Foundation[] = [
  { slug: "brand", title: { en: "Brand", ar: "الهوية" }, desc: { en: "The logo, its versions, clear space, sizes, colours, motion and downloads.", ar: "الشعار ونسخه والمساحة الفارغة والمقاسات والألوان والحركة والتنزيلات." }, Page: BrandPage },
  { slug: "colors", title: { en: "Colors", ar: "الألوان" }, desc: { en: "Semantic color tokens in both themes.", ar: "رموز الألوان الدلالية في المظهرين." }, Page: Colors },
  { slug: "typography", title: { en: "Typography", ar: "الخطوط" }, desc: { en: "Families, scale and the Arabic rules.", ar: "العائلات والمقياس وقواعد العربية." }, Page: Typography },
  { slug: "spacing", title: { en: "Spacing, radius, layers", ar: "المسافات والانحناء والطبقات" }, desc: { en: "Radius, density, elevation and z-index.", ar: "الانحناء والكثافة والارتفاع وترتيب الطبقات." }, Page: Spacing },
  { slug: "motion", title: { en: "Motion", ar: "الحركة" }, desc: { en: "Durations, easings, the slash angle and the reduced-motion policy.", ar: "المدد ومنحنيات الحركة وزاوية الخط وسياسة تقليل الحركة." }, Page: Motion },
  { slug: "language", title: { en: "Language and direction", ar: "اللغة والاتجاه" }, desc: { en: "English and Arabic, RTL rules and built-in strings.", ar: "العربية والإنجليزية وقواعد الاتجاه والنصوص المضمنة." }, Page: Language },
  { slug: "theming", title: { en: "Theming", ar: "المظاهر" }, desc: { en: "Dark, light and system modes, and project brands.", ar: "الوضع الداكن والفاتح ووضع الجهاز، وهويات المشاريع." }, Page: Theming },
  { slug: "server-components", title: { en: "Server components", ar: "مكونات الخادم" }, desc: { en: "Use the packages in React Server Components, for example the Next.js App Router.", ar: "استخدام الحزم مع مكونات خادم React، مثل App Router في Next.js." }, Page: ServerComponentsPage },
];

export const findFoundation = (slug: string) => FOUNDATIONS.find((f) => f.slug === slug);
