# Percent Design System

React components, design tokens and signature motion for products in English and Arabic: right to left, dark and light, WCAG AA, and a Saudi kit (Riyal sign, Hijri dates, IBAN, national ID, CR, VAT, phone, national address, ZATCA invoice QR).

Docs and live examples: https://design.percent.sa

| Package | What |
|---------|------|
| [`@percentsa/tokens`](packages/tokens) | CSS variables, Tailwind v4 theme, token JSON, brand files |
| [`@percentsa/ui`](packages/ui) | React components (Tailwind v4 + Radix), Saudi and bilingual kit |
| [`@percentsa/motion`](packages/motion) | Scramble, slash reveal, marquee, magnetic, cursor, counter |

## Install

```bash
bun add @percentsa/tokens @percentsa/ui @percentsa/motion
```

npm, pnpm and yarn work too. Needs React 19 and Tailwind CSS v4.

```css
@import "tailwindcss";
@import "@percentsa/tokens/theme.css";   /* tokens as CSS variables + Tailwind theme */
@import "@percentsa/ui/styles.css";      /* component styles; tells Tailwind to scan the package */
@import "@percentsa/motion/styles.css";
```

```tsx
<html lang="ar" dir="rtl" data-theme="dark">
  …
  <PercentProvider lang="ar" link={RouterLink}>
    <App />
  </PercentProvider>
```

Set `data-theme` (`dark`, `light` or `system`) and `data-density` on `<html>`: menus, dialogs and toasts render in `<body>`, outside any themed wrapper.

TypeScript: `"moduleResolution"` `bundler`, `node16` and `nodenext` all work.

### React Server Components (Next.js App Router)

Components with state, effects or events are client components: their files start with `"use client"`. Functions and constants (`formatMoney`, `buttonClass`, `THEME_SCRIPT`, `formatDate`, the validators, …) are in files without it, so a server component can call them. A server component can render any component, but it can pass only data as props: functions (`onClick`, `onValueChange`, `link`) need a client component.

`PercentProvider` takes functions (`link`, `text`), so put it in a client file of your app:

```tsx
// app/providers.tsx
"use client";
import NextLink from "next/link";
import { PercentProvider } from "@percentsa/ui";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PercentProvider lang="en" link={({ href, ...p }) => <NextLink href={href!} {...p} />}>
      {children}
    </PercentProvider>
  );
}
```

Then use `<Providers>` in `app/layout.tsx`.

## Your brand

Percent's black-and-white look is the default. A project sets its colors, fonts, corner radius and logo in one brand file, and the components do not change: https://design.percent.sa/en/foundations/theming

The packages ship no font files. Load your own fonts and set `--p-font-sans`, `--p-font-sans-ar` (Arabic pages) and `--p-font-mono`; without them, text uses the device's fonts.

## Develop

```bash
bun install
bun run dev    # docs site
bun test
bun run typecheck
```

Docs site in Docker:

```bash
docker build -t percent-design-docs .
docker run -p 3000:3000 percent-design-docs
```

Project guide: `AGENTS.md`. Contributing: `CONTRIBUTING.md`. Spec: `docs/spec.md`. Changes: `CHANGELOG.md` (plain words: https://design.percent.sa/en/changelog).

## License

The code is MIT licensed (`LICENSE`). The Percent name, the % mark, the wordmark and the spinner shape are not covered by the license: see `TRADEMARKS.md`.
