import { describe, expect, test } from "bun:test";
import { useState, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Input, PercentProvider, Switch } from "../src";
import { FilterBar, type FilterDef, type FilterValue } from "../src/components/filter-bar";
import { SettingsRow, SettingsSection } from "../src/components/settings";
import { AuthLayout } from "../src/components/auth-layout";
import { click, mount, press, useDom } from "./dom";
import { logoLayout } from "@percentsa/tokens";

useDom();

const html = (node: ReactNode) => renderToStaticMarkup(node);
const logoBox = (v: "icon-en" | "icon-ar") => `viewBox="${logoLayout(v).viewBox.join(" ")}"`;
const ar = (node: ReactNode) => <PercentProvider lang="ar">{node}</PercentProvider>;

const FILTERS: FilterDef[] = [
  { key: "status", label: "Status", multiple: true, options: [{ value: "active", label: "Active" }, { value: "paused", label: "Paused" }] },
  { key: "owner", label: "Owner", options: [{ value: "sara", label: "Sara" }, { value: "omar", label: "Omar" }] },
];

let last: FilterValue | undefined;
function Harness({ initial = {}, filters = FILTERS }: { initial?: FilterValue; filters?: FilterDef[] }) {
  const [value, setValue] = useState(initial);
  return (
    <FilterBar
      filters={filters}
      value={value}
      onValueChange={(v) => {
        last = v;
        setValue(v);
      }}
    />
  );
}

const trigger = (name: string) => [...document.querySelectorAll<HTMLButtonElement>("button[aria-haspopup]")].find((b) => b.textContent!.startsWith(name))!;
const menu = () => document.querySelector('[role="menu"]');
const item = (label: string) => [...document.querySelectorAll('[role^="menuitem"]')].find((i) => i.textContent === label)!;
const tags = () => [...document.querySelectorAll('button[aria-label^="Remove"], button[aria-label^="إزالة"]')].map((b) => b.getAttribute("aria-label"));
const buttonByText = (text: string) => [...document.querySelectorAll("button")].find((b) => b.textContent === text);

describe("FilterBar", () => {
  test("multiple: checkbox items toggle, the menu stays open, the button counts", async () => {
    await mount(<Harness />);
    await press(trigger("Status"), { key: "Enter" });
    expect(item("Active").getAttribute("role")).toBe("menuitemcheckbox");
    await click(item("Active"));
    expect(last).toEqual({ status: ["active"] });
    expect(menu()).not.toBeNull();
    await click(item("Paused"));
    expect(last).toEqual({ status: ["active", "paused"] });
    expect(item("Paused").getAttribute("aria-checked")).toBe("true");
    await click(item("Active"));
    expect(last).toEqual({ status: ["paused"] });
    expect(trigger("Status").textContent).toContain("1 selected");
  });

  test("single: radio items replace the choice and close the menu", async () => {
    await mount(<Harness />);
    await press(trigger("Owner"), { key: "Enter" });
    expect(item("Sara").getAttribute("role")).toBe("menuitemradio");
    await click(item("Sara"));
    expect(last).toEqual({ owner: ["sara"] });
    expect(menu()).toBeNull();
    await press(trigger("Owner"), { key: "Enter" });
    await click(item("Omar"));
    expect(last).toEqual({ owner: ["omar"] });
  });

  test("active values are removable tags; Clear filters empties every filter", async () => {
    await mount(<Harness initial={{ status: ["active", "paused"], owner: ["sara"] }} />);
    expect(tags()).toEqual(["Remove Status: Active", "Remove Status: Paused", "Remove Owner: Sara"]);
    expect(trigger("Status").textContent).toContain("2 selected");
    await click(document.querySelector('[aria-label="Remove Status: Active"]')!);
    expect(last).toEqual({ status: ["paused"], owner: ["sara"] });
    // Focus goes to the filter button, not to the page, when the tag disappears.
    expect(document.activeElement).toBe(trigger("Status"));
    await click(buttonByText("Clear filters")!);
    expect(last).toEqual({ status: [], owner: [] });
    expect(tags()).toEqual([]);
    expect(buttonByText("Clear filters")).toBeUndefined();
  });

  test("nothing active: no tags, no count, no Clear filters", async () => {
    await mount(<Harness />);
    expect(tags()).toEqual([]);
    expect(buttonByText("Clear filters")).toBeUndefined();
    expect(trigger("Status").textContent).toBe("Status");
  });

  test("Arabic: group name, remove and clear strings", async () => {
    await mount(ar(<Harness filters={[{ key: "status", label: "الحالة", multiple: true, options: [{ value: "active", label: "نشط" }] }]} initial={{ status: ["active"] }} />));
    expect(document.querySelector('[role="group"]')!.getAttribute("aria-label")).toBe("عوامل التصفية");
    expect(tags()).toEqual(["إزالة الحالة: نشط"]);
    expect(buttonByText("مسح عوامل التصفية")).toBeDefined();
  });

  test("optional search input with its value and placeholder", () => {
    const out = html(<FilterBar filters={FILTERS} value={{}} onValueChange={() => {}} search={{ value: "masar", onValueChange: () => {}, placeholder: "Search projects" }} />);
    expect(out).toMatch(/type="search"[^>]*aria-label="Search"/);
    expect(out).toContain('value="masar"');
    expect(out).toContain('placeholder="Search projects"');
    expect(html(<FilterBar filters={FILTERS} value={{}} onValueChange={() => {}} />)).not.toContain('type="search"');
  });
});

describe("Settings", () => {
  test("SettingsRow with controlId: the label is for the control; the row is not a group (the name would be read twice)", () => {
    const out = html(<SettingsRow label="Display name" description="Shown on invoices" controlId="name" control={<Input id="name" />} />);
    expect(out).toMatch(/<label[^>]*for="name"[^>]*>Display name<\/label>/);
    expect(out).toContain('id="name"');
    expect(out).not.toContain('role="group"');
    // The description still reaches the control.
    const describedBy = out.match(/<input[^>]*aria-describedby="([^"]+)"/)?.[1];
    expect(describedBy).toBeTruthy();
    expect(out).toContain(`id="${describedBy}"`);
    expect(out).toMatch(new RegExp(`id="${describedBy}"[^>]*>Shown on invoices`));
  });

  test("SettingsRow without controlId: plain label text, the group carries the name; label left, control right from 768 px", () => {
    const out = html(ar(<SettingsRow label="الإشعارات" control={<Switch label="البريد" />} />));
    expect(out).not.toContain("<label for");
    expect(out).not.toContain("aria-describedby");
    const id = out.match(/role="group" aria-labelledby="([^"]+)"/)![1];
    expect(out).toMatch(new RegExp(`id="${id}"[^>]*>الإشعارات<`));
    expect(out).toContain("md:grid-cols-2");
  });

  test("SettingsSection: a labelled section with an h2, rows divided by lines, footer at the end", () => {
    const out = html(
      <SettingsSection title="Profile" description="How others see you" footer={<button>Save</button>}>
        <SettingsRow label="A" control="x" />
      </SettingsSection>,
    );
    const id = out.match(/<section aria-labelledby="([^"]+)"/)![1];
    expect(out).toMatch(new RegExp(`<h2 id="${id}" class="heading[^"]*">Profile</h2>`));
    expect(out).toContain("How others see you");
    expect(out).toContain("divide-y");
    expect(out).toMatch(/justify-end[^>]*><button>Save<\/button>/);
  });
});

describe("AuthLayout", () => {
  test("h1 title, default logo (icon + English), description, footer; aside hidden below 1024 px", () => {
    const out = html(
      <AuthLayout title="Sign in" description="Welcome back" footer={<a href="/up">Create an account</a>} aside={<p>Quote</p>}>
        <form>fields</form>
      </AuthLayout>,
    );
    expect(out).toMatch(/<h1 class="heading[^"]*">Sign in<\/h1>/);
    expect(out).toContain(logoBox("icon-en"));
    expect(out).toContain("Welcome back");
    expect(out).toContain("Create an account");
    expect(out).toMatch(/class="[^"]*\bhidden\b[^"]*@5xl:block[^"]*"[^>]*><p>Quote<\/p>/);
    expect(out).toContain("@5xl:grid-cols-2");
  });

  test("the default logo has the name Percent for screen readers, in the page language", () => {
    expect(html(<AuthLayout title="Sign in">x</AuthLayout>)).toContain('role="img" aria-label="Percent"');
    expect(html(ar(<AuthLayout title="تسجيل الدخول">x</AuthLayout>))).toContain('role="img" aria-label="برسنت"');
  });

  test("Arabic, custom brand, no aside: one column", () => {
    const out = html(ar(<AuthLayout brand={<span>شعار</span>} title="تسجيل الدخول">x</AuthLayout>));
    expect(out).toMatch(/<h1 class="heading[^"]*">تسجيل الدخول<\/h1>/);
    expect(out).toContain("شعار");
    expect(out).not.toContain(logoBox("icon-ar"));
    expect(out).not.toContain("@5xl:grid-cols-2");
    expect(out).not.toContain("@5xl:block");
  });
});
