import { data, Link, useParams } from "react-router";
import { Display, Stack, Text, type Lang } from "@percentsa/ui";
import { COPY } from "~/docs/copy";

export const loader = () => data(null, { status: 404 });

export default function NotFound() {
  const lang = useParams().lang as Lang;
  return (
    <Stack gap={6}>
      <Display size="md">404</Display>
      <Text tone="muted">{COPY.notFound[lang]}</Text>
      <Link to={`/${lang}`} viewTransition className="underline underline-offset-4">
        {COPY.backHome[lang]}
      </Link>
    </Stack>
  );
}
