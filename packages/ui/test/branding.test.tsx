import { describe, expect, test } from "bun:test";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Alert, AuthLayout, Button, EmptyState, MobileMenu, PercentProvider, Progress, ProgressRing, SiteFooter, SiteHeader, Spinner, type BrandSlots } from "../src";

const links = [
  { href: "/work", label: "Work" },
  { href: "/contact", label: "Contact", current: true },
];

// The year changes every January; the snapshot must not.
const html = (node: ReactNode, lang: "en" | "ar" = "en") =>
  renderToStaticMarkup(<PercentProvider lang={lang}>{node}</PercentProvider>).replace(/© \d{4}/g, "© YEAR");

const parts = (lang: "en" | "ar") => ({
  header: html(<SiteHeader homeHref="/" links={links} actions={<a href="/c">Talk</a>} />, lang),
  menu: html(<MobileMenu links={links} footer={<a href="/c">Talk</a>} />, lang),
  footer: html(<SiteFooter homeHref="/" email="hi@example.com" links={links} legal={[{ href: "/privacy", label: "Privacy" }]} actions={<a href="/c">Talk</a>} copyright="Percent." />, lang),
  auth: html(<AuthLayout title="Sign in">form</AuthLayout>, lang),
  empty: html(<EmptyState title="Nothing" description="Empty." />, lang),
  spinner: html(<Spinner />, lang),
  spinnerDecorative: html(<Spinner decorative />, lang),
  buttonLoading: html(<Button loading>Save</Button>, lang),
});

describe("no brand: Percent's own logo and spinner", () => {
  test("English", () => expect(parts("en")).toMatchSnapshot());
  test("Arabic", () => expect(parts("ar")).toMatchSnapshot());
});

const MARK = 'd="M0 0H70.8';
const branded = (node: ReactNode, brand: BrandSlots, lang: "en" | "ar" = "en") =>
  renderToStaticMarkup(
    <PercentProvider lang={lang} brand={brand}>
      {node}
    </PercentProvider>,
  );
const dialogOf = (h: string) => h.slice(h.indexOf("<dialog"), h.indexOf("</dialog>"));
const slots = { mark: <i id="m" />, wordmark: <i id="w" /> };

describe("provider mark and wordmark", () => {
  test("every logo place uses the provider's slots", () => {
    const header = branded(<SiteHeader homeHref="/" links={links} />, slots);
    expect(header.slice(0, header.indexOf("<dialog"))).toContain('id="w"');
    expect(dialogOf(header)).toContain('id="m"');
    expect(dialogOf(branded(<MobileMenu links={links} />, slots))).toContain('id="m"');
    expect(branded(<SiteFooter homeHref="/" links={links} />, slots)).toContain('id="m"');
    expect(branded(<AuthLayout title="Sign in">form</AuthLayout>, slots)).toContain('id="w"');
    expect(branded(<EmptyState title="Nothing" />, slots)).toContain('id="m"');
    const all = [header, branded(<SiteFooter homeHref="/" links={links} />, slots), branded(<AuthLayout title="x">y</AuthLayout>, slots), branded(<EmptyState title="x" />, slots), branded(<Spinner />, slots)];
    for (const h of all) expect(h).not.toContain(MARK);
  });
  test("a brand with one logo uses it in both places, never Percent's", () => {
    expect(branded(<SiteHeader homeHref="/" links={links} />, { mark: <i id="m" /> })).not.toContain(MARK);
    expect(branded(<SiteFooter homeHref="/" links={links} />, { wordmark: <i id="w" /> })).toContain('id="w"');
  });
  test("header brand also in the phone menu", () => {
    expect(dialogOf(html(<SiteHeader homeHref="/" links={links} brand={<i id="h" />} />))).toContain('id="h"');
  });
});

describe("Spinner ring", () => {
  test("a brand without a spinner gets the ring, not the % mark", () => {
    const out = branded(<Spinner />, { mark: <i /> });
    expect(out).toContain("p-spinner-ring");
    expect(out).not.toContain(MARK);
    expect(out).toContain('role="status"');
    expect(out).toContain('<span class="sr-only">Loading</span>');
  });
  test("the brand's own spinner, hidden from screen readers; the label still speaks", () => {
    const out = branded(<Spinner />, { spinner: <i id="s" /> });
    expect(out).toMatch(/aria-hidden="true"[^>]*><i id="s">/);
    expect(out).toContain('role="status"');
    expect(out).toContain('<span class="sr-only">Loading</span>');
  });
  test("Button loading follows the brand", () => {
    expect(branded(<Button loading>Save</Button>, { mark: <i /> })).toContain("p-spinner-ring");
  });
});

describe("footer slots", () => {
  const groups = [
    { title: "Product", links: [{ href: "/a", label: "A" }] },
    { title: "Company", links: [{ href: "/b", label: "B" }, { href: "/c", label: "C" }] },
  ];
  test("groups, social, notice, badges, children, className, contact", () => {
    const out = html(
      <SiteFooter
        homeHref="/"
        email="hi@example.com"
        links={links}
        groups={groups}
        social={[{ href: "https://x.com/p", label: "X", icon: <svg /> }]}
        notice="Notice text"
        badges={null}
        className="extra"
        contact={<p id="contact">Call us</p>}
      >
        <form id="news" />
      </SiteFooter>,
    );
    expect(out.match(/<h2[^>]*>/g)).toHaveLength(2);
    expect(out.match(/<ul/g)!.length).toBeGreaterThanOrEqual(2);
    expect(out).toMatch(/<a href="https:\/\/x.com\/p" aria-label="X \(opens in a new tab\)" target="_blank" rel="noopener noreferrer"/);
    expect(out).toContain("Notice text");
    expect(out).not.toContain("©");
    expect(out).not.toContain("Made in KSA");
    expect(out).toMatch(/<footer class="[^"]*extra"/);
    expect(out).toContain('id="contact"');
    expect(out).not.toContain("mailto:");
    const news = out.indexOf('id="news"');
    expect(news).toBeGreaterThan(out.indexOf('id="contact"'));
    expect(news).toBeLessThan(out.indexOf("Notice text"));
  });
  test("Arabic, groups only, no badges: no empty nav, groups in source order, no flag", () => {
    const out = html(<SiteFooter homeHref="/" groups={groups} badges={null} />, "ar");
    // One "Site links" landmark that holds the columns (never an empty one).
    expect(out.match(/<nav /g)).toHaveLength(1);
    expect(out).toMatch(/<nav aria-label="روابط الموقع"[^>]*>[^]*<h2[^]*<\/nav>/);
    expect(out.indexOf("Product")).toBeLessThan(out.indexOf("Company"));
    expect(out).not.toContain("<img");
    expect(out).not.toContain("صُنع في السعودية");
  });
});

describe("status tones", () => {
  test("Alert success uses the success token", () => {
    const out = html(<Alert tone="success" title="Saved" />);
    expect(out).toContain("text-success");
    expect(out).not.toMatch(/<svg[^>]*text-fg[ "]/);
  });
  test("Progress fills with primary", () => {
    expect(html(<Progress value={40} />)).toContain("bg-primary");
    expect(html(<Progress value={40} />)).not.toContain("bg-fg ");
    expect(html(<ProgressRing value={40} />)).toContain("stroke-primary");
  });
});

test("a nested provider without brand keeps the outer brand (no % mark inside)", () => {
  const out = renderToStaticMarkup(
    <PercentProvider lang="en" brand={OUTER_BRAND}>
      <PercentProvider lang="ar">
        <SiteFooter homeHref="/" links={[]} social={[{ href: "https://x.example", label: "X", icon: <i /> }]} />
        <Spinner />
      </PercentProvider>
    </PercentProvider>,
  );
  expect(out).toContain('id="outer-mark"');
  expect(out).not.toContain('d="M0 0H70.8');
  expect(out).toContain('aria-label="X (يفتح في علامة تبويب جديدة)"');
});
const OUTER_BRAND = { mark: <i id="outer-mark" /> };

