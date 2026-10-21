import { describe, expect, test } from "bun:test";
import { COLOR_TOKENS, color, contrast, THEMES } from "../src";
import { themeCss, tokensCss, tokensJson } from "../scripts/generate";

describe("tokens", () => {
  test("every text color passes WCAG AA (4.5:1) on the page, on surfaces and in overlays (surface-2), in both themes", () => {
    for (const theme of THEMES)
      for (const fg of ["fg", "fg-2", "fg-3", "danger", "warning", "success"] as const)
        for (const bg of ["bg", "surface", "surface-2"] as const)
          expect([theme, fg, bg, contrast(color[theme][fg], color[theme][bg]) >= 4.5]).toEqual([theme, fg, bg, true]);
  });
  test("contrast() is the WCAG ratio", () => {
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrast("#777777", "#777777")).toBe(1);
  });
  test("contrast() reads #rgb and refuses what it cannot read", () => {
    expect(contrast("#fff", "#000")).toBeCloseTo(21, 5);
    expect(contrast("#FA0", "#000")).toBe(contrast("#ffaa00", "#000000"));
    for (const bad of ["white", "#ffff", "fff", "#ggg"]) expect(() => contrast(bad, "#000")).toThrow(`"${bad}" is not a #rgb or #rrggbb color`);
  });
  test("text on the primary button passes AA in both themes", () => {
    for (const theme of THEMES) expect(contrast(color[theme].primary, color[theme]["primary-fg"])).toBeGreaterThanOrEqual(4.5);
  });
  test("new color tokens: danger-fg (text on danger) and success, both AA", () => {
    expect([color.dark["danger-fg"], color.light["danger-fg"], color.dark.success, color.light.success]).toEqual(["#000000", "#ffffff", "#ffffff", "#000000"]);
    for (const theme of THEMES) expect(contrast(color[theme]["danger-fg"], color[theme].danger)).toBeGreaterThanOrEqual(4.5);
  });
  test("tokens.css has the system mode: dark by default, light when the device asks for light", () => {
    const css = tokensCss();
    expect(css).toMatch(/:root, \[data-theme="dark"\], \[data-theme="system"\] \{\s*color-scheme: dark;/);
    const media = css.split("@media (prefers-color-scheme: light)")[1]!;
    expect(media).toMatch(/^ \{\s*\[data-theme="system"\] \{\s*color-scheme: light;/);
    for (const name of COLOR_TOKENS) expect(media).toContain(`--p-${name}: ${color.light[name]};`);
  });
  test("fonts: the device's fonts by default; Arabic goes through --p-font-sans-ar, so a brand can set it", () => {
    const css = tokensCss();
    expect(css).toMatch(/:root \{[^}]*--p-font-sans: system-ui,/);
    expect(css).toMatch(/:root \{[^}]*--p-font-sans-ar: system-ui,/);
    expect(css).toMatch(/:root \{[^}]*--p-font-mono: ui-monospace,/);
    expect(css).toMatch(/html\[lang="ar"\] \{\s*--p-font-sans: var\(--p-font-sans-ar\);\s*\}/);
  });
  test("small radii are tokens with Tailwind's values, mapped to Tailwind's names", () => {
    const css = tokensCss();
    const theme = themeCss();
    for (const [k, v] of [["sm", "0.25rem"], ["md", "0.375rem"], ["lg", "0.5rem"], ["xl", "0.75rem"]]) {
      expect(css).toContain(`--p-radius-${k}: ${v};`);
      expect(theme).toContain(`--radius-${k}: var(--p-radius-${k});`);
    }
  });
  test("tokens.css has every color variable in the dark (default) and light blocks", () => {
    const css = tokensCss();
    const [dark, light] = css.split('[data-theme="light"]');
    for (const name of COLOR_TOKENS) {
      expect(dark).toContain(`--p-${name}: ${color.dark[name]};`);
      expect(light).toContain(`--p-${name}: ${color.light[name]};`);
    }
    expect(css).toContain('[data-density="compact"]');
  });
  test("theme.css maps every color to a Tailwind utility and keeps the shadcn names working", () => {
    const css = themeCss();
    expect(css).toContain("@theme inline");
    for (const name of COLOR_TOKENS) expect(css).toContain(`--color-${name}: var(--p-${name});`);
    for (const alias of ["background", "foreground", "card", "popover", "primary-foreground", "muted-foreground", "destructive", "border", "input", "ring"])
      expect(css).toContain(`--color-${alias}:`);
  });
  test("tokens.json carries the same values (design-token format, for Figma)", () => {
    const json = tokensJson();
    expect(json.color.light["fg-3"]).toEqual({ $type: "color", $value: color.light["fg-3"] });
    expect(json.color.dark.bg.$value).toBe("#000000");
    expect(json.radius.card.$value).toBe("24px");
  });
});
