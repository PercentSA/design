# Changelog

All three packages (`@percentsa/tokens`, `@percentsa/ui`, `@percentsa/motion`) share one version. A tag `vX.Y.Z` publishes them (`.github/workflows/release.yml`).

## 0.14.0

Two layout options for record pages. Both are optional and off by default. Nothing changes for existing projects.

- [Grid](https://design.percent.sa/en/components/grid): `masonry` (default false). Each child moves up into the free space of its column, so cards of very different heights leave no gaps between rows. The DOM order is the reading and tab order, and children are placed in it (the next free place after the previous child). The server renders a normal grid; after mount the grid gets `data-masonry` (rows of 1 px, no row gap) and each child gets `grid-row-end: span N` from its height plus the gap, measured with one ResizeObserver on the children (never the grid) and again on font load and when a child is added or removed. A span is written only when it changes. Works with `cols`, `min` and RTL. Use `gap` for the space, not margins. Children take the height of their content (`h-full` is ignored), and print shows a normal grid. The grid ends at the last child (a negative bottom margin takes back the last gap).
- [DescriptionList](https://design.percent.sa/en/components/description-list): `cols` 1 | 2 | 3 (default 1). The pairs stay stacked (term above details) and flow in N columns, row by row. A column is at least 9rem of the list itself (a container query: 2 columns from 18rem, 3 from 27rem), so a list in a narrow card has fewer columns, down to one. The lines between rows run across each row, a last row with fewer pairs stretches them, and `density="compact"` works. `layout` still sets each pair: `stack` as above; `columns` puts the term beside its details, in columns of at least 18rem (2 columns from 36rem, 3 from 54rem); `auto` is stacked, and side by side when each column is 28rem or more.
- [RecordSection](https://design.percent.sa/en/components/record-section): `cols`, passed to its DescriptionList, and `layout="stack"` (term above details, for short facts in columns).

## 0.13.0

Till and board parts for POS screens, work boards and counter tablets. Every new prop is optional. One visible change for existing projects: a [Kanban](https://design.percent.sa/en/components/kanban) column with no cards now shows "No items" (in Arabic "لا توجد عناصر"); before, it showed nothing. Nothing else changes for an app that does not use the new props: the new control height token has the old value (32 px) everywhere except inside `data-density="touch"`.

- [ActionBar](https://design.percent.sa/en/components/action-bar) (new): the bottom bar of a work tool. `items` (`id`, `label`, `icon`, `keyHint`, `onSelect`, `tone` default/danger, `disabled`, `group` main/end), `label` (the name of the `nav`), `className`. Equal tiles 56 px high (64 px in touch density; 72 px when any item has a key hint and the pointer is a mouse, so the key keeps clear of the edge and the label) with a 20 px icon, the label (cut, full text in `title`) and a left-to-right `Kbd` hint hidden on a coarse pointer; `end` items follow a separator and stay in view; when a tile would be narrower than 5rem the last `main` items move into a "More" menu (label and key hint per row); no items renders nothing. The bar shows the hints, the app binds the keys. Strings `more` (and `moreActions` for the menu button name).
- [Keypad](https://design.percent.sa/en/components/keypad) (new): digit keys on a touch screen for an amount or a PIN. `value` and `onValueChange` (the draft text, Western digits and ".", as `MoneyInput`), `mode` amount/pin, `decimals` (2; 0 hides the "." key), `maxLength`, `disabled`, `label`. Keys are buttons in a 3-column grid, left to right in both languages, 56 px high: amount mode has 1 to 9, ".", 0, "00" and a backspace key; pin mode has 1 to 9, 0 and backspace. A leading zero is replaced by the next digit, a second "." and a further decimal are refused, and at `maxLength` the digit keys do nothing. A hardware keyboard works only while the focus is on the page or inside the keypad (never in a text field, dialog or menu, on a key repeat, or with Ctrl, Meta or Alt), and the key is taken only when it did something. Strings `keypad.backspace`, `point`, `doubleZero`.
- [PinPad](https://design.percent.sa/en/components/pin-pad): now built on the same key grid as Keypad. The API, look and behaviour are the same.
- [Kanban](https://design.percent.sa/en/components/kanban): work-board options. `onMove` is optional (without it: no drag, no Move menu; the card actions are the content of `renderCard`). Per column: `count` (a server total; `null` shows an ellipsis), `state` (`loading`: two skeleton cards on the first read; `error`: the error line and "Try again" after the loaded cards, or an error state when there are none), `onRetry`, `empty`, `hasMore`, `loadingMore`, `onLoadMore` (a "Load more" button, and the next page also loads by itself, once per page, when the end of the column scrolls into view). Board: `fill` (the height of the parent; each column scrolls by itself), `columnWidth="fill"` (the columns share the width, at least 14rem, then the row scrolls sideways), `phone="switch"` (below 768 px one column and a switch with title and count in its own scroll box; `column` and `onColumnChange` let the app keep the shown column in the address), `density="compact"` (card padding 0.625rem). The Move button follows the touch control height. Strings `noItems`, `loadMore`, `loadFailed`.
- [Button](https://design.percent.sa/en/components/button), [Toggle](https://design.percent.sa/en/components/toggle), SegmentedControl items, the [NumberInput](https://design.percent.sa/en/components/number-input) step buttons and menu rows: the small size follows a new token `--p-control-h-xs` (32 px in every current density, so nothing changes) instead of a fixed 32 px.
- `data-density="touch"` (tokens): on a coarse pointer `--p-control-h` is 48 px, `--p-control-h-sm` and `--p-control-h-xs` are 44 px (WCAG 2.5.5); on a fine pointer the compact values (40, 32, 32). `tokens.json` has a `density.touch` group.
- [AppShell](https://design.percent.sa/en/components/app-shell): `density` also accepts `"touch"`, and `fill` makes the shell as high as the screen with `<main>` a flex column with `min-h-0`, so a page box with `flex-1 min-h-0` takes the rest and scrolls inside its own regions. Default false: no change.
- [ListItem](https://design.percent.sa/en/components/list): `onSelect` (the row is one button; the title is its text; controls in `trailing` still work) and `disabled` (dim, no press). With `href`, `href` wins.
- [Card](https://design.percent.sa/en/components/card): `onSelect` (the whole card is one button; the title is its text, 2 lines at most with the full text in `title`), `disabled`, and `media` (above the header, the full width of the card). Works with `density="compact"`.
- [Thumbnail](https://design.percent.sa/en/components/thumbnail): `size="fill"` (the full width of its box, 4:3, `object-cover`).
- [Text](https://design.percent.sa/en/components/text): `tone="danger"`.

## 0.12.0

Form and phone-tool parts for admin forms and small field apps. Every new prop is optional. One visible change for existing projects: the footer of a `FormSheet` with `side="bottom"` now shows its two buttons in two equal columns, size large (before, they sat at the end at the normal size). Nothing else changes for an app that does not use the new props.

- [LineItemsEditor](https://design.percent.sa/en/components/line-items-editor) (new): the lines of a document in a form. `lines`, `getKey`, `columns` (`header`, `cell(line, ctx)`, `width` xs/sm/md/lg/fill, `align`, `readOnly`, `card` title/field/end/hide), `caption` (`hideCaption`), `onAdd` (`addLabel`), `onRemove` (`canRemove`), `lineActions` (a "⋯" menu), `detail` (`openDetails`, `onOpenDetailsChange`), `totals`, `empty`, `loading`, `error`, `disabled`, `numbered`. Table rows, or line cards when the part (measured with ResizeObserver) is narrower than the sum of its column minimums, "#" and the buttons. Enter never submits the form from inside the editor: next editable cell, next line, and a new line from the last cell. Focus goes to the new line after an add, and to the line that took its place (else the add button) after a remove; both are announced. `ctx.next()` moves the focus on after a pick. `Field` (and `FormField`) in a cell hides its label on rows and adds the line to its accessible name; on cards the label shows. Strings `lines.add`, `line`, `remove(n)`, `details`, `number`, `added(n)`, `removed(n)`, `more`.
- [FormBar](https://design.percent.sa/en/components/form-bar) (new): the action bar at the end of a form page or a long sheet form. `summary` (a live status area), buttons as `children`, `sticky` (default true). One row from 640 px; below it the summary has its own line and the buttons share the row.
- [PinPad](https://design.percent.sa/en/components/pin-pad) (new): a short numeric code on large keys. `length` (4), `label`, `onComplete(pin)` (keys off while its promise runs, then the pad clears), `onStart`, `error` (an alert under the dots; clears them), `disabled`. Masked dots and a 3 x 4 key grid in left-to-right order in both languages. Digit keys and Backspace on a hardware keyboard work (not while a text field has the focus). Screen readers hear a count, never the digits. Strings `pinPad.clear`, `pinPad.progress(n, total)`.
- [AppShell](https://design.percent.sa/en/components/app-shell): `sidebar` is optional. Without it there is no sidebar column, no menu button and no sheet, the header row shows at every width, and `--p-sticky-top` is the header height at every width. With neither a sidebar nor a header, only `<main>` renders (a development warning). The app draws its own logo and passes it in `header`; no logo part is added.
- [Sheet](https://design.percent.sa/en/components/sheet): `size="lg"` is `min(100%, 56rem)` for a side sheet, for a document made from another document (`md`, `min(100%, 28rem)`, is the default). A bottom sheet ignores it.
- [FormSheet](https://design.percent.sa/en/components/form-sheet): `size` (as Sheet), `blocked` (why the submit is refused now: shown above the buttons with a warning icon in a status area, the submit stays visible but disabled and points to the reason; `pending` wins over it; an empty value shows nothing), `danger` (the submit is a danger button) and `cancelLabel` (the close button's text, default Cancel). A submit while `blocked` does nothing. With `side="bottom"` the two buttons fill the footer in two equal columns, size large (the visible change above).

## 0.11.0

Report parts for admin dashboards and printed reports. Every new prop is optional. Two visible changes for existing projects: a [Stat](https://design.percent.sa/en/components/stat) tile now sizes its value and padding by its own width (a tile 15rem or wider looks as before), and `TableHead scope="row"` now looks like a body cell (before, it kept the column-header look).

- [Stat](https://design.percent.sa/en/components/stat): the tile is a container (`@container`), and the value size and padding follow the tile width: from 15rem `text-3xl` with `p-5` (as before), from 12rem `text-2xl`, from 10rem `text-xl`, below 10rem `text-lg`, with `p-4` under 15rem. An amount with decimals fits a tile of 158 px (two per row on a phone, four per row at 1024 px). The label, change and hint keep their sizes. The tile takes its width from its parent (a grid cell, flex-1 or a width); in a parent that sizes to its content it is 9rem wide. The padding now sits on an inner element, so a `className` padding on the tile no longer changes it.
- [PeriodPicker](https://design.percent.sa/en/components/period-picker): `presets` (the preset buttons of the custom range, as in DateRangePicker), `weekStart` (first day of the week in the custom range calendar and in "This week"; 0 Sunday … 6 Saturday) and `clearTo` (the period a cleared custom range goes back to; default this month).
- [DataTable](https://design.percent.sa/en/components/data-table): `density="print"` for a printed report: cells `text-xs px-1 py-1`, header row `h-8 px-1` with wrapping text, no scroll box (`overflow-visible`), no cards and no sticky header. Totals and group rows take the same small cells.
- [Table](https://design.percent.sa/en/components/table): `TableHead scope="row"` looks like a body cell (`py-3`, `text-sm`, `text-fg`, normal weight, wraps), and `TableHead wrap` lets a column header wrap with its height following the text.
- [RecordSummary](https://design.percent.sa/en/components/record-summary): docs only, one report example (the totals of a period).

## 0.10.0

List parts for admin screens. No breaking change: every new prop is optional. One visible change for existing projects: the first cell of a `DataTable` row with `rowHref` is now `font-medium` at all widths (before, only on the phone cards).

- [DataTable](https://design.percent.sa/en/components/data-table): a column takes `description` (a muted second line under the value; null, undefined and "" show nothing; in the first column of a row with `rowHref` it comes after the link, and links in it stay clickable) and `cardSlot` (below 768 px only: `"end"` at the end of the title line, `"meta"` in one wrapped line under the title, `"block"` full width under the meta; no header, and a cell with no value shows nothing). The table takes `density="compact"` (cells `py-2`, header row `h-9`, card rows `p-3` with `gap-y-1`).
- [FilterBar](https://design.percent.sa/en/components/filter-bar): `collapseOnPhone` folds the filter menus below 768 px into one "Filters" button with the count of chosen values. It opens a bottom Sheet with one group per filter (checkboxes, or radios when not `multiple`) and "Clear filters". Search, `actions` and the tags stay on the bar. Above 768 px nothing changes.
- [EmptyState](https://design.percent.sa/en/components/empty-state): `variant="plain"` has no dashed frame, for an empty state inside a table, a card or a sheet. DataTable uses it for its own default empty state (before, it set `border-0` on the framed one).

## 0.9.0

Record parts for admin screens. No breaking change: every new prop is optional, and a project that takes this version sees no change until it uses one.

- [RecordSummary](https://design.percent.sa/en/components/record-summary): the 1 to 6 key facts of a record in one dense strip under its header (label, value, hint per cell), with an optional `media` slot. The cells follow the width of the strip (container queries): one row from 56rem, 3 per row from 36rem, 2 per row below. Empty values show "Not set", long text is cut at 2 lines, `href` makes a value a link, and `loading` shows skeleton cells. New strings: `recordSummary`.
- [Thumbnail](https://design.percent.sa/en/components/thumbnail): a small square image (`sm` 40 px, `md` 64 px, `lg` 96 px) with a fallback icon for no image or a load error, an optional one-line `caption`, and an optional `href` that makes the whole thumbnail a link.
- [LineItemsTable](https://design.percent.sa/en/components/line-items-table): a line takes `media` (a small image), `description` (muted lines under the name), `parts` (the sub-lines of a kit, without a price) and `extra` (chips, file thumbnails); the table takes `totals` (a TotalsList under the table, at the end side) and `empty` (text in place of the rows). They show in the phone card rows too. New strings: `lines.kitParts`.
- [DescriptionList](https://design.percent.sa/en/components/description-list) and [RecordSection](https://design.percent.sa/en/components/record-section): `layout="auto"` puts the term and the details side by side when the list or section itself is 28rem wide or more (a container query), so one in a narrow grid cell stays stacked. `layout="columns"` is unchanged (it follows the screen, from 768 px).
- [Card](https://design.percent.sa/en/components/card), DescriptionList and RecordSection: `density="compact"` for dense records (Card: `p-4`, header gap 3, `text-base` title; DescriptionList rows: `py-2`).

## 0.8.2

A layout fix. No breaking change.

- Pagination, and DataTable with pages: below the `sm` breakpoint the current page shows without its neighbours (first, gap, current, gap, last). With 9 items the bar needed 356 px and pushed pages past the edge of a 360 px phone.

## 0.8.1

A layout fix. No breaking change.

- Input with `start` or `end` content, and the parts built on it (Combobox, list search): the input no longer sets the width of its parents. In Arabic, its intrinsic width of 317 px pushed pages past the edge of a 360 px phone.

## 0.8.0

ERP parts for documents, records, forms and reports. New entry `@percentsa/ui/react-hook-form` (optional peer `react-hook-form`). No breaking change.

- [DetailLayout](https://design.percent.sa/en/components/detail-layout): a main column and a side column (2:1) that never let a wide table push the page; one column on phones. [TotalsList](https://design.percent.sa/en/components/totals-list): document totals aligned under each other.
- [LineItemsTable](https://design.percent.sa/en/components/line-items-table): document lines with product and SKU, quantity, unit price, discount, VAT and total, a returned-quantity chip, and card rows on phones.
- DataTable totals (a total row) and groupBy, groupHeader, groupTotals (row groups with subtotals) for reports.
- [FormField](https://design.percent.sa/en/components/form-field) on the new entry @percentsa/ui/react-hook-form: binds a react-hook-form field to Field (label, hint, error, ids). react-hook-form is an optional peer; @percentsa/ui alone does not need it.
- [FormSheet](https://design.percent.sa/en/components/form-sheet): an edit form in a sheet with a sticky footer, a pending state and a guard for unsaved changes. [RecordSection](https://design.percent.sa/en/components/record-section): a record's facts as text, with its edit action.
- AlertDialog without a trigger gives focus back to the element that had it before it opened (was: the page).
- [ImageField](https://design.percent.sa/en/components/image-field): an image upload with preview, replace, remove and an upload callback.
- FileDrop disabled.
- Combobox: server search (onQueryChange, loading), long lists (limit), an "add new" option (onCreate), and valueLabel for a chosen value that is not in the results.
- [PeriodPicker](https://design.percent.sa/en/components/period-picker): a month, quarter, year or custom period for reports. periodOf and periodOptions give the same periods on the server. `calendar="hijri"` gives Umm al-Qura months, quarters (3 Hijri months) and years; the value stays Gregorian ISO days, and a Hijri year or quarter label ends with the era (`hijriEra`: "AH", «هـ»).
- [TimeInput](https://design.percent.sa/en/components/time-input) (12-hour time with AM/PM, ص/م in Arabic) and [DateTimePicker](https://design.percent.sa/en/components/date-time-picker). splitTime and joinTime convert between "HH:mm" and the 12-hour clock.
- NumberInput format: how a set value shows ([TimeInput](https://design.percent.sa/en/components/time-input) shows minutes as "05").
- [SaudiPlate](https://design.percent.sa/en/components/saudi-plate) (a Saudi private plate drawing; the middle strip shows the emblem, «السعودية», K S A and the private-car circle), [PlateInput](https://design.percent.sa/en/components/plate-input) (one field with a live plate) and parsePlate.
- Calendar, DatePicker and DateRangePicker: a month list and a year list between the previous and next buttons, in the Gregorian and the Hijri calendar. The years go from min to max, else from 100 years back to 10 years forward; months outside min and max are disabled. monthNames gives the 12 month names of a year.
- DateRangePicker defaultCalendar: the calendar shown first (was always Gregorian).
- The app's own words: IbanInput uses the app's placeholder (was: the built-in one won). PhoneInput takes the country names from the strings (new key `countries`). Invoice otherLanguageStrings replaces the built-in labels of the second language. The Language page of the docs shows how to give all built-in strings.
- useSidebarRail: the parts in the Sidebar `header` and `footer` know whether the sidebar is an icon rail. In the phone sheet the sidebar is always expanded, so it is false there.

## 0.7.0

ERP parts for app shells and lists. No breaking change: without the new props, components render as in 0.6.0.

- [TimeText](https://design.percent.sa/en/components/time-text), formatDateTime, formatRelative, formatTimeOfDay: dates and times in Riyadh time, 12-hour clock, relative words, the exact value on hover or tap.
- formatMoney and Money: decimals up to 6 for unit prices (maxDecimals) and brackets for negative amounts (accounting). formatPhone, phoneLinks and [PhoneText](https://design.percent.sa/en/components/phone-text): phone numbers for display, with call and WhatsApp links.
- formatMoney and Money: a result of zero has no minus sign (was "-0.00"), and a non-finite amount shows "—" (was "NaN").
- [StatusBadge](https://design.percent.sa/en/components/status-badge): a badge with a coloured dot in five tones; the colour is on the dot only. EmptyState tone="error" with a retry button. [NotFound](https://design.percent.sa/en/components/page-states) and [Forbidden](https://design.percent.sa/en/components/page-states) page states.
- [PageHeader](https://design.percent.sa/en/components/page-header): page title, status badges, a meta line, a back link, one primary action, secondary actions and a "⋯" menu; optional sticky. Menu items take a description (for example why an item is disabled).
- Calendar mode="range" and [DateRangePicker](https://design.percent.sa/en/components/date-range-picker) (size="sm" for toolbars): a date range with the presets today, yesterday, last 7 days, last 30 days, this week, this month and last month.
- DataTable: rowHref (the whole row opens the record), rowActions (a "⋯" menu per row) and cards (each row is a card below 768 px).
- [ColumnsMenu](https://design.percent.sa/en/components/columns-menu) (show and hide columns), DataTable hiddenColumns, a rows-per-page choice and a sticky header. FilterBar actions: the list toolbar's controls at the end of the bar.
- [PrintArea](https://design.percent.sa/en/components/print-area) and usePrint: print one part of a page on A4 (portrait or landscape) with a header on every page.
- PercentProvider location: a clicked link shows a pending state at once, until the new page is there. Sidebar, menus, breadcrumbs, cards, list rows and table row links get it.

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
