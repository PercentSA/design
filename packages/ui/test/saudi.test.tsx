import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  formatDate,
  formatIban,
  formatMoney,
  getPhoneCountry,
  getPhoneIssue,
  getSaudiIdType,
  hijriParts,
  isBuildingNumber,
  isCrNumber,
  isNationalId,
  isPostalCode,
  isSaudiIban,
  isShortAddress,
  isVatNumber,
  Money,
  normalizePhone,
  PercentProvider,
  RiyalSign,
  toWesternDigits,
} from "../src";

describe("digits", () => {
  test("Arabic-Indic and Persian digits become Western digits; other characters stay", () => {
    expect(toWesternDigits("٠١٢٣٤٥٦٧٨٩ ۰۱۲۳۴۵۶۷۸۹ a-1")).toBe("0123456789 0123456789 a-1");
  });
});

describe("money", () => {
  test("Western digits and grouping in both languages, two decimals only when needed", () => {
    expect(formatMoney(1250)).toBe("1,250");
    expect(formatMoney(1250.5)).toBe("1,250.50");
    expect(formatMoney(1250, { decimals: 2 })).toBe("1,250.00");
    expect(formatMoney(-75)).toBe("-75");
  });
  test("<Money> puts the Riyal sign left of the number in both directions, with a name", () => {
    const en = renderToStaticMarkup(<Money amount={1250} />);
    const ar = renderToStaticMarkup(<PercentProvider lang="ar"><Money amount={1250} /></PercentProvider>);
    expect(en).toContain('dir="ltr"');
    expect(en.indexOf("<svg")).toBeLessThan(en.indexOf("1,250"));
    expect(en).toContain('aria-label="Saudi riyal"');
    expect(ar).toContain('dir="ltr"');
    expect(ar).toContain('aria-label="ريال سعودي"');
    expect(en).not.toContain("SAR");
  });
  test("<RiyalSign> is the SAMA glyph, hidden without a label", () => {
    const html = renderToStaticMarkup(<RiyalSign />);
    expect(html).toContain('viewBox="0 0 1124.14 1256.39"');
    expect(html.match(/<path/g)).toHaveLength(2);
    expect(html).toContain('aria-hidden="true"');
  });
});

describe("dates", () => {
  const day = new Date("2026-02-18T12:00:00Z"); // 1 Ramadan 1447 (Umm al-Qura)
  test("Hijri (Umm al-Qura) and Gregorian, Western digits in Arabic", () => {
    expect(formatDate(day, { calendar: "hijri" })).toBe("1 Ramadan 1447 AH");
    expect(formatDate(day, { lang: "ar", calendar: "hijri" })).toBe("1 رمضان 1447 هـ");
    expect(formatDate(day, { lang: "ar" })).toBe("18 فبراير 2026");
    expect(formatDate(day)).toBe("18 February 2026");
  });
  test("the day is the Riyadh day, so server and browser agree", () => {
    expect(formatDate(new Date("2026-02-17T22:30:00Z"))).toBe("18 February 2026");
  });
  test("hijriParts gives numbers", () => {
    expect(hijriParts(day)).toEqual({ year: 1447, month: 9, day: 1 });
  });
});

describe("validators", () => {
  test("Saudi IBAN: SA + 22 digits with a valid mod-97 check; spaces and Arabic digits accepted", () => {
    expect(isSaudiIban("SA0380000000608010167519")).toBe(true);
    expect(isSaudiIban("sa03 8000 0000 6080 1016 7519")).toBe(true);
    expect(isSaudiIban("SA٠٣80000000608010167519")).toBe(true);
    expect(isSaudiIban("SA0380000000608010167518")).toBe(false);
    expect(isSaudiIban("AE070331234567890123456")).toBe(false);
    expect(isSaudiIban("SA038000000060801016751")).toBe(false);
    expect(formatIban("sa0380000000608010167519")).toBe("SA03 8000 0000 6080 1016 7519");
  });
  test("national ID / iqama: 10 digits, starts with 1 or 2, Luhn check digit", () => {
    expect(isNationalId("1000000008")).toBe(true);
    expect(isNationalId("2000000006")).toBe(true);
    expect(isNationalId("١٠٠٠٠٠٠٠٠٨")).toBe(true);
    expect(isNationalId("1000000007")).toBe(false);
    expect(isNationalId("3000000004")).toBe(false);
    expect(isNationalId("100000008")).toBe(false);
  });
  test("getSaudiIdType: citizen for a national ID, resident for an iqama, null when invalid", () => {
    expect(getSaudiIdType("1000000008")).toBe("citizen");
    expect(getSaudiIdType(" 2000000006 ")).toBe("resident");
    expect(getSaudiIdType("٢٠٠٠٠٠٠٠٠٦")).toBe("resident");
    expect(getSaudiIdType("1000000007")).toBeNull();
    expect(getSaudiIdType("3000000004")).toBeNull();
    expect(getSaudiIdType("10000000a8")).toBeNull();
    expect(getSaudiIdType("")).toBeNull();
  });
  test("CR: 10 digits; VAT: 15 digits starting and ending with 3", () => {
    expect(isCrNumber("1010123456")).toBe(true);
    expect(isCrNumber("101012345")).toBe(false);
    expect(isVatNumber("300000000000003")).toBe(true);
    expect(isVatNumber("310000000000002")).toBe(false);
    expect(isVatNumber("30000000000003")).toBe(false);
  });
  test("national address parts", () => {
    expect(isShortAddress("RRRD2929")).toBe(true);
    expect(isShortAddress("rrrd 2929")).toBe(true);
    expect(isShortAddress("RRR2929")).toBe(false);
    expect(isBuildingNumber("8228")).toBe(true);
    expect(isBuildingNumber("822")).toBe(false);
    expect(isPostalCode("12643")).toBe(true);
    expect(isPostalCode("1264")).toBe(false);
  });
});

describe("GCC phone", () => {
  test.each(["501234567", "٥٠١٢٣٤٥٦٧", "۵۰۱۲۳۴۵۶۷", "+966 50 123 4567", "00966 50 123 4567", "0501234567"])(
    "accepts the same Saudi number: %s",
    (draft) => {
      expect(getPhoneIssue(draft, getPhoneCountry("SA"))).toBeNull();
      expect(normalizePhone(draft, "SA")).toBe("966501234567");
    },
  );
  test.each(["+96591234", "0096591234", "+501234567"])("never treats incomplete international input as local: %s", (draft) => {
    expect(normalizePhone(draft, "KW")).toBeNull();
    expect(getPhoneIssue(draft, getPhoneCountry("KW"))).not.toBeNull();
  });
  test("rejects letters instead of stripping them, and checks the chosen country", () => {
    expect(normalizePhone("501234567a")).toBeNull();
    expect(getPhoneIssue("501234567a", getPhoneCountry("SA"))?.type).toBe("nonDigits");
    expect(normalizePhone("55123456", "QA")).toBe("97455123456");
    expect(normalizePhone("55123456", "SA")).toBeNull();
    expect(getPhoneIssue("5012", getPhoneCountry("SA"))?.type).toBe("tooShort");
  });
});
