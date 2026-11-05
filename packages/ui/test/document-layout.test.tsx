import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { DetailLayout, PercentProvider, TotalsList } from "../src";
import { mount, useDom } from "./dom";

useDom();

const ITEMS = [
  { label: "Subtotal", amount: 1200 },
  { label: "Discount", amount: -50, hint: "Spring offer" },
  { label: "VAT 15%", amount: 172.5 },
  { label: "Total", amount: 1322.5, total: true },
];

describe("DetailLayout", () => {
  test("DetailLayout uses minmax(0, …) columns and an aside named by sideLabel", async () => {
    const el = await mount(<DetailLayout main={<p>Lines</p>} side={<p>Customer</p>} sideLabel="Details" />);
    const grid = el.firstElementChild!;
    expect(grid.className).toContain("md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]");
    expect(grid.className).toContain("items-start");
    const [main, side] = [...grid.children];
    // On phones the main column comes first.
    expect(main!.textContent).toBe("Lines");
    expect(main!.className).toContain("min-w-0");
    expect(side!.tagName).toBe("ASIDE");
    expect(side!.getAttribute("aria-label")).toBe("Details");
    expect(side!.className).toContain("min-w-0");
  });

  test("DetailLayout without side has one column", async () => {
    const el = await mount(<DetailLayout main={<p>Lines</p>} />);
    const grid = el.firstElementChild!;
    expect(grid.className).not.toContain("md:grid-cols");
    expect(grid.className).toContain("grid-cols-1");
    expect(grid.children.length).toBe(1);
    expect(el.querySelector("aside")).toBeNull();
  });
});

describe("TotalsList", () => {
  test("TotalsList: one dt/dd per item, 2 decimals, total rows strong", async () => {
    const el = await mount(<TotalsList items={ITEMS} />);
    const dl = el.querySelector("dl")!;
    expect([...dl.querySelectorAll("dt")].map((dt) => dt.firstChild!.textContent)).toEqual(["Subtotal", "Discount", "VAT 15%", "Total"]);
    expect([...dl.querySelectorAll("dd")].map((dd) => dd.textContent)).toEqual(["1,200.00", "-50.00", "172.50", "1,322.50"]);
    // Values: end-aligned, with the Riyal sign.
    expect([...dl.querySelectorAll("dd")].every((dd) => dd.className.includes("text-end") && dd.querySelector("svg"))).toBe(true);
    const rows = [...dl.children];
    expect(rows.map((r) => r.className.includes("font-semibold"))).toEqual([false, false, false, true]);
    expect(rows[3]!.className).toContain("border-t");
    // The hint is a small line under its label.
    expect(dl.querySelectorAll("dt")[1]!.lastElementChild!.textContent).toBe("Spring offer");
  });

  test("negative discount shows a minus, accounting item shows brackets", async () => {
    const el = await mount(
      <TotalsList
        items={[
          { label: "Discount", amount: -50 },
          { label: "Balance", amount: -1234.5, accounting: true },
        ]}
      />,
    );
    expect([...el.querySelectorAll("dd")].map((dd) => dd.textContent)).toEqual(["-50.00", "(1,234.50)"]);
  });
});

test("both render with renderToStaticMarkup and have no directive", () => {
  const html = renderToStaticMarkup(
    <PercentProvider lang="ar">
      <DetailLayout main={<TotalsList items={ITEMS} />} side="جانب" sideLabel="التفاصيل" />
    </PercentProvider>,
  );
  expect(html).toContain('<aside aria-label="التفاصيل"');
  expect(html).toContain("1,322.50");
  for (const file of ["layout.tsx", "totals-list.tsx"]) {
    expect(readFileSync(resolve(import.meta.dir, "../src/components", file), "utf8")).not.toMatch(/^"use client"/);
  }
});
