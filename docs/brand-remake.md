# Brand remake — spec (owner decisions 2026-10-15 to 2026-10-22)

Status: approved by the owner on 2026-10-21, including the items marked *proposed* (they were proposed while writing this document). Base: `main` at 0.4.1 (merged, not tagged). Shipped in 0.5.0. The grid (D9, §4) changes the sizes from 0.6.0.

## 1. Intent

Percent gets real wordmarks in Arabic and English that are built from the % logo: the slash of the logo is the ر in برسنت and the c in percent. A motion turns the logo into each word and back. It shows what the studio can do, and it is the loader in Percent's products and sites. Later, videos and showcases are rendered from the same code.

This work delivers, in the design system:

1. The geometry of the icon, the two wordmarks and the 7 logo versions, in code (one source).
2. `<Logo>` in `@percentsa/ui` (replaces `<Wordmark>`).
3. The loader (the Portal motion) in `@percentsa/motion`.
4. A brand guideline page in the docs, with SVG downloads.

Success: every logo, still or moving, anywhere, comes from this one geometry; the loader's first and last frames are exactly the still icon, and its word frames are exactly the still wordmarks.

## 2. Owner decisions

| # | Decision |
|---|----------|
| D1 | Static wordmarks first, then motion. Everything is built in code (SVG + JS). Videos are rendered from the code later (After Effects only if code fails). |
| D2 | Arabic wordmark (2026-10-17, changed 2026-10-20): flat-line برسنت, monoline. ر = the slash, crossing the line at mid-height; its length is the English x-height (140), centred on the line, so it is the same shape as the English c. ب is joined to the slash; a gap after ر; ن tooth and dot; ت upturn and two dots; square dots; line ends cut at the slash angle; the ب dot's bottom sits on the ر's bottom. Values: `docs/brand/arabic-wordmark.json`. |
| D3 | English wordmark (2026-10-18): lowercase "percent", straight strokes, the same stroke as Arabic (28.5), the c is the slash (slanted at the slash angle, x-height long), line ends cut at the slash angle, t with a foot. Values: `docs/brand/english-wordmark.json`. |
| D4 | Motion: **P · Portal** (2026-10-20, "I like P very much"; "looks perfect" 2026-10-21). The squares slide into the slash and disappear; the slash narrows to the word's slash; the word slides out of it on both sides and settles with a small overshoot. Word → logo is the same motion backwards. (1A and 2B are kept for later; not in this work.) |
| D5 | Loader loop, fixed order: logo → Arabic → logo → English → logo. 1.2 s per change, 0.8 s on each word, 0.4 s on the logo: 7.2 s per loop. |
| D6 | 7 logo versions (2026-10-21): icon; English; Arabic; icon + English; icon + Arabic; icon + both in a row; icon + both stacked. Rules in §4.5. |
| D7 | Black and white only: white on black, black on white. No other colours. |
| D8 | Q11 `<Logo version>` in `@percentsa/ui` replaces `<Wordmark>`. Q12 the loader is an SVG component in `@percentsa/motion`; with reduced motion it shows the still icon. Q14 the guideline page (§5.4) with clear space 1 square, minimum sizes icon 16 px / icon 24 px with words. Q15 in running text the name is "Percent" with a capital P; the logo is lowercase. Q16 videos later. Q17 percent.sa changes in a separate step after the release. |
| D9 | The grid (2026-10-21 and 2026-10-22, after the Brand page showed the sizes as numbers): 1 square = 100 units, the icon 3 × 3 squares, slash 2 across for 3 down, x-height 2 squares, English as high as the icon, the Arabic word as wide as the English with a long س (ب bar 320, س 450). The sizes of 0.5 stay in the code for a rollback (§4.6). |

## 3. Reference files (the source of truth)

`docs/brand/` holds the approved mockups. They are plain HTML pages; open them in a browser. Port their geometry and keyframes exactly; do not redraw.

| File | What it holds |
|------|---------------|
| `portal-loader.html` | The approved loader page: the geometry (`W` = Arabic word, `enWord(EN)` = English word, `TL`, `BR`, `slashQ`, `slashCut`, `roundQuad`), the keyframe engine (`prep`/`at`: monotone cubic, `U`, `make`), the Portal definitions (`slideIn`, `through`, `P_ar`, `P_en`), the clip (`halfPlane`), the camera drift (`drift`), `draw`, and the loop (`SEQ`). It also holds the code of ideas that were not chosen (`V` = 1A, `W_*`, `F_*`, necks): do not port them. |
| `logo-versions.html` | The 7 versions in both colours: `part`, `put`, `row`, `stack`, and the version table `ALL`. |
| `arabic-wordmark.json`, `english-wordmark.json` | The approved values of 0.5. |

These files show the sizes of 0.5. The grid (§4) uses the same shapes and the same motion with the sizes in `LOGO_SIZES`.

## 4. Geometry

All sizes are in `LOGO_SIZES` (`packages/tokens/src/logo.ts`). The sizes of 0.5 stay in `LOGO_SIZES_0_5` (§4.6).

### 4.1 Units

- One grid: 1 square = 100 visible units. Every shape is a path drawn with fill and an 8 round-join stroke in the same colour, so the corners are rounded by 4. "Path" sizes exclude the stroke; "visible" sizes include it (a path is 4 inside its visible edge).
- The line: y = 150 (the middle of the icon). Every part in a row is centred on it.
- The slash angle: 2 across for 3 down (run 2/3; `SLASH_RUN` 0.6667 is the same angle for the wipes). Nothing ever mirrors: not the icon, not the words, not the motion, also on RTL pages.
- Gaps and clear space: 1 square (100).

### 4.2 Icon

3 × 3 squares, its slash centred on x = 0. Visible: top-left square x −150 to −50, y 0 to 100; bottom-right square x 50 to 150, y 200 to 300; the slash joins the top-right cell and the bottom-left cell (top edge x 50 to 150 at y 0, bottom edge x −150 to −50 at y 300). Visible box: x −150 to 150, y 0 to 300. `MARK_PATH` is the same shape moved to start at 0 (292 × 292 path, 300 × 300 visible; `MARK_STROKE` 8).

### 4.3 Arabic wordmark

Stroke and dots 40; the line is centred on y 150. The ر is the English c stem: 200 high (the x-height). The word is as wide as the English (1127.93): the ب bar is 320 (right of the ر); left of the ر, a 20 gap, then the long line (730): the س 450 (from the gap to the ن tooth's centre), the ن tooth to the ت dots 150, the ت dots to the line end 130. Tooth 20 above the line; dot gap 40. Visible box: x −774.04 to 353.90, y 30 to 250 (1127.93 × 220). The ر bottom and the ب dot bottom are both at y 250.

### 4.4 English wordmark

x-height 200 (2 squares) centred on the line; ascender and descender 50 (half a square), so the word is exactly as high as the icon (y 0 to 300). Letter width 150, letter gap 20, stroke 40; c arm 80, r arm 130, t 100 wide with its stem at a third; r to c −20, c to e 60. The word is placed with the c's centre at x = 0. Visible box: x −494.04 to 633.90, y 0 to 300 (1127.93 × 300).

### 4.5 The 7 versions

Gaps are measured between visible boxes. The icon is always at 1:1 with the words (the loader's scale), except where the words are scaled in version 7.

| # | Version | Layout | Visible size |
|---|---------|--------|--------------|
| 1 | Icon | `<Mark>` | 300 × 300 |
| 2 | English | the English word | 1127.93 × 300 |
| 3 | Arabic | the Arabic word | 1127.93 × 220 |
| 4 | Icon + English | icon, 1 square, English. The icon is at the reading start (left). | 1527.93 × 300 |
| 5 | Icon + Arabic | Arabic, 1 square, icon. The icon is at the reading start (right). | 1527.93 × 300 |
| 6 | Icon + both, row | Arabic, 1 square, icon, 1 square, English. The words have the same width, so the icon is exactly in the middle. | 2755.87 × 300 |
| 7 | Icon + both, stacked | Icon on the right. Left of it, 1 square away and right-aligned to that edge: Arabic on top, English below, both at half size (scale 0.5): each word's x-height is one square, beside the top and bottom squares (Arabic line at y 50, English x-height centre at y 250). Dots and the English descender go a little past the icon. | 963.97 × 335 |

The loader holds every stage in the view box `-620 -50 1240 400`. Its slide distances follow the larger words (`LOGO_SIZES.loader`).

### 4.6 The sizes of 0.5 (kept for a rollback)

`LOGO_SIZES_0_5` holds the sizes of 0.5. A test checks that they still give exactly the 0.5.1 output (every version and every loader frame). To roll back: build `LOGO` from `LOGO_SIZES_0_5` in `logo.ts`, and put back the 0.5.1 values of `MARK_PATH`, `MARK_W`, `MARK_H`, `MARK_STROKE` (6.63) and `SLASH_RUN` (0.7157, in tokens and motion); the tests show each place. 0.5.1 also stays on npm.

The geometry of 0.5, as approved on 2026-10-21:

#### 0.5: 4.1 Units

- One unit system for the icon and both words: the icon is 227.8 high (the `<Mark>` path, 221.2 high, plus its round-join stroke 6.63). Every shape is a path drawn with fill and a 6.63 round-join stroke in the same colour, which gives the logo's slightly soft corners. "Path" sizes exclude the stroke; "visible" sizes include it (path + 6.63).
- The line: y = 110.6 (the middle of the icon). Every part in a row is centred on it.
- The slash angle: 158 across per 221.2 down. Nothing ever mirrors: not the icon, not the words, not the motion, also on RTL pages.
- One **square** = 70.8 (the path size of a logo square). It is the unit for gaps and clear space.

#### 0.5: 4.2 Icon

`MARK_PATH` (unchanged). In the word and motion coordinates, the icon has its slash centred on x = 0: top-left square path x −115.15 to −44.35, y 0 to 70.8; bottom-right square x 44.05 to 114.85, y 150.4 to 221.2; slash path width 67.7 (horizontal). Visible box: x −118.47 to 118.16, y −3.31 to 224.51.

The icon's slash is the `MARK_PATH` slash: 67.7 wide at the top, 68.3 at the bottom. The reference pages draw it as a 67.7-wide parallelogram (`slashQ(67.7)`), 0.3 off at the two bottom corners, which cannot be seen. The build uses `MARK_PATH` for the still icon and for the loader's logo frames, so `<Mark>`, `<Logo version="icon">` and the loader's first and last frames are the same shape (*proposed*: `MARK_PATH` is published and used by `Spinner` and the percent.sa hero).

#### 0.5: 4.3 Arabic wordmark

Built by `W` (with `slashCut`) in `portal-loader.html` from `arabic-wordmark.json`. Stroke 28.5 visible, line centred on y 110.6; the ر is `slashCut((28.5 − 6.63)/cos, 140)`: its shape equals the English c stem. Visible box: x −361.01 to 204.56, y 20.82 to 180.60 (565.6 × 159.8). The ر bottom and the ب dot bottom are both at y 180.6.

#### 0.5: 4.4 English wordmark

Built by `enWord(EN)` in `portal-loader.html` from `english-wordmark.json` (x-height 140 centred on the line, ascender and descender 0.35 × x-height). The word is placed with the c's centre at x = 0. Visible box: x −330.23 to 428.90, y −8.40 to 229.60 (759.1 × 238).

#### 0.5: 4.5 The 7 versions

Gaps are measured between visible boxes. The icon is always at 1:1 with the words (the loader's scale), except where the words are scaled in version 7.

| # | Version | Layout | Visible size |
|---|---------|--------|--------------|
| 1 | Icon | `<Mark>` | 236.6 × 227.8 |
| 2 | English | the English word | 759.1 × 238 |
| 3 | Arabic | the Arabic word | 565.6 × 159.8 |
| 4 | Icon + English | icon, 1 square, English. The icon is at the reading start (left). | 1066.6 × 238 |
| 5 | Icon + Arabic | Arabic, 1 square, icon. The icon is at the reading start (right). | 873 × 227.8 |
| 6 | Icon + both, row | Arabic, 1 square, icon, 1 square, English: both words start at the icon. | 1702.9 × 238 |
| 7 | Icon + both, stacked | Icon on the right. Left of it, 1 square away and right-aligned to that edge: Arabic on top, English below. Both words are scaled by 77.43 / 140 (0.5531): each word's x-height (and its ر or c) is as high as one visible square. The Arabic line is at y 35.4 (beside the top square's centre), the English x-height centre at y 185.8 (beside the bottom square's centre). Dots, ascender and descender go a little past the icon. | 727.3 × 265.9 |

## 5. Parts to build

### 5.1 Brand geometry (*proposed*: in `@percentsa/tokens`)

A plain TypeScript module (no React, no DOM) with the icon, the two words, the 7 version layouts, and the path builder (`roundQuad`), for example `packages/tokens/src/logo.ts` (`brand.ts` there is the client brand CSS of 0.4.0; keep them apart). It is in `@percentsa/tokens` because `@percentsa/ui` and `@percentsa/motion` both depend on tokens, and the motion package does not depend on `@percentsa/ui`; this keeps one source of geometry without a new dependency. It also holds the loader's keyframes and timings (they are brand constants, not the UI duration tokens).

### 5.2 `<Logo>` (`@percentsa/ui`)

- `version`: `"icon" | "en" | "ar" | "icon-en" | "icon-ar" | "row" | "stack"` (*proposed*: names).
- One inline SVG, sized by its height through `className` (as `<Mark>`); the viewBox is the visible box (no clear space inside).
- Fill and stroke `currentColor`, so it works in dark, light and client themes (AGENTS rule 3). The guideline (not the code) says black or white only.
- Decorative (`aria-hidden`) unless it has `label`; with `label` it is `role="img"` with that name (as `<Mark>`).
- Same output in LTR and RTL. Server-rendered; no JavaScript needed.
- `<Mark>` stays as it is (the icon is unchanged); `<Logo version="icon">` and `<Mark>` draw the same shape.

### 5.3 Loader (`@percentsa/motion`; *proposed*: name `LogoLoader`)

- Plays the loop of D5 with the Portal motion of D4, ported from `portal-loader.html` (`P_ar`, `P_en`, `slideIn`, `through`, clip, drift, interpolation). The English clip lines sit `E / cos + 6` (≈ 10.07) outside the c's edges, the Arabic ones on the edges, as in the reference.
- The frame is a pure function of time (ms → shapes), so tests and the later video renderer can sample any moment. At every stage edge it equals the still icon or the still word exactly.
- SVG, one fixed viewBox that holds every stage (0.5: `-400 -40 800 300`; the grid: `-620 -50 1240 400`), so the box never changes size.
- Server HTML and the first client render show the still icon (no layout shift). The loop starts after hydration.
- Reduced motion (`prefers-reduced-motion: reduce`): the still icon, no loop.
- Runs only while on screen and while the tab is visible (spec §6).
- Decorative unless it has `label` (*proposed*: as `<Mark>`; the motion package has no strings provider). Never mirrors in RTL.
- `className` sets the size.

### 5.4 Brand guideline page (`apps/docs`)

A new foundation page "Brand" / "الهوية" (EN + AR, dark + light), in the same style as the other foundation pages. Sections:

1. **Logo versions**: the 7, drawn by `<Logo>`, with when to use each (*proposed*): icon for small and square spaces (avatars, app icons, favicons); icon + English on English pages and icon + Arabic on Arabic pages (the default); icon + both in a row for wide bilingual spaces (letterheads, footers, signs); stacked for bilingual spaces with less width; English or Arabic alone only where the icon is already near.
2. **Construction**: the units, the square, the ر and the c equal to the x-height, the stacked version's square alignment (a diagram from the geometry).
3. **Clear space**: 1 square on all sides (a third of the icon height; in versions without the icon, 100 in the same units, half the x-height).
4. **Minimum size**: icon alone 16 px high; versions with words: icon 24 px high (versions 2 and 3: the same scale, so the English x-height is at least 16 px); version 7: icon 48 px high (its words are at half size, so this keeps them as large as in the other versions at 24 px). 0.5 had 44 px for version 7.
5. **Colours**: white on black, black on white. Never other colours, gradients, shadows or outlines; the green status colour is never part of the logo.
6. **Do not**: stretch, recolour, shade, outline, rotate, mirror, redraw, type the name in a font as a logo, change the spacing or the arrangement. Show each as a small crossed-out example made from the geometry (*proposed*).
7. **The name in text**: "Percent" with a capital P in English text (the logo is lowercase); "برسنت" in Arabic text (§10).
8. **Motion**: the live loader, the stage list and timings (D5), and the reduced-motion rule.
9. **Downloads**: §5.5.

Component pages (AGENTS rule 9): a "Logo" page in the Brand group (it replaces the "Wordmark" page) and a "LogoLoader" page in the Motion group, with examples, then `bun run registry`.

### 5.5 SVG downloads

7 versions × 2 colours = 14 SVG files, tight viewBox, explicit `#fff` or `#000` (they are files that leave the system, so the no-hex rule does not apply to them). Generated by a script from the geometry; a test fails when they are out of date (as for `registry.json`). Names: `percent-<version>-<white|black>.svg` (*proposed*).

### 5.6 Remove `<Wordmark>`

`<Wordmark>` (the % plus "Percent" typed in Geist) is removed from `@percentsa/ui`. Since 0.4.0 a project can set its own logos with the provider's `brand` slots (`mark`, `wordmark`, `spinner`); `<Wordmark>` is only Percent's default for the `wordmark` slot. That default becomes `<Logo>` in the page language (*proposed*, following Q17): icon + English on English pages, icon + Arabic on Arabic pages, with the icon at least 24 px high (the old header mark was 20 px). Places: `site.tsx` (SiteHeader), `auth-layout.tsx`, and `apps/docs/app/routes/docs-layout.tsx` (docs header). The `mark` slot default stays `<Mark>`. Projects that set `brand` see no change. The docs text "The name stays in English on Arabic pages" goes.

## 6. Rules

From AGENTS.md and spec.md, plus the brand rules above:

- Black and white only; nothing mirrors; the logo is never redrawn outside the geometry module.
- Motion: reduced motion, on screen only, tab visible, no layout shift when JavaScript starts, hidden start states only under `html.js`.
- Every visible or spoken string in EN + AR.
- Each part: a test, a docs example (EN/AR), a docs page entry, `bun run registry`.
- `bun test` and `bun run typecheck` pass before every commit.

## 7. Tests

- Geometry: the grid values (§4.1–4.5); the ر equals the c stem; the ب dot bottom and the ر bottom are at 250; the Arabic word is as wide as the English; the icon is in the middle of the row; every gap is 100; the version 7 scale (0.5) and line positions (50, 250). `LOGO_SIZES_0_5` gives exactly the 0.5.1 output (§4.6).
- `<Logo>`: every version renders; `currentColor`; `label` → `role="img"` with the name, no label → `aria-hidden`; the same output with `dir="rtl"`.
- Loader: frames at every stage edge equal the still icon or words; reduced motion → the still icon and no animation frame requests; the server output is the still icon; it stops when hidden or off screen; no mirror in RTL.
- Downloads are up to date.
- The docs build and server tests (existing) pass.

## 8. Release

`<Wordmark>` is removed, so this is a breaking change: release **0.5.0** (0.4.0 is out; 0.4.1 is merged), with a CHANGELOG entry that names the removal and the replacement. The owner pushes the tag.

## 9. Not in this work

- Videos (a later step, rendered from the loader's frame function).
- percent.sa (a separate step after 0.4.0: header icon + English on /en, icon + Arabic on /ar).
- The motions 1A, 2B, W, F (saved in the reference page; not built).
- Favicon and app icons (the icon does not change).
- `Spinner` (it keeps its own mark drawing; the loader does not replace it).
- Print formats (PDF, EPS) and a Figma library.

Anti-goals (a failure even if it works): a logo drawn by hand anywhere; a loader frame at a stage edge that differs from the still logo or word; any colour in the logo; any mirroring.

## 10. The name in Arabic

Owner decision 2026-10-21: the name in Arabic text is **برسنت**, the spelling of the Arabic logo. The misspelling with ي was removed from the repo in PR #12, which also adds AGENTS.md rule 13 and `test/arabic-name.test.ts` (it fails if the misspelling comes back). The guideline page states the rule (§5.4, section 7).

## 11. Left to the implementation

File and function layout inside the packages; props beyond those listed; how the SVG files are generated; the viewBox handling; the docs page layout and wording (EN + AR); the animation loop details; test structure.
