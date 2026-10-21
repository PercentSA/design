# Motion 2 — spec (2026-10-15)

In: RevealText, sliding indicator, reorder glide, digit roll, page transitions, slash hover, drag to close sheets. Not included: pointer spotlight on cards, pointer dot field.

## Rules for every part (from AGENTS.md and spec.md)
- Reduced motion (`prefers-reduced-motion: reduce`): no movement. A short fade is allowed where a state change would be hard to see without it.
- Hidden start states only under `.js` (set before first paint), so pages without JavaScript show everything.
- Animations run only while on screen. No scroll-driven or pinned effects.
- RTL: anything that moves along the reading direction mirrors in Arabic. The slash angle is never mirrored (the % mark is not mirrored); its run follows the reading direction, as in SlashReveal.
- Black and white only. Easing and durations from tokens (`--p-ease-out`, `--p-duration-*`).
- Server HTML is final content: no layout shift when JavaScript starts.
- Every visible or spoken string through the provider strings (EN + AR).
- Each part: test file, docs example (EN/AR), docs page entry, `bun run registry`.

## Parts

### 1. RevealText (@percentsa/motion)
`<RevealText as="h2" className>{"plain text"}</RevealText>`
- Children: a string. Words split on white space only; letters are never split (Arabic letters join). Each word is masked and rises into view.
- Line by line: after layout, words get their line index (from their top offset) and each line starts a step later (60 ms); words in a line follow 15 ms apart. Line indexes are measured again on resize (no animation then).
- Shows once, when on screen (`useReveal`). Screen readers read the text once, as normal text (no aria-label copy, no hidden duplicates).
- Reduced motion: a short fade of the whole element.

### 2. NumberRoll (@percentsa/motion)
`<NumberRoll value={1284} format={(n) => string} className />`
- When `value` changes, each digit rolls vertically to its new digit (a column 0–9). Other characters (separators, signs, the decimal point) change in place. Digit count changes: new digits enter from the reading end.
- First render shows the value with no animation (the server and the first client render match). `Counter` stays as it is (count-up on first view).
- Western digits, `dir="ltr"`, tabular digits. Screen readers get the final value only (visual digits aria-hidden, an sr-only text).
- Off screen: the value changes without animation. Reduced motion: no roll.

### 3. Sliding indicator (@percentsa/ui)
Tabs (underline), SegmentedControl (pill), Sidebar (current item background).
- One indicator element per list moves (transform + width/height) to the active item. Measured with ResizeObserver (fonts, language switch, collapse).
- Server HTML and pages without JavaScript: the active item draws its own state, as now. The indicator takes over only after the first measure, with no visible jump.
- RTL: works with physical measures; no special mirroring needed beyond correct positions.
- Reduced motion: the indicator jumps (no transition).
- Shared internal hook in packages/ui/src/lib (not exported unless a second consumer needs it).

### 4. Reorder glide (@percentsa/ui)
Kanban (cards within and across columns), List, FilterBar chips.
- FLIP: measure items (by a stable `data-flip` id) before the DOM changes, then animate each moved item from its old place to the new one (transform, Web Animations API, `--p-duration-base`, `--p-ease-out`). New items fade in. Removed items leave at once.
- Exported hook `useFlip(containerRef, deps)` from @percentsa/ui, so apps can use it on their own lists.
- The focused element keeps its focus. Reduced motion: no animation.

### 5. Page transitions (@percentsa/motion CSS)
- Opt-in by attribute on `<html>`: `data-page-transition="fade"` (cross-fade, `--p-duration-fast`) or `"slash"` (the new page wipes in behind an edge at the slash angle, in the reading direction).
- Uses the browser View Transitions API through React Router (`<Link viewTransition>`, `useNavigate()(to, { viewTransition: true })`). Docs say how to make the app's link component pass `viewTransition` by default (PercentProvider `link`).
- Browsers without the API: normal navigation. Reduced motion: no animation.
- Without the attribute nothing changes (percent.sa has its own view-transition CSS).
- The docs site uses `slash`.

### 6. Slash hover (@percentsa/motion CSS)
- Opt-in class `p-slash-hover` for outline/ghost buttons and links: on hover and on keyboard focus a fill in `fg` wipes in behind an edge at the slash angle, in the reading direction; the text turns `bg`. It wipes out the same way.
- Not for primary buttons (their fill is already `fg`): docs say so.
- Touch: no hover state on tap. Reduced motion: the fill fades in.

### 7. Drag to close sheets (@percentsa/ui)
- Sheet on touch (pointerType touch or pen): drag toward the closing side; the sheet follows the finger. Release past 30 % of its size, or a fast flick, closes it; else it springs back.
- Side sheets: horizontal drag anywhere on the sheet when the movement is mostly horizontal (vertical scrolling inside still works). Bottom sheet: drag on the handle and header, or on the content when it is scrolled to the top. A visible handle on bottom sheets.
- Mouse: no drag. RTL: start/end sides follow the direction. Reduced motion: no spring animation; the drag itself still works.
- Close goes through the normal Radix close (focus return, onOpenChange).
