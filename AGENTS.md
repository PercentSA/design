# AGENTS.md — Percent Design System

> The project guide: structure, commands and rules. The reader is assumed to know nothing about this project. Pull requests: see CONTRIBUTING.md.

The design system gives Percent's projects and client projects one design language: React components, design tokens and signature motion, in English and Arabic (RTL), dark and light. Percent's black-and-white look is the default. A project sets its own colors, fonts, corner radius and logo with a brand file (`docs/branding.md`); the components do not change. Read `docs/spec.md` before changing tokens or adding components.

## Structure

```
packages/tokens   @percentsa/tokens  src/tokens.ts is the only source of token values; scripts/build.ts writes dist/*.css + tokens.json
                                     src/logo.ts: the logo geometry and 7 versions; src/logo-motion.ts: the loader frames
packages/ui       @percentsa/ui      React components, hooks, formatters, Saudi validators, styles.css
packages/motion   @percentsa/motion  Signature motion (scramble, reveal, slash wipe, marquee, magnet, cursor, counter)
apps/docs         Public docs site (React Router 8, EN + AR, dark + light). Imports the packages' src (Vite alias), so no package build is needed.
                  app/docs/catalogue.ts lists every page (stage-2 pages in app/docs/pages/*.ts); app/examples/*.tsx hold the examples
                  (one exported function each; the page shows its source; app/docs/examples.ts maps groups to files). server.ts is the production server.
                  public/brand/ holds the logo SVG downloads (generated: bun run logo-files).
docs/             spec.md (stage-1 decisions), stage2.md (stage-2 APIs), branding.md (brands), motion-2.md (motion parts)
                  brand-remake.md (the logo spec) and brand/ (its reference files: the approved geometry and motion)
```

## Commands

```bash
bun install
bun run dev          # builds tokens, starts the docs site
bun test             # all packages
bun run typecheck
bun run build        # dist/ of every package
```

Run `bun test` and `bun run typecheck` before every commit.

## Rules

1. Token values live only in `packages/tokens/src/tokens.ts`. Components use Tailwind utilities that read the variables (`bg-surface`, `text-fg-2`, `border-line`, `rounded-card`) or `var(--p-*)`. No hex colors in components.
2. Every component works in LTR and RTL: logical properties only (`ms-`, `pe-`, `start-`, `text-start`). Direction icons (chevrons, arrows) mirror with `rtl:-scale-x-100`; nothing else mirrors. The % mark and the slash angle never mirror.
3. Every component works in dark and light modes and with any brand: never assume black is the background.
4. Text passes WCAG AA (tested in `packages/tokens/test`). Touch targets ≥ 24×24 px. Every interactive component works with the keyboard and shows the focus ring.
5. Built-in visible or accessible strings (Close, Next, …) come from `useStrings()` (EN + AR in `packages/ui/src/i18n/strings.ts`), never hard-coded.
6. Money uses `<Money>`/`formatMoney` (Riyal sign left of the number, Western digits). Never "SAR" in UI text.
7. Motion respects `prefers-reduced-motion` (spec §6). Hidden start states only under `html.js`.
8. Radix (`radix-ui`) for behavior of overlays, menus and form primitives; `lucide-react` for icons. Add no other UI dependency without a decision in `docs/spec.md`.
9. New component: source in `packages/<pkg>/src`, export from the package index, a test in `packages/<pkg>/test`, an example function in an `apps/docs/app/examples/*.tsx` file of its group and a page entry (`catalogue.ts` or `app/docs/pages/*.ts`), then `bun run registry`.
10. Tests run with a DOM (happy-dom, preloaded by `bunfig.toml`). Use `test/dom.tsx` (`mount`, `click`, `press`) for portals, focus and events. `apps/docs/test` builds the docs and runs the production server.
11. Component CSS goes in `@layer components`, so Tailwind utilities on the same element win. Exception: `.p-slash-hover` (motion) is unlayered, because it must beat the Button variants' hover utilities (a test locks this).
12. Charts: series use the brand colours `--p-chart-1` … `--p-chart-5` (default: greys, each 3:1 on the page) and also differ by dash, marker or hatch, so colour is never the only difference. A project that sets `patterns={false}` is responsible for the colour differences. Charts mirror in RTL (`mirror={false}` keeps LTR) and carry their data as a hidden table.
13. No font files in the packages: fonts are a brand setting, and many font licenses do not allow redistribution. The defaults are the device's fonts (`--p-font-sans`, `--p-font-sans-ar`, `--p-font-mono`).
14. The Percent name and logo (icon, wordmarks, the 7 versions, the loader, the spinner shape) are not covered by the MIT license (`TRADEMARKS.md`).
15. The name is "Percent" in English text and "برسنت" in Arabic text (the spelling of the Arabic logo). `test/arabic-name.test.ts` fails if the misspelling with ي comes back.
16. The logo (icon, wordmarks, 7 versions, loader) comes only from `packages/tokens/src/logo.ts`. Never redraw it or type the name in a font as a logo. The SVG files in `apps/docs/public/brand/` are generated (`bun run logo-files`).
17. React Server Components: a `ui` or `motion` source file with hooks, context, event handlers or browser globals starts with `"use client";`; any other file does not. Exported functions and constants go in files without it (for example `button-class.ts` next to `actions.tsx`), so server code can call them. The package indexes have no directive. `test/use-client.test.ts` checks all three rules.

## Docs deployment

`Dockerfile` (repo root; it builds `apps/docs`) runs `apps/docs/server.ts` (Bun.serve) on port 3000. The docs are public, including the registry (`/r/*.json` holds the component source). Health check: `/healthz`. Pages are sent `Cache-Control: no-cache`; hashed assets are immutable.

## Publishing

`ui` and `motion` build with `tsc`: one ESM file and one declaration file per source file, so each client module keeps its `"use client"` line. `scripts/dist-imports.ts` then adds `.js` to the relative imports in `dist`, so the packages load in Node for server rendering and work with TypeScript `nodenext` (`test/publish.test.ts`). `tokens` is one `bun build` file plus `tsc` declarations. `.github/workflows/release.yml` publishes all three to npm when a `v*` tag is pushed; the tag sets the version (`git tag v0.5.1 && git push origin v0.5.1`). Login is npm trusted publishing (no token; npm adds provenance); a version that is already on npm is skipped. Projects install with `bun add @percentsa/tokens @percentsa/ui @percentsa/motion` (no token).

Each `## X.Y.Z` in CHANGELOG.md also gets a plain-words entry in `apps/docs/app/docs/changelog.ts` (the docs Changelog page; `apps/docs/test/changelog.test.ts` fails without it). Set its `date` when the tag is pushed.

## Copy-in registry (shadcn)

`bun run registry` writes `registry.json` (committed; the tests fail when it is out of date) and `apps/docs/app/registry.generated.json` (git-ignored). One item per source file; relative imports become registry dependencies, and every exported component also gets a friendly item (`button` → `actions`). The docs serve items at `/r/<name>.json` (public). Files copy to `components/percent/<pkg>/` with the package's folder layout, so their relative imports keep working.
