/** One invoice line. Amounts in riyals; `discount` comes off the line before VAT; `vatRate` 0.15 by default. */
export type InvoiceLineAmounts = { quantity: number; unitPrice: number; vatRate?: number; discount?: number };

// Half-up away from zero, so a credit line rounds like its debit.
const round = (n: number) => Math.sign(n) * Math.round(Math.abs(n));
const halalas = (riyals: number) => round(riyals * 100);

/**
 * Line and invoice totals in riyals (2 decimals), computed in halalas (integers) so sums never drift.
 * VAT is rounded half-up to the halala on each line.
 */
export function invoiceTotals(lines: InvoiceLineAmounts[]) {
  const h = lines.map(({ quantity, unitPrice, vatRate = 0.15, discount = 0 }) => {
    const net = round(quantity * halalas(unitPrice)) - halalas(discount);
    // Integer ÷ 10000 is exact at .5, so the rate's binary error cannot flip the rounding.
    const vat = round((net * Math.round(vatRate * 10_000)) / 10_000);
    return { net, vat, total: net + vat };
  });
  const sum = (key: "net" | "vat" | "total") => h.reduce((s, l) => s + l[key], 0) / 100;
  return {
    lines: h.map((l) => ({ net: l.net / 100, vat: l.vat / 100, total: l.total / 100 })),
    subtotal: sum("net"),
    vat: sum("vat"),
    total: sum("total"),
  };
}

export type ZatcaFields = { seller: string; vatNumber: string; timestamp: string; total: number; vat: number };

/**
 * The ZATCA QR payload of a simplified tax invoice (phase 1): base64 of TLV tags 1–5
 * (seller name, VAT number, ISO 8601 timestamp, total incl. VAT, VAT total). Works in browsers and Bun.
 */
export function zatcaTlv({ seller, vatNumber, timestamp, total, vat }: ZatcaFields) {
  const utf8 = new TextEncoder();
  const bytes = [seller, vatNumber, timestamp, total.toFixed(2), vat.toFixed(2)].flatMap((value, i) => {
    if (!value.trim()) throw new TypeError(`ZATCA tag ${i + 1} is required.`);
    const b = utf8.encode(value);
    if (b.length > 255) throw new RangeError(`ZATCA tag ${i + 1} is ${b.length} bytes; the limit is 255.`);
    return [i + 1, b.length, ...b];
  });
  return btoa(String.fromCharCode(...bytes));
}
