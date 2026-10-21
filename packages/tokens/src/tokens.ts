/**
 * Percent design tokens: the single source of truth. `scripts/build.ts` writes tokens.css,
 * theme.css (Tailwind v4) and tokens.json from these values.
 */

export const THEMES = ["dark", "light"] as const;
export type Theme = (typeof THEMES)[number];

export const COLOR_TOKENS = [
  "bg",
  "surface",
  "surface-2",
  "line",
  "line-strong",
  "fg",
  "fg-2",
  "fg-3",
  "primary",
  "primary-fg",
  "live",
  "danger",
  "danger-fg",
  "warning",
  "success",
] as const;
export type ColorToken = (typeof COLOR_TOKENS)[number];

/**
 * Black and white first. `live` is only for small status dots; `danger`/`warning` only for errors and warnings.
 * `danger-fg` is text on `danger`; `success` is success text (Percent: same as `fg`, a brand may set green).
 */
export const color: Record<Theme, Record<ColorToken, string>> = {
  dark: {
    bg: "#000000",
    surface: "#0b0b0b",
    "surface-2": "#111111",
    line: "#1f1f1f",
    "line-strong": "#2a2a2a",
    fg: "#ffffff",
    "fg-2": "#9a9a9a",
    "fg-3": "#7e7e7e",
    primary: "#ffffff",
    "primary-fg": "#000000",
    live: "#3ecf8e",
    danger: "#ff7a7a",
    "danger-fg": "#000000",
    warning: "#f5b84a",
    success: "#ffffff",
  },
  light: {
    bg: "#ffffff",
    surface: "#f5f5f5",
    "surface-2": "#ebebeb",
    line: "#e3e3e3",
    "line-strong": "#cfcfcf",
    fg: "#000000",
    "fg-2": "#555555",
    "fg-3": "#696969",
    primary: "#000000",
    "primary-fg": "#ffffff",
    live: "#0f8a55",
    danger: "#c42b1c",
    "danger-fg": "#ffffff",
    warning: "#935e00",
    success: "#000000",
  },
};

export const shadow: Record<Theme, { overlay: string }> = {
  dark: { overlay: "0 24px 60px rgb(0 0 0 / 0.6)" },
  light: { overlay: "0 24px 60px rgb(0 0 0 / 0.12)" },
};

const SYSTEM_SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

/** Fonts are a brand setting: no font files ship with the packages, so the defaults are the device's fonts. */
export const font = {
  sans: SYSTEM_SANS,
  /** Arabic pages use --p-font-sans-ar. */
  sansArabic: SYSTEM_SANS,
  mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
} as const;

/** sm–xl are Tailwind's own values; theme.css maps rounded-sm…xl to them, so a brand changes those too. */
export const radius = { field: "12px", card: "24px", panel: "28px", pill: "999px", sm: "0.25rem", md: "0.375rem", lg: "0.5rem", xl: "0.75rem" } as const;

export const duration = { fast: "150ms", base: "250ms", slow: "450ms", reveal: "900ms" } as const;

export const easing = {
  out: "cubic-bezier(0.2, 0.8, 0.2, 1)",
  "in-out": "cubic-bezier(0.6, 0, 0.4, 1)",
  wipe: "cubic-bezier(0.6, 0, 0.2, 1)",
} as const;

/** Horizontal run of the % mark's slash per unit of height (2 across for 3 down). Wipes use this angle; it never mirrors. */
export const SLASH_RUN = 0.6667;

export const layer = { base: 0, sticky: 20, header: 40, overlay: 50, toast: 60, cursor: 70 } as const;

/** Control sizes: roomy for websites, compact for apps (`data-density="compact"`). */
export const density = {
  comfortable: { "control-h": "48px", "control-h-sm": "40px", "control-px": "16px" },
  compact: { "control-h": "40px", "control-h-sm": "32px", "control-px": "12px" },
} as const;

/** Page gutter (left and right padding of sections). */
export const gutter = "5vw";
