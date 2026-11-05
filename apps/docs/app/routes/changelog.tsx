import { Link, useParams } from "react-router";
import { Badge, Display, formatDate, Heading, Label, Stack, Text, type Lang } from "@percentsa/ui";
import type { Route } from "./+types/changelog";
import { LINK, RELEASES, type ChangeKind } from "~/docs/changelog";
import { COPY } from "~/docs/copy";

export const meta: Route.MetaFunction = ({ params }) => {
  const lang = params.lang === "ar" ? "ar" : "en";
  return [{ title: `${COPY.changelog[lang]} · ${COPY.title[lang]}` }, { name: "description", content: COPY.changelogLead[lang] }];
};

const KIND: Record<ChangeKind, { label: string; variant: "solid" | "subtle" | "outline" }> = {
  new: { label: "New", variant: "subtle" },
  better: { label: "Better", variant: "subtle" },
  fixed: { label: "Fixed", variant: "outline" },
  action: { label: "Action needed", variant: "solid" },
};

/** Entry text; `[Name](slug)` becomes a link to the component page. */
function ChangeText({ text, lang }: { text: string; lang: Lang }) {
  // split with the two capture groups gives: text, name, slug, text, name, slug, …, text
  const parts = text.split(LINK);
  return parts.map((s, i) =>
    i % 3 === 1 ? (
      <Link key={i} to={`/${lang}/components/${parts[i + 1]}`} viewTransition className="font-medium text-fg underline decoration-line-strong underline-offset-4 hover:decoration-fg">
        {s}
      </Link>
    ) : i % 3 === 2 ? null : (
      s
    ),
  );
}

/** Every version, newest first, in plain words. The entries are English on both language pages. */
export default function Changelog() {
  const lang = useParams().lang as Lang;
  const latest = RELEASES.find((r) => r.date)?.version;
  return (
    <Stack gap={12} className="max-w-3xl">
      <Stack gap={4}>
        <Label>@percentsa</Label>
        <Display as="h1" size="md">
          {COPY.changelog[lang]}
        </Display>
        <Text size="lg" tone="muted">
          {COPY.changelogLead[lang]}
        </Text>
      </Stack>
      <div lang="en" dir="ltr" className="grid gap-12">
        {RELEASES.map((r) => (
          <section key={r.version} id={`v${r.version}`} aria-labelledby={`v${r.version}-title`} className="grid gap-4 border-t border-line pt-8">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <Heading level={2} id={`v${r.version}-title`}>
                {r.version}
              </Heading>
              {r.version === latest && <Badge variant="solid">Latest</Badge>}
              {r.date ? (
                <time dateTime={r.date} className="text-sm text-fg-3">
                  {formatDate(new Date(`${r.date}T12:00:00+03:00`))}
                </time>
              ) : (
                <Badge variant="outline">Not released yet</Badge>
              )}
            </div>
            <Text tone="muted">{r.summary}</Text>
            <ul className="grid gap-4">
              {r.changes.map((ch, i) => (
                <li key={i} className="grid gap-1.5 sm:grid-cols-[8rem_1fr] sm:items-start sm:gap-4">
                  <span>
                    <Badge variant={KIND[ch.kind].variant}>{KIND[ch.kind].label}</Badge>
                  </span>
                  <span className="text-fg-2">
                    <ChangeText text={ch.text} lang={lang} />
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Stack>
  );
}
