import { describe, expect, test } from "bun:test";
import type { ComponentProps } from "react";
import { LineItemsTable, PercentProvider, type LineItem } from "../src";
import { mount, useDom } from "./dom";

useDom();

const LINES: LineItem[] = [
  { id: "1", name: "Arabic coffee", sku: "SKU-001", quantity: 4, unit: "kg", unitPrice: 314.7826, total: 1259.13 },
  { id: "2", name: "Paper cups", quantity: 200, unitPrice: 12.5, total: 2500, returned: 2 },
  { id: "3", name: "Dates", quantity: 1, unitPrice: 1.1234567, total: 1.12, returned: 0 },
];
const RouterLink = ({ href, ...rest }: ComponentProps<"a">) => <a data-router="" href={href} {...rest} />;
const render = (lang: "en" | "ar", props: Partial<ComponentProps<typeof LineItemsTable>> = {}) =>
  mount(
    <PercentProvider lang={lang} link={RouterLink}>
      <LineItemsTable lines={LINES} caption="Lines" prices="incl" {...props} />
    </PercentProvider>,
  );
const headers = (el: Element) => [...el.querySelectorAll("thead th")].map((th) => th.textContent);
// Card rows: each cell after the first holds its header (for phones), then the value.
const column = (el: Element, n: number) =>
  [...el.querySelectorAll("tbody tr")].map((tr) => (n === 0 ? tr.children[n]!.textContent : tr.children[n]!.lastElementChild!.textContent));

describe("LineItemsTable", () => {
  test("headers say incl. or excl. VAT in both languages", async () => {
    expect(headers(await render("en"))).toEqual(["Product", "Qty", "Unit price incl. VAT", "Total incl. VAT"]);
    expect(headers(await render("ar", { prices: "excl" }))).toEqual(["المنتج", "الكمية", "سعر الوحدة قبل الضريبة", "الإجمالي قبل الضريبة"]);
    expect(headers(await render("ar"))).toContain("الإجمالي شامل الضريبة");
  });

  test("unit price keeps up to 6 decimals, totals 2", async () => {
    const el = await render("en");
    expect(column(el, 2)).toEqual(["314.7826", "12.50", "1.123457"]);
    expect(column(el, 3)).toEqual(["1,259.13", "2,500.00", "1.12"]);
    // The quantity with its unit.
    expect(column(el, 1)).toEqual(["4 kg", "200", "1"]);
    // Money: the Riyal sign, never "SAR".
    expect(el.querySelectorAll("tbody svg[aria-label]").length).toBe(6);
    expect(el.textContent).not.toContain("SAR");
  });

  test("returned chip only when returned > 0 (Arabic مُرتجع 2)", async () => {
    const el = await render("ar");
    expect(column(el, 0).map((t) => t!.includes("مُرتجع"))).toEqual([false, true, false]);
    expect(el.querySelector("tbody tr:nth-child(2) td")!.textContent).toContain("مُرتجع 2");
    expect((await render("en")).textContent).toContain("Returned 2");
  });

  test("SKU is LTR inside Arabic", async () => {
    const el = await render("ar");
    const sku = [...el.querySelectorAll("tbody span")].find((s) => s.textContent === "SKU-001")!;
    expect(sku.getAttribute("dir")).toBe("ltr");
    expect(sku.className).toContain("font-mono");
  });

  test("discount and VAT columns only when a line has them", async () => {
    expect(headers(await render("en", { lines: LINES.map((l) => ({ ...l, discount: 0, vat: 0 })) }))).toEqual(["Product", "Qty", "Unit price incl. VAT", "Total incl. VAT"]);
    const el = await render("en", { lines: [LINES[0]!, { ...LINES[1]!, vat: 326.09 }] });
    expect(headers(el)).toEqual(["Product", "Qty", "Unit price incl. VAT", "VAT", "Total incl. VAT"]);
    // A line without VAT shows 0.00 in the column.
    expect(column(el, 3)).toEqual(["0.00", "326.09"]);
    const ar = await render("ar", { lines: [{ ...LINES[0]!, discount: 50 }] });
    expect(headers(ar)).toEqual(["المنتج", "الكمية", "سعر الوحدة شامل الضريبة", "الخصم", "الإجمالي شامل الضريبة"]);
    expect(column(ar, 3)).toEqual(["50.00"]);
  });

  test("line href makes the row a link", async () => {
    const el = await render("en", { lines: [{ ...LINES[0]!, href: "/products/1" }, LINES[1]!] });
    const rows = [...el.querySelectorAll("tbody tr")];
    const link = rows[0]!.querySelector("a")!;
    expect(link.getAttribute("href")).toBe("/products/1");
    expect(link.hasAttribute("data-router")).toBe(true);
    expect(link.parentElement).toBe(rows[0]!.querySelector("td"));
    expect(rows[1]!.querySelector("a")).toBeNull();
  });

  test("lines are card rows on phones, and rowActions adds the row menu", async () => {
    const el = await render("en", { rowActions: () => [{ label: "Return", onSelect: () => {} }] });
    expect(el.querySelector("thead")!.className).toContain("max-md:sr-only");
    expect(el.querySelectorAll("tbody button[aria-haspopup]").length).toBe(3);
  });
});
