# Changelog

All three packages (`@percentsa/tokens`, `@percentsa/ui`, `@percentsa/motion`) share one version. A tag `vX.Y.Z` publishes them (`.github/workflows/release.yml`).

## 0.7.0

Parts for app shells and lists. No breaking change.

- TimeText, formatDateTime, formatRelative, formatTimeOfDay: dates and times in Riyadh time, 12-hour clock, relative words, the exact value on hover or tap.
- formatMoney and Money: decimals up to 6 for unit prices (maxDecimals) and brackets for negative amounts (accounting). formatPhone, phoneLinks and PhoneText: phone numbers for display, with call and WhatsApp links.
- formatMoney and Money: a result of zero has no minus sign (was "-0.00"), and a non-finite amount shows "—" (was "NaN").
- StatusBadge: a badge with a coloured dot in five tones; the colour is on the dot only. EmptyState tone="error" with a retry button. NotFound and Forbidden page states.
- PageHeader: page title, status badges, a meta line, a back link, one primary action, secondary actions and a "⋯" menu; optional sticky. Menu items take a description (for example why an item is disabled).
- Calendar mode="range" and DateRangePicker: a date range with the presets today, yesterday, this week, this month and last month.
- DataTable: rowHref (the whole row opens the record), rowActions (a "⋯" menu per row) and cards (each row is a card below 768 px).
- ColumnsMenu (show and hide columns), DataTable hiddenColumns, a rows-per-page choice and a sticky header. FilterBar actions: the list toolbar's controls at the end of the bar.
- PrintArea and usePrint: print one part of a page on A4 (portrait or landscape) with a header on every page.

## 0.6.0

The logo on a grid (spec docs/brand-remake.md D9, §4): 1 square = 100 units, so every size is a round number. The shapes and the motion do not change; their sizes do.

**Breaking:** the logo, `MARK_PATH` and `SLASH_RUN` change.
- The icon is 3 × 3 squares (`MARK_PATH` 292 × 292, `MARK_W`, `MARK_H` 292); its slash runs 2 across for 3 down. `SLASH_RUN` is 0.6667 (was 0.7157), so the slash wipes are a little steeper.
- Round-join stroke 8 (was 6.63): `LOGO_STROKE`, and the new `MARK_STROKE` in ui.
- The English word is as high as the icon (x-height 200, ascender and descender 50). The Arabic word is as wide as the English, with a long س; in the row version the icon is exactly in the middle.
- Gaps and clear space 1 square (`LOGO_SQUARE` 100); the stacked version uses half-size words; its minimum size is 48 px (was 44 px).
- `LOADER_VIEWBOX` is `-620 -50 1240 400` (was `-400 -40 800 300`): the loader is wider for its height.

Packages
- tokens: `LOGO_SIZES` (the grid) and `LOGO_SIZES_0_5` (the 0.5 sizes, kept for a rollback; a test checks that they give the 0.5.1 output), `buildLogo(sizes)` and `buildLoader(sizes)`.
- ui: `Spinner` draws its parts from `MARK_PATH`.

Docs
- Brand page: the construction drawn on the grid, the new sizes, clear space and minimum sizes. The SVG downloads are new.

## 0.5.1

React Server Components (Next.js App Router) support. The first release published from GitHub Actions with npm trusted publishing (npm adds provenance). No breaking change: every export keeps its name.

Packages
- `ui` and `motion` ship one ESM file per source file instead of one bundle. Client modules (hooks, context, events) start with `"use client"`; the package index and the plain modules do not.
- Functions and constants moved to modules without the directive, so a server component can call them: `formatMoney`, the `RIYAL_*` constants, `buttonClass`, `formatNumber`, `FIELD_BOX`, `TEXT_BOX`, `MENU_ITEM`, `acceptsFile`, `formatFileSize`, `paginationRange`, `THEME_SCRIPT`, `initials`, `readConsent`, `MARK_*`, and in motion `counterValue`, `magnetOffset`, `slashRunPercent`, `boostTarget`, `easeRate`, `loopHeadroom`.
- Relative imports in `dist` (JS and declarations) end in `.js`: TypeScript `"moduleResolution": "nodenext"` and `node16` now work, not only `bundler`.
- New type export: `ButtonSize`.

Docs
- README: how to use the packages in React Server Components, and `PercentProvider` in a client file of the app.
- Server components page (Foundations): what works in a server component and what needs a client component, the provider setup, a server page and a client component for events. The samples build in Next.js 16.

## 0.5.0

First public release: the code is MIT licensed, the packages are public on npm, and installing needs no token. From 0.5.1, releases publish from GitHub Actions with npm trusted publishing (no token), so npm adds provenance. Includes 0.4.1, which was not published alone.

The Percent logo remake (spec docs/brand-remake.md): the % icon with the Arabic and English wordmarks, in 7 versions from one geometry.

**Breaking:** `Wordmark` is removed; use `Logo`. Without a brand, SiteHeader and AuthLayout now show the icon + the page language (`icon-en` or `icon-ar`).

**Breaking:** no font files in the packages: `@percentsa/tokens/fonts.css` and `@percentsa/tokens/fonts/*` are removed, and the tokens package no longer depends on the Geist font packages. The defaults of `--p-font-sans`, `--p-font-sans-ar` and `--p-font-mono` are the device's fonts. A project loads its own fonts and sets the three variables (Percent's projects: Geist, Thmanyah Sans, Geist Mono).

Packages
- Published to npm instead of GitHub Packages: remove the `@percentsa:registry` line from `.npmrc`.
- `license: MIT`, a README and the LICENSE in each package. `TRADEMARKS.md`: the Percent name and logo (icon, wordmarks, versions, loader, spinner shape) are not covered by the license.

Tokens
- `logo.ts`: the logo geometry (`LOGO_ICON`, `LOGO_ARABIC`, `LOGO_ENGLISH`, `LOGO_STROKE`, `LOGO_SQUARE`), `quadPath`, `visibleBox`, `LOGO_VERSIONS` and `logoLayout(version)`.
- `logo-motion.ts`: the loader loop (`LOADER_STAGES`, `LOADER_LOOP_MS`, `LOADER_VIEWBOX`) and `logoLoaderFrame(ms)`, so the component and video renders use the same frames.

UI
- `Logo version`: `icon`, `en`, `ar`, `icon-en`, `icon-ar`, `row` (Arabic | icon | English) and `stack` (icon on the right, Arabic above English). `currentColor`, never mirrored.

Motion
- `LogoLoader`: the 7.2 s loop logo → Arabic → logo → English → logo. It plays only on screen with the tab visible; the server and reduced motion show the still icon.

Docs
- Brand page (clear space, minimum sizes, versions, do and don't, downloads) and SVG downloads of every version in white and black.
- Install without a token; the registry URL is `https://design.percent.sa/r/{name}.json`. The docs site loads its own fonts (Geist, IBM Plex Sans Arabic, Geist Mono).

## 0.4.1

Site layout options, so a project with a capped page width (for example 1440 px) can use SiteHeader and SiteFooter. Without the new props the output is the same as 0.4.0. Not published alone: these changes came out in 0.5.0.
- SiteHeader `position`: `"fixed"` (default), `"sticky"` or `"static"` (in the flow, no bar classes, no scroll listener). New `className` on the `<header>`.
- SiteHeader and SiteFooter `width`: the content width of `<Container size>` (`sm`, `md`, `lg`, `xl`, default `full`). Only the side padding changes, so backgrounds and borders stay full width. New type `SiteWidth`.
- SiteHeader without `links`: no phone menu, no empty "Main navigation", and the actions stay visible on phones.

## 0.4.0

Brands (spec docs/branding.md): any project sets its colors, fonts, corner radius and logo without a fork. Without brand settings the output is the same as 0.3.1 (percent.sa checked: same server HTML and computed styles).

Tokens
- `data-theme` is the mode only: `dark` (also without the attribute), `light`, or new `system` (follows the device).
- `brandCss(brand)` writes a project's brand file from one object (`dark`, `light`, `vars`); load it after the design-system CSS. A color set only for dark gets Percent's light value in light mode. `checkBrand(brand)` returns the color pairs that fail WCAG AA.
- New colors `danger-fg` (text on `danger`) and `success`; for Percent they keep today's look.
- `--p-font-sans-ar` (Arabic pages); a brand sets it next to `--p-font-sans`.
- Small radii are tokens (`--p-radius-sm|md|lg|xl`, Tailwind's values), so `rounded-md`/`rounded-lg` follow a brand.

UI
- `PercentProvider brand={{ mark, wordmark, spinner }}` and `useBrand()`: SiteHeader, the phone menu, SiteFooter, AuthLayout and EmptyState use the brand's logo; an empty slot takes the other slot. With a brand, Spinner (and Button `loading`) is a ring unless `spinner` is given.
- SiteFooter (issue #7): optional `brand`, `contact`, `groups` (link columns), `social`, `notice`, `badges` (`null` hides "Made in KSA"), `children`, `className`; `links` is optional.
- `ThemeSwitch` (System, Light, Dark), `useTheme()` and `THEME_SCRIPT` (in `<head>`, applies the stored choice before first paint).
- Selected and active states use `primary` everywhere (radio, choice card, slider, tabs line, steps, timeline, progress). The danger Button uses `danger-fg`; Alert success uses `success`.
- Charts: series colors from `--p-chart-1…5` (fallback: today's greys); patterns stay on, `patterns={false}` removes dashes and hatches. Bar and slice fills have five styles, so series 1–15 differ with five brand colors.
- AlertDialog: `onAction` may return a Promise (the dialog waits, the button shows loading, a rejection keeps it open).
- `toast({ action: { label, onClick } })` for "Undo". Menu items take `href` and `target` (through the provider link). Popover, HoverCard and Tooltip take `side="start" | "end"`. `headingLevel` on Card, TicketView, Invoice and Kanban.

Motion
- SlashReveal and the success wipe take the angle from `--p-slash-run` (the server HTML has `--p-aspect`, the CSS makes the run).
- `ScrambleProvider noise` sets the Latin scramble characters.
- The success wipe band and the ScenePlayer dot use `primary`.

## 0.3.1

Bug fixes from a review of every component (2026-10-20). No change for current percent.sa usage.

Forms
- OtpInput: a letter no longer moves focus to the next box, and `onValueChange` gets digits only (Radix applied `sanitizeValue` to paste only). Arabic digits typed in a box become Western digits.
- OtpInput in a Field: the label names the boxes, the hint and error are linked, and the boxes show the error border.
- MoneyInput: in Arabic the Riyal sign is on the left of the number again.
- NationalIdInput, CrInput, VatInput, IbanInput, MoneyInput: a key in a full field is refused (before, the last character was dropped). In money, a second "." is refused.
- NationalAddress: the caret stays in place when a character is refused or changed.
- Combobox: with no text and no highlighted item, Enter clears the value (before, it chose the first item). A click on the list padding no longer closes the list. Its hidden input gets `disabled` and `form`.
- DatePicker: the hidden input gets `disabled` and the new `form` prop; inside a Field the trigger is described by the chosen date.
- IBAN: `isSaudiIban` accepts letters in the account part (SA2!n2!n18!c).
- NumberInput: the step buttons do nothing when `readOnly`.
- FileDrop: after a file is removed, focus goes to the file input; a form reset clears the list.
- PasswordInput: the toggle no longer says "pressed" in addition to its changed name.
- ChoiceCardGroup: the name is the label only; the description is linked.
- SettingsRow with `controlId`: no group (the label was read twice); controls that use `useFieldControl` get the description.

Data display
- Invoice: `qr` needs `seller.vatNumber` (type); a QR that cannot be made is left out with a console error, the page no longer crashes.
- Charts: a missing value (null, undefined, "") breaks the line or area and shows "—" (before, 0). A series with one point shows a marker. Very large data no longer throws (no spread in min/max); a pointer move in the same row does not render again.
- DataTable: the sort and the selection checks are faster (memo, Set). Tree: open checks use a Set.
- TicketView: initials are the same as Avatar ("ال" rule).
- JsonViewer: Date shows as ISO text, Map as an object, Set as an array.
- CodeBlock: a block without a file name or language is a group named "Code". DonutChart: the hidden table has a "Category" header.
- Kanban: valid list HTML in an empty column. AvatarGroup: the ring has the Card colour inside a Card.

Layout and text
- PercentProvider `strings`: groups (for example `errors`) merge one level deep, so one changed error text keeps the others.
- SiteFooter: a long email wraps. NavLinks: unique keys when `links` and `legal` share an address.
- Link: `asChild` with `external` keeps the child's classes, `target` and `rel`.

Motion
- Text decode (`switch-controller`) shows the final text at once under reduced motion.
- Counter: no flash of the final number before counting (start state hidden under `html.js`).
- Marquee pauses its CSS loop off screen. Magnet listens to the pointer only while on screen. RevealText reads all positions before it writes.

Tokens
- `contrast()` accepts `#rgb` and throws a clear error for values it cannot read.

## 0.3.0

Motion (owner decisions in docs/motion-2.md; every part: reduced motion, RTL, no hidden content without JavaScript)
- `RevealText` (@percentsa/motion): headings rise word by word, line by line; Arabic words are never split.
- `NumberRoll` (@percentsa/motion): digits roll to a changed value (prices, totals); screen readers get the value only.
- Tabs, SegmentedControl, Sidebar: one indicator slides to the active item (before JavaScript the item draws its own state).
- `useFlip` (@percentsa/ui): items glide to their new place; used by Kanban, List (`data-flip` on ListItem) and FilterBar tags.
- Page transitions (@percentsa/motion CSS): opt in with `data-page-transition="fade"` or `"slash"` on `<html>` and React Router `viewTransition`; the docs use `slash`.
- `p-slash-hover` (@percentsa/motion CSS): opt-in hover and focus fill at the slash angle for outline/ghost buttons and links (not primary buttons).
- Sheet: drag to close on touch and pen (a handle on bottom sheets).
- Sheet drag does not start on sliders, text fields, horizontal scrollers, menus opened from the sheet or parts marked `data-sheet-no-drag`; it ends when the sheet closes during a drag; a controlled sheet that stays open springs back.
- `p-slash-hover`: browsers without `lh` or `atan()` (Chrome < 111, Safari < 16.4, Firefox < 120) get a plain fill.
- The sliding indicator is measured in sub-pixels (also in a scrolled list and inside a Dialog that pops in).
- `useFlip` does not take focus from an element that got focus in the same change (autoFocus); List measures only when its order changes.
- `RevealText` takes one plain string: it cannot wrap other elements (for example percent.sa's `<Sx>`).

UI
- `getSaudiIdType()`: "citizen" (national ID), "resident" (iqama) or null; `isNationalId()` uses it (PR #4, nfnot).

Build
- CI and release run on the self-hosted runner (with Node for the Node load test); registry paths use "/" on Windows; the Node load test imports by file URL (PR #4).

## 0.2.1

Docs
- Public: no password, search engines may index the pages; component pages have a description. The registry (`/r/*.json`, component source) is public too; `components.json` needs no headers.
- Server: `X-Content-Type-Options: nosniff`, `frame-ancestors 'none'`, `Vary: Cookie` on pages; unknown registry names are 404.

Packages
- `@percentsa/ui` and `@percentsa/motion` name `@percentsa/tokens` as a peer dependency (their CSS uses the tokens). The release workflow updates bun.lock after setting the version, so the published range is the release's own.

UI
- IbanInput, MoneyInput, NumberInput, NationalIdInput, CrInput, VatInput: the caret stays in place when an edit in the middle reformats the value.
- NumberInput steps: a value off the step grid goes to the next or previous grid value (grid from `min`, else 0).
- SearchInput: a Field label or `aria-labelledby` names it (the default "Search" name only when nothing else does).
- Input with adornments: no error border for `aria-invalid="false"`.
- Checkbox, Switch, RadioGroup: the description is linked with `aria-describedby`; the name is the label only.
- FileDrop (one file): a refused file keeps the file chosen before; error border while an error shows; new prop `aria-invalid`.
- PhoneInput: with a `name`, the form also posts the country (`countryName`, default `${name}-country`), also without JavaScript. A phone issue sets `aria-invalid` even when the app passes "false".
- Slider with two thumbs: each thumb has its own name (Minimum / Maximum, or `thumbLabels`); new strings `minimum`, `maximum`.
- Combobox: Arrow Down / Arrow Up open the list on the chosen item, else on the first / last item.
- Calendar on its own: the view follows `value` to its month.
- `toast()` while no `<Toaster>` is mounted is dropped (no pile of old toasts later): place one Toaster in the root layout.
- SiteHeader: the desktop nav is named "Main navigation" (new string `mainNavigation`); the phone menu keeps "Menu".
- Accordion: closed panels are in the server HTML (hidden) and their content mounts at page load; the browser's find-in-page opens the panel with the match (browsers with `beforematch`; others keep closed panels plainly hidden); the open/close animation no longer measures heights.
- Combobox: the highlighted option stays in view in a long list.
- AppShell: new prop `embedded` (no `<header>`/`<main>` landmarks and no skip link, for a shell inside a page that has its own).

Motion
- Marquee: the scroll boost runs frames only during and just after a scroll.

## 0.2.0

Stage 2 (docs/stage2.md):
- Data display: `Card`, `Table`, `DataTable` (sort, select, paginate, loading, empty; client or server data), `List`/`ListItem`, `DescriptionList`, `Stat`, `Timeline`, `Accordion`, `Tree`, `Avatar`/`AvatarGroup`, `CodeBlock`, `JsonViewer`.
- Boards and calendars: `Kanban` (drag and drop + a "Move" menu that reorders in the column and moves to other columns, without a mouse), `CalendarView` (Gregorian/Hijri month with events, agenda on phones).
- Charts (own SVG, black and white, mirrored in Arabic, keyboard tooltip, hidden data table): `LineChart`, `AreaChart`, `BarChart`, `DonutChart`, `Sparkline`, `ChartLegend`.
- App patterns: `AppShell`, `Sidebar`, `CommandPalette` + `useCommandShortcut`, `FilterBar`, `SettingsSection`/`SettingsRow`, `AuthLayout`.
- Invoices and support: `Invoice` (bilingual tax invoice, print styles; `qr` needs `timestamp`), `invoiceTotals` (halalas), `zatcaTlv` (empty seller, VAT number or time is an error), `QrCode` and `ZatcaQr` (black on white in every theme), `TicketView`.
- New dependency of `@percentsa/ui`: `uqr` (QR encoder, MIT).

## 0.1.1

Tokens
- `fg-3` is #7e7e7e (dark) and #696969 (light); light `warning` is #935e00. Text in menus, popovers, dialogs and toasts (`surface-2`) passes WCAG AA.

UI
- Calendar / DatePicker: with `min`/`max`, focus starts on a day that can be chosen; arrow keys after the month buttons stay in the new month.
- Combobox: the list is a popover layer: Escape inside a dialog closes only the list, and parents with `overflow: hidden` no longer clip it.
- Button `loading`: keeps focus and its name (aria-disabled), says "Loading", ignores clicks and form submits.
- SegmentedControl: always one item chosen, also without `value`.
- PhoneInput: Arabic country menu shows "(+966)".
- NumberInput, IbanInput, NationalIdInput, CrInput, VatInput, PasswordInput: the app's `className` is kept. Digit inputs accept pasted numbers with spaces.
- `cn()`: later `rounded-*`/`shadow-*` utilities replace the token ones.
- Menus and lists: a visible highlight for the active item.
- Tabs: no scroll bar under the tabs in Chrome. CopyButton: no error without clipboard. SiteFooter: the year in Riyadh.

Motion
- Marquee: a pause button (WCAG 2.2.2), pause on keyboard focus, new prop `labels`; reduced motion: no edge fade.
- ScrambleText: links around it keep their underline.
- Reveal: elements taller than five screens show; printing shows everything; the slash wipe follows `:dir(rtl)`.

Docs
- Password on every path except /healthz, also the built files (own Bun server); the server does not start without `DOCS_PASSWORD`. New page: all components on one page.

## 0.1.0

First release: stage 1 of docs/spec.md (foundations, brand, text, layout, actions, forms, Saudi forms and dates, overlays, feedback, navigation, Saudi and bilingual kit, motion, utilities).
