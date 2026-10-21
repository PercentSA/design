import { decl, modeBlocks } from "../src/brand";
import { COLOR_TOKENS, color, density, duration, easing, font, gutter, layer, radius, shadow, SLASH_RUN, THEMES, type Theme } from "../src/tokens";

const themeVars = (t: Theme) => ({
  ...Object.fromEntries(COLOR_TOKENS.map((n) => [n, color[t][n]])),
  "shadow-overlay": shadow[t].overlay,
});

const modeBody = (t: Theme) => `  color-scheme: ${t};\n${decl(themeVars(t))}`;

/** CSS variables. Dark is the default; `data-theme` (dark, light, system) switches any subtree. */
export function tokensCss(): string {
  const shared = {
    "font-sans": font.sans,
    "font-sans-ar": font.sansArabic,
    "font-mono": font.mono,
    ...Object.fromEntries(Object.entries(radius).map(([k, v]) => [`radius-${k}`, v])),
    ...Object.fromEntries(Object.entries(duration).map(([k, v]) => [`duration-${k}`, v])),
    ...Object.fromEntries(Object.entries(easing).map(([k, v]) => [`ease-${k}`, v])),
    ...Object.fromEntries(Object.entries(layer).map(([k, v]) => [`z-${k}`, v])),
    ...density.comfortable,
    "slash-run": SLASH_RUN,
    gutter,
  };
  return [
    "/* Generated from src/tokens.ts. Do not edit. */",
    ...modeBlocks(modeBody("dark"), modeBody("light")),
    `:root {\n${decl(shared)}\n}`,
    `[data-density="compact"] {\n${decl(density.compact)}\n}`,
    `html[lang="ar"] {\n${decl({ "font-sans": "var(--p-font-sans-ar)" })}\n}`,
    "",
  ].join("\n\n");
}

// Names the shadcn/ui primitives use, so copied shadcn components look right without edits.
const SHADCN: Record<string, string> = {
  background: "bg",
  foreground: "fg",
  card: "surface",
  "card-foreground": "fg",
  popover: "surface-2",
  "popover-foreground": "fg",
  "primary-foreground": "primary-fg",
  secondary: "surface-2",
  "secondary-foreground": "fg",
  muted: "surface-2",
  "muted-foreground": "fg-3",
  accent: "surface-2",
  "accent-foreground": "fg",
  destructive: "danger",
  border: "line",
  input: "line-strong",
  ring: "fg-3",
};

/** Tailwind v4 theme: utilities read the variables, so a theme switch needs no new CSS. */
export function themeCss(): string {
  const lines = [
    ...COLOR_TOKENS.map((n) => `--color-${n}: var(--p-${n});`),
    ...Object.entries(SHADCN).map(([a, n]) => `--color-${a}: var(--p-${n});`),
    "--font-sans: var(--p-font-sans);",
    "--font-mono: var(--p-font-mono);",
    ...Object.keys(radius).map((k) => `--radius-${k}: var(--p-radius-${k});`),
    ...Object.keys(easing).map((k) => `--ease-${k}: var(--p-ease-${k});`),
    "--shadow-overlay: var(--p-shadow-overlay);",
  ];
  return [
    "/* Generated from src/tokens.ts. Do not edit. */",
    '@import "./tokens.css";',
    "",
    `@theme inline {\n${lines.map((l) => `  ${l}`).join("\n")}\n}`,
    "",
  ].join("\n");
}

type Token = { $type: string; $value: string | number };
const group = <T extends Record<string, string | number>>(o: T, $type: string) =>
  Object.fromEntries(Object.entries(o).map(([k, v]) => [k, { $type, $value: v }])) as Record<keyof T, Token>;

/** Design Tokens Community Group format (Figma Tokens Studio, Style Dictionary). */
export function tokensJson() {
  return {
    color: Object.fromEntries(THEMES.map((t) => [t, group(color[t], "color")])) as Record<Theme, Record<string, Token>>,
    font: group(font, "fontFamily"),
    radius: group(radius, "dimension"),
    duration: group(duration, "duration"),
    easing: group(easing, "cubicBezier"),
    layer: group(layer, "number"),
    density: { comfortable: group(density.comfortable, "dimension"), compact: group(density.compact, "dimension") },
    slashRun: { $type: "number", $value: SLASH_RUN },
  };
}

