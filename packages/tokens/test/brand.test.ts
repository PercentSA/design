import { describe, expect, test } from "bun:test";
import { brandCss, checkBrand } from "../src";

describe("brandCss", () => {
  test("brandCss selectors match the base blocks; the light values are written twice", () => {
    const css = brandCss({ dark: { primary: "#3ecf8e" }, light: { primary: "#0f5b4a" }, vars: { "font-sans": "X" } });
    expect(css).toMatch(/:root, \[data-theme="dark"\], \[data-theme="system"\] \{\s*--p-primary: #3ecf8e;\s*\}/);
    expect(css).toMatch(/\n\[data-theme="light"\] \{\s*--p-primary: #0f5b4a;\s*\}/);
    expect(css).toMatch(/@media \(prefers-color-scheme: light\) \{\s*\[data-theme="system"\] \{\s*--p-primary: #0f5b4a;\s*\}\s*\}/);
    expect(css).toMatch(/\n:root \{\s*--p-font-sans: X;\s*\}/);
    expect(css.split("--p-primary: #0f5b4a;")).toHaveLength(3);
  });
  test("a color set only for dark gets Percent's light value in the light blocks (the dark block also targets :root); an empty brand is a comment only", () => {
    const css = brandCss({ dark: { primary: "#3ecf8e", "chart-1": "#3ecf8e" } });
    expect(css).toMatch(/\[data-theme="light"\] \{\n  --p-primary: #000000;\n  --p-chart-1: initial;\n\}/);
    expect(css.match(/--p-primary: #000000;/g)).toHaveLength(2);
    expect(brandCss({ light: { primary: "#0f5b4a" } })).not.toContain(":root");
    const empty = brandCss({});
    expect(empty.trim()).toMatch(/^\/\*[^]*\*\/$/);
    expect(empty).not.toContain("{");
  });
  test("an unset value writes nothing", () => {
    expect(brandCss({ dark: { primary: undefined } })).not.toContain("--p-primary");
  });
});

describe("checkBrand", () => {
  test("a partial brand is checked with Percent's values for the tokens it does not set", () => {
    const fails = checkBrand({ dark: { primary: "#3ecf8e", "primary-fg": "#ffffff" } });
    expect(fails).toHaveLength(1);
    expect(fails[0]).toMatchObject({ mode: "dark", fg: "primary-fg", bg: "primary", min: 4.5 });
    expect(fails[0]!.ratio).toBeLessThan(4.5);
  });
  test("Percent passes", () => {
    expect(checkBrand({})).toEqual([]);
  });
  test("chart colors need 3:1 on the page", () => {
    expect(checkBrand({ dark: { "chart-1": "#333333" } })).toMatchObject([{ mode: "dark", fg: "chart-1", bg: "bg", min: 3 }]);
    expect(checkBrand({ dark: { "chart-1": "#3ecf8e" } })).toEqual([]);
  });
});

test("an undefined light value keeps Percent's light fill-in for a dark-only color", () => {
  const css = brandCss({ dark: { primary: "#3ecf8e" }, light: { primary: undefined } });
  expect(css.match(/--p-primary: #000000;/g)).toHaveLength(2);
});

test("checkBrand: primary needs 3:1 on bg and surface (selected states use it)", () => {
  const fails = checkBrand({ dark: { primary: "#222222", "primary-fg": "#ffffff" } });
  expect(fails.map((f) => `${f.fg}/${f.bg}`)).toEqual(expect.arrayContaining(["primary/bg", "primary/surface"]));
});

