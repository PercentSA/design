import { describe, expect, test } from "bun:test";
import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Breadcrumbs,
  LangSwitch,
  MobileMenu,
  Pagination,
  paginationRange,
  PercentProvider,
  SiteFooter,
  SiteHeader,
  SkipLink,
  Steps,
  Tabs,
} from "../src";

const html = (node: React.ReactNode) => renderToStaticMarkup(node);
const ar = (node: React.ReactNode) => html(<PercentProvider lang="ar">{node}</PercentProvider>);
const links = [
  { href: "/en#work", label: "Work" },
  { href: "/en#services", label: "Services", current: true },
];

describe("pagination", () => {
  test.each([
    [1, 1, [1]],
    [3, 5, [1, 2, 3, 4, 5]],
    [1, 10, [1, 2, 3, 4, 5, "gap", 10]],
    [5, 10, [1, "gap", 4, 5, 6, "gap", 10]],
    [9, 10, [1, "gap", 6, 7, 8, 9, 10]],
    [4, 10, [1, 2, 3, 4, 5, "gap", 10]],
    [6, 10, [1, "gap", 5, 6, 7, "gap", 10]],
  ] as const)("page %i of %i", (page, total, range) => {
    expect(paginationRange(page, total)).toEqual([...range]);
  });
  test("links work without JavaScript; the current page is marked; chevrons mirror in RTL", () => {
    const out = ar(<Pagination page={1} total={3} href={(n) => `/ar/blog?page=${n}`} />);
    expect(out).toContain('aria-label="التنقل بين الصفحات"');
    expect(out).toMatch(/aria-current="page"[^>]*>1</);
    expect(out).toContain('href="/ar/blog?page=2"');
    expect(out).toContain('aria-disabled="true"');
    expect(out.match(/rtl:-scale-x-100/g)).toHaveLength(2);
  });
});

describe("trails", () => {
  test("Breadcrumbs: the last item is the current page, separators are hidden", () => {
    const out = html(<Breadcrumbs items={[{ href: "/en", label: "Home" }, { href: "/en/work", label: "Work" }, { label: "Masar" }]} />);
    expect(out).toContain('aria-label="Breadcrumb"');
    expect(out).toMatch(/aria-current="page"[^>]*>Masar</);
    expect(out.match(/<a /g)).toHaveLength(2);
    expect(out).toContain("rtl:-scale-x-100");
  });
  test("Steps mark the current step and say where the reader is", () => {
    const out = html(<Steps current={1} items={[{ label: "Details" }, { label: "Payment" }, { label: "Done" }]} />);
    expect(out).toMatch(/aria-current="step"[^>]*>[\s\S]*Payment/);
    expect(out).toContain("Step 2 of 3");
  });
  test("Tabs are a tablist", () => {
    const out = html(<Tabs defaultValue="a" items={[{ value: "a", label: "Overview", content: "A" }, { value: "b", label: "Specs", content: "B" }]} />);
    expect(out).toContain('role="tablist"');
    expect(out).toMatch(/role="tab"[^>]*aria-selected="true"/);
  });
  test("Tabs: no tab reaches below the scrollable list (Chrome showed a scroll bar under the tabs)", () => {
    const out = html(<Tabs defaultValue="a" items={[{ value: "a", label: "Overview", content: "A" }]} />);
    expect(out).toMatch(/role="tablist"[^>]*overflow-x-auto/);
    expect(out).not.toContain("-mb-px");
  });
});

describe("site chrome", () => {
  const RouterLink = ({ href, ...p }: ComponentProps<"a">) => <a data-router="" href={href} {...p} />;
  test("SiteHeader: skip link, current section, router links from the provider", () => {
    const out = html(
      <PercentProvider lang="en" link={RouterLink}>
        <SiteHeader homeHref="/en" links={links} />
      </PercentProvider>,
    );
    expect(out).toContain('href="#main"');
    expect(out).toMatch(/aria-current="page"[^>]*>Services</);
    expect(out).toContain("data-router");
    expect(out).toContain('aria-label="Home"');
  });
  test("SiteHeader: the phone menu shows `menuFooter` (its own order) instead of the header actions", () => {
    const out = html(<SiteHeader homeHref="/en" links={links} actions={<i>header-actions</i>} menuFooter={<i>menu-actions</i>} />);
    expect(out).toMatch(/class="hidden items-center gap-2.5 md:flex"><i>header-actions<\/i>/);
    expect(out).toMatch(/p-menu-foot[^"]*"><i>menu-actions<\/i>/);
    expect(out).not.toMatch(/p-menu-foot[^"]*"><i>header-actions/);
  });
  test("MobileMenu is a native dialog with a labelled trigger", () => {
    const out = ar(<MobileMenu links={links} />);
    expect(out).toContain("<dialog");
    expect(out).toContain('aria-label="القائمة"');
    expect(out).toContain('aria-haspopup="dialog"');
  });
  test("LangSwitch names the other language in that language", () => {
    const out = html(<LangSwitch href="/ar" />);
    expect(out).toContain(">العربية<");
    expect(out).toContain('lang="ar"');
    expect(out).toContain('hrefLang="ar"');
    expect(ar(<LangSwitch href="/en" />)).toContain('lang="en"');
  });
  test("SiteFooter and SkipLink render in Arabic", () => {
    const out = ar(<SiteFooter homeHref="/ar" email="contact@percent.sa" links={links} legal={[{ href: "/ar/privacy", label: "الخصوصية" }]} />);
    expect(out).toContain("mailto:contact@percent.sa");
    expect(out).toContain("صُنع في السعودية");
    expect(ar(<SkipLink />)).toContain("انتقل إلى المحتوى");
  });
});
