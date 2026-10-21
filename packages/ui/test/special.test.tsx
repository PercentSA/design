import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  acceptsFile,
  Combobox,
  CrInput,
  Field,
  FileDrop,
  formatFileSize,
  IbanInput,
  MoneyInput,
  NationalAddress,
  NationalIdInput,
  normalizeAmount,
  normalizeDigits,
  normalizeIban,
  normalizeSignedAmount,
  stepNumber,
  NumberInput,
  OtpInput,
  parseAmount,
  PasswordInput,
  PercentProvider,
  PhoneInput,
  phoneIssueMessage,
  getPhoneCountry,
  getPhoneIssue,
  saudiError,
  searchKey,
  SearchInput,
  STRINGS,
  VatInput,
} from "../src";

const html = (node: React.ReactNode) => renderToStaticMarkup(node);
const ar = (node: React.ReactNode) => html(<PercentProvider lang="ar">{node}</PercentProvider>);
const noop = () => {};

describe("normalizers: what people type becomes Western digits", () => {
  test("digits fields keep digits only, up to the length", () => {
    expect(normalizeDigits("١٢٣٤ab56", 4)).toBe("1234");
    expect(normalizeDigits("۱۰۱۰ 123 456", 10)).toBe("1010123456");
  });
  test("amounts: Arabic separators, grouping removed, two decimals at most", () => {
    expect(normalizeAmount("١٬٢٥٠٫٥٠٧")).toBe("1250.50");
    expect(normalizeAmount("1,250.5.5")).toBe("1250.55");
    expect(normalizeAmount("abc")).toBe("");
    expect(parseAmount("1250.5")).toBe(1250.5);
    expect(parseAmount("")).toBeNull();
    expect(parseAmount(".")).toBeNull();
  });
  test("IBAN: upper case, no spaces, 24 characters at most", () => {
    expect(normalizeIban("sa03 8000 ٠٠٠٠ 6080 1016 7519 99")).toBe("SA0380000000608010167519");
  });
  test("search ignores Arabic letter forms and accents", () => {
    expect(searchKey("إبراهيم")).toBe(searchKey("ابراهيم"));
    expect(searchKey("مكة المكرمة")).toBe(searchKey("مكه المكرمه"));
    expect(searchKey("Café")).toBe("cafe");
  });
  test("files: size text and accept rules", () => {
    expect(formatFileSize(1_240_000)).toBe("1.2 MB");
    expect(formatFileSize(900)).toBe("900 B");
    const pdf = new File(["x"], "Offer.PDF", { type: "application/pdf" });
    expect(acceptsFile(pdf, ".pdf")).toBe(true);
    expect(acceptsFile(pdf, "image/*")).toBe(false);
    expect(acceptsFile(pdf, "image/*, application/pdf")).toBe(true);
    expect(acceptsFile(pdf)).toBe(true);
  });
});

describe("validation messages", () => {
  test("saudiError gives the message in the language, null when valid or empty", () => {
    expect(saudiError("iban", "SA00", "en")).toBe(STRINGS.en.errors.iban);
    expect(saudiError("iban", "SA00", "ar")).toBe(STRINGS.ar.errors.iban);
    expect(saudiError("iban", "SA0380000000608010167519", "en")).toBeNull();
    expect(saudiError("nationalId", "", "en")).toBeNull();
    expect(saudiError("vat", "300000000000003", "en")).toBeNull();
    expect(saudiError("postalCode", "123", "ar")).toBe(STRINGS.ar.errors.postalCode);
  });
  test("phone issues explain what to fix", () => {
    const sa = getPhoneCountry("SA");
    expect(phoneIssueMessage(getPhoneIssue("5012", sa)!, "en")).toBe("Enter 9 digits.");
    expect(phoneIssueMessage(getPhoneIssue("901234567", sa)!, "en")).toBe("The number starts with 5 or 1.");
    expect(phoneIssueMessage(getPhoneIssue("50a", sa)!, "ar")).toBe(STRINGS.ar.errors.phoneDigits);
  });
});

describe("special inputs render", () => {
  test("PasswordInput has a labelled show button", () => {
    const out = html(<PasswordInput />);
    expect(out).toContain('type="password"');
    expect(out).toContain('aria-label="Show password"');
  });
  test("SearchInput is a search box", () => {
    expect(html(<SearchInput />)).toContain('type="search"');
  });
  test("NumberInput has labelled step buttons", () => {
    const out = ar(<NumberInput value={2} onValueChange={noop} />);
    expect(out).toContain('aria-label="زيادة"');
    expect(out).toContain('value="2"');
  });
  test("MoneyInput: Riyal sign left of the number, also in Arabic", () => {
    const out = ar(<MoneyInput value="1250" onValueChange={noop} />);
    expect(out).toContain('dir="ltr"');
    expect(out.indexOf("<svg")).toBeLessThan(out.indexOf("<input"));
    expect(out).toContain('inputMode="decimal"');
  });
  test("IBAN, ID, CR and VAT inputs are LTR and numeric where they should be (the normalizers cut the length)", () => {
    expect(html(<IbanInput value="SA0380000000608010167519" onValueChange={noop} />)).toContain('value="SA03 8000 0000 6080 1016 7519"');
    expect(html(<NationalIdInput value="" onValueChange={noop} />)).toContain('dir="ltr"');
    expect(html(<CrInput value="" onValueChange={noop} />)).toContain('inputMode="numeric"');
    expect(html(<VatInput value="" onValueChange={noop} />)).toContain('inputMode="numeric"');
  });
  test("OtpInput: one box per digit, left to right in Arabic", () => {
    const out = ar(<OtpInput length={6} />);
    expect(out.match(/aria-label="الرقم \d من 6"/g)).toHaveLength(6);
    expect(out).toContain("[direction:ltr]");
  });
  test("PhoneInput: inside a Field the number gets the label; the country menu has its own name", () => {
    const out = html(
      <Field label="Phone" id="phone">
        <PhoneInput value="" onValueChange={noop} country="SA" onCountryChange={noop} />
      </Field>,
    );
    expect(out).toMatch(/<input[^>]*id="phone"/);
    expect(out).toMatch(/<input[^>]*type="tel"/);
    expect(out).toContain('aria-label="Country calling code"');
    expect(out).toContain("SA +966");
  });
  test("Combobox is an ARIA combobox", () => {
    const out = html(<Combobox options={[{ value: "ruh", label: "Riyadh" }]} value="ruh" onValueChange={noop} />);
    expect(out).toContain('role="combobox"');
    expect(out).toContain('aria-expanded="false"');
    expect(out).toContain('value="Riyadh"');
  });
  test("FileDrop is a real file input inside a label", () => {
    const out = html(<FileDrop name="files" accept=".pdf" maxSizeMb={5} />);
    expect(out).toContain('type="file"');
    expect(out).toContain('accept=".pdf"');
    expect(out).toContain("Up to 5 MB each");
  });
  test("NationalAddress labels every part in the language", () => {
    const out = ar(<NationalAddress value={{}} onValueChange={noop} />);
    for (const label of Object.values(STRINGS.ar.address)) expect(out).toContain(label);
  });
});

describe("number steps", () => {
  test("steps snap to the step size without float noise and stay in range", () => {
    expect(stepNumber(0.2, 0.1, 1)).toBe(0.3);
    expect(stepNumber(5, 1, 1, { max: 5 })).toBe(5);
    expect(stepNumber(0, 1, -1, { min: -3 })).toBe(-1);
    expect(stepNumber(1.5, 0.5, 1)).toBe(2);
  });
  test("a minus sign is kept only when negative numbers are allowed", () => {
    expect(normalizeSignedAmount("-١٢", true)).toBe("-12");
    expect(normalizeSignedAmount("-12", false)).toBe("12");
    expect(parseAmount("-12.5")).toBe(-12.5);
  });
});
