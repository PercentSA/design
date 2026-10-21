# Stage 2 — data display, charts, app patterns

Status: owner approved stage 2 on 2026-10-15 ("start stage 2"); the component list is spec §9. The APIs and the builder calls below were decided during the build; the owner can change them.

Everything in docs/spec.md still applies: React 19 + Tailwind v4 + Radix, black and white, EN + AR (RTL), dark + light, SSR-safe, WCAG 2.2 AA, reduced motion, Western digits, Riyal sign for money.

## Builder calls

1. **No chart library.** Charts are SVG drawn by our own code (spec: no other UI library). Line, area, bar, donut and sparkline cover dashboards; anything else is stage 3.
2. **Chart colours stay black and white.** Series use the grey scale (`fg`, `fg-2`, `fg-3`, `line-strong`) and differ also by dash pattern or marker shape, so colour is never the only difference. Green (`live`) is not a series colour. A client theme can pass its own series colours.
3. **Charts in Arabic run right to left.** The x axis follows the reading direction (time flows from right to left in Arabic), like the slash wipe. `mirror={false}` keeps left to right.
4. **Every chart has the data as a table** for screen readers (visually hidden), and a pointer/keyboard tooltip.
5. **QR codes use `uqr`** (MIT, no dependencies, unjs). A QR encoder is error-prone to write; the ZATCA TLV payload is ours.
6. **Kanban moves cards with drag and drop (mouse) and with a "Move to" menu** (keyboard, touch, screen readers). No drag library.
7. **CodeBlock has no syntax highlighter.** It shows plain code with line numbers, a file name and copy. A project that wants colours renders highlighted children (for example from Shiki on the server). No HTML strings (no `dangerouslySetInnerHTML`).
8. **Invoices are bilingual on one page** (Arabic and English labels side by side), as Saudi tax invoices usually are, whatever the page language. Amounts are computed in halalas (integers).
9. **KPI change arrows are neutral** (no red/green): an arrow and a sign; `tone="danger"` only when the owner of the data says it is bad.
10. **Data table is our own** (no TanStack): sort, select, paginate, loading, empty. Server-side data: the table is controlled (`sort`, `page` + callbacks).

## Components

Names are exports of `@percentsa/ui`. "Strings" = keys added to the built-in strings (EN + AR).

### Data display (`components/data-*.tsx` and others)

- `Card` — `title?`, `description?`, `action?` (node at the end of the header), `footer?`, `href?` (whole card is one link; the title is the link text; other links inside stay clickable), `children`. Built on `Surface`.
- `Table` — styled native table: `Table` (scroll container + `<table>`, `caption?`), `TableHeader`, `TableBody`, `TableRow`, `TableHead` (`align?: "start" | "end" | "center"`), `TableCell` (`align?`). Numbers: `align="end"` + tabular digits.
- `DataTable<Row>` — `columns: { key: string; header: ReactNode; cell?: (row) => ReactNode; sortValue?: (row) => string | number; sortable?: boolean; align?: "start" | "end" | "center"; width?: string }[]`, `rows: Row[]`, `getRowId(row)`, `caption` (required, may be visually hidden), sort: `sort?`/`defaultSort?` `{ key, direction: "asc" | "desc" }` + `onSortChange?` (header buttons, `aria-sort`), selection: `selectable?`, `selected?`/`defaultSelected?` (ids) + `onSelectedChange?` (header checkbox with indeterminate state), pagination: `pageSize?` (client-side) or `page?` + `pageCount?` + `onPageChange?` (server-side) using `Pagination`, `loading?` (skeleton rows, `aria-busy`), `empty?` (node; default `EmptyState` with `noResults`). Sorting uses `Intl.Collator(lang, { numeric: true })`. Strings: `selectAll`, `selectRow`, `selectedCount(n)`.
- `List`, `ListItem` — `ListItem`: `leading?`, `title`, `description?`, `trailing?`, `href?`. Dividers between items.
- `DescriptionList` — `items: { term: ReactNode; details: ReactNode }[]`, `layout?: "stack" | "columns"` (columns from 768 px).
- `Stat` (KPI) — `label`, `value` (node: number, `Money`, `FormattedNumber`), `change?: { value: string; direction: "up" | "down" | "flat"; tone?: "neutral" | "danger" }`, `hint?`, `chart?` (node, e.g. `Sparkline`). Strings: `increase`/`decrease` exist; add `noChange`.
- `Timeline` — `items: { id; time: ReactNode; title: ReactNode; description?; status?: "done" | "current" | "next" }[]`. Vertical, line on the start side.
- `Accordion` — Radix Accordion: `items: { value; title; content; disabled? }[]`, `type?: "single" | "multiple"`, `defaultValue?`/`value?`/`onValueChange?`, `collapsible` default true for single.
- `Tree` — ARIA tree view: `items: TreeNode[]` (`{ id; label; icon?; children? }`), `expanded?`/`defaultExpanded?` + `onExpandedChange?`, `selected?` + `onSelect?`. Keyboard: arrows (Left/Right mirrored in RTL), Home/End, Enter/Space select; roving tabindex.
- `Avatar` — Radix Avatar: `src?`, `name` (initials fallback: first letters of the first two words; Arabic too), `size?: "sm" | "md" | "lg"`. `AvatarGroup` — `max?`, shows "+N". Strings: `moreCount(n)`.
- `CodeBlock` — `code: string`, `language?` (label only), `filename?`, `lineNumbers?` (default true), `highlight?: number[]` (lines), `children?` (pre-highlighted content replaces the plain code), copy button. Always LTR.
- `JsonViewer` — `value: unknown`, `defaultDepth?` (default 1), collapsible objects and arrays (buttons with `aria-expanded`), type styling with greys and mono, LTR. Strings: `expand`, `collapse`, `itemCount(n)`.

### Boards and calendars

- `Kanban<Card>` — `columns: { id; title; cards: Card[] }[]`, `getCardId(card)`, `renderCard(card)`, `onMove(cardId, toColumnId, toIndex)`. Mouse: HTML drag and drop with a drop indicator. Keyboard/touch: a "Move to" menu button on each card (DropdownMenu with the other columns). Moves are announced (LiveRegion). Horizontal scroll on small screens. Strings: `moveTo(column)`, `moveCard`, `cardMoved(card, column)`.
- `CalendarView` — month grid with events: `events: { id; title; start: PlainDate; end?: PlainDate; tone?: "default" | "muted" }[]`, `month?`/`defaultMonth?` (`MonthView`), `onMonthChange?`, `calendar?: "gregorian" | "hijri"`, `weekStart?` (0), `onDayClick?(day)`, `onEventClick?(event)`. Up to 3 events per day, then "+N more" (Popover with the full list). Below 768 px it shows a list (agenda) of the month's days that have events. Strings: `today`, `moreEvents(n)`.

### Charts (`components/charts/*`)

Shared: `data: Record<string, number | string>[]`, `x: string` (key), `series: { key: string; label: ReactNode; color?: string }[]`, `height?` (default 240), `format?: (n: number) => string` (default `formatNumber` in the page language), `title` (required: the accessible name and the hidden table caption), `mirror?` (default: true in RTL). Responsive width (ResizeObserver after mount; SSR renders at a fixed width and scales — no hydration mismatch). Pointer and keyboard: the chart is one tab stop; Left/Right (mirrored) move between x values; a tooltip shows the values and a polite live region announces them. Gridlines in `line`, axis text in `fg-3`.

- `LineChart` (`curve?: "linear" | "monotone"`, markers optional), `AreaChart` (stacked optional), `BarChart` (`layout?: "vertical" | "horizontal"`, grouped or `stacked`), `DonutChart` (`data: { label; value }[]`, centre `label`/`value`, legend), `Sparkline` (`values: number[]`, decorative unless `title`), `ChartLegend`.
- Reduced motion: no draw-in animation (the only animation is a short draw-in on first view).

### App patterns

- `AppShell` — `sidebar`, `header?`, `children`; sidebar fixed on the start side from 1024 px, a `Sheet` below; skip link to main; `density="compact"` by default (`data-density`); `embedded?` (0.2.1): no `<header>`/`<main>` landmarks and no skip link, for a shell inside a page that has its own.
- `Sidebar` — `sections: { title?: ReactNode; items: { href; label; icon?; badge?; current? }[] }[]`, `header?` (brand), `footer?` (user menu), `collapsed?`/`onCollapsedChange?` (icon rail with tooltips). Strings: `collapseSidebar`, `expandSidebar`, `openNavigation`.
- `CommandPalette` — `open`/`onOpenChange`, `commands: { id; label; group?; icon?; shortcut?; keywords?: string[]; onSelect() }[]`, `placeholder?`. Dialog + combobox listbox, `searchKey` matching (Arabic-aware), groups, Up/Down/Enter/Escape. `useCommandShortcut(onOpen)` binds Ctrl+K / ⌘K. Strings: `commandPalette`, `searchCommands`.
- `FilterBar` — `search?: { value; onValueChange; placeholder? }`, `filters: { key; label; options: { value; label }[]; multiple?: boolean }[]`, `value: Record<string, string[]>`, `onValueChange`. Each filter is a button with a menu of checkbox items; active filters show as removable `Tag`s; "Clear filters". Strings: `filters`, `clearFilters`.
- `SettingsSection` (`title`, `description?`, `children`, `footer?`) and `SettingsRow` (`label`, `description?`, `control`; label left / control right on wide screens, stacked on phones).
- `AuthLayout` — `brand?`, `title`, `description?`, `children` (the form), `footer?` (links), `aside?` (picture panel from 1024 px). Docs show recipes: sign in, sign up, forgot password, OTP verification, built from existing fields.

### Business

- Helpers (`saudi/invoice.ts`): `invoiceTotals(lines: { quantity: number; unitPrice: number; vatRate?: number; discount?: number }[])` → `{ lines: { net; vat; total }[]; subtotal; vat; total }` computed in halalas and returned in riyals (2 decimals); default VAT 15 %. `zatcaTlv({ seller, vatNumber, timestamp, total, vat })` → base64 TLV (tags 1–5, ZATCA phase 1 / simplified invoice QR; UTF-8 lengths, error when a value is longer than 255 bytes).
- `QrCode` — `value: string`, `size?`, `label` (accessible name), quiet zone; SVG from `uqr`, black on white in every theme (review fix: scanners often cannot read inverted codes).
- `ZatcaQr` — `QrCode` of `zatcaTlv(...)`.
- `Invoice` — `type: "standard" | "simplified"`, `number`, `issueDate: PlainDate`, `seller` / `buyer` (`{ name; vatNumber?; crNumber?; address? }`), `lines: { description; quantity; unitPrice; vatRate? }[]`, `notes?`, `showHijri?`, `qr?: boolean` (ZATCA QR from the totals). Bilingual labels (EN + AR on one page). Print styles: white paper, black text in every theme, no shadows.
- `TicketView` — `subject`, `id`, `status: ReactNode` (e.g. `Badge`), `meta: { term; details }[]` (side panel, `DescriptionList`), `messages: { id; author: { name; avatar? }; time: ReactNode; body: ReactNode; internal?: boolean; attachments?: { name; href; size? }[] }[]`, `composer?` (node: the reply form). Internal notes have a dashed border and a label. Strings: `internalNote`, `attachments`.

## Docs

New groups: Data display, Boards and calendars, Charts, App patterns, Business. One page per component with examples in EN and AR; the overview page `/:lang/all` picks them up.
