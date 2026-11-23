import { useState } from "react";
import { Blockquote, Button, Code, Display, ExpandableText, FormattedNumber, Heading, Highlight, Kbd, Label, Link, Prose, Stack, Text } from "@percentsa/ui";
import { useT } from "~/lib/t";

export function DisplayExample() {
  const t = useT();
  return (
    <Stack gap={6}>
      <Display size="xl">{t("We build", "نبني")}</Display>
      <Display as="h2" size="lg">{t("Software studio", "استوديو برمجيات")}</Display>
      <Display as="h3" size="md">{t("Design. Build. Run.", "صمّم. ابنِ. شغّل.")}</Display>
    </Stack>
  );
}

export function HeadingExample() {
  const t = useT();
  return (
    <Stack gap={3}>
      {([1, 2, 3, 4, 5, 6] as const).map((level) => (
        <Heading key={level} level={level}>
          {t(`Heading level ${level}`, `عنوان المستوى ${level}`)}
        </Heading>
      ))}
    </Stack>
  );
}

export function TextExample() {
  const t = useT();
  const body = t("Percent designs and builds software for companies in Saudi Arabia.", "تصمّم برسنت البرمجيات وتبنيها للشركات في السعودية.");
  return (
    <Stack gap={3}>
      <Text size="lg">{body}</Text>
      <Text>{body}</Text>
      <Text size="sm" tone="muted">{body}</Text>
      <Text size="xs" tone="subtle">{body}</Text>
      <Text size="sm" tone="danger">{t("The shift state could not be read.", "تعذّرت قراءة حالة الوردية.")}</Text>
    </Stack>
  );
}

export function LabelExample() {
  const t = useT();
  return <Label>{t("Selected work", "أعمال مختارة")}</Label>;
}

export function LinkExample() {
  const t = useT();
  return (
    <Text>
      {t("Read the ", "اقرأ ")}
      <Link href="#privacy">{t("privacy policy", "سياسة الخصوصية")}</Link>
      {t(" or visit ", " أو زُر ")}
      <Link href="https://percent.sa" external>
        percent.sa
      </Link>
    </Text>
  );
}

export function CodeKbdExample() {
  const t = useT();
  return (
    <Text>
      {t("Run ", "شغّل ")}
      <Code>bun test</Code>
      {t(" or press ", " أو اضغط ")}
      <Kbd>⌘</Kbd> <Kbd>K</Kbd>
    </Text>
  );
}

export function BlockquoteExample() {
  const t = useT();
  return (
    <Blockquote cite={t("Client, logistics company", "عميل، شركة لوجستية")}>
      {t("They shipped the first version in six weeks.", "أطلقوا النسخة الأولى خلال ستة أسابيع.")}
    </Blockquote>
  );
}

export function ProseExample() {
  const t = useT();
  return (
    <Prose>
      <h2>{t("What we collect", "ما نجمعه")}</h2>
      <p>
        {t("We keep only what you send through the form. Read ", "نحتفظ فقط بما ترسله عبر النموذج. اقرأ ")}
        <a href="#rights">{t("your rights", "حقوقك")}</a>.
      </p>
      <ul>
        <li>{t("Name and email", "الاسم والبريد الإلكتروني")}</li>
        <li>{t("Your message", "رسالتك")}</li>
      </ul>
    </Prose>
  );
}

export function HighlightExample() {
  const t = useT();
  return (
    <Text>
      {t("Results for ", "نتائج ")}
      <Highlight>{t("design", "تصميم")}</Highlight>
    </Text>
  );
}

export function FormattedNumberExample() {
  return (
    <Stack gap={2}>
      <FormattedNumber value={1250000} className="text-2xl" />
      <FormattedNumber value={1250000} options={{ notation: "compact" }} className="text-2xl" />
      <FormattedNumber value={0.42} options={{ style: "percent" }} className="text-2xl" />
    </Stack>
  );
}

export function ExpandableTextExample() {
  const t = useT();
  return (
    <Stack gap={4}>
      <ExpandableText
        text={t("Build failed: the step could not read the file because the path is longer than the limit of the file system.", "فشل البناء: تعذّرت على الخطوة قراءة الملف لأن المسار أطول من حد نظام الملفات.")}
        details={<Code>job 4f2a</Code>}
      />
      <ExpandableText text={t("Build finished.", "اكتمل البناء.")} />
    </Stack>
  );
}

/** Controlled: a button outside the text opens it. */
export function ExpandableTextControlledExample() {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <Stack gap={4}>
      <Button size="sm" variant="secondary" className="justify-self-start" onClick={() => setOpen(true)}>
        {t("Show the error", "أظهر الخطأ")}
      </Button>
      <ExpandableText
        open={open}
        onOpenChange={setOpen}
        text={t("Build failed: the step could not read the file because the path is longer than the limit of the file system.", "فشل البناء: تعذّرت على الخطوة قراءة الملف لأن المسار أطول من حد نظام الملفات.")}
        details={<Code>job 4f2a</Code>}
      />
    </Stack>
  );
}
