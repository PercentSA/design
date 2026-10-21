import { Link, useParams } from "react-router";
import { buttonClass, Display, Grid, Heading, Inline, Label, Stack, Surface, Text, type Lang } from "@percentsa/ui";
import type { Route } from "./+types/home";
import { GROUPS, PAGES } from "~/docs/catalogue";
import { COPY } from "~/docs/copy";
import { FOUNDATIONS } from "~/docs/foundations";

export const meta: Route.MetaFunction = ({ params }) => {
  const lang = params.lang === "ar" ? "ar" : "en";
  return [{ title: COPY.title[lang] }, { name: "description", content: COPY.lead[lang] }];
};

const INSTALL = `bun add @percentsa/tokens @percentsa/ui @percentsa/motion`;

const CSS = `@import "tailwindcss";
@import "@percentsa/tokens/theme.css";
@import "@percentsa/ui/styles.css";
@import "@percentsa/motion/styles.css";

/* Fonts are yours: the packages ship none (without these, the device's fonts). */
:root {
  --p-font-sans: "Your Sans", system-ui, sans-serif;
  --p-font-sans-ar: "Your Arabic", "Your Sans", system-ui, sans-serif;
  --p-font-mono: "Your Mono", ui-monospace, monospace;
}`;

const LINKS = [
  { href: "https://github.com/PercentSA/design", label: { en: "Source on GitHub", ar: "الشيفرة على GitHub" } },
  { href: "https://www.npmjs.com/package/@percentsa/ui", label: { en: "npm", ar: "npm" } },
  { href: "https://github.com/PercentSA/design/blob/main/LICENSE", label: { en: "MIT license", ar: "رخصة MIT" } },
] as const;

const TSX = `<html lang="ar" dir="rtl" data-theme="dark">
  …
  <PercentProvider lang="ar" link={RouterLink}>
    <App />
  </PercentProvider>`;

const REGISTRY = `// components.json: copy single components into the project instead (shadcn CLI)
"registries": {
  "@percentsa": {
    "url": "https://design.percent.sa/r/{name}.json"
  }
}

bunx shadcn add @percentsa/button @percentsa/date-picker`;

const Pre = ({ children }: { children: string }) => (
  <pre dir="ltr" className="overflow-x-auto rounded-card border border-line bg-surface p-5 font-mono text-[13px] leading-relaxed text-fg-2">
    {children}
  </pre>
);

export default function Home() {
  const lang = useParams().lang as Lang;
  return (
    <Stack gap={16} className="max-w-5xl">
      <Stack gap={6}>
        <Label>@percentsa</Label>
        <Display size="lg">{COPY.title[lang]}</Display>
        <Text size="lg" tone="muted" className="max-w-2xl">
          {COPY.lead[lang]}
        </Text>
        <Inline gap={2}>
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className={buttonClass("secondary", "sm")}>
              {l.label[lang]}
            </a>
          ))}
        </Inline>
      </Stack>
      <Stack gap={5}>
        <Heading level={2}>{COPY.install[lang]}</Heading>
        <Pre>{INSTALL}</Pre>
        <Pre>{CSS}</Pre>
        <Pre>{TSX}</Pre>
        <Text size="sm" tone="subtle">
          {lang === "ar"
            ? "أو انسخ مكونات منفردة إلى المشروع (shadcn CLI)."
            : "Or copy single components into the project (shadcn CLI)."}
        </Text>
        <Pre>{REGISTRY}</Pre>
      </Stack>
      <Stack gap={5}>
        <Heading level={2}>{COPY.foundations[lang]}</Heading>
        <Grid min="15rem" gap={3}>
          {FOUNDATIONS.map((f) => (
            <Link key={f.slug} to={`/${lang}/foundations/${f.slug}`} viewTransition>
              <Surface className="grid h-full gap-1 p-5 transition-colors hover:border-line-strong">
                <span className="font-medium">{f.title[lang]}</span>
                <Text size="sm" tone="subtle">{f.desc[lang]}</Text>
              </Surface>
            </Link>
          ))}
        </Grid>
      </Stack>
      <Stack gap={5}>
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <Heading level={2}>{COPY.components[lang]}</Heading>
          <Link to={`/${lang}/all`} viewTransition className="text-sm text-fg-2 underline decoration-line-strong underline-offset-4 hover:text-fg">
            {COPY.all[lang]}
          </Link>
        </div>
        <Grid min="15rem" gap={3}>
          {GROUPS.map((g) => {
            const pages = PAGES.filter((p) => p.group === g.id);
            return (
              <Link key={g.id} to={`/${lang}/components/${pages[0]!.slug}`} viewTransition>
                <Surface className="grid h-full gap-1 p-5 transition-colors hover:border-line-strong">
                  <span className="font-medium">{g.title[lang]}</span>
                  <Text size="sm" tone="subtle">
                    {pages.length} {COPY.pages[lang]}
                  </Text>
                </Surface>
              </Link>
            );
          })}
        </Grid>
      </Stack>
    </Stack>
  );
}
