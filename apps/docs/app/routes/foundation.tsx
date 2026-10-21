import { useParams } from "react-router";
import { Display, Label, Stack, Text, type Lang } from "@percentsa/ui";
import type { Route } from "./+types/foundation";
import { COPY } from "~/docs/copy";
import { findFoundation } from "~/docs/foundations";

export function loader({ params }: Route.LoaderArgs) {
  if (!findFoundation(params.page)) throw new Response("Not Found", { status: 404 });
  return null;
}

export const meta: Route.MetaFunction = ({ params }) => {
  const f = findFoundation(params.page);
  const lang = params.lang === "ar" ? "ar" : "en";
  return [{ title: f ? `${f.title[lang]} · ${COPY.title[lang]}` : COPY.title[lang] }];
};

export default function Foundation() {
  const { lang, page } = useParams() as { lang: Lang; page: string };
  const f = findFoundation(page)!;
  return (
    <Stack gap={10} className="max-w-5xl">
      <Stack gap={4}>
        <Label>{COPY.foundations[lang]}</Label>
        <Display as="h1" size="md">
          {f.title[lang]}
        </Display>
        <Text size="lg" tone="muted">
          {f.desc[lang]}
        </Text>
      </Stack>
      <f.Page />
    </Stack>
  );
}
