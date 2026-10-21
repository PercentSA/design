import { ArrowRight } from "lucide-react";
import { Button, CodeBlock, Inline, Link, Stack, Text, useLang } from "@percentsa/ui";
import { useT } from "~/lib/t";

// Opt-in classes from @percentsa/motion/styles.css: no import in the component file.
export function SlashHoverExample() {
  const t = useT();
  return (
    <Stack gap={6} align="start">
      <Inline gap={3}>
        <Button variant="secondary" className="p-slash-hover">
          {t("Start a project", "ابدأ مشروعًا")}
        </Button>
        <Button variant="ghost" className="p-slash-hover">
          {t("See our work", "شاهد أعمالنا")}
        </Button>
        <Button variant="secondary" iconOnly aria-label={t("Next", "التالي")} className="p-slash-hover">
          <ArrowRight aria-hidden className="rtl:-scale-x-100" />
        </Button>
      </Inline>
      <Text tone="muted">
        {t("Read the ", "اقرأ ")}
        <Link href="#privacy" className="p-slash-hover px-1">
          {t("privacy policy", "سياسة الخصوصية")}
        </Link>
        .
      </Text>
    </Stack>
  );
}

// These docs opt in with "slash": the link below plays it.
export function PageTransitionExample() {
  const t = useT();
  const lang = useLang();
  const code = `// app/root.tsx: opt in on <html>, "fade" or "slash".
<html lang={lang} dir={dir} data-page-transition="slash">

// The app's link passes viewTransition to React Router,
// except for links to a place on the same page.
const RouterLink = ({ href = "#", ...p }: ComponentProps<"a">) => (
  <Link to={href} viewTransition={!href.startsWith("#")} {...p} />
);
<PercentProvider lang={lang} link={RouterLink}>…</PercentProvider>

// Navigating from code:
navigate("/${lang}/work", { viewTransition: true });`;
  return (
    <Stack gap={6} className="w-full max-w-2xl">
      <CodeBlock code={code} filename="app/root.tsx" />
      <Text tone="muted">
        {t("Try it: open the page ", "جرّبها: افتح صفحة ")}
        <Link href={`/${lang}/components/slash-hover`}>p-slash-hover</Link>
        .
      </Text>
    </Stack>
  );
}
