import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import {
  AspectRatio,
  Bleed,
  Blockquote,
  Code,
  Container,
  Display,
  formatNumber,
  Grid,
  Heading,
  Highlight,
  Inline,
  Kbd,
  Label,
  LiveRegion,
  Link,
  MadeInKsa,
  Mark,
  FormattedNumber,
  PercentProvider,
  Prose,
  ScrollArea,
  Section,
  Separator,
  SiteHeader,
  Split,
  Stack,
  Surface,
  Text,
  VisuallyHidden,
} from "../src";
import { logoLayout } from "@percentsa/tokens";

const html = (node: React.ReactNode) => renderToStaticMarkup(node);
const ar = (node: React.ReactNode) => html(<PercentProvider lang="ar">{node}</PercentProvider>);

describe("brand", () => {
  test("Mark is the flat % path, decorative unless labelled", () => {
    expect(html(<Mark />)).toContain('d="M0 0H92V92H0Z M200 200H292V292H200Z M198.141 0H288.526L93.859 292H3.474Z"');
    expect(html(<Mark />)).toContain('aria-hidden="true"');
    expect(html(<Mark label="Percent" />)).toContain('aria-label="Percent"');
  });
  test("SiteHeader without a brand shows icon + English on English pages and icon + Arabic on Arabic pages", () => {
    const box = (v: "icon-en" | "icon-ar") => `viewBox="${logoLayout(v).viewBox.join(" ")}"`;
    expect(html(<SiteHeader homeHref="/" links={[]} />)).toContain(box("icon-en"));
    expect(ar(<SiteHeader homeHref="/" links={[]} />)).toContain(box("icon-ar"));
  });
  test("MadeInKsa speaks the page language", () => {
    expect(html(<MadeInKsa />)).toContain("Made in KSA");
    expect(ar(<MadeInKsa />)).toContain("صُنع في السعودية");
  });
});

describe("text", () => {
  test("Display and Heading pick their element and use the type classes", () => {
    expect(html(<Display>Hi</Display>)).toMatch(/^<h1 class="display /);
    expect(html(<Display as="h2" size="md">Hi</Display>)).toMatch(/^<h2 /);
    expect(html(<Heading level={3}>Hi</Heading>)).toMatch(/^<h3 class="heading /);
  });
  test("Text tones map to the text tokens", () => {
    expect(html(<Text tone="muted">x</Text>)).toContain("text-fg-2");
    expect(html(<Text as="span" size="sm" tone="subtle">x</Text>)).toMatch(/^<span class="[^"]*text-fg-3/);
  });
  test("Label, Code, Kbd, Highlight, Blockquote", () => {
    expect(html(<Label>Services</Label>)).toBe('<span class="label">Services</span>');
    expect(html(<Code>bun test</Code>)).toContain('<code dir="ltr"');
    expect(html(<Kbd>⌘K</Kbd>)).toContain('<kbd dir="ltr"');
    expect(html(<Highlight>key</Highlight>)).toContain("<mark");
    expect(html(<Blockquote cite="Owner">Fast.</Blockquote>)).toContain("<figcaption");
  });
  test("an external Link opens a new tab safely and marks it for screen readers", () => {
    const out = html(<Link href="https://x.sa" external>Site</Link>);
    expect(out).toContain('target="_blank"');
    expect(out).toContain('rel="noopener noreferrer"');
    expect(out).toContain("rtl:-scale-x-100");
  });
  test("Link asChild styles a router link without a wrapper", () => {
    const out = html(<Link asChild><a href="/en">Home</a></Link>);
    expect(out).toMatch(/^<a [^>]*class="[^"]*underline/);
    expect(out).toContain('href="/en"');
    expect(out).toEndWith(">Home</a>");
  });
  test("FormattedNumber and formatNumber: Western digits in both languages, LTR", () => {
    expect(formatNumber(1250000, "ar", { notation: "compact" })).toMatch(/^1\.3\sمليون$/);
    expect(formatNumber(0.5, "en", { style: "percent" })).toBe("50%");
    expect(ar(<FormattedNumber value={1250} />)).toContain('dir="ltr"');
    expect(ar(<FormattedNumber value={1250} />)).toContain(">1,250<");
  });
  test("Prose styles rich text through one class", () => {
    expect(html(<Prose><p>x</p></Prose>)).toContain('class="p-prose');
  });
  test("styles.css keeps the Arabic rules for display, heading and label", () => {
    const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
    for (const sel of ['html[lang="ar"] .display', 'html[lang="ar"] .heading', 'html[lang="ar"] .label'])
      expect(css).toContain(sel);
  });
});

describe("layout", () => {
  test("Container uses the page gutter; Section is a section", () => {
    expect(html(<Container>x</Container>)).toContain("px-(--p-gutter)");
    expect(html(<Section id="work">x</Section>)).toMatch(/^<section [^>]*id="work"/);
  });
  test("Stack, Inline, Grid, Split use static classes Tailwind can find", () => {
    expect(html(<Stack gap={6}>x</Stack>)).toContain("flex-col gap-6");
    expect(html(<Inline gap={2} justify="between">x</Inline>)).toContain("justify-between");
    expect(html(<Grid cols={3}>x</Grid>)).toContain("md:grid-cols-3");
    expect(html(<Grid min="18rem">x</Grid>)).toContain("--min:18rem");
    expect(html(<Split ratio="1:2"><div /><div /></Split>)).toContain("md:grid-cols-[1fr_2fr]");
  });
  test("Surface, Bleed, Separator, AspectRatio, ScrollArea render", () => {
    expect(html(<Surface>x</Surface>)).toContain("rounded-card");
    expect(html(<Bleed>x</Bleed>)).toContain("-mx-(--p-gutter)");
    expect(html(<Separator />)).toContain("bg-line");
    expect(html(<AspectRatio ratio={16 / 9}>x</AspectRatio>)).toContain("padding-bottom:56.25%");
    expect(html(<ScrollArea className="h-40">x</ScrollArea>)).toContain("h-40");
  });
});

describe("utilities", () => {
  test("VisuallyHidden keeps text for screen readers; LiveRegion announces", () => {
    expect(html(<VisuallyHidden>Hidden</VisuallyHidden>)).toContain(">Hidden<");
    expect(html(<LiveRegion>Saved</LiveRegion>)).toContain('role="status"');
    expect(html(<LiveRegion assertive>Failed</LiveRegion>)).toContain('role="alert"');
  });
});
