import type { CSSProperties, ReactNode } from "react";
import { LOADER_STAGES, LOGO_LINE_Y, LOGO_SQUARE, LOGO_STROKE, LOGO_VERSIONS, logoLayout, type LogoVersion } from "@percentsa/tokens";
import { LogoLoader } from "@percentsa/motion";
import { Grid, Heading, Logo, Mark, Stack, Surface, Text, useLang, type Localized } from "@percentsa/ui";

const ICON_H = logoLayout("icon").viewBox[3]; // the visible icon height in logo units
const XH = 140; // the x-height: the ر and the c

function useL() {
  const lang = useLang();
  return (v: Localized) => v[lang];
}

const Mono = ({ children }: { children: ReactNode }) => (
  <span dir="ltr" className="font-mono text-xs text-fg-3">
    {children}
  </span>
);

function Section({ title, text, children }: { title: Localized; text: Localized; children?: ReactNode }) {
  const l = useL();
  return (
    <Stack gap={5}>
      <Heading level={2}>{l(title)}</Heading>
      <Text tone="muted">{l(text)}</Text>
      {children}
    </Stack>
  );
}

const USE: Record<LogoVersion, Localized> = {
  icon: { en: "Small and square spaces: avatars, app icons, favicons.", ar: "المساحات الصغيرة والمربعة: الصور الرمزية وأيقونات التطبيقات والمواقع." },
  en: { en: "English alone, only where the icon is already near.", ar: "الإنجليزية وحدها، فقط حين تكون الأيقونة قريبة." },
  ar: { en: "Arabic alone, only where the icon is already near.", ar: "العربية وحدها، فقط حين تكون الأيقونة قريبة." },
  "icon-en": { en: "The default on English pages: headers, sign-in pages.", ar: "الافتراضي في الصفحات الإنجليزية: الترويسات وصفحات الدخول." },
  "icon-ar": { en: "The default on Arabic pages. The icon is at the reading start, on the right.", ar: "الافتراضي في الصفحات العربية. الأيقونة في بداية القراءة، على اليمين." },
  row: { en: "Wide bilingual spaces: letterheads, footers, signs. Arabic | icon | English.", ar: "المساحات العريضة بلغتين: الأوراق الرسمية والتذييلات واللافتات. العربية | الأيقونة | الإنجليزية." },
  stack: { en: "Bilingual spaces with less width. Each word's x-height is one square.", ar: "المساحات الأضيق بلغتين. ارتفاع كل كلمة يساوي مربعًا واحدًا." },
};

/** The logo with horizontal guides at logo-unit heights (same viewBox, so they line up). */
function Guides({ version, ys }: { version: LogoVersion; ys: number[] }) {
  const [x, , w] = logoLayout(version).viewBox;
  return (
    <div className="relative">
      <Logo version={version} className="h-auto w-full max-w-2xl" />
      <svg viewBox={logoLayout(version).viewBox.join(" ")} className="absolute inset-0 h-full w-full max-w-2xl overflow-visible text-fg-3" aria-hidden="true">
        {ys.map((y) => (
          <line key={y} x1={x - 20} x2={x + w + 20} y1={y} y2={y} stroke="currentColor" strokeWidth={1.5} strokeDasharray="6 6" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
    </div>
  );
}

/** A logo `px` pixels high, measured on the icon. */
function AtIconHeight({ version, px }: { version: LogoVersion; px: number }) {
  return (
    <div style={{ height: `${(px * logoLayout(version).viewBox[3]) / ICON_H}px` }}>
      <Logo version={version} className="h-full" />
    </div>
  );
}

/** The default logo with one wrong change. */
const Wrong = ({ style, className }: { style?: CSSProperties; className?: string }) => (
  <span className="inline-block" style={style}>
    <Logo version="icon-en" className={className ?? "h-8"} />
  </span>
);

const DONT: { label: Localized; node: ReactNode }[] = [
  { label: { en: "Stretch", ar: "التمديد" }, node: <Wrong style={{ transform: "scaleX(1.3)" }} className="h-7" /> },
  { label: { en: "Recolour", ar: "تغيير اللون" }, node: <Wrong style={{ color: "var(--p-live)" }} /> },
  { label: { en: "Shade", ar: "الظل" }, node: <Wrong style={{ filter: "drop-shadow(4px 4px 0 var(--p-fg-3))" }} /> },
  { label: { en: "Outline", ar: "الحدود فقط" }, node: <Wrong className="h-8 [&_g]:fill-none" /> },
  { label: { en: "Rotate", ar: "التدوير" }, node: <Wrong style={{ transform: "rotate(-12deg)" }} /> },
  { label: { en: "Mirror", ar: "العكس" }, node: <Wrong style={{ transform: "scaleX(-1)" }} /> },
  {
    label: { en: "Type the name in a font", ar: "كتابة الاسم بخط" },
    node: (
      <span lang="en" dir="ltr" className="inline-flex items-center gap-2 font-sans text-xl font-semibold">
        <Mark className="h-6" />
        Percent
      </span>
    ),
  },
  {
    label: { en: "Change the spacing", ar: "تغيير المسافات" },
    node: (
      <span dir="ltr" className="inline-flex items-center gap-0.5">
        <Logo version="icon" className="h-8" />
        <Logo version="en" className="h-8" />
      </span>
    ),
  },
];

function Crossed({ children }: { children: ReactNode }) {
  return (
    <div className="relative grid h-24 place-items-center overflow-hidden">
      {children}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full text-danger" aria-hidden="true">
        <line x1="4" y1="96" x2="96" y2="4" stroke="currentColor" strokeWidth={2} vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}

const STAGE_WORD: Record<"ar" | "en", Localized> = { ar: { en: "Arabic", ar: "العربية" }, en: { en: "English", ar: "الإنجليزية" } };
const LOGO_WORD: Localized = { en: "logo", ar: "الشعار" };

export function BrandPage() {
  const l = useL();
  const pad = (version: LogoVersion, h: number): CSSProperties => ({ padding: `${(LOGO_SQUARE / logoLayout(version).viewBox[3]) * h}px` });
  return (
    <Stack gap={16}>
      <Section
        title={{ en: "Logo versions", ar: "نسخ الشعار" }}
        text={{
          en: "Seven versions from one geometry. The icon is always at the reading start; icon and words are the same size (1:1), one square apart. Draw them only with <Logo version>.",
          ar: "سبع نسخ من هندسة واحدة. الأيقونة دائمًا في بداية القراءة، والأيقونة والكلمات بالحجم نفسه (1:1) وبينها مربع واحد. ارسمها فقط بالمكون \u2066<Logo\u00a0version>\u2069.",
        }}
      >
        <Grid min="18rem" gap={4}>
          {LOGO_VERSIONS.map((v) => (
            <Surface key={v} className="grid content-between gap-6 p-6">
              <div className="grid h-24 place-items-center">
                <Logo version={v} className="h-auto max-h-16 w-auto max-w-full" />
              </div>
              <div className="grid gap-1">
                <Mono>{v}</Mono>
                <Text size="sm">{l(USE[v])}</Text>
              </div>
            </Surface>
          ))}
        </Grid>
      </Section>

      <Section
        title={{ en: "Construction", ar: "البناء" }}
        text={{
          en: `One unit system: the icon is ${LOGO_SQUARE} × ${LOGO_SQUARE} squares and a slash, with a ${LOGO_STROKE} round-join stroke. The words sit on one line (y ${LOGO_LINE_Y}). The ر and the c are the same slash, as long as the x-height (${XH}). In the stacked version each word's x-height is one visible square, beside the top and bottom squares.`,
          ar: `نظام وحدات واحد: الأيقونة مربعان بقياس ${LOGO_SQUARE} × ${LOGO_SQUARE} وخط مائل، بحد دائري الزوايا سماكته ${LOGO_STROKE}. تقع الكلمات على خط واحد (y ${LOGO_LINE_Y}). الراء وحرف c هما الخط المائل نفسه، وطولهما ارتفاع الحرف (${XH}). في النسخة المكدسة يساوي ارتفاع كل كلمة مربعًا ظاهرًا واحدًا، بجانب المربع العلوي والسفلي.`,
        }}
      >
        <Guides version="icon-en" ys={[0, LOGO_LINE_Y - XH / 2, LOGO_LINE_Y, LOGO_LINE_Y + XH / 2, 2 * LOGO_LINE_Y]} />
        <Guides version="stack" ys={[-LOGO_STROKE / 2, LOGO_SQUARE + LOGO_STROKE / 2, 2 * LOGO_LINE_Y - LOGO_SQUARE - LOGO_STROKE / 2, 2 * LOGO_LINE_Y + LOGO_STROKE / 2]} />
      </Section>

      <Section
        title={{ en: "Clear space", ar: "المساحة الفارغة" }}
        text={{
          en: "Keep one square free on all sides: 0.31 × the icon height. Without the icon, the same distance in logo units (about half the x-height).",
          ar: "اترك مربعًا واحدًا فارغًا من كل الجهات: 0.31 × ارتفاع الأيقونة. ودون الأيقونة، المسافة نفسها بوحدات الشعار (نحو نصف ارتفاع الحرف).",
        }}
      >
        <div className="w-fit border border-dashed border-line-strong" style={pad("icon-en", 64)}>
          <Logo version="icon-en" className="h-16" />
        </div>
      </Section>

      <Section
        title={{ en: "Minimum size", ar: "أصغر مقاس" }}
        text={{
          en: "Measured on the icon: icon alone 16 px high; versions with words 24 px; the stacked version 44 px (its words are at 0.55 scale).",
          ar: "يُقاس على الأيقونة: الأيقونة وحدها 16 بكسل ارتفاعًا؛ والنسخ مع الكلمات 24 بكسل؛ والنسخة المكدسة 44 بكسل (كلماتها بمقياس 0.55).",
        }}
      >
        <div className="flex flex-wrap items-end gap-10">
          {([["icon", 16], ["icon-en", 24], ["icon-ar", 24], ["stack", 44]] as const).map(([v, px]) => (
            <div key={v} className="grid justify-items-start gap-2">
              <AtIconHeight version={v} px={px} />
              <Mono>
                {v} · {px} px
              </Mono>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title={{ en: "Colours", ar: "الألوان" }}
        text={{
          en: "White on black or black on white. Never other colours, gradients, shadows or outlines. The green status colour is never part of the logo.",
          ar: "أبيض على أسود أو أسود على أبيض. لا ألوان أخرى ولا تدرجات ولا ظلال ولا حدود. اللون الأخضر للحالة ليس جزءًا من الشعار أبدًا.",
        }}
      >
        <Grid min="16rem" gap={4}>
          {(["#000", "#fff"] as const).map((bg) => (
            <div key={bg} className="grid h-40 place-items-center rounded-card border border-line" style={{ background: bg, color: bg === "#000" ? "#fff" : "#000" }}>
              <Logo version="icon-en" className="h-12" />
            </div>
          ))}
        </Grid>
      </Section>

      <Section
        title={{ en: "Do not", ar: "لا تفعل" }}
        text={{
          en: "Do not stretch, recolour, shade, outline, rotate, mirror or redraw the logo, type the name in a font as a logo, or change the spacing or the arrangement.",
          ar: "لا تمدد الشعار ولا تغيّر لونه ولا تضف ظلًا أو حدودًا ولا تدوّره ولا تعكسه ولا تعِد رسمه، ولا تكتب الاسم بخط بدل الشعار، ولا تغيّر المسافات أو الترتيب.",
        }}
      >
        <Grid min="12rem" gap={4}>
          {DONT.map((d) => (
            <Surface key={d.label.en} className="grid gap-3 p-4">
              <Crossed>{d.node}</Crossed>
              <Text size="sm">{l(d.label)}</Text>
            </Surface>
          ))}
        </Grid>
      </Section>

      <Section
        title={{ en: "The name in text", ar: "الاسم في النص" }}
        text={{
          en: "In English text: \"Percent\", with a capital P (the logo is lowercase). In Arabic text: \"برسنت\".",
          ar: "في النص الإنجليزي: \"Percent\" بحرف P كبير (الشعار بحروف صغيرة). وفي النص العربي: \"برسنت\".",
        }}
      >
        <div className="flex flex-wrap gap-10 text-3xl font-semibold">
          <span lang="en" dir="ltr">
            Percent
          </span>
          <span lang="ar" dir="rtl">
            برسنت
          </span>
        </div>
      </Section>

      <Section
        title={{ en: "Motion", ar: "الحركة" }}
        text={{
          en: "The loader (<LogoLoader>): the squares slide into the slash, the slash narrows, and the word slides out of it on both sides. It plays only on screen with the tab visible. With reduced motion it shows the still icon.",
          ar: "مؤشر التحميل (\u2066<LogoLoader>\u2069): ينزلق المربعان داخل الخط المائل، ويضيق الخط، وتنزلق الكلمة منه على الجانبين. يعمل فقط وهو ظاهر على الشاشة والتبويب مرئي. ومع تقليل الحركة تظهر الأيقونة ثابتة.",
        }}
      >
        <Surface className="grid place-items-center p-8">
          <LogoLoader label={l({ en: "Loading", ar: "جارٍ التحميل" })} className="block h-auto w-full max-w-xl" />
        </Surface>
        <table className="w-full max-w-md text-sm">
          <tbody>
            {LOADER_STAGES.map((s, i) => (
              <tr key={i} className="border-b border-line">
                <td className="py-2">
                  {s.from === s.to ? l(s.from ? LOGO_WORD : STAGE_WORD[s.word]) : `${l(s.from ? LOGO_WORD : STAGE_WORD[s.word])} → ${l(s.from ? STAGE_WORD[s.word] : LOGO_WORD)}`}
                </td>
                <td className="py-2 text-end">
                  <Mono>{s.ms} ms</Mono>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section
        title={{ en: "Downloads", ar: "التنزيلات" }}
        text={{
          en: "SVG files of every version, white (for dark backgrounds) and black (for light backgrounds), generated from the same geometry.",
          ar: "ملفات SVG لكل نسخة، بالأبيض (للخلفيات الداكنة) وبالأسود (للخلفيات الفاتحة)، مولدة من الهندسة نفسها.",
        }}
      >
        <Grid min="14rem" gap={3}>
          {LOGO_VERSIONS.map((v) => (
            <Surface key={v} className="grid gap-2 p-4">
              <Mono>{v}</Mono>
              <div className="flex gap-4 text-sm">
                {(["white", "black"] as const).map((c) => (
                  <a key={c} href={`/brand/percent-${v}-${c}.svg`} download className="underline underline-offset-4">
                    {l(c === "white" ? { en: "White", ar: "أبيض" } : { en: "Black", ar: "أسود" })}
                  </a>
                ))}
              </div>
            </Surface>
          ))}
        </Grid>
      </Section>
    </Stack>
  );
}
