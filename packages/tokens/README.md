# @percentsa/tokens

Design tokens of the Percent Design System: CSS variables, a Tailwind CSS v4 theme, token JSON, and `brandCss()` / `checkBrand()` for a project's own brand.

```bash
bun add @percentsa/tokens
```

```css
@import "tailwindcss";
@import "@percentsa/tokens/theme.css";
```

- `theme.css`: every token as a `--p-*` variable for dark, light and system modes, mapped to Tailwind utilities (`bg-surface`, `text-fg-2`, `rounded-card`, …).
- `tokens.css`: the variables only. `tokens.json`: the values for other tools.
- `brandCss(brand)` writes a brand file (colors per mode, fonts, radius); `checkBrand(brand)` lists color pairs that fail WCAG AA.

No font files ship with this package. Load your own and set `--p-font-sans`, `--p-font-sans-ar` and `--p-font-mono`.

Docs: https://design.percent.sa · Source: https://github.com/PercentSA/design · License: MIT
