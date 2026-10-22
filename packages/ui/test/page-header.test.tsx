import { describe, expect, test } from "bun:test";
import type { ComponentProps, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AppShell, Button, DropdownMenu, PageHeader, PercentProvider, type MenuItem } from "../src";
import { click, mount, press, useDom } from "./dom";

useDom();

const ar = (node: ReactNode) => <PercentProvider lang="ar">{node}</PercentProvider>;
const menu: MenuItem[] = [
  { label: "Delete", danger: true, onSelect: () => {} },
  { label: "Duplicate", onSelect: () => {} },
  { label: "Send", disabled: true, description: "Add a customer first" },
];

describe("PageHeader", () => {
  test("title is an h1; headingLevel 2 gives an h2", () => {
    expect(renderToStaticMarkup(<PageHeader title="Orders" />)).toMatch(/<h1[^>]*>Orders<\/h1>/);
    const two = renderToStaticMarkup(<PageHeader title="Orders" headingLevel={2} />);
    expect(two).toMatch(/<h2[^>]*>Orders<\/h2>/);
    expect(two).not.toContain("<h1");
  });

  test("badges sit beside the title, meta under it", async () => {
    const el = await mount(<PageHeader title="INV-1042" badges={<span data-badge="">Paid</span>} meta={<span data-meta="">Due 30 September</span>} />);
    const h1 = el.querySelector("h1")!;
    const badge = el.querySelector("[data-badge]")!;
    const meta = el.querySelector("[data-meta]")!;
    expect(h1.parentElement!.contains(badge)).toBe(true);
    expect(h1.parentElement!.contains(meta)).toBe(false);
    expect(h1.compareDocumentPosition(meta) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test("back link uses the provider link; the arrow mirrors in RTL", () => {
    const Link = ({ href, ...rest }: ComponentProps<"a">) => <a data-router="" href={href} {...rest} />;
    const html = renderToStaticMarkup(
      <PercentProvider lang="ar" link={Link}>
        <PageHeader title="INV-1042" back={{ href: "/ar/invoices", label: "الفواتير" }} />
      </PercentProvider>,
    );
    expect(html).toMatch(/<a data-router="" href="\/ar\/invoices"[^>]*>.*الفواتير<\/a>/);
    expect(html).toMatch(/<svg[^>]*class="[^"]*rtl:-scale-x-100/);
    expect(html.indexOf("/ar/invoices")).toBeLessThan(html.indexOf("<h1"));
  });

  test("secondary renders once and stays mounted on phones", async () => {
    const el = await mount(<PageHeader title="Orders" primary={<Button>New order</Button>} secondary={<Button data-secondary="">Export</Button>} />);
    expect(el.querySelectorAll("[data-secondary]")).toHaveLength(1);
    const panel = el.querySelector("[data-secondary]")!.parentElement!;
    expect(panel.className.split(" ")).toContain("hidden");
    expect(panel.className).toContain("md:flex");
    const toggle = el.querySelector("button[aria-expanded]")!;
    expect(toggle.getAttribute("aria-controls")).toBe(panel.id);
  });

  test("action order from 768 px is the page order: primary, secondary, ⋯", async () => {
    const el = await mount(<PageHeader title="Orders" primary={<Button data-primary="">New order</Button>} secondary={<Button data-secondary="">Export</Button>} menu={menu} />);
    const primary = el.querySelector("[data-primary]")!;
    const secondary = el.querySelector("[data-secondary]")!;
    const more = el.querySelector('button[aria-label="More actions"]')!;
    expect(primary.compareDocumentPosition(secondary) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(secondary.compareDocumentPosition(more) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // CSS must not move them: the visual order is the focus order (WCAG 2.4.3).
    const actions = primary.parentElement!.parentElement!;
    expect(actions.outerHTML).not.toMatch(/\border-/);
  });

  test("More actions toggles aria-expanded and lists menu items with descriptions", async () => {
    const el = await mount(<PageHeader title="INV-1042" primary={<Button>Record payment</Button>} menu={menu} />);
    const toggle = el.querySelector("button[aria-expanded]")!;
    expect(toggle.textContent).toBe("More actions");
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    await click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    const panel = el.querySelector(`#${CSS.escape(toggle.getAttribute("aria-controls")!)}`)!;
    expect(panel.className.split(" ")).not.toContain("hidden");
    const send = [...panel.querySelectorAll("button")].find((b) => b.textContent!.startsWith("Send"))!;
    expect(send.disabled).toBe(true);
    expect(el.querySelector(`#${CSS.escape(send.getAttribute("aria-describedby")!)}`)!.textContent).toBe("Add a customer first");
    await click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  test("danger menu items go last after a separator", async () => {
    const el = await mount(<PageHeader title="INV-1042" menu={menu} />);
    await click(el.querySelector("button[aria-expanded]")!);
    const panel = el.querySelector(`#${CSS.escape(el.querySelector("button[aria-expanded]")!.getAttribute("aria-controls")!)}`)!;
    const parts = [...panel.querySelectorAll("button, hr")].map((n) => (n.tagName === "HR" ? "—" : n.textContent!.replace("Add a customer first", "")));
    expect(parts).toEqual(["Duplicate", "Send", "—", "Delete"]);
    // The "⋯" dropdown uses the same order.
    await press(el.querySelector('button[aria-label="More actions"]')!, { key: "Enter" });
    const menuEl = document.querySelector('[role="menu"]')!;
    const items = [...menuEl.querySelectorAll('[role="menuitem"], [role="separator"]')].map((n) => (n.getAttribute("role") === "separator" ? "—" : n.textContent!.replace("Add a customer first", "")));
    expect(items).toEqual(["Duplicate", "Send", "—", "Delete"]);
  });

  test("Arabic: the menu button is named إجراءات أخرى", () => {
    const html = renderToStaticMarkup(ar(<PageHeader title="الطلبات" menu={menu} />));
    expect(html).toContain('aria-label="إجراءات أخرى"');
    expect(html).toContain(">إجراءات أخرى<");
  });
});

describe("menu item descriptions", () => {
  test("DropdownMenu: an item description is linked to the item", async () => {
    await mount(<DropdownMenu defaultOpen trigger={<button>menu</button>} items={menu} />);
    const send = [...document.querySelectorAll('[role="menuitem"]')].find((n) => n.textContent!.startsWith("Send"))!;
    const id = send.getAttribute("aria-describedby")!;
    expect(document.getElementById(id)!.textContent).toBe("Add a customer first");
    const plain = [...document.querySelectorAll('[role="menuitem"]')].find((n) => n.textContent === "Duplicate")!;
    expect(plain.hasAttribute("aria-describedby")).toBe(false);
  });
});

describe("AppShell sticky offset", () => {
  test("AppShell sets the sticky offset", () => {
    const withHeader = renderToStaticMarkup(
      <AppShell sidebar={<p>Side</p>} header={<span>Acme</span>}>
        <p>x</p>
      </AppShell>,
    );
    expect(withHeader).toContain("[--p-sticky-top:3.5rem]");
    expect(withHeader).not.toContain("lg:[--p-sticky-top:0px]");
    const without = renderToStaticMarkup(
      <AppShell sidebar={<p>Side</p>}>
        <p>x</p>
      </AppShell>,
    );
    expect(without).toContain("lg:[--p-sticky-top:0px]");
  });
});
