import { describe, expect, mock, spyOn, test } from "bun:test";
import { act, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { encode } from "uqr";
import { PercentProvider } from "../src";
import { invoiceTotals, zatcaTlv } from "../src/saudi/invoice";
import { QrCode, ZatcaQr } from "../src/components/qr-code";
import { Invoice } from "../src/components/invoice";
import { TicketView } from "../src/components/ticket-view";

const html = (node: ReactNode) => renderToStaticMarkup(node);
const ar = (node: ReactNode) => html(<PercentProvider lang="ar">{node}</PercentProvider>);

describe("invoiceTotals", () => {
  test("3 × 33.33 at 15 %: VAT per line rounded half-up to the halala", () => {
    expect(invoiceTotals([{ quantity: 3, unitPrice: 33.33 }])).toEqual({
      lines: [{ net: 99.99, vat: 15, total: 114.99 }],
      subtotal: 99.99,
      vat: 15,
      total: 114.99,
    });
  });
  test("zero-rated lines have no VAT", () => {
    expect(invoiceTotals([{ quantity: 2, unitPrice: 50, vatRate: 0 }])).toEqual({ lines: [{ net: 100, vat: 0, total: 100 }], subtotal: 100, vat: 0, total: 100 });
  });
  test("a discount comes off the line before VAT", () => {
    expect(invoiceTotals([{ quantity: 1, unitPrice: 200, discount: 20 }]).lines[0]).toEqual({ net: 180, vat: 27, total: 207 });
  });
  test("half a halala rounds up on each line; sums are exact (halalas, not floats)", () => {
    const t = invoiceTotals([
      { quantity: 1, unitPrice: 0.1 },
      { quantity: 1, unitPrice: 0.2 },
      { quantity: 1, unitPrice: 0.1, vatRate: 0.05 },
    ]);
    expect(t.lines.map((l) => l.vat)).toEqual([0.02, 0.03, 0.01]);
    expect(t.subtotal).toBe(0.4);
    expect(t.vat).toBe(0.06);
    expect(t.total).toBe(0.46);
  });
});

// Walks a TLV payload: [tag, length, ...value] per field.
function readTlv(b64: string) {
  const bytes = Buffer.from(b64, "base64");
  const fields: { tag: number; length: number; value: string }[] = [];
  for (let i = 0; i < bytes.length; ) {
    const tag = bytes[i]!;
    const length = bytes[i + 1]!;
    fields.push({ tag, length, value: bytes.subarray(i + 2, i + 2 + length).toString("utf8") });
    i += 2 + length;
  }
  return fields;
}

describe("zatcaTlv", () => {
  test("the published Salla vector", () => {
    expect(zatcaTlv({ seller: "Salla", vatNumber: "1234567891", timestamp: "2021-07-12T14:25:09Z", total: 100, vat: 15 })).toBe(
      "AQVTYWxsYQIKMTIzNDU2Nzg5MQMUMjAyMS0wNy0xMlQxNDoyNTowOVoEBjEwMC4wMAUFMTUuMDA=",
    );
  });
  test("Arabic seller name: lengths are UTF-8 bytes; amounts have 2 decimals", () => {
    const fields = readTlv(zatcaTlv({ seller: "شركة برسنت", vatNumber: "300000000000003", timestamp: "2026-02-18T09:30:00Z", total: 114.99, vat: 15 }));
    expect(fields).toEqual([
      { tag: 1, length: 19, value: "شركة برسنت" },
      { tag: 2, length: 15, value: "300000000000003" },
      { tag: 3, length: 20, value: "2026-02-18T09:30:00Z" },
      { tag: 4, length: 6, value: "114.99" },
      { tag: 5, length: 5, value: "15.00" },
    ]);
  });
  test("a value over 255 bytes is a RangeError", () => {
    const base = { vatNumber: "300000000000003", timestamp: "2026-02-18T09:30:00Z", total: 1, vat: 0 };
    expect(() => zatcaTlv({ ...base, seller: "a".repeat(255) })).not.toThrow();
    expect(() => zatcaTlv({ ...base, seller: "ب".repeat(128) })).toThrow(RangeError);
  });
});

// "hello world 1234" fits version 1 at ECC L but needs version 2 at ECC M.
const VALUE = "hello world 1234";
const pathOf = (markup: string) => markup.match(/<path d="([^"]+)"/)![1]!;

describe("QrCode", () => {
  test("SVG with a name, ECC M and a quiet zone of 4 modules", () => {
    const out = html(<QrCode value={VALUE} label="Scan me" size={120} />);
    const n = encode(VALUE, { ecc: "M" }).size - 2 + 8; // uqr's default border is 1
    expect(n).toBe(33);
    expect(out).toContain('role="img"');
    expect(out).toContain('aria-label="Scan me"');
    expect(out).toContain(`viewBox="0 0 ${n} ${n}"`);
    expect(out).toContain('width="120"');
    expect(out.match(/<path/g)).toHaveLength(1);
  });
  test("one path draws exactly the dark modules of the uqr matrix", () => {
    const { data } = encode(VALUE, { ecc: "M", border: 4 });
    const dark = data.flat().filter(Boolean).length;
    const drawn = [...pathOf(html(<QrCode value={VALUE} label="x" />)).matchAll(/h(\d+)/g)].reduce((s, m) => s + Number(m[1]), 0);
    expect(drawn).toBe(dark);
    // Quiet zone: no run starts in the first 4 rows or columns.
    expect([...pathOf(html(<QrCode value={VALUE} label="x" />)).matchAll(/M(\d+) (\d+)/g)].every((m) => Number(m[1]) >= 4 && Number(m[2]) >= 4)).toBe(true);
  });
  test("hydrates the server markup without a mismatch", async () => {
    const { hydrateRoot } = await import("react-dom/client");
    const node = <QrCode value="https://percent.sa" label="x" />;
    const el = document.createElement("div");
    el.innerHTML = html(node);
    const before = el.innerHTML;
    const onRecoverableError = mock();
    const root = await act(async () => hydrateRoot(el, node, { onRecoverableError }));
    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(el.querySelector("path")!.getAttribute("d")).toBe(pathOf(before));
    await act(async () => root.unmount());
  });
  test("ZatcaQr encodes the TLV payload", () => {
    const props = { seller: "Percent", vatNumber: "300000000000003", timestamp: "2026-02-18T00:00:00Z", total: 114.99, vat: 15 };
    expect(html(<ZatcaQr {...props} label="QR" />)).toBe(html(<QrCode value={zatcaTlv(props)} label="QR" />));
  });
});

const INVOICE = {
  number: "INV-0042",
  issueDate: "2026-02-18",
  seller: { name: "Percent", vatNumber: "300000000000003", crNumber: "1010000000", address: "Riyadh" },
  buyer: { name: "Client Co.", vatNumber: "311111111111113" },
  lines: [{ description: "Design", quantity: 3, unitPrice: 33.33 }],
};

describe("Invoice", () => {
  test("labels in both languages on one page, in either page language", () => {
    for (const out of [html(<Invoice type="standard" {...INVOICE} />), ar(<Invoice type="standard" {...INVOICE} />)]) {
      for (const label of ["Tax invoice", "فاتورة ضريبية", "VAT number", "الرقم الضريبي", "Total incl. VAT", "الإجمالي شامل ضريبة القيمة المضافة"]) {
        expect(out).toContain(label);
      }
    }
  });
  test("standard vs simplified title", () => {
    const standard = html(<Invoice type="standard" {...INVOICE} />);
    const simplified = html(<Invoice type="simplified" {...INVOICE} />);
    expect(standard).not.toContain("Simplified tax invoice");
    expect(simplified).toContain("Simplified tax invoice");
    expect(simplified).toContain("فاتورة ضريبية مبسطة");
  });
  test("lines and totals from invoiceTotals with Money (Riyal sign, Western digits, never SAR)", () => {
    const out = ar(<Invoice type="standard" {...INVOICE} />);
    for (const amount of ["33.33", "99.99", "15.00", "114.99"]) expect(out).toContain(`</svg>${amount}<`);
    expect(out).toContain('aria-label="ريال سعودي"');
    expect(out).toContain(">15%<");
    expect(out).not.toContain("SAR");
  });
  test("Gregorian issue date; Hijri too with showHijri", () => {
    expect(html(<Invoice type="standard" {...INVOICE} />)).toContain("18 February 2026");
    expect(html(<Invoice type="standard" {...INVOICE} />)).not.toContain("Ramadan");
    expect(html(<Invoice type="standard" {...INVOICE} showHijri />)).toContain("1 Ramadan 1447 AH");
  });
  test("ZATCA QR from the totals and the real time of issue (required with qr)", () => {
    const tlv = (timestamp: string) => zatcaTlv({ seller: "Percent", vatNumber: "300000000000003", timestamp, total: 114.99, vat: 15 });
    const out = html(<Invoice type="simplified" {...INVOICE} qr timestamp="2026-02-18T09:30:00Z" />);
    expect(out).toContain(pathOf(html(<QrCode value={tlv("2026-02-18T09:30:00Z")} label="x" />)));
    expect(out).toContain('aria-label="Invoice QR code"');
    expect(html(<Invoice type="simplified" {...INVOICE} />)).not.toContain("Invoice QR code");
    // @ts-expect-error -- an invented time of issue would go into the QR code
    void (<Invoice type="simplified" {...INVOICE} qr />);
  });
  test("a seller without a VAT number: a type error with qr; at run time no QR and no crash, the error is logged", () => {
    const error = spyOn(console, "error").mockImplementation(() => {});
    // @ts-expect-error -- a ZATCA QR code needs the seller's VAT number
    const out = html(<Invoice type="simplified" {...INVOICE} seller={{ name: "Percent" }} qr timestamp="2026-02-18T09:30:00Z" />);
    expect(out).toContain("Simplified tax invoice");
    expect(out).not.toContain("Invoice QR code");
    expect(error).toHaveBeenCalledTimes(1);
    expect(String(error.mock.calls[0]![0])).toMatch(/ZATCA tag 2 is required/);
    error.mockRestore();
  });
  test("prints black on white", () => {
    expect(html(<Invoice type="standard" {...INVOICE} />)).toContain("print:bg-white");
  });
});

describe("TicketView", () => {
  const ticket = (
    <TicketView
      subject="Cannot download invoice"
      id="TCK-1024"
      status={<span>Open</span>}
      meta={[{ term: "Priority", details: "High" }]}
      messages={[
        { id: "1", author: { name: "Sara Alqahtani" }, time: "09:30", body: "Hello", attachments: [{ name: "screen.png", href: "/screen.png", size: 245_000 }] },
        { id: "2", author: { name: "Omar" }, time: "09:45", body: "Checking", internal: true },
      ]}
      composer={<form aria-label="Reply" />}
    />
  );
  test("messages are articles; internal notes are dashed and labelled in the page language", () => {
    const en = html(ticket);
    expect(en.match(/<article/g)).toHaveLength(2);
    expect(en.match(/border-dashed/g)).toHaveLength(1);
    expect(en).toContain("Internal note");
    expect(ar(ticket)).toContain("ملاحظة داخلية");
  });
  test("header, initials, attachments, meta as a description list and the composer", () => {
    const out = html(ticket);
    expect(out).toMatch(/<h1[^>]*>Cannot download invoice<\/h1>/);
    expect(out).toContain(">TCK-1024<");
    expect(out).toContain(">SA<");
    expect(out).toContain("Attachments");
    expect(out).toContain('href="/screen.png"');
    expect(out).toContain("245 KB");
    expect(out).toMatch(/<dl[^>]*>.*<dt[^>]*>Priority<\/dt><dd[^>]*>High<\/dd>/);
    expect(out).toContain('aria-label="Reply"');
    expect(ar(ticket)).toContain("المرفقات");
  });
});
