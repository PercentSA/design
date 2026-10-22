// The app's own words replace the built-in texts (0.8.0): IbanInput placeholder, PhoneInput country names,
// Invoice labels in the second language.
import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { IbanInput, PercentProvider, PhoneInput, STRINGS } from "../src";
import { Invoice } from "../src/components/invoice";
import { mount, press, useDom } from "./dom";

useDom();
const noop = () => {};

describe("the app's words win", () => {
  test("IbanInput: the app's placeholder replaces the built-in one", () => {
    expect(renderToStaticMarkup(<IbanInput value="" onValueChange={noop} />)).toContain('placeholder="SA00 0000 0000 0000 0000 0000"');
    const out = renderToStaticMarkup(<IbanInput value="" onValueChange={noop} placeholder="SA.. (24)" />);
    expect(out).toContain('placeholder="SA.. (24)"');
    expect(out).not.toContain("SA00 0000");
  });

  test("PhoneInput: country names come from the strings; the defaults stay", async () => {
    const names = async (strings?: { countries: Partial<(typeof STRINGS)["en"]["countries"]> }, lang: "en" | "ar" = "en") => {
      const el = await mount(
        <PercentProvider lang={lang} strings={strings}>
          <PhoneInput value="" onValueChange={noop} country="SA" onCountryChange={noop} />
        </PercentProvider>,
      );
      await press(el.querySelector('[role="combobox"]')!, { key: "ArrowDown" });
      const out = [...document.querySelectorAll('[role="option"]')].map((o) => o.textContent);
      await press(document.querySelector('[role="option"]')!, { key: "Escape" });
      return out;
    };
    expect(await names()).toEqual(["Saudi Arabia (+966)", "UAE (+971)", "Qatar (+974)", "Kuwait (+965)", "Bahrain (+973)", "Oman (+968)"]);
    expect((await names(undefined, "ar"))[0]).toBe("السعودية (+966)");
    expect((await names({ countries: { SA: "KSA", AE: "United Arab Emirates" } })).slice(0, 3)).toEqual(["KSA (+966)", "United Arab Emirates (+971)", "Qatar (+974)"]);
  });

  test("Invoice: otherLanguageStrings replace the second-language labels", () => {
    const props = {
      type: "standard" as const,
      number: "INV-1",
      issueDate: "2026-02-18",
      seller: { name: "Percent", vatNumber: "300000000000003" },
      lines: [{ description: "Design", quantity: 1, unitPrice: 100 }],
    };
    const en = renderToStaticMarkup(<Invoice {...props} otherLanguageStrings={{ seller: "المورّد" }} />);
    expect(en).toContain("المورّد");
    expect(en).not.toContain(STRINGS.ar.invoice.seller);
    // The other labels keep the built-in words.
    expect(en).toContain(STRINGS.ar.invoice.vatNumber);
    const ar = renderToStaticMarkup(
      <PercentProvider lang="ar">
        <Invoice {...props} otherLanguageStrings={{ seller: "Supplier" }} />
      </PercentProvider>,
    );
    expect(ar).toContain("Supplier");
    expect(ar).not.toContain(">Seller<");
  });
});
