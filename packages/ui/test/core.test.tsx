import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { cn, isolate, LangSwitch, localize, MadeInKsa, MobileMenu, PercentProvider, SkipLink, STRINGS, useDir, useLang, useStrings } from "../src";

function Probe() {
  const s = useStrings();
  return (
    <p>
      {useLang()}|{useDir()}|{s.close}|{s.page(3, 9)}
    </p>
  );
}

describe("ui core", () => {
  test("the provider sets language, direction and built-in strings", () => {
    expect(renderToStaticMarkup(<PercentProvider lang="ar"><Probe /></PercentProvider>)).toContain("ar|rtl|إغلاق|صفحة 3 من 9");
    expect(renderToStaticMarkup(<PercentProvider lang="en"><Probe /></PercentProvider>)).toContain("en|ltr|Close|Page 3 of 9");
  });
  test("without a provider: English, left to right", () => {
    expect(renderToStaticMarkup(<Probe />)).toContain("en|ltr|Close");
  });
  test("a project can replace single strings", () => {
    const html = renderToStaticMarkup(<PercentProvider lang="en" strings={{ close: "Dismiss" }}><Probe /></PercentProvider>);
    expect(html).toContain("en|ltr|Dismiss|Page 3 of 9");
  });
  test("`text` renders the visible built-in strings (to scramble them, for example)", () => {
    const mark = (t: string) => <b>{t}</b>;
    const out = renderToStaticMarkup(
      <PercentProvider lang="en" text={mark}>
        <LangSwitch href="/ar" />
        <MobileMenu links={[]} />
        <MadeInKsa />
        <SkipLink />
      </PercentProvider>,
    );
    for (const t of ["العربية", "Menu", "Close", "Made in KSA", "Skip to content"]) expect(out).toContain(`<b>${t}</b>`);
  });
  test("every built-in string exists in both languages", () => {
    for (const key of Object.keys(STRINGS.en) as (keyof typeof STRINGS.en)[]) {
      expect([key, typeof STRINGS.ar[key]]).toEqual([key, typeof STRINGS.en[key]]);
      if (typeof STRINGS.ar[key] === "string") expect(STRINGS.ar[key]).not.toBe("");
    }
  });
  test("helpers: cn merges Tailwind conflicts, isolate keeps LTR runs whole, localize picks the language", () => {
    expect(cn("px-2 text-fg", false, "px-4")).toBe("text-fg px-4");
    expect(isolate("#4821")).toBe("⁦#4821⁩");
    expect(localize({ en: "Hello", ar: "مرحبا" }, "ar")).toBe("مرحبا");
  });
});
