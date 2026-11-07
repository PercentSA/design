import { describe, expect, test } from "bun:test";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PercentProvider, Sidebar, SideNav, type SideNavGroup, type SidebarSection } from "../src";
import { click, mount, useDom } from "./dom";

useDom();

const ar = (node: ReactNode) => <PercentProvider lang="ar">{node}</PercentProvider>;
const sections: SidebarSection[] = [{ items: [{ href: "/a", label: "Overview", icon: <svg /> }] }];

describe("Sidebar toggle label", () => {
  test("expanded: the words show beside the icon", async () => {
    const el = await mount(<Sidebar sections={sections} />);
    const toggle = el.querySelector("button[aria-expanded]")!;
    expect(toggle.textContent).toBe("Collapse sidebar");
    expect(toggle.getAttribute("aria-label")).toBe("Collapse sidebar");
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
  });

  test("collapsed: icon only, the words are the accessible name; the same button keeps its place when it toggles", async () => {
    const el = await mount(<Sidebar sections={sections} />);
    const toggle = el.querySelector("button[aria-expanded]")!;
    await click(toggle);
    const after = el.querySelector("button[aria-expanded]")!;
    expect(after).toBe(toggle);
    expect(after.textContent).toBe("");
    expect(after.getAttribute("aria-label")).toBe("Expand sidebar");
    expect(after.getAttribute("aria-expanded")).toBe("false");
  });

  test("Arabic words", async () => {
    const el = await mount(ar(<Sidebar sections={sections} />));
    const toggle = el.querySelector("button[aria-expanded]")!;
    expect(toggle.textContent).toBe("طي الشريط الجانبي");
    expect(toggle.querySelector("svg")!.getAttribute("class")).toContain("rtl:-scale-x-100");
    await click(toggle);
    expect(toggle.getAttribute("aria-label")).toBe("توسيع الشريط الجانبي");
  });

  test("an app overrides the words with provider strings", async () => {
    const el = await mount(
      <PercentProvider lang="en" strings={{ collapseSidebar: "Hide menu" }}>
        <Sidebar sections={sections} />
      </PercentProvider>,
    );
    expect(el.querySelector("button[aria-expanded]")!.textContent).toBe("Hide menu");
  });

  test("toggleLabel={false}: icon only, still named", async () => {
    const el = await mount(<Sidebar sections={sections} toggleLabel={false} />);
    const toggle = el.querySelector("button[aria-expanded]")!;
    expect(toggle.textContent).toBe("");
    expect(toggle.getAttribute("aria-label")).toBe("Collapse sidebar");
  });
});

const groups: SideNavGroup[] = [
  {
    label: "Account",
    items: [
      { href: "/profile", label: "Profile", icon: <svg data-icon /> },
      { href: "/keys", label: "Keys", icon: <svg data-icon />, badge: 2, current: true },
    ],
  },
  { items: [{ href: "/billing", label: "Billing" }, { href: "/x", label: <b>Node</b> }] },
];
const html = (node: ReactNode) => renderToStaticMarkup(node);

describe("SideNav iconOnly", () => {
  test("each link is named by its label, which is visually hidden", () => {
    const out = html(<SideNav groups={groups} label="Settings" iconOnly />);
    expect(out).toContain('<span class="sr-only">Profile</span>');
    expect(out).toContain('<span class="sr-only">Keys</span>');
    expect(out).not.toContain("break-words");
    expect(out).toContain("size-11");
    expect(out).toContain('<span aria-hidden="true" class="contents"><svg data-icon="true">');
  });

  test("group headings stay for screen readers", () => {
    const out = html(<SideNav groups={groups} label="Settings" iconOnly />);
    expect(out).toMatch(/<h2 [^>]*class="[^"]*sr-only[^"]*">Account<\/h2>/);
    expect(out).toMatch(/<ul aria-labelledby="/);
  });

  test("the current item keeps aria-current and the selected look", () => {
    const out = html(<SideNav groups={groups} label="Settings" iconOnly />);
    expect(out.match(/aria-current="page"/g)).toHaveLength(1);
    expect(out).toMatch(/<a href="\/keys" aria-current="page" class="[^"]*aria-\[current=page\]:bg-surface-2/);
  });

  test("a badge is a dot, its value stays for screen readers", () => {
    const out = html(<SideNav groups={groups} label="Settings" iconOnly />);
    expect(out).toContain('<span class="sr-only">2</span>');
    expect(out).toContain("size-1.5 rounded-pill bg-fg");
    expect(out.match(/size-1\.5/g)).toHaveLength(1);
  });

  test("no icon: the first letter of a text label; none for a node label", () => {
    const out = html(<SideNav groups={groups} label="Settings" iconOnly />);
    expect(out).toContain('<span aria-hidden="true" class="font-medium uppercase">B</span>');
    expect(out.match(/font-medium uppercase/g)).toHaveLength(1);
  });

  test("no icon, Arabic label: the article «ال» is skipped", () => {
    const out = html(<SideNav groups={[{ items: [{ href: "/a", label: "الإعدادات" }, { href: "/b", label: "باقة" }] }]} label="الإعدادات" iconOnly />);
    expect(out).toContain('class="font-medium uppercase">إ</span>');
    expect(out).toContain('class="font-medium uppercase">ب</span>');
  });

  test("RTL: renders all links; the dot sits at the end edge", async () => {
    const out = html(ar(<SideNav groups={groups} label="الإعدادات" iconOnly />));
    expect(out).toContain("end-2");
    const el = await mount(ar(<SideNav groups={groups} label="الإعدادات" iconOnly />));
    expect(el.querySelectorAll("a")).toHaveLength(4);
  });

  test("sticky works with it", () => {
    const out = html(<SideNav groups={groups} label="Settings" iconOnly sticky />);
    expect(out).toContain("sticky top-(--p-sticky-top,0px)");
  });

  test("no effect on variant list", () => {
    const plain = html(<SideNav groups={groups} label="Settings" variant="list" />);
    expect(html(<SideNav groups={groups} label="Settings" variant="list" iconOnly />)).toBe(plain);
  });

  test("without iconOnly the column is unchanged", () => {
    const out = html(<SideNav groups={groups} label="Settings" />);
    expect(out).toContain("break-words");
    expect(out).not.toContain("size-11");
    expect(out).not.toContain("sr-only");
  });
});
