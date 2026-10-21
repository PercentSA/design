# 0.4.0: brands (spec)

Status: built in 0.4.0. Items marked **(builder call)** were decided during the build.

## Intent

The design system is used by Percent's own projects and by client projects. Each project changes only its brand: colors, logo, fonts, corner radius. Everything else stays the same in every project: components, layout, motion, Saudi and Arabic parts, accessibility, RTL.

Before 0.4.0 a second brand could not do this. A project had to write its own header, footer, logo, theme toggle and color blocks, because:
- the footer, the phone menu, the spinner and EmptyState always draw the % mark (issue #7);
- a brand must write every color two or three times (dark, light, device setting), and the docs recipe puts the brand and the mode in one `data-theme` value;
- selected states use `fg` in some parts and `primary` in others, so a colored `primary` gives mixed results; the danger button puts `primary-fg` text on `danger`;
- Arabic pages ignore a brand font; the slash angle is a JS constant in two places.

## Goals

1. A project sets its brand in one CSS file (each color one time for light and dark) and one provider prop (logo). No fork, no copied components.
2. Modes: dark (default, as today), light, and system (follows the device). A theme switch and a head script come with the design system.
3. percent.sa does not change (same look and behavior; server HTML differs only in attributes with no visible effect) when it updates from 0.3.1 to 0.4.0 without brand settings. **(builder call: the baseline is 0.3.1; the 0.1.1 → 0.3.1 changes are checked when percent.sa takes them.)**
4. Issue #7 closed: the footer takes a brand and can be arranged for other projects.

Non-goals: moving percent.sa site sections (hero, Services scene) into the design system; a theme editor; per-component brand props beyond the ones below; Tailwind `dark:` variant support (components use tokens, not `dark:`).

Anti-goals: anything that makes percent.sa look or behave differently; a brand that needs to copy a component to change its logo or colors; color as the only difference between chart series by default.

## Decisions

### 1. Fonts and corner radius are brand settings
- Already CSS variables: `--p-font-sans`, `--p-font-mono`, `--p-radius-field|card|panel|pill`.
- New `--p-font-sans-ar` (default: today's Arabic stack). `html[lang="ar"]` sets `--p-font-sans: var(--p-font-sans-ar)`. A brand sets both `--p-font-sans` and `--p-font-sans-ar` on `:root`.
- Small radii become tokens: `--p-radius-sm|md|lg|xl` with Tailwind's default values (0.25rem, 0.375rem, 0.5rem, 0.75rem), mapped in theme.css to Tailwind's `--radius-sm|md|lg|xl`. Existing `rounded-md`/`rounded-lg` classes (checkbox, menu items, tooltips, Code, Kbd) then follow the brand with no component change. **(builder call)**
- A brand loads its own font files. Since 0.5.0 the packages ship no fonts: the defaults are the device's fonts.

### 2. Modes and the brand file
- `data-theme` means the mode only: `dark`, `light` or `system`. No attribute = dark (as today).
- tokens.css keeps plain color values (no `light-dark()`) in three blocks:
  ```css
  :root, [data-theme="dark"], [data-theme="system"] { color-scheme: dark;  /* dark values */ }
  [data-theme="light"] { color-scheme: light; /* light values */ }
  @media (prefers-color-scheme: light) { [data-theme="system"] { color-scheme: light; /* light values */ } }
  ```
  Nested `data-theme` subtrees work in every browser, because each block sets the values on the element that has the attribute.
- **(builder call)** Not `light-dark()`: Vite 8 minifies CSS with Lightning CSS for older browser targets, which rewrites `light-dark()` into variables that resolve on `:root`, so nested light sections keep dark brand colors (found by the builder check, tested in headless Chrome). Plain blocks have no build-tool or browser limit.
- A brand file uses the same three selectors, loaded after the design-system CSS. Nobody writes it by hand: `@percentsa/tokens` exports `brandCss(brand)` that writes it from one object (each color given one time per mode, the light values written twice by the function, not by the author):
  ```ts
  import { brandCss } from "@percentsa/tokens";
  export const brand = {
    dark: { primary: "#3ecf8e", "primary-fg": "#000000" },
    light: { primary: "#0f5b4a", "primary-fg": "#ffffff" },
    vars: { "font-sans": '"Brand Sans", system-ui, sans-serif', "font-sans-ar": '"Brand Arabic", "Brand Sans", sans-serif', "radius-card": "8px" },
  };
  // scripts/brand.ts: await Bun.write("app/brand.css", brandCss(brand));  (committed output)
  ```
  `dark`/`light` take `ColorToken` names (plus the chart tokens); `vars` takes any other `--p-*` name without the prefix (fonts, radii, durations, `slash-run`). Unknown names are a type error.
- `checkBrand(brand)` (same object) returns the pairs that fail WCAG AA for each mode, with Percent's values for the tokens the brand does not set: fg/fg-2/fg-3 on bg/surface/surface-2 ≥ 4.5, primary-fg on primary ≥ 4.5, danger-fg on danger ≥ 4.5, success/danger/warning on bg ≥ 4.5, chart colors on bg ≥ 3. A project puts it in a one-line test.
- `ThemeSwitch` (@percentsa/ui): three-option control (System, Light, Dark) built on the existing SegmentedControl, strings from `useStrings()`. It sets `data-theme` on `<html>` and stores the choice in `localStorage` (key `p-theme`). `THEME_SCRIPT` (string export) runs in `<head>` before first paint and applies the stored choice; with nothing stored, the app's own `<html data-theme>` stays. `useTheme()` returns `[theme, setTheme]`.
- The docs recipe (foundations, "client theme") changes to `brandCss()` and shows its output.

### 3. One brand color for selected states, new status tokens
- `primary` / `primary-fg` is the brand color. Every selected or active indicator uses it: radio dot, choice card, slider range and thumb, tab line, steps, progress, timeline, success wipe band, ScenePlayer dot, plus the parts that already use it (checkbox, switch, chips, calendar, segmented control, pagination). For Percent `primary` = `fg`, so nothing changes visually.
- New color tokens: `danger-fg` (text on `danger`; Percent: dark #000000, light #ffffff) and `success` (Percent: #ffffff dark, #000000 light, the same values as `fg`, written as plain values; a brand may set green). The danger Button uses `text-danger-fg`. Alert `success` tone uses `text-success`. **(builder call)** Toast keeps its green `live` dot (status dots are `live`, a brand sets `live`).
- Not added: soft/tint tokens, severity scales, gradients. They stay in the project (for example its own severity colors).

### 4. Logo
- `PercentProvider` gets `brand?: { mark?: ReactNode; wordmark?: ReactNode; spinner?: ReactNode }` and `useBrand()`.
- Defaults when a slot is empty: `mark` → `<Mark/>`, `wordmark` → `<Logo version="icon-en"/>` or `"icon-ar"` by page language (Percent).
- Users: SiteHeader (`brand` prop ?? provider wordmark), MobileMenu top bar (header `brand` prop ?? provider mark ?? `<Mark/>`; SiteHeader passes its `brand`), SiteFooter (`brand` prop ?? provider mark ?? `<Mark className="h-9"/>`), AuthLayout (`brand` prop ?? provider wordmark), EmptyState default icon (provider mark ?? `<Mark/>`).
- Spinner: `brand.spinner` if given; else the % spinner when the provider has no `brand`; else a plain ring (currentColor, rotates; under reduced motion it pulses opacity like today's spinner). Button `loading` uses Spinner, so it follows. **(builder call: the ring appears as soon as `brand` is set, so a brand never shows the % by accident.)**
- `Mark`, `Logo`, `MARK_*` stay as Percent's own exports (`Logo` replaced `Wordmark` in 0.5.0).

### 5. Charts
- Brand chart colors `--p-chart-1` … `--p-chart-5`, set in the brand's `dark`/`light` objects. Not defined by default. **(builder call)** Each series reads `var(--p-chart-N, <today's grey>)` where the color is used, so the fallback follows the subtree's `--p-fg` like today, and Percent charts stay as today when no chart token is set.
- Series `i` uses `--p-chart-${(i % 5) + 1}` with fallback `GREYS[i % 3]`. A per-series `color` still wins.
- Patterns stay on by default (series never differ by color alone). Requirement **(builder call)**: with Percent's 3 greys, series 1–9 differ in (color, dash/marker) for lines and in (color, fill) for bars and slices; with 5 distinct brand colors, series 1–15 differ the same way. A test checks both. Suggested: five fill styles (solid, 45°, −45°, 0°, 90° hatch) with fill index `(i + floor(i / 5)) % 5`, and dash/marker index chosen the same way; the builder may pick another formula that meets the requirement.
- New chart prop `patterns?: boolean` (default `true`); `false` removes dashes and hatches (markers stay). AGENTS rule 12 changes: a project that turns patterns off is responsible for color differences.
- AreaChart fill opacity stays.

### 6. SiteFooter (issue #7)
All new props are optional; without them the output is today's.
```ts
type FooterGroup = { title: ReactNode; links: NavItem[] };
type SocialLink = { href: string; label: string; icon: ReactNode };
SiteFooter({
  homeHref, email, legal, actions, copyright,   // as today
  links?: NavItem[],        // now optional
  brand?: ReactNode,        // replaces the mark (default: provider mark ?? <Mark className="h-9"/>)
  contact?: ReactNode,      // replaces the email block
  groups?: FooterGroup[],   // link columns, each a heading (h2) + list, after `links`
  social?: SocialLink[],    // icon links, aria-label = label, open in a new tab with rel="noopener noreferrer"
  notice?: ReactNode,       // replaces the whole "© year copyright" text
  badges?: ReactNode,       // end of the bottom row; default <MadeInKsa/>; null hides it
  children?: ReactNode,     // full-width row between the top and bottom rows (newsletter, CTA)
  className?: string,
})
```
- Legal links stay in the top nav (as today).
- Phone (< 768 px): groups stack; social links wrap; nothing overflows at 390 px.

### 7. New features in 0.4.0
- AlertDialog: if `onAction` returns a Promise, the dialog stays open, the action button shows `loading`, and the dialog closes when the Promise resolves; on reject it stays open (the app shows the error).
- Toast: `action?: { label: string; onClick: () => void }` rendered with Radix `Toast.Action` (`altText` = label), for "Undo".
- `headingLevel?: 2 | 3 | 4 | 5 | 6` on Card, TicketView, Invoice and the Kanban column title (defaults: today's levels). TicketView default stays h1.
- Menu items: `MenuItem` (the DropdownMenu item) takes `href`; it renders through the provider link component (`asChild`), so router links and "open in new tab" work.
- Popover, HoverCard, Tooltip: `side` also accepts `"start"` and `"end"`, mapped with `useDir()` (start = left in English, right in Arabic). `left`/`right` stay physical.

### 8. Motion settings
- SlashReveal computes its run in CSS from `var(--p-slash-run)` and an inline `--p-aspect` (today it writes `--p-run` inline from the JS constant), so the server HTML keeps working and one CSS variable sets the angle. The success wipe (runs after mount) reads `--p-slash-run` from computed style, fallback the JS `SLASH_RUN`. **(builder call)**
- `ScrambleProvider` gets `noise?: string` (default `LATIN_NOISE`, which keeps "%"). **(builder call)**
