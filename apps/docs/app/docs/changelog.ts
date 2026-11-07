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

/** The name of a new component links to its page: write `[Name](slug)` in the text. */
export const LINK = /\[([^\]]+)\]\(([a-z0-9-]+)\)/;

/** What each version changes, in plain words, newest first. One entry per "## X.Y.Z" in CHANGELOG.md (test/changelog.test.ts). */
export const RELEASES: Release[] = [
  {
    version: "0.17.0",
    date: "2026-11-08",
    summary: "The Sidebar collapse button shows its words, and SideNav can be an icon column.",
    changes: [
      c("new", "[Sidebar](sidebar): the collapse button shows its words beside the icon while the sidebar is expanded. In the rail it is the icon alone, with the words as tooltip and accessible name. The words are the provider strings collapseSidebar and expandSidebar. New prop toggleLabel (default true); false keeps the icon only."),
      c("new", "[SideNav](side-nav): new prop iconOnly for variant column. Each item is its icon in a touch-sized box, with the label as tooltip and accessible name; group headings are for screen readers only; a badge is a small dot; an item without an icon shows the first letter of its label. No effect on variant list. The docs show an icon column from 768 px and the full column from 1280 px."),
    ],
  },
  {
    version: "0.16.4",
    date: "2026-11-07",
    summary: "A segmented choice whose label wraps keeps space around the text.",
    changes: [
      c("fixed", "[SegmentedControl](segmented-control) and [ToggleGroup](segmented-control): a choice whose label wraps to two lines keeps space above and below the text and shows as a rounded box. Before, the text touched the edges. A choice of one line looks the same as before."),
    ],
  },
  {
    version: "0.16.3",
    date: "2026-11-07",
    summary: "A toggle group that wraps stays a rounded box.",
    changes: [
      c("fixed", "[ToggleGroup](segmented-control): the choices wrap to more rows when they do not fit, and the group stays a rounded box. Before, a group that wrapped showed as an ellipse. A group of one row looks the same as before."),
    ],
  },
  {
    version: "0.16.2",
    date: "2026-11-07",
    summary: "A form sheet's footer reaches the bottom edge of the sheet, and the step buttons of a time field follow the page direction.",
    changes: [
      c("fixed", "[FormSheet](form-sheet): the footer now reaches the bottom edge of the sheet. Before, it stopped 24 px above the edge, and a long form showed its fields in that gap."),
      c("fixed", "[TimeInput](time-input): the step buttons of each box follow the page direction, as in every NumberInput (in Arabic, minus on the right). The boxes stay in clock order, hour first."),
    ],
  },
  {
    version: "0.16.1",
    date: "2026-11-07",
    summary: "An image field can show a whole logo, and a white logo on a dark surface.",
    changes: [
      c("new", "[ImageField](image-field): `fit` (\"contain\" shows the whole image, for a logo; the default \"cover\" is unchanged) and `previewTheme` (\"dark\" shows the preview on a dark surface in both page themes, for a white logo)."),
    ],
  },
  {
    version: "0.16.0",
    date: "2026-11-07",
    summary: "A side navigation for settings areas and other areas with many sections.",
    changes: [
      c("new", "[SideNav](side-nav): in-page navigation in groups with headings. A compact column (sticky if you want, under the AppShell header) or, with variant list, a full-width list with a description under each label and a chevron: the settings home on a phone."),
    ],
  },
  {
    version: "0.15.1",
    date: "2026-11-07",
    summary: "Fields in one row stay aligned when one of them is taller.",
    changes: [
      c("fixed", "[Field](field) and [PhoneInput](phone-input): next to a taller field in a grid row, the label and the control stay at the top of the cell. Before, the field stretched and its label and control moved apart."),
    ],
  },
  {
    version: "0.15.0",
    date: "2026-11-06",
    summary: "Settings rows show errors and a saved state, a form settings row for react-hook-form, and move buttons for ordered lists.",
    changes: [
      c("new", "[SettingsSection](settings): status, a short state at the start of the footer (Unsaved changes, Changes saved.), read politely. It shows with footer and wraps above the buttons below 640 px."),
      c("new", "[SettingsRow](settings): error, required and optional. The error shows under the control; with controlId the control gets aria-invalid and the error in aria-describedby, as in Field."),
      c("new", "[FormSettingsRow](form-settings-row): a react-hook-form field in a SettingsRow, as FormField is for Field (group for a Switch or Checkbox). Import it from @percentsa/ui/react-hook-form."),
      c("new", "[ListItem](list): move, with move up and move down buttons for an ordered list. The focus stays on the moved row's button and the new place is announced in the page language."),
    ],
  },
  {
    version: "0.14.4",
    date: "2026-11-06",
    summary: "A comma in an amount is the decimal mark, the keypad replaces a prefilled amount, and the line editor puts the focus in the right place.",
    changes: [
      c("fixed", "[MoneyInput](money-input) and [NumberInput](number-input): a comma in a number without a \".\" is now the decimal mark (10,5 is 10.5, before it read as 105). Next to a \".\" a comma still groups thousands and is dropped (1,250.50 is 1250.50)."),
      c("fixed", "[Keypad](keypad): a prefilled value is replaced by the first key, as on a calculator; backspace clears it. Before, a digit was added to the end of the prefilled value."),
      c("fixed", "[LineItemsEditor](line-items-editor): a focus move (Enter, a new line, a removed line) goes to the text input of the cell, not to the \"−\" button of a NumberInput, and selects the text, so a typed value replaces the old one."),
      c("better", "[LineItemsEditor](line-items-editor): with disabled, the add button shows disabled instead of hidden; the table is no longer an extra tab stop."),
      c("new", "[Table](table): scrolls={false} for a table that never scrolls sideways; its region is then no tab stop."),
      c("better", "[Card](card) and [ListItem](list) with onSelect: the press button is described by the description and the body or the trailing part, so a screen reader hears the price, the state or the phone with the name."),
    ],
  },
  {
    version: "0.14.3",
    date: "2026-11-06",
    summary: "A chosen link button shows, and phone cards stay inside their box.",
    changes: [
      c("better", "[Button](button): a link button that is pressed (aria-pressed) is bold with a full underline, so the chosen item of a list of link buttons shows."),
      c("fixed", "[DataTable](data-table) with cards: a wide group or total row no longer makes the phone cards wider than the table box."),
    ],
  },
  {
    version: "0.14.2",
    date: "2026-11-06",
    summary: "The phone field looks the same in Arabic and English.",
    changes: [
      c("fixed", "[PhoneInput](phone-input): in Arabic the country code now sits on the left of the number, as in English, because a phone number reads left to right. Labels and messages keep the page direction."),
    ],
  },
  {
    version: "0.14.1",
    date: "2026-11-06",
    summary: "Description lists in columns fit narrower cards.",
    changes: [
      c("better", "[DescriptionList](description-list) with cols: a column of stacked pairs is now at least 8rem (was 9rem), so a card in a three-column record grid shows its short money rows in 2 columns. Lists with the term beside its details are unchanged."),
    ],
  },
  {
    version: "0.14.0",
    date: "2026-11-05",
    summary: "Two layout options for record pages: a grid where cards move up into the free space, and description lists in two or three columns. Nothing changes for existing projects.",
    changes: [
      c("new", "[Grid](grid) has a masonry option. On a record page with a long details card next to a short refunds card, each card moves up into the free space of its column, so there are no big gaps between rows. The reading and tab order stay the page order. The server sends a normal grid and the browser arranges the cards after the page loads. Use the grid gap for the space, not margins. Cards keep the height of their content, and a printed page shows a normal grid."),
      c("new", "[DescriptionList](description-list) can flow in two or three columns (cols), with the term above its details: good for short money rows such as a cash summary. A column is at least 9rem of the list itself, so the same list in a narrow card or on a phone shows fewer columns, down to one. The lines run across each row, and it works with compact density. The layout option still sets each pair: term above its details, beside them (in wider columns), or beside them when there is room."),
      c("new", "[RecordSection](record-section) passes cols to its list, and can show its facts stacked (layout stack)."),
    ],
  },
  {
    version: "0.13.0",
    date: "2026-11-05",
    summary: "Parts for tills, work boards and counter tablets: an action bar, a digit keypad, a Kanban that works as a status board with server counts and pages, and a touch density. One visible change for existing projects: a Kanban column with no cards now says \"No items\".",
    changes: [
      c("new", "[ActionBar](action-bar) is the bottom bar of a till, a kiosk or a picking tool: equal tiles with an icon, a label and a key hint such as F2 (hidden on a touch screen). When any tile has a key hint, all tiles are taller so the key never touches the edge. A danger item can sit after a separator. When the bar is narrow the last tiles go into a More menu. The app binds the keys; the bar only shows them."),
      c("new", "[Keypad](keypad) puts digit keys on a touch screen for an amount or a PIN, so the system keyboard does not cover a dialog. An amount keypad has a point, 00 and backspace and refuses a third decimal; a PIN keypad has the digits and backspace. The keys read left to right in Arabic, like a phone, and a hardware keyboard works only while the focus is on the page or inside the keypad."),
      c("better", "[PinPad](pin-pad) now shares its key grid with the keypad. It looks and works as before."),
      c("better", "[Kanban](kanban) can be a work board. Leave out onMove and there is no drag and no Move menu; the card actions are yours. Each column can show a count from the server, a loading state, an error with Try again (the loaded cards stay), its own empty text, and pages: a Load more button that also loads the next page by itself when you reach the end. The board can fill the height of its parent with each column scrolling alone, share the width, show one column with a switch on a phone, and use compact cards."),
      c("better", "A [Kanban](kanban) column with no cards now shows \"No items\" (before, nothing)."),
      c("new", "Touch density: put data-density=\"touch\" on a counter tablet screen or on [AppShell](app-shell) (density=\"touch\"). On a touch screen the controls grow to 44 to 48 px; with a mouse they keep the compact sizes. The small [Button](button), [Toggle](toggle), segmented control items, number steps and menu rows follow the new --p-control-h-xs token, which is 32 px everywhere else, so nothing changes without it."),
      c("new", "[AppShell](app-shell) can fill the screen (fill): the page box takes the height that is left and scrolls inside its own regions, so a till, a board or a calendar needs no calc() for the header."),
      c("new", "[ListItem](list) and [Card](card) can be one button (onSelect, disabled) for a pickable row or tile, and a card can carry an image above its header (media) with a full-width [Thumbnail](thumbnail) (size=\"fill\")."),
      c("new", "[Text](text) has a danger tone for a shortfall or a refused state."),
    ],
  },
  {
    version: "0.12.0",
    date: "2026-11-05",
    summary: "Parts for form pages and small phone tools: a line editor, a form action bar, a PIN pad, an app frame without a sidebar, and a wider sheet. One visible change for existing projects: a form sheet from the bottom now shows its two buttons in two equal columns, large.",
    changes: [
      c("new", "[LineItemsEditor](line-items-editor) is for the lines of a quote, order, invoice or stocktake in a form. Your inputs sit in the cells, with add, remove, a menu and details for each line, and totals below. Enter moves to the next cell and the next line, and from the last cell it adds a line; it never sends the form. After an add or a remove the focus goes to the right place and a screen reader hears what changed. On a narrow width the rows become cards."),
      c("new", "[FormBar](form-bar) is the bar at the end of a form page: a short live summary (a total, a count) at the start and the buttons at the end. It stays at the bottom of the scroll area. On a phone the summary has its own line and the buttons share the row."),
      c("new", "[PinPad](pin-pad) is for a short code on large keys, such as a device lock or a cashier switch. The dots hide the digits, a screen reader hears only how many were typed, and a hardware keyboard works. The keys stop while the code is checked."),
      c("new", "[AppShell](app-shell) works without a sidebar: no menu button, and the header row shows at every width. Use it for a driver app, a partner portal or a kiosk."),
      c("new", "[Sheet](sheet) can be wide (size=\"lg\", 56rem) for a document made from another document."),
      c("new", "[FormSheet](form-sheet) can say why the submit is refused (blocked): the reason shows above the buttons, announced, and the button stays visible but off. It also takes size, danger (a red submit button) and cancelLabel."),
      c("better", "A [FormSheet](form-sheet) from the bottom now shows its two buttons in two equal columns, large. Before, they were small and at the end."),
    ],
  },
  {
    version: "0.11.0",
    date: "2026-11-05",
    summary: "Parts for reports and dashboards. Two visible changes for existing projects: a Stat tile now sizes its value by its own width, and a row header in a table now looks like a normal cell.",
    changes: [
      c("new", "[PeriodPicker](period-picker) can show preset buttons in its custom range (today, yesterday, last 7 days…), start the week on Saturday, and go back to a period you choose when the custom range is cleared."),
      c("new", "[DataTable](data-table) has density=\"print\" for a printed report: small cells, headers that wrap, no scroll box and no cards, so a wide table fits the page. Total and group rows follow."),
      c("new", "[Table](table) column headers can wrap onto more lines (wrap)."),
      c("better", "A [Stat](stat) tile now sizes its value and padding by its own width, not the screen. A wide tile looks as before; narrower tiles use smaller text, so an amount with decimals fits four tiles in a row or two on a phone. The tile takes its width from its parent (a grid cell, flex-1 or a width); in a parent that sizes to its content it is 9rem wide. Padding set with className on the tile no longer changes the inner padding."),
      c("better", "A row header in a [Table](table) (TableHead with scope=\"row\") now looks like a normal cell: normal weight, regular text size and colour, and it wraps. Before, it looked like a column header."),
      c("new", "The [RecordSummary](record-summary) page has a report example: the totals of a period."),
    ],
  },
  {
    version: "0.10.0",
    date: "2026-11-05",
    summary: "Parts for lists in an admin app. Nothing changes for existing projects, except that the first cell of a row that opens a record is now medium weight on wide screens too.",
    changes: [
      c("new", "[DataTable](data-table) columns can show a muted second line under the value (a phone under a name), and, on phones, place a cell on the card: at the end of the title line, in one line under the title, or full width for long text. A new compact density makes dense lists tighter."),
      c("new", "[FilterBar](filter-bar) has collapseOnPhone: on a phone the filter menus fold into one “Filters” button with the number of chosen values. It opens a sheet from the bottom with one group per filter and a “Clear filters” button. On wide screens the bar is the same."),
      c("new", "[EmptyState](empty-state) has variant=\"plain\": no dashed frame, for an empty state inside a table, a card or a sheet. DataTable now uses it for its own empty state."),
      c("better", "The first cell of a DataTable row that opens a record (rowHref) is now medium weight at all widths. Before, only the phone cards had it."),
    ],
  },
  {
    version: "0.9.0",
    date: "2026-11-05",
    summary: "Parts for the pages of a record in an admin app. Nothing changes for existing projects.",
    changes: [
      c("new", "[RecordSummary](record-summary) shows the 1 to 6 key facts of a record in one dense strip under its header: a label, a value and a hint per cell, and an optional picture at the start. It fits the width it is given: one row when wide, three per row in the middle, two per row on a phone. An empty value shows “Not set”, long text is cut at two lines, and a value can be a link."),
      c("new", "[Thumbnail](thumbnail) is a small square picture in three sizes, with an icon when there is no picture or it does not load, an optional caption, and an optional link around the whole picture."),
      c("new", "[LineItemsTable](line-items-table) lines can show a small picture, muted description lines, the parts of a kit and more content (such as chips) under the name. The table can show the document totals under it and a text when there are no lines. On phones the same details show in each card."),
      c("new", "[DescriptionList](description-list) and [RecordSection](record-section) have layout=\"auto\": the term and its details sit side by side only when the list itself is wide enough, so one in a narrow column stays stacked. The existing layouts do not change."),
      c("new", "[Card](card), DescriptionList and RecordSection have density=\"compact\" for dense records: less padding and a smaller title."),
    ],
  },
  {
    version: "0.8.2",
    date: "2026-11-03",
    summary: "A layout fix for phones. Nothing else changes.",
    changes: [c("fixed", "On phones, Pagination and a DataTable with pages show the current page without its neighbours, so a long list no longer pushes the page past the edge of the screen.")],
  },
  {
    version: "0.8.1",
    date: "2026-11-02",
    summary: "A layout fix for phones. Nothing else changes.",
    changes: [c("fixed", "Input with start or end content, and the parts built on it, no longer push an Arabic page past the edge of a phone.")],
  },
  {
    version: "0.8.0",
    date: "2026-10-23",
    summary: "Parts for documents, records, forms and reports. Nothing changes for existing projects.",
    changes: [
      c("new", "The parts in the [Sidebar](sidebar) header and footer can ask useSidebarRail() whether the sidebar is an icon rail. In the phone sheet it is always expanded, so a user menu there shows the name and role."),
      c("new", "[DetailLayout](detail-layout) puts a record page in two columns: the main part and a side column with details and totals. A wide table scrolls inside its column, so the page never gets wider. On phones the columns stack, main part first. [TotalsList](totals-list) shows a document's totals with the amounts under each other."),
      c("new", "[LineItemsTable](line-items-table) shows the lines of an order or invoice: product and SKU, quantity, unit price, discount, VAT and total. The headers say whether prices include VAT, a chip shows a returned quantity, and on phones each line is a card."),
      c("new", "DataTable can show a total row at the foot, and can put the rows of a report in groups, each with a header and a subtotal. A sort works inside each group, and a printed total row stays in one piece after the last row."),
      c("new", "[FormField](form-field) connects a react-hook-form field to Field: the label, the hint and the field's error message, with the ids screen readers need. It comes from its own import, @percentsa/ui/react-hook-form. Projects that do not use react-hook-form do not need to install it."),
      c("new", "[FormSheet](form-sheet) is an edit form in a sheet. Save and Cancel stay at the bottom, Save shows a spinner while the form saves, and closing the sheet with unsaved changes asks first. [RecordSection](record-section) shows a record's facts with an Edit button, and \"Not set\" where a value is empty."),
      c("fixed", "An AlertDialog opened without a trigger (from a menu or a sheet) gives focus back to where it was when it closes."),
      c("new", "[ImageField](image-field) uploads an image, for example a logo or a product photo. It shows a preview with Replace and Remove, refuses a wrong file type or a file that is too large before the upload, and keeps the old image if the upload fails."),
      c("new", "FileDrop can be disabled."),
      c("new", "Combobox can search on the server: it passes each typed query to the app and shows the results with a \"Searching\" row while they load. A long list shows its first matches and how many more there are. An \"Add\" option at the end lets people add a value that is not in the list."),
      c("new", "[PeriodPicker](period-picker) chooses the period of a report: a month, a quarter, a year or a custom date range. Switching from a month to a quarter or a year keeps the same end, so September becomes the third quarter and then the whole year. With the Hijri calendar the periods are Hijri months, quarters and years (for example \"1448 AH\"), and the value is still the first and last Gregorian day."),
      c("new", "[TimeInput](time-input) chooses a time of day on the 12-hour clock: hour, minute and AM/PM (ص/م in Arabic). Going from 11 to 12 crosses noon or midnight, as on a clock. [DateTimePicker](date-time-picker) puts a date and a time together, and sends a value only when both are set."),
      c("new", "NumberInput can format the number it shows, for example a minute as \"05\"."),
      c("new", "[SaudiPlate](saudi-plate) draws a Saudi car plate with its Arabic and Latin rows, and the emblem, «السعودية» and KSA in the middle. [PlateInput](plate-input) takes a plate as one text, in any order and in Arabic or English, and shows the plate under the field as you type, or what to fix. parsePlate reads the text on the server too."),
      c("better", "Calendar, DatePicker and DateRangePicker have a month list and a year list, so a date years away takes two choices, not many clicks. Months outside the allowed dates cannot be chosen."),
      c("better", "DateRangePicker can open on the Hijri calendar."),
      c("new", "An app can give its own words for every built-in text. The phone country names now come from the strings, and an invoice takes the app's labels for its second language. The Language page shows how."),
      c("fixed", "IbanInput shows the app's placeholder when the app gives one."),
    ],
  },
  {
    version: "0.7.0",
    date: "2026-10-23",
    summary: "Parts for app screens and lists. Nothing changes for existing projects.",
    changes: [
      c("new", "[TimeText](time-text) shows a date or time the short way, in Riyadh time: \"3:45 PM\" today, \"Yesterday 3:45 PM\", \"12 September, 3:45 PM\" this year. Hover, focus or tap shows the exact value. formatDateTime, formatRelative and formatTimeOfDay give the same text for tables, exports and printouts."),
      c("new", "Money and formatMoney can keep up to 6 decimals for unit prices, and can put negative amounts in brackets: (1,234.50)."),
      c("fixed", "formatMoney never shows -0.00, and shows \"—\" for an amount that is not a number, so a broken value does not look like zero."),
      c("new", "[PhoneText](phone-text) shows a phone number as a call link (\"+966 55 000 0999\"), with an optional WhatsApp link. formatPhone and phoneLinks give the text and the links."),
      c("new", "[StatusBadge](status-badge) shows a status (Paid, Overdue) with a coloured dot in five tones. The colour is on the dot only, so the text stays readable."),
      c("new", "EmptyState can show a load error with a \"Try again\" button. [NotFound](page-states) and [Forbidden](page-states) are ready pages for a missing record and for a page the user may not open."),
      c("new", "[PageHeader](page-header) is the top of a list or record page: the title with status badges, a back link to the list, one primary action, and the other actions in a \"⋯\" menu. On phones the primary action is full width and \"More actions\" opens the rest."),
      c("new", "Menu items can show a second line under the label, for example why an item is disabled."),
      c("new", "[DateRangePicker](date-range-picker) chooses a date range for a list filter, with the presets today, yesterday, last 7 days, last 30 days, this week, this month and last month. Calendar can choose a range too. The small size fits a list toolbar."),
      c("new", "DataTable rows can open their record: the whole row is one link, and the checkbox and the \"⋯\" row menu still work. On phones, the rows can show as cards."),
      c("new", "[ColumnsMenu](columns-menu) lets people show and hide table columns. DataTable can offer a rows-per-page choice and keep its header row in view while the rows scroll. FilterBar takes the list's other controls (date range, columns, refresh) at its end, so one bar is the whole list toolbar."),
      c("new", "[PrintArea](print-area) and usePrint print one part of a page, such as a list, on A4 paper, black on white in any theme. The title repeats on every page, page numbers are at the bottom, and nothing else on the page prints."),
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
