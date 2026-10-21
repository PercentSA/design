import { Link, useParams } from "react-router";
import { buttonClass, cn, Display, Heading, Inline, Label, Stack, Text, type Lang } from "@percentsa/ui";
import type { Route } from "./+types/all";
import { GROUPS, PAGES } from "~/docs/catalogue";
import { COPY } from "~/docs/copy";
import { Desc } from "~/docs/desc";
import { exampleComponent } from "~/docs/examples";

export const meta: Route.MetaFunction = ({ params }) => {
  const lang = params.lang === "ar" ? "ar" : "en";
  return [{ title: `${COPY.all[lang]} · ${COPY.title[lang]}` }];
};

// Site chrome is laid out for the full page width; half a column clips it.
const WIDE = new Set(["site-header", "site-footer", "app-shell", "invoice", "data-table", "kanban", "calendar-view", "ticket-view"]);

/** Every component on one page, each with its first example. */
export default function All() {
  const lang = useParams().lang as Lang;
  const groups = GROUPS.map((g) => ({ ...g, pages: PAGES.filter((p) => p.group === g.id) }));
  return (
    <Stack gap={16}>
      <Stack gap={6}>
        <Label>
          {PAGES.length} {COPY.pages[lang]}
        </Label>
        <Display size="md">{COPY.all[lang]}</Display>
        <Text size="lg" tone="muted" className="max-w-3xl">
          {COPY.allLead[lang]}
        </Text>
        <Inline as="nav" aria-label={COPY.components[lang]} gap={2}>
          {groups.map((g) => (
            <a key={g.id} href={`#${g.id}`} className={buttonClass("secondary", "sm")}>
              {g.title[lang]}
            </a>
          ))}
        </Inline>
      </Stack>
      {groups.map((g) => (
        <section key={g.id} id={g.id} aria-labelledby={`${g.id}-title`} className="grid gap-5">
          <Heading level={2} id={`${g.id}-title`}>
            {g.title[lang]} <span className="text-fg-3 tabular-nums">{g.pages.length}</span>
          </Heading>
          <div className="grid gap-4 xl:grid-cols-2">
            {g.pages.map((p) => {
              const Example = exampleComponent(p.group, p.examples[0]!)!;
              return (
                <article key={p.slug} data-card="" className={cn("flex min-w-0 flex-col overflow-hidden rounded-card border border-line", WIDE.has(p.slug) && "xl:col-span-2")}>
                  <div className="stage flex min-h-48 flex-1 items-center justify-center-safe overflow-x-auto bg-bg p-6">
                    <Example />
                  </div>
                  <div className="grid gap-1 border-t border-line bg-surface px-5 py-4">
                    <Link to={`/${lang}/components/${p.slug}`} viewTransition className="w-fit font-medium underline decoration-line-strong underline-offset-4 hover:decoration-fg">
                      <span lang="en">{p.name}</span>
                    </Link>
                    <Text size="sm" tone="subtle">
                      <Desc text={p.desc[lang]} />
                    </Text>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </Stack>
  );
}
