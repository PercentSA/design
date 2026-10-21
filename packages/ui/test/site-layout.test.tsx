// SiteHeader position/width/no-links and SiteFooter width (0.4.1).
import { describe, expect, test } from "bun:test";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PercentProvider, SiteFooter, SiteHeader } from "../src";

const html = (node: ReactNode) => renderToStaticMarkup(<PercentProvider lang="en">{node}</PercentProvider>);
const LINKS = [{ href: "#work", label: "Work" }];
const XL = "px-[max(var(--p-gutter),calc((100%-1440px)/2+var(--p-gutter)))]";
const tag = (out: string, name: string) => out.match(new RegExp(`<${name}[^>]*>`))![0];

describe("SiteHeader", () => {
  test("default: fixed bar, full width (same as 0.4.0)", () => {
    const out = html(<SiteHeader homeHref="/" links={LINKS} actions={<a href="#c">Contact</a>} />);
    expect(tag(out, "header")).toContain('class="fixed inset-x-0 top-0');
    expect(out).toContain('class="grid h-16 grid-cols-[1fr_auto] items-center px-(--p-gutter) md:h-20 md:grid-cols-[1fr_auto_1fr]"');
    expect(out).toContain('class="hidden items-center gap-2.5 md:flex"');
    expect(out).toContain(">Menu</button>");
  });
  test("position sticky keeps the bar; static has no position or bar classes", () => {
    expect(tag(html(<SiteHeader homeHref="/" links={LINKS} position="sticky" />), "header")).toMatch(/class="sticky top-0 z-\(--p-z-header\) border-b/);
    const plain = tag(html(<SiteHeader homeHref="/" links={LINKS} position="static" />), "header");
    expect(plain).not.toContain("class=");
    expect(tag(html(<SiteHeader homeHref="/" links={LINKS} position="static" className="border-b border-line" />), "header")).toContain('class="border-b border-line"');
  });
  test("width xl caps the content with the side padding (one element, no wrapper)", () => {
    const row = tag(html(<SiteHeader homeHref="/" links={LINKS} width="xl" />), 'div class="grid h-16');
    expect(row).toContain(XL);
    expect(row).not.toContain(" px-(--p-gutter) ");
  });
  test("no links: no menu button, no empty nav, actions visible on phones", () => {
    const out = html(<SiteHeader homeHref="/" links={[]} actions={<a href="#t">Theme</a>} />);
    expect(out).not.toContain(">Menu</button>");
    expect(out).not.toContain("<nav");
    expect(out).toContain('<div class="flex items-center gap-2.5"><a href="#t">Theme</a></div>');
    expect(out).not.toContain("md:grid-cols-[1fr_auto_1fr]");
  });
});

describe("SiteFooter", () => {
  test("default: full width rows (same as 0.4.0)", () => {
    const out = html(<SiteFooter homeHref="/" links={LINKS} />);
    expect(out).toContain('class="flex flex-col gap-12 px-(--p-gutter) py-16 md:flex-row md:items-end md:justify-between"');
    expect(out).toContain('class="flex flex-wrap items-center justify-between gap-4 border-t border-line px-(--p-gutter) py-6 text-sm text-fg-3"');
  });
  test("width xl caps every row; the border stays on the full-width row", () => {
    const out = html(
      <SiteFooter homeHref="/" links={LINKS} width="xl">
        <p>News</p>
      </SiteFooter>,
    );
    expect(out.split(XL)).toHaveLength(4);
    expect(out).toContain(`class="flex flex-wrap items-center justify-between gap-4 border-t border-line py-6 text-sm text-fg-3 ${XL}"`);
  });
});
