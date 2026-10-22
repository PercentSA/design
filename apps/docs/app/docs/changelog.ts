export type ChangeKind = "new" | "better" | "fixed" | "action";

/** English only: the entries show in English on Arabic pages too. */
export type Release = {
  version: string;
  /** Tag date (YYYY-MM-DD); null until the version is tagged. */
  date: string | null;
  summary: string;
  changes: { kind: ChangeKind; text: string }[];
};

const c = (kind: ChangeKind, text: string) => ({ kind, text });

/** What each version changes, in plain words, newest first. One entry per "## X.Y.Z" in CHANGELOG.md (test/changelog.test.ts). */
export const RELEASES: Release[] = [
  {
    version: "0.8.0",
    date: null,
    summary: "Parts for documents, records, forms and reports. Nothing changes for existing projects.",
    changes: [
      c("new", "DetailLayout puts a record page in two columns: the main part and a side column with details and totals. A wide table scrolls inside its column, so the page never gets wider. On phones the columns stack, main part first. TotalsList shows a document's totals with the amounts under each other."),
      c("new", "LineItemsTable shows the lines of an order or invoice: product and SKU, quantity, unit price, discount, VAT and total. The headers say whether prices include VAT, a chip shows a returned quantity, and on phones each line is a card."),
    ],
  },
  {
    version: "0.7.0",
    date: "2026-10-22",
    summary: "Parts for app screens and lists. Nothing changes for existing projects.",
    changes: [
      c("new", "TimeText shows a date or time the short way, in Riyadh time: \"3:45 PM\" today, \"Yesterday 3:45 PM\", \"12 September, 3:45 PM\" this year. Hover, focus or tap shows the exact value. formatDateTime, formatRelative and formatTimeOfDay give the same text for tables, exports and printouts."),
      c("new", "Money and formatMoney can keep up to 6 decimals for unit prices, and can put negative amounts in brackets: (1,234.50)."),
      c("fixed", "formatMoney never shows -0.00, and shows \"—\" for an amount that is not a number, so a broken value does not look like zero."),
      c("new", "PhoneText shows a phone number as a call link (\"+966 55 000 0999\"), with an optional WhatsApp link. formatPhone and phoneLinks give the text and the links."),
      c("new", "StatusBadge shows a status (Paid, Overdue) with a coloured dot in five tones. The colour is on the dot only, so the text stays readable."),
      c("new", "EmptyState can show a load error with a \"Try again\" button. NotFound and Forbidden are ready pages for a missing record and for a page the user may not open."),
      c("new", "PageHeader is the top of a list or record page: the title with status badges, a back link to the list, one primary action, and the other actions in a \"⋯\" menu. On phones the primary action is full width and \"More actions\" opens the rest."),
      c("new", "Menu items can show a second line under the label, for example why an item is disabled."),
      c("new", "DateRangePicker chooses a date range for a list filter, with the presets today, yesterday, this week, this month and last month. Calendar can choose a range too. The small size fits a list toolbar."),
      c("new", "DataTable rows can open their record: the whole row is one link, and the checkbox and the \"⋯\" row menu still work. On phones, the rows can show as cards."),
      c("new", "ColumnsMenu lets people show and hide table columns. DataTable can offer a rows-per-page choice and keep its header row in view while the rows scroll. FilterBar takes the list's other controls (date range, columns, refresh) at its end, so one bar is the whole list toolbar."),
      c("new", "PrintArea and usePrint print one part of a page, such as a list, on A4 paper, black on white in any theme. The title repeats on every page, page numbers are at the bottom, and nothing else on the page prints."),
      c("new", "Links react at once: give PercentProvider the router's location, and a clicked link in the sidebar, a menu, the breadcrumbs, a card or a table row shows a thin bar until the new page is there."),
    ],
  },
  {
    version: "0.6.0",
    date: "2026-10-22",
    summary: "The Percent logo on a grid: one square is 100 units, so every size is a round number. The logo keeps its shapes and motion; its sizes change.",
    changes: [
      c("better", "The icon is 3 by 3 squares, the English name is as high as the icon, and the Arabic name is as wide as the English, with a long س."),
      c("action", "MARK_PATH and SLASH_RUN change: the icon is 292 units square, and the slash wipes are a little steeper (0.6667). Check pages that draw the mark themselves."),
      c("action", "The loader is wider for its height (view box -620 -50 1240 400), and the stacked logo needs at least 48 px."),
      c("new", "The sizes of the previous logo stay in the code (LOGO_SIZES_0_5), so it can come back if needed."),
      c("better", "The Brand page draws the logo on its grid. The SVG downloads are new."),
    ],
  },
  {
    version: "0.5.1",
    date: "2026-10-21",
    summary: "The packages now work in React Server Components, for example the Next.js App Router. Nothing changes for existing projects.",
    changes: [
      c("new", "Works with React Server Components: interactive components are marked as client components, and functions such as formatMoney and buttonClass can run on the server."),
      c("better", "TypeScript finds the types with every module setting, including nodenext."),
      c("new", "A Server components page in the docs shows what works on the server, how to set up the provider in a Next.js app, and how to handle events."),
      c("better", "Published straight from GitHub with npm provenance, so you can check where each version came from."),
    ],
  },
  {
    version: "0.5.0",
    date: "2026-10-21",
    summary: "First public release: open source (MIT) and on npm, with no token needed to install. The new Percent logo: the % icon with the Arabic and English names, in seven versions, and a loader that moves between them. Includes the 0.4.1 changes.",
    changes: [
      c("new", "One logo component draws all seven versions: the icon, each name alone, the icon with one name, both names in a row, and both names stacked."),
      c("new", "A loader turns the icon into the Arabic name, back, into the English name and back. It moves only while you can see it, and stays still if you ask your device for less motion."),
      c("new", "A Brand page in the docs: clear space, smallest sizes, colours, what not to do, the loader and SVG downloads of every version."),
      c("action", "The old wordmark (the % with \"Percent\" in a font) is gone. Use the logo component; headers and sign-in pages now show the icon with the name in the page language."),
      c("action", "Fonts are yours now: the packages ship no font files. Load your fonts, set --p-font-sans, --p-font-sans-ar and --p-font-mono, and remove the fonts.css import. Without them, text uses the device's fonts."),
      c("action", "Install from npm: remove the @percentsa registry line from your .npmrc."),
      c("new", "The code is open source under the MIT license. The Percent name and logos are not part of the license: set your own logo with the brand setting."),
      c("new", "Each package has its own page on npm, with a README."),
    ],
  },
  {
    version: "0.4.1",
    date: "2026-10-21",
    summary: "The site header and footer fit more page layouts. Nothing changes for existing projects. Not published alone: these changes came out in 0.5.0.",
    changes: [
      c("new", "The site header can stay at the top, stick while you scroll, or scroll away with the page."),
      c("new", "The header and footer can follow a page with a maximum width (for example 1440 px). Backgrounds and borders still go from edge to edge."),
      c("better", "A header without links shows its buttons on phones too, and has no empty menu."),
    ],
  },
  {
    version: "0.4.0",
    date: "2026-10-21",
    summary: "Brands: any project can use its own colors, fonts, corner radius and logo. Percent projects look the same as before.",
    changes: [
      c("new", "One brand file sets a project's colors, fonts, corner radius and logo. You do not need your own copy of the design system."),
      c("new", "Dark, light and system modes (system follows the device), with a ready switch that remembers the choice."),
      c("new", "A check lists the brand color pairs that are hard to read (WCAG AA)."),
      c("new", "The site footer takes link columns, social links, contact details, a notice and your own content."),
      c("better", "Selected items (choices, tabs, sliders, steps, progress) use the brand's main color."),
      c("better", "Charts use the brand's colors and keep their patterns, so you can tell series apart without color too."),
      c("new", "A confirm dialog can wait until a save is done. Notifications can have an Undo button. Menu items can be links."),
    ],
  },
  {
    version: "0.3.1",
    date: "2026-10-21",
    summary: "Bug fixes from a review of every component.",
    changes: [
      c("fixed", "Typing a letter in the one-time code boxes no longer jumps to the next box."),
      c("fixed", "In Arabic, the Riyal sign is on the left of the amount again."),
      c("fixed", "A full ID, CR, VAT, IBAN or money field refuses an extra key. Before, it dropped the last character."),
      c("fixed", "Charts show a gap for a missing value, not a zero."),
      c("fixed", "An invoice whose QR code cannot be made no longer breaks the page."),
      c("better", "Tables, lists and animations do less work, so pages stay fast."),
    ],
  },
  {
    version: "0.3.0",
    date: "2026-10-15",
    summary: "Motion: new animations for text, numbers and navigation. All of them respect the reduced-motion setting.",
    changes: [
      c("new", "Headings can rise in word by word. Arabic words are never split."),
      c("new", "Numbers can roll to a new value (prices, totals)."),
      c("new", "Tabs and the sidebar slide one indicator to the active item. Items in boards and lists glide to their new place."),
      c("new", "Page changes can fade, or wipe in at the slash angle."),
      c("new", "On phones, you can drag a sheet to close it."),
      c("new", "A check tells a Saudi national ID from an iqama number."),
    ],
  },
  {
    version: "0.2.1",
    date: "2026-10-15",
    summary: "Fixes and a public docs site. Not published alone: these changes came out in 0.3.0.",
    changes: [
      c("better", "The docs site is public. Anyone can copy single components with the shadcn command."),
      c("better", "A phone field sends the country with the form, also without JavaScript."),
      c("fixed", "Typing in the middle of a formatted number (IBAN, money, ID) keeps the cursor in place."),
      c("better", "The browser's find (Ctrl+F) finds text in closed accordion panels and opens them."),
      c("action", "Put one Toaster in the root layout. A notification sent while no Toaster is on the page is dropped."),
    ],
  },
  {
    version: "0.2.0",
    date: "2026-10-15",
    summary: "Data, boards, charts, app layouts and invoices.",
    changes: [
      c("new", "Cards, tables (sort, select, pages), lists, stats, timeline, accordion, tree, avatars and code blocks."),
      c("new", "A drag-and-drop board that also works with the keyboard, and a month calendar (Gregorian and Hijri)."),
      c("new", "Line, area, bar and donut charts. They mirror in Arabic and have a hidden table for screen readers."),
      c("new", "App layouts: shell, sidebar, command palette (Ctrl+K), filter bar, settings rows and a sign-in page."),
      c("new", "A bilingual tax invoice with the ZATCA QR code, and a support ticket view."),
    ],
  },
  {
    version: "0.1.1",
    date: "2026-10-15",
    summary: "Easier to read and to use with the keyboard.",
    changes: [
      c("fixed", "Grey text in menus, dialogs and notifications is easier to read (WCAG AA)."),
      c("fixed", "In the date picker, keyboard focus starts on a day you can choose."),
      c("fixed", "A combobox in a dialog: Escape closes only the list, and the list is not cut off."),
      c("better", "A loading button keeps focus and tells screen readers that it is loading."),
      c("new", "Moving text (marquee) has a pause button."),
    ],
  },
  {
    version: "0.1.0",
    date: "2026-10-14",
    summary: "First release.",
    changes: [
      c("new", "Colors, type, spacing and fonts, in dark and light."),
      c("new", "Text, layout, buttons, forms, dialogs, menus, notifications and navigation, in English and Arabic."),
      c("new", "Saudi kit: phone, national ID, CR, VAT, IBAN, national address, money with the Riyal sign, and Hijri dates."),
      c("new", "Percent motion: text scramble, reveal, slash wipe and marquee."),
    ],
  },
];
