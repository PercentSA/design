import { describe, expect, mock, test } from "bun:test";
import { act, useState, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PercentProvider } from "../src";
import { AppShell } from "../src/components/app-shell";
import { CommandPalette, useCommandShortcut, type Command } from "../src/components/command-palette";
import { Sidebar, useSidebarRail, type SidebarSection } from "../src/components/sidebar";
import { click, mount, press, useDom } from "./dom";

useDom();

const ar = (node: ReactNode) => <PercentProvider lang="ar">{node}</PercentProvider>;
const sections: SidebarSection[] = [
  {
    title: "Workspace",
    items: [
      { href: "/app", label: "Overview", icon: <svg /> },
      { href: "/app/inbox", label: "Inbox", icon: <svg />, badge: 3, current: true },
    ],
  },
  { items: [{ href: "/app/settings", label: "Settings", icon: <svg /> }] },
];

const type = (input: HTMLInputElement, value: string) =>
  act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });

describe("Sidebar", () => {
  test("nav label, section headings, current item, badge", async () => {
    const el = await mount(<Sidebar sections={sections} />);
    const nav = el.querySelector("nav")!;
    expect(nav.getAttribute("aria-label")).toBe("Menu");
    const heading = nav.querySelector("h2")!;
    expect(heading.textContent).toBe("Workspace");
    expect(nav.querySelector("ul")!.getAttribute("aria-labelledby")).toBe(heading.id);
    const current = nav.querySelectorAll('[aria-current="page"]');
    expect(current).toHaveLength(1);
    expect(current[0]!.getAttribute("href")).toBe("/app/inbox");
    expect(current[0]!.textContent).toContain("3");
    const ar1 = await mount(ar(<Sidebar sections={sections} />));
    expect(ar1.querySelector("nav")!.getAttribute("aria-label")).toBe("القائمة");
    const named = await mount(<Sidebar sections={sections} label="Admin" />);
    expect(named.querySelector("nav")!.getAttribute("aria-label")).toBe("Admin");
  });

  test("collapsed: labels visually hidden, toggle labelled with aria-expanded", async () => {
    const onCollapsedChange = mock();
    const el = await mount(<Sidebar sections={sections} collapsed onCollapsedChange={onCollapsedChange} />);
    const link = el.querySelector('a[href="/app"]')!;
    expect(link.querySelector(".sr-only")!.textContent).toBe("Overview");
    const toggle = el.querySelector("button[aria-expanded]")!;
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(toggle.getAttribute("aria-label")).toBe("Expand sidebar");
    await click(toggle);
    expect(onCollapsedChange).toHaveBeenCalledWith(false);
  });

  test("uncontrolled toggle collapses; Arabic labels", async () => {
    const el = await mount(ar(<Sidebar sections={sections} />));
    const toggle = el.querySelector("button[aria-expanded]")!;
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(toggle.getAttribute("aria-label")).toBe("طي الشريط الجانبي");
    expect(el.querySelector('a[href="/app"] .sr-only')).toBeNull();
    await click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(toggle.getAttribute("aria-label")).toBe("توسيع الشريط الجانبي");
    expect(el.querySelector('a[href="/app"] .sr-only')!.textContent).toBe("Overview");
  });
});

describe("CommandPalette", () => {
  const make = (log: string[]): Command[] => [
    { id: "new", label: "إنشاء فاتورة", group: "Invoices", shortcut: "Ctrl N", onSelect: () => log.push("new") },
    { id: "list", label: "All invoices", group: "Invoices", keywords: ["bills"], onSelect: () => log.push("list") },
    { id: "theme", label: "Dark theme", group: "Settings", onSelect: () => log.push("theme") },
  ];
  const input = () => document.querySelector<HTMLInputElement>('[role="combobox"]')!;
  const options = () => [...document.querySelectorAll('[role="option"]')].map((o) => o.textContent);
  const active = () => document.getElementById(input().getAttribute("aria-activedescendant")!)!.textContent;

  test("dialog, combobox wiring, groups, shortcut in Kbd", async () => {
    await mount(<CommandPalette open onOpenChange={() => {}} commands={make([])} />);
    const dialog = document.querySelector('[role="dialog"]')!;
    expect(document.getElementById(dialog.getAttribute("aria-labelledby")!)!.textContent).toBe("Command palette");
    const listbox = document.getElementById(input().getAttribute("aria-controls")!)!;
    expect(listbox.getAttribute("role")).toBe("listbox");
    expect(input().getAttribute("placeholder")).toBe("Type a command or search");
    const groups = [...listbox.querySelectorAll('[role="group"]')];
    expect(groups.map((g) => document.getElementById(g.getAttribute("aria-labelledby")!)!.textContent)).toEqual(["Invoices", "Settings"]);
    const kbd = listbox.querySelector("kbd")!;
    expect(kbd.textContent).toBe("Ctrl N");
    expect(kbd.getAttribute("dir")).toBe("ltr");
    expect(active()).toContain("إنشاء فاتورة");
  });

  test("filters with searchKey over label and keywords (Arabic letter forms)", async () => {
    await mount(ar(<CommandPalette open onOpenChange={() => {}} commands={make([])} />));
    expect(input().getAttribute("placeholder")).toBe("اكتب أمرًا أو ابحث");
    await type(input(), "انشاء فاتوره");
    expect(options()).toEqual(["إنشاء فاتورةCtrl N"]);
    await type(input(), "BILLS");
    expect(options()).toEqual(["All invoices"]);
    await type(input(), "zzz");
    expect(options()).toEqual([]);
    expect(document.querySelector('[role="status"]')!.textContent).toBe("لا توجد نتائج");
  });

  test("Up/Down wrap; Enter runs onSelect, then closes", async () => {
    const log: string[] = [];
    const onOpenChange = mock();
    await mount(<CommandPalette open onOpenChange={onOpenChange} commands={make(log)} />);
    await press(input(), { key: "ArrowUp" });
    expect(active()).toBe("Dark theme");
    await press(input(), { key: "ArrowDown" });
    expect(active()).toContain("إنشاء فاتورة");
    await press(input(), { key: "ArrowDown" });
    await press(input(), { key: "Enter" });
    expect(log).toEqual(["list"]);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  test("closing returns focus to where it was", async () => {
    function App() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>open</button>
          <CommandPalette open={open} onOpenChange={setOpen} commands={make([])} />
        </>
      );
    }
    const el = await mount(<App />);
    const button = el.querySelector("button")!;
    button.focus();
    await click(button);
    expect(document.activeElement).toBe(input());
    await press(input(), { key: "Escape" });
    // Radix moves focus on close in a timeout.
    await act(() => new Promise((r) => setTimeout(r, 0)));
    expect(document.activeElement).toBe(button);
  });

  test("Escape closes", async () => {
    const onOpenChange = mock();
    await mount(<CommandPalette open onOpenChange={onOpenChange} commands={make([])} />);
    await press(input(), { key: "Escape" });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe("useCommandShortcut", () => {
  function Probe({ onToggle }: { onToggle: () => void }) {
    useCommandShortcut(onToggle);
    return (
      <>
        <input id="field" />
        <input id="palette" data-command-palette="" />
      </>
    );
  }

  test("Ctrl+K and Meta+K call back; ignored in fields except the palette; Arabic layout", async () => {
    const fn = mock();
    const el = await mount(<Probe onToggle={fn} />);
    await press(document.body, { key: "k", ctrlKey: true });
    await press(document.body, { key: "K", metaKey: true });
    await press(document.body, { key: "ن", code: "KeyK", ctrlKey: true });
    expect(fn).toHaveBeenCalledTimes(3);
    await press(document.body, { key: "k" });
    await press(el.querySelector("#field")!, { key: "k", ctrlKey: true });
    expect(fn).toHaveBeenCalledTimes(3);
    await press(el.querySelector("#palette")!, { key: "k", ctrlKey: true });
    expect(fn).toHaveBeenCalledTimes(4);
  });

  test("toggles a palette", async () => {
    function App() {
      const [open, setOpen] = useState(false);
      useCommandShortcut(() => setOpen((o) => !o));
      return <CommandPalette open={open} onOpenChange={setOpen} commands={[]} />;
    }
    await mount(<App />);
    await press(document.body, { key: "k", ctrlKey: true });
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    await press(document.querySelector('[role="combobox"]')!, { key: "k", ctrlKey: true });
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });
});

describe("AppShell", () => {
  const shell = (props: { density?: "compact" | "comfortable" } = {}) => (
    <AppShell sidebar={<Sidebar sections={sections} />} header={<span>Acme</span>} {...props}>
      <h1>Page</h1>
    </AppShell>
  );

  test("server markup: skip link, main id, density, open-navigation button (EN, AR)", () => {
    const en = renderToStaticMarkup(shell());
    expect(en).toContain('data-density="compact"');
    expect(en).toMatch(/<a href="#main"[^>]*>Skip to content<\/a>/);
    expect(en).toMatch(/<main[^>]*id="main"/);
    expect(en).toContain('aria-label="Open navigation"');
    expect(en).toContain("<nav");
    const arabic = renderToStaticMarkup(ar(shell()));
    expect(arabic).toContain("انتقل إلى المحتوى");
    expect(arabic).toContain('aria-label="فتح التنقل"');
    expect(renderToStaticMarkup(shell({ density: "comfortable" }))).not.toContain("data-density");
  });

  test("the button opens the sidebar in a start sheet, expanded, without the toggle; a link closes it", async () => {
    const el = await mount(
      <AppShell sidebar={<Sidebar sections={sections} collapsed onCollapsedChange={() => {}} />}>
        <p>x</p>
      </AppShell>,
    );
    await click(el.querySelector('[aria-label="Open navigation"]')!);
    const sheet = document.querySelector('[role="dialog"]')!;
    expect(sheet.getAttribute("data-side")).toBe("start");
    expect(sheet.querySelector('a[href="/app"] .sr-only')).toBeNull();
    expect(sheet.querySelector("button[aria-expanded]")).toBeNull();
    await click(sheet.querySelector('a[href="/app"]')!);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  test("useSidebarRail: true in the collapsed rail, false in the phone sheet", async () => {
    function Part() {
      return <span data-rail={String(useSidebarRail())} />;
    }
    const el = await mount(
      <AppShell sidebar={<Sidebar sections={sections} collapsed onCollapsedChange={() => {}} header={<Part />} footer={<Part />} />}>
        <p>x</p>
      </AppShell>,
    );
    const rail = [...el.querySelectorAll("[data-rail]")].filter((x) => !x.closest('[role="dialog"]'));
    expect(rail.map((x) => x.getAttribute("data-rail"))).toEqual(["true", "true"]);
    await click(el.querySelector('[aria-label="Open navigation"]')!);
    const sheet = document.querySelector('[role="dialog"]')!;
    expect([...sheet.querySelectorAll("[data-rail]")].map((x) => x.getAttribute("data-rail"))).toEqual(["false", "false"]);
  });
});
