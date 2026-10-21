# Percent Design System — Spec

Status: approved by the owner on 2026-10-14 (Q1–Q8 below). Items marked *builder call* were decided during the build; the owner can change them.

## 1. Purpose

One design language for every Percent project: the website (percent.sa), Percent's own products, internal tools, and client projects. A new project starts from the system and looks like Percent on day one; a client project replaces the theme and keeps every component.

The look comes from percent.sa: black and white, Geist + Thmanyah Sans, English and Arabic (right to left), the % slash as the motion motif, calm and precise motion.

## 2. Owner decisions

| # | Decision |
|---|----------|
| Q1 | Tokens are platform-free (CSS variables + JSON for Figma, Flutter, Swift later). Components: React 19 + Tailwind CSS v4 + Radix. No Svelte version. |
| Q2 | For Percent and for client projects. Percent's look is the default theme; a client project replaces theme tokens (colors, fonts, radius) without changing components. |
| Q3 | Dark is the default theme; light is a second theme from the same black-and-white scale. percent.sa stays dark only. |
| Q4 | One repo `PercentSA/design` with several packages and a docs app, plus a shadcn-style registry for copy-in components. Since 0.5.0 the repo is public (MIT) and the packages are on npm. |
| Q5 | Built in stages (section 9). Each stage is finished and documented before the next. |
| Q6 | The docs site is deployed like percent.sa. It is public since 0.2.1. |
| Q7 | Code is the source of truth. Token JSON is exported for Figma; a Figma library comes later. |
| Q8 | percent.sa moves to the system's packages after stage 1. |

The packages are `@percentsa/tokens`, `@percentsa/ui`, `@percentsa/motion` (the scope is the GitHub organization's name).

## 3. Repository

```
packages/
  tokens/   @percentsa/tokens  source: src/tokens.ts → dist/tokens.css, theme.css, tokens.json
  ui/       @percentsa/ui      React components, hooks, formatters, Saudi validators, styles.css
  motion/   @percentsa/motion  Signature motion: scramble, reveal, slash wipe, marquee, magnet, cursor, counter, scene control
apps/
  docs/     Public docs site (React Router 8, SSR, EN + AR, dark + light), one page per component
registry.json  shadcn-style registry (copy-in components), built into apps/docs/public/r
```

- Bun workspaces; `bun test`; TypeScript strict. Packages compile with `tsc` to ESM + `.d.ts`.
- Same versions as percent.sa: React 19, React Router 8.3.1, Tailwind CSS 4.3, Vite 8, Bun.
- Dependencies of `@percentsa/ui`: `radix-ui`, `lucide-react`, `clsx`, `tailwind-merge`. React is a peer dependency. No other UI library.

### Using the system in a project

```css
@import "tailwindcss";
@import "@percentsa/tokens/theme.css";   /* tokens as CSS variables + Tailwind theme */
@import "@percentsa/ui/styles.css";      /* component styles; tells Tailwind to scan the package */
@import "@percentsa/motion/styles.css";
```

```tsx
<PercentProvider lang="ar">…</PercentProvider>   // direction, built-in strings (EN/AR), tooltips
```

Install: `bun add @percentsa/tokens @percentsa/ui @percentsa/motion`. Fonts: the project loads its own and sets `--p-font-sans`, `--p-font-sans-ar` and `--p-font-mono` (see `docs/branding.md`).

## 4. Tokens

Source of truth: `packages/tokens/src/tokens.ts`. Every value has a CSS variable `--p-*`; Tailwind utilities map to them (`bg-bg`, `bg-surface`, `text-fg-2`, `border-line`, `rounded-card`, …), so the theme changes at runtime without new CSS.

### 4.1 Color (semantic)

| Token | Dark (default) | Light | Use |
|-------|----------------|-------|-----|
| `bg` | #000000 | #ffffff | page |
| `surface` | #0b0b0b | #f5f5f5 | cards, fields |
| `surface-2` | #111111 | #ebebeb | raised, hover, popovers |
| `line` | #1f1f1f | #e3e3e3 | dividers, card borders |
| `line-strong` | #2a2a2a | #cfcfcf | field borders, outline buttons |
| `fg` | #ffffff | #000000 | main text |
| `fg-2` | #9a9a9a | #555555 | secondary text |
| `fg-3` | #7e7e7e | #696969 | labels, hints (≥ 4.5:1 on `bg`, `surface` and `surface-2`) |
| `primary` | #ffffff | #000000 | primary action background (the white button) |
| `primary-fg` | #000000 | #ffffff | text on `primary` |
| `live` | #3ecf8e | #0f8a55 | status dots only (tertiary) |
| `danger` | #ff7a7a | #c42b1c | errors, destructive actions |
| `warning` | #f5b84a | #935e00 | warnings |

Rules: black and white first. Green only for small status dots. `danger`/`warning` only for errors and warnings. Every text token passes WCAG AA (4.5:1) on `bg` and `surface` in both themes (tested). A client theme overrides the same variables.

### 4.2 Typography

- Families: a brand setting. The packages ship no font files (since 0.5.0); the defaults are the device's fonts. Percent's brand uses Geist (Latin), Thmanyah Sans (Arabic) and Geist Mono.
- Scale (px): 12, 13, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72, 96 + fluid display sizes.
- `display`: weight 600, line-height 1, tracking -0.045em; Arabic: weight 700, line-height 1.28, tracking 0.
- `label`: mono 12px, tracking 0.16em, uppercase; Arabic: sans 14px, no tracking, no uppercase.
- Body line-height 1.6 (Arabic 1.8). Digits are Western in both languages.

### 4.3 Other tokens

- Spacing: Tailwind's 4px scale (unchanged); section padding and page gutter (`5vw`) tokens.
- Radius: `field` 12px, `card` 24px, `panel` 28px, `pill` 999px; a client theme can set all to 0–8px.
- Border: 1px everywhere; focus ring 2px `fg`, offset 3px.
- Elevation: flat. Overlays use `surface-2` + `line` + one shadow token (`overlay`).
- Motion: durations `fast` 150ms, `base` 250ms, `slow` 450ms, `reveal` 900ms; easings `out` cubic-bezier(.2,.8,.2,1), `in-out` cubic-bezier(.6,0,.4,1), `wipe` cubic-bezier(.6,0,.2,1); `slash` = the % mark slash run per unit of height 0.7157.
- Breakpoints: Tailwind defaults (640, 768, 1024, 1280, 1536).
- Layers (z-index): base 0, sticky 20, header 40, overlay 50, toast 60, cursor 70.
- Density: `comfortable` (marketing) and `compact` (apps) via `data-density="compact"` (smaller field and button heights).

## 5. Language and direction

- Every component works in LTR and RTL with logical properties (`ms-`, `ps-`, `start-`). Icons that show direction (arrows, chevrons) mirror in RTL; others never mirror. The % mark and the slash angle never mirror.
- `PercentProvider` sets direction for Radix and supplies built-in strings (Close, Previous, Next, …) in English and Arabic; a project can override them.
- Helpers: `Localized<T>` (`{ en, ar }`), `isolate()` (LRI/PDI) for ids, codes and English inside Arabic.
- Money: always the Riyal sign (SAMA glyph, SVG), left of the number with a space, Western digits, in both directions. Never "SAR" in UI text.
- Dates: Gregorian and Hijri (Umm al-Qura via `Intl`), Western digits.

## 6. Motion

- From percent.sa: text scramble (language switch), slash-angle wipe reveal, text rise, reveal on view, marquee with edge fade and scroll-speed boost, magnetic primary buttons, "View" cursor, play-once pictures, scene player control (play/pause + progress dots), success wipe, number counter.
- `prefers-reduced-motion: reduce`: no scramble, no marquee movement, no magnet; reveals become short fades. A component can opt in to keep playing (as the percent.sa Services scene does), but only when it has a pause control or is not large movement.
- No scroll-driven or pinned sections. Animations run only on screen and while the tab is visible.
- Hidden start states apply only under `html.js` (set before first paint), so pages without JavaScript show everything.

## 7. Accessibility

- WCAG 2.2 AA: contrast tested in both themes; touch targets ≥ 24×24 px; visible focus ring; full keyboard use (Radix patterns); labels for every field; errors linked with `aria-describedby`; status messages announced.
- Decorative canvas or pictures are `aria-hidden`; the real text is in the DOM.

## 8. Component catalogue

Categories (owner-approved list): 0 foundations, 1 brand, 2 text, 3 layout, 4 actions, 5 forms, 6 navigation, 7 overlays, 8 feedback, 9 data display, 10 charts, 11 media, 12 motion, 13 website sections, 14 app patterns, 15 Saudi/bilingual kit, 16 outside the web (email, print, slides, social, Discord), 17 utilities and accessibility, 18 tooling.

## 9. Stages

**Stage 1** (this build):
- Foundations: all tokens, both themes, fonts, density, base styles, token JSON export.
- Brand: `Mark`, `Logo` (replaced `Wordmark` in 0.5.0), `RiyalSign`, `MadeInKsa`.
- Text: `Display`, `Heading`, `Text`, `Label`, `Link`, `Code`, `Kbd`, `Blockquote`, `Prose`, `Highlight`, `Number`.
- Layout: `Container`, `Section`, `Stack`, `Inline`, `Grid`, `Split`, `AspectRatio`, `Separator`, `ScrollArea`, `Surface`, `Bleed`.
- Actions: `Button` (primary, secondary, ghost, danger, link; sizes; icon-only; loading), `ButtonGroup`, `Toggle`, `ToggleGroup`/`SegmentedControl`, `CopyButton`, `BackToTop`.
- Forms: `Field` (label, hint, error, counter), `Input`, `Textarea` (grows to a cap), `Select`, `Combobox`, `Checkbox`, `RadioGroup`, `ChoiceCard`, `ChipGroup`, `Switch`, `Slider`, `NumberInput`, `PasswordInput`, `SearchInput`, `PhoneInput` (GCC), `OtpInput`, `MoneyInput`, `IbanInput`, `NationalIdInput`, `CrInput`, `VatInput`, `NationalAddress`, `Calendar` + `DatePicker` (Gregorian/Hijri), `FileDrop`, `Fieldset`, `Honeypot`.
- Overlays: `Dialog`, `AlertDialog`, `Sheet`, `Popover`, `Tooltip`, `HoverCard`, `DropdownMenu`, `ContextMenu`, `Toast`, `ConsentBanner` (PDPL).
- Feedback: `Alert`, `Badge`, `Tag`, `StatusDot`, `Progress`, `ProgressRing`, `Spinner` (% mark), `Skeleton`, `EmptyState`.
- Navigation: `SiteHeader`, `MobileMenu`, `Tabs`, `Breadcrumbs`, `Pagination`, `Steps`, `SkipLink`, `LangSwitch`, `SiteFooter`.
- Saudi/bilingual kit: `Money`, `formatMoney`, `formatDate` (Hijri), `isolate`, validators (IBAN, national ID, CR, VAT, national address, GCC phone), `PercentProvider`, built-in strings.
- Motion: `ScrambleProvider` + `ScrambleText`, `Reveal`, `SlashReveal`, `Marquee`, `Magnetic`, `ViewCursor`, `PlayOnce`, `Counter`, `ScenePlayer` control, `useSuccessWipe`.
- Utilities: `cn`, `useMediaQuery`, `useReducedMotion`, `VisuallyHidden`, `LiveRegion`.
- Docs site (EN/AR, dark/light, every stage-1 component with examples and usage), publish workflow, shadcn registry.

**Stage 2** (built 2026-10-15; APIs and builder calls in `docs/stage2.md`): data display (cards, table, data table, lists, KPI, timeline, accordion, tree, avatar, kanban, calendar view, code block, JSON viewer), charts, app patterns (app shell, sidebar, command palette, filters, settings, auth pages, invoice + ZATCA QR, ticket view).

**Stage 3**: website sections, media (gallery, video, device frames, before/after, map), email templates, print/PDF, slides, social templates, Discord message guide, starters, visual regression tests, Figma token sync.

## 10. Builder calls

- Light palette values (4.1), `warning` color, density switch, layer numbers.
- Hijri calendar built on `Intl` (`islamic-umalqura`), no date library.
- Variants written as plain class maps (no `class-variance-authority`).
- Built-in strings live in the system (EN/AR) because Radix needs accessible labels.
- `@percentsa/motion` depends on React only (no motion library).
