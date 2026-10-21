import { Link, useParams } from "react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Display, Heading, Label, Stack, Text, type Lang } from "@percentsa/ui";
import type { Route } from "./+types/component";
import { findPage, GROUPS, PAGES } from "~/docs/catalogue";
import { COPY } from "~/docs/copy";
import { Desc, plainDesc } from "~/docs/desc";
import { exampleComponent, exampleFile } from "~/docs/examples";
import { exampleSource } from "~/lib/source";

export function loader({ params }: Route.LoaderArgs) {
  if (!findPage(params.slug)) throw new Response("Not Found", { status: 404 });
  return null;
}

export const meta: Route.MetaFunction = ({ params }) => {
  const p = findPage(params.slug);
  const lang = params.lang === "ar" ? "ar" : "en";
  return [{ title: p ? `${p.name} · ${COPY.title[lang]}` : COPY.title[lang] }, ...(p ? [{ name: "description", content: plainDesc(p.desc[lang]) }] : [])];
};

export default function ComponentPage() {
  const { lang, slug } = useParams() as { lang: Lang; slug: string };
  const page = findPage(slug)!;
  const i = PAGES.indexOf(page);
  const prev = PAGES[i - 1];
  const next = PAGES[i + 1];
  const group = GROUPS.find((g) => g.id === page.group)!;
  return (
    <Stack gap={12} className="max-w-5xl">
      <Stack gap={4}>
        <Label>{group.title[lang]}</Label>
        <Display as="h1" size="md">
          <span lang="en">{page.name}</span>
        </Display>
        <Text size="lg" tone="muted" className="max-w-3xl">
          <Desc text={page.desc[lang]} />
        </Text>
        <pre dir="ltr" className="w-fit max-w-full overflow-x-auto rounded-field border border-line bg-surface px-4 py-3 font-mono text-[13px] text-fg-2">
          {page.imports ? `import { ${page.imports} } from "@percentsa/${page.pkg ?? "ui"}";` : `@import "@percentsa/${page.pkg ?? "ui"}/styles.css";`}
        </pre>
      </Stack>
      <Stack gap={8}>
        <Heading level={2}>{COPY.examples[lang]}</Heading>
        {page.examples.map((name) => {
          const Example = exampleComponent(page.group, name)!;
          return (
            <section key={name} className="overflow-hidden rounded-card border border-line">
              <div className="stage flex min-h-56 items-center justify-center bg-bg p-6 md:p-10">
                <Example />
              </div>
              <details className="border-t border-line bg-surface">
                <summary className="cursor-pointer px-5 py-3 text-sm text-fg-2 hover:text-fg">{COPY.code[lang]}</summary>
                <pre dir="ltr" className="max-h-[32rem] overflow-auto border-t border-line px-5 py-4 font-mono text-[13px] leading-relaxed text-fg-2">
                  {exampleSource(exampleFile(page.group, name), name)}
                </pre>
              </details>
            </section>
          );
        })}
      </Stack>
      <nav className="flex justify-between gap-4 border-t border-line pt-8 text-sm">
        {prev ? (
          <Link to={`/${lang}/components/${prev.slug}`} viewTransition className="flex items-center gap-2 text-fg-2 hover:text-fg">
            <ArrowLeft aria-hidden className="size-4 rtl:-scale-x-100" />
            {prev.name}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link to={`/${lang}/components/${next.slug}`} viewTransition className="flex items-center gap-2 text-fg-2 hover:text-fg">
            {next.name}
            <ArrowRight aria-hidden className="size-4 rtl:-scale-x-100" />
          </Link>
        )}
      </nav>
    </Stack>
  );
}
