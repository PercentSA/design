import { describe, expect, test } from "bun:test";
import { act } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Button, Dialog, PercentProvider, RecordSummary, SettingsSection } from "../src";
import { mount, useDom } from "./dom";

useDom();

const wrap = (node: React.ReactNode) => <PercentProvider lang="en">{node}</PercentProvider>;

describe("RecordSummary status", () => {
  test("a status item shows a dot and the word at value size", () => {
    const html = renderToStaticMarkup(wrap(<RecordSummary items={[{ id: "a", label: "Site", status: { tone: "danger", label: "Down" } }]} />));
    expect(html).toContain("bg-danger");
    expect(html).toContain("Down");
    expect(html).toContain("text-lg");
  });
  test("status wins over value", () => {
    const html = renderToStaticMarkup(wrap(<RecordSummary items={[{ id: "a", label: "Site", value: "Hidden", status: { tone: "live", label: "Up" } }]} />));
    expect(html).toContain("Up");
    expect(html).not.toContain("Hidden");
  });
  test("a status item with href is a link", () => {
    const html = renderToStaticMarkup(wrap(<RecordSummary items={[{ id: "a", label: "Site", href: "/s", status: { tone: "live", label: "Up" } }]} />));
    expect(html).toMatch(/<a [^>]*href="\/s"[^>]*class="[^"]*underline[^"]*"[^>]*>Up<\/a>/);
  });
  test("an item without status renders as before", () => {
    const html = renderToStaticMarkup(wrap(<RecordSummary items={[{ id: "a", label: "Total", value: "12" }, { id: "b", label: "Note" }]} />));
    expect(html).toContain("12");
    expect(html).toContain("Not set");
    expect(html).not.toContain("bg-live");
  });
});

describe("SettingsSection action", () => {
  test("action sits at the end of the heading row", () => {
    const html = renderToStaticMarkup(wrap(<SettingsSection title="Limits" action={<button>Edit</button>}>x</SettingsSection>));
    expect(html).toContain("flex-wrap");
    expect(html.indexOf("Limits")).toBeLessThan(html.indexOf("Edit"));
  });
  test("without action the section renders as before", () => {
    const html = renderToStaticMarkup(wrap(<SettingsSection title="Limits">x</SettingsSection>));
    expect(html).not.toContain("flex-wrap");
    expect(html).toContain('<div class="grid gap-1.5">');
  });
});

describe("Button blocked", () => {
  test("a blocked button is focusable, refuses the press and names its reason", async () => {
    let pressed = 0;
    const el = await mount(wrap(<Button blocked="A backup runs now." onClick={() => pressed++}>Back up now</Button>));
    const b = el.querySelector("button")!;
    expect(b.getAttribute("aria-disabled")).toBe("true");
    expect(b.hasAttribute("disabled")).toBe(false);
    expect(b.className).toContain("cursor-not-allowed");
    expect(b.className).toContain("opacity-50");
    const reason = document.getElementById(b.getAttribute("aria-describedby")!.split(" ")[0]!)!;
    expect(reason.hidden).toBe(true);
    // The name skips hidden content: the reason must not be part of it.
    const name = b.cloneNode(true) as HTMLElement;
    name.querySelectorAll("[hidden]").forEach((n) => n.remove());
    expect(name.textContent).toBe("Back up now");
    expect(reason.textContent).toBe("A backup runs now.");
    await act(async () => b.click());
    expect(pressed).toBe(0);
  });
  test("a press on a blocked button opens the reason", async () => {
    const el = await mount(wrap(<Button blocked="A backup runs now.">Back up now</Button>));
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
    await act(async () => el.querySelector("button")!.click());
    expect(document.querySelector('[role="tooltip"]')?.textContent).toBe("A backup runs now.");
  });
  test("a button without blocked renders as before", async () => {
    let pressed = 0;
    const el = await mount(wrap(<Button onClick={() => pressed++}>Save</Button>));
    const b = el.querySelector("button")!;
    expect(b.hasAttribute("aria-disabled")).toBe(false);
    expect(b.hasAttribute("aria-describedby")).toBe(false);
    expect(b.className).not.toContain("cursor-not-allowed");
    await act(async () => b.click());
    expect(pressed).toBe(1);
  });
});

describe("overlay classes", () => {
  test("overlays use the shared classes", async () => {
    await mount(wrap(<Dialog open title="T">x</Dialog>));
    const c = document.querySelector('[role="dialog"]')!;
    expect(c.className).toContain("shadow-overlay");
    expect(c.className).toContain("bg-surface-2");
  });
});
