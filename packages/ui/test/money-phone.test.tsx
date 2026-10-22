import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { formatMoney, formatPhone, Money, PercentProvider, PhoneText, phoneLinks } from "../src";

describe("formatMoney options", () => {
  test("formatMoney default keeps the 0.6.0 output", () => {
    expect(formatMoney(1200)).toBe("1,200");
    expect(formatMoney(12.5)).toBe("12.50");
    expect(formatMoney(-75)).toBe("-75");
    expect(formatMoney(1250, { decimals: 2 })).toBe("1,250.00");
  });
  test("maxDecimals for unit prices", () => {
    expect(formatMoney(314.7826, { maxDecimals: 6 })).toBe("314.7826");
    expect(formatMoney(12.5, { maxDecimals: 6 })).toBe("12.50");
    expect(formatMoney(1.1234567, { maxDecimals: 6 })).toBe("1.123457");
    expect(formatMoney(1200, { maxDecimals: 4 })).toBe("1,200.00");
  });
  test("accounting brackets", () => {
    expect(formatMoney(-1234.5, { decimals: 2, accounting: true })).toBe("(1,234.50)");
    expect(formatMoney(1234.5, { decimals: 2, accounting: true })).toBe("1,234.50");
  });
  test("negative zero and non-finite amounts", () => {
    expect(formatMoney(-0.004, { decimals: 2 })).toBe("0.00");
    expect(formatMoney(-0, { decimals: 2 })).toBe("0.00");
    expect(formatMoney(-0.004, { decimals: 2, accounting: true })).toBe("0.00");
    expect(formatMoney(-0)).toBe("0");
    for (const n of [NaN, Infinity, -Infinity]) expect(formatMoney(n)).toBe("—");
  });
  test("Money accounting in Arabic: sign at the left, brackets around the number, LTR", () => {
    const html = renderToStaticMarkup(
      <PercentProvider lang="ar">
        <Money amount={-1234.5} decimals={2} accounting />
      </PercentProvider>,
    );
    expect(html).toContain('dir="ltr"');
    expect(html.indexOf("<svg")).toBeGreaterThan(-1);
    expect(html.indexOf("<svg")).toBeLessThan(html.indexOf("(1,234.50)"));
  });
});

describe("phone display", () => {
  test("formatPhone", () => {
    for (const raw of ["966550000999", "0550000999", "٠٥٥٠٠٠٠٩٩٩"]) {
      expect(formatPhone(raw)).toBe("+966 55 000 0999");
      expect(formatPhone(raw, { style: "national" })).toBe("055 000 0999");
    }
    expect(formatPhone("+97430000999")).toBe("+974 3000 0999");
    expect(formatPhone("+97430000999", { style: "national" })).toBe("3000 0999");
    expect(formatPhone("30000999", { country: "QA" })).toBe("+974 3000 0999");
    expect(formatPhone(" 12 ")).toBe("12");
    expect(formatPhone(null)).toBe("");
  });
  test("phoneLinks", () => {
    expect(phoneLinks("0550000999")).toEqual({ tel: "tel:+966550000999", whatsapp: "https://wa.me/966550000999" });
    expect(phoneLinks("12")).toBeNull();
    expect(phoneLinks(undefined)).toBeNull();
  });
  test("PhoneText: tel link, LTR number, WhatsApp link named in Arabic", () => {
    const html = renderToStaticMarkup(
      <PercentProvider lang="ar">
        <PhoneText value="0550000999" whatsapp />
      </PercentProvider>,
    );
    expect(html).toContain('href="tel:+966550000999"');
    expect(html).toContain('dir="ltr"');
    expect(html).toContain(">+966 55 000 0999<");
    expect(html).toContain('href="https://wa.me/966550000999"');
    expect(html).toContain('aria-label="واتساب +966 55 000 0999"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });
  test("PhoneText: an invalid number is plain text", () => {
    const html = renderToStaticMarkup(<PhoneText value="12" whatsapp />);
    expect(html).toContain(">12<");
    expect(html).not.toContain("<a");
    expect(renderToStaticMarkup(<PhoneText value="  " />)).toBe("");
    expect(renderToStaticMarkup(<PhoneText value={null} />)).toBe("");
  });
});
