import { describe, expect, test } from "bun:test";
import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PercentProvider, SideNav, type SideNavGroup } from "../src";

const groups: SideNavGroup[] = [
  {
    label: "Account",
    items: [
      { href: "/settings/profile", label: "Profile", description: "Name and photo", icon: <svg data-icon /> },
      { href: "/settings/security", label: "Security", description: "Password and sessions", current: true, badge: "2" },
    ],
  },
  { items: [{ href: "/settings/billing", label: "Billing", description: "Plan and invoices" }] },
];

const html = (node: React.ReactNode) => renderToStaticMarkup(node);
const ar = (node: React.ReactNode) => html(<PercentProvider lang="ar">{node}</PercentProvider>);

describe("SideNav", () => {
  test("a nav with a name, a heading per labelled group, links, and the current page marked", () => {
    const out = html(<SideNav groups={groups} label="Settings" />);
    expect(out).toMatch(/^<nav aria-label="Settings"/);
    expect(out.match(/<h2 /g)).toHaveLength(1);
    expect(out).toContain(">Account</h2>");
    expect(out.match(/<ul /g)).toHaveLength(2);
    expect(out).toMatch(/<ul aria-labelledby="([^"]+)"/);
    expect(out.match(/<a /g)).toHaveLength(3);
    expect(out.match(/aria-current="page"/g)).toHaveLength(1);
    expect(out).toMatch(/<a href="\/settings\/security" aria-current="page"/);
    expect(out).toContain(">2</");
  });

  test("links go through the provider's router link", () => {
    const Router = ({ href, ...p }: ComponentProps<"a">) => <a data-router href={href} {...p} />;
    const out = html(
      <PercentProvider lang="en" link={Router}>
        <SideNav groups={groups} label="Settings" />
      </PercentProvider>,
    );
    expect(out.match(/data-router/g)).toHaveLength(3);
  });

  test("column: no description, no chevron, labels wrap, icons are decoration", () => {
    const out = html(<SideNav groups={groups} label="Settings" />);
    expect(out).not.toContain("Name and photo");
    expect(out).not.toContain("lucide-chevron-right");
    expect(out).toContain("break-words");
    expect(out).not.toContain("truncate");
    expect(out).not.toContain("sticky");
  });

  test("sticky: under the header token, scrolls on its own", () => {
    const out = html(<SideNav groups={groups} label="Settings" sticky />);
    expect(out).toContain("sticky top-(--p-sticky-top,0px)");
    expect(out).toContain("overflow-y-auto");
  });

  test("list: each description under its label and a chevron at the end, mirrored in RTL", () => {
    const out = ar(<SideNav groups={groups} label="الإعدادات" variant="list" />);
    expect(out).toContain("Name and photo");
    expect(out).toContain("Plan and invoices");
    expect(out.match(/lucide-chevron-right/g)).toHaveLength(3);
    expect(out.match(/rtl:-scale-x-100/g)).toHaveLength(3);
    expect(out).toContain("min-h-14");
    expect(out).not.toContain("sticky");
  });

  test("an item icon is hidden from screen readers", () => {
    const out = html(<SideNav groups={groups} label="Settings" />);
    expect(out).toContain('<span aria-hidden="true" class="contents"><svg data-icon="true">');
  });
});

describe("SideNav scrollbar (0.17.1)", () => {
  test("a sticky column scrolls on its own with the scrollbar hidden; a plain one does not", () => {
    const sticky = html(<SideNav groups={groups} label="Settings" sticky />);
    expect(sticky).toMatch(/^<nav[^>]*class="[^"]*overflow-y-auto scrollbar-none/);
    expect(html(<SideNav groups={groups} label="Settings" />)).not.toContain("scrollbar-none");
  });

  test("styles.css defines the scrollbar-none utility", async () => {
    const css = await Bun.file(new URL("../styles.css", import.meta.url)).text();
    expect(css).toMatch(/@utility scrollbar-none \{\s*scrollbar-width: none;\s*&::-webkit-scrollbar \{\s*display: none;/);
  });
});
