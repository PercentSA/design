import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { act, type ReactNode } from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { PercentProvider } from "../src";
import { Accordion } from "../src/components/accordion";
import { AppShell } from "../src/components/app-shell";
import { click, mount, useDom } from "./dom";

useDom();

const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");

describe("D2: Accordion keeps closed panels in the HTML", () => {
  const items = [
    { value: "a", title: "Pricing", content: "From 5,000" },
    { value: "b", title: "Timeline", content: "Six weeks" },
    { value: "c", title: "Support", content: "One year", disabled: true },
  ];
  const panels = (el: Element) => [...el.querySelectorAll<HTMLElement>('[role="region"]')];
  const triggers = (el: Element) => [...el.querySelectorAll<HTMLButtonElement>("h3 button")];
  const reveal = (panel: Element) => act(async () => void panel.dispatchEvent(new Event("beforematch", { bubbles: true })));
  // happy-dom has no find-in-page: say it has, as Chromium does.
  beforeAll(() => void Object.defineProperty(HTMLElement.prototype, "onbeforematch", { value: null, configurable: true, writable: true }));
  afterAll(() => void delete (HTMLElement.prototype as { onbeforematch?: unknown }).onbeforematch);

  test("server HTML: closed panels hold their content and are hidden; the open panel is not", () => {
    const box = document.createElement("div");
    box.innerHTML = renderToStaticMarkup(<Accordion items={items} defaultValue="b" />);
    const [a, b, c] = panels(box);
    expect(a?.textContent).toBe("From 5,000");
    expect(a?.hasAttribute("hidden")).toBe(true);
    expect(b?.textContent).toBe("Six weeks");
    expect(b?.hasAttribute("hidden")).toBe(false);
    expect(c?.textContent).toBe("One year");
    expect(c?.hasAttribute("hidden")).toBe(true);
  });

  test("in the browser, closed panels are hidden until found (find-in-page); a disabled one stays hidden", async () => {
    const el = await mount(<Accordion items={items} defaultValue="b" />);
    const [a, b, c] = panels(el);
    expect(a!.getAttribute("hidden")).toBe("until-found");
    expect(b!.hasAttribute("hidden")).toBe(false);
    expect(c!.getAttribute("hidden")).toBe("");
    await click(triggers(el)[0]!);
    expect(a!.hasAttribute("hidden")).toBe(false);
    expect(b!.getAttribute("hidden")).toBe("until-found");
    expect(b!.textContent).toBe("Six weeks");
  });

  test("a find-in-page match (beforematch) opens its item and reports the new value", async () => {
    let single = "";
    const el = await mount(<Accordion items={items} defaultValue="b" onValueChange={(v) => (single = v)} />);
    await reveal(panels(el)[0]!);
    expect(triggers(el)[0]!.getAttribute("aria-expanded")).toBe("true");
    expect(panels(el)[0]!.hasAttribute("hidden")).toBe(false);
    expect(panels(el)[1]!.getAttribute("hidden")).toBe("until-found");
    expect(single).toBe("a");

    let multiple: string[] = [];
    const el2 = await mount(<Accordion type="multiple" items={items} defaultValue={["b"]} onValueChange={(v) => (multiple = v)} />);
    await reveal(panels(el2)[0]!);
    expect(multiple).toEqual(["b", "a"]);
    expect(triggers(el2).map((t) => t.getAttribute("aria-expanded"))).toEqual(["true", "true", "false"]);
  });

  test("a controlled value stays in control", async () => {
    const el = await mount(<Accordion items={items} value="a" />);
    await click(triggers(el)[1]!);
    expect(triggers(el)[1]!.getAttribute("aria-expanded")).toBe("false");
    expect(panels(el)[1]!.getAttribute("hidden")).toBe("until-found");
  });

  test("the height animation needs no measured height (kept panels get none), and a closing panel stays painted", () => {
    expect(css).not.toContain("--radix-accordion-content-height");
    expect(css).toMatch(/@keyframes p-accordion-down \{\s*from \{\s*grid-template-rows: minmax\(0, 0fr\);/);
    expect(css).toMatch(/@keyframes p-accordion-up \{[^@]*content-visibility: visible;/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s*\.p-accordion\[data-state\] \{\s*animation: none;/);
  });
});

describe("D3: AppShell inside a page that has its own landmarks", () => {
  const shell = (props: { embedded?: boolean } = {}) =>
    renderToStaticMarkup(
      <AppShell {...props} sidebar={<p>Side</p>} header={<span>Acme</span>}>
        <h1>Page</h1>
      </AppShell>,
    );

  test("embedded: no <main>, no <header>, no skip link; the content and header still render", () => {
    const out = shell({ embedded: true });
    expect(out).not.toContain("<main");
    expect(out).not.toContain("<header");
    expect(out).not.toContain("#main");
    expect(out).toContain("Acme");
    expect(out).toContain("<h1>Page</h1>");
    expect(shell()).toContain("<main");
  });

  test("the docs example adds no <main> or <header> inside the docs page", async () => {
    // A path in a variable: the ui typecheck does not follow it into the docs app.
    const path = "../../../apps/docs/app/examples/app-shell.tsx";
    const { AppShellExample } = (await import(path)) as { AppShellExample: () => ReactNode };
    const out = renderToStaticMarkup(
      <PercentProvider lang="en">
        <AppShellExample />
      </PercentProvider>,
    );
    expect(out).toContain("Inbox");
    expect(out).not.toContain("<main");
    expect(out).not.toContain("<header");
  });
});
