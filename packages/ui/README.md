# @percentsa/ui

React components of the Percent Design System (React 19, Tailwind CSS v4, Radix): forms, overlays, navigation, data display, charts, app layouts, invoices, and a Saudi and bilingual kit (Riyal sign, Hijri dates, IBAN, national ID, CR, VAT, phone, national address). Every component works in English and Arabic (RTL), dark and light, with the keyboard.

```bash
bun add @percentsa/tokens @percentsa/ui
```

```css
@import "tailwindcss";
@import "@percentsa/tokens/theme.css";
@import "@percentsa/ui/styles.css";
```

```tsx
import { Button, PercentProvider } from "@percentsa/ui";

<PercentProvider lang="ar" link={RouterLink}>
  <Button>متابعة</Button>
</PercentProvider>
```

The Percent logo is the default. Set your own with `PercentProvider brand={{ mark, wordmark }}`: the Percent name and logos are not covered by the MIT license (see TRADEMARKS.md in the repository).

Docs and examples: https://design.percent.sa · Source: https://github.com/PercentSA/design · License: MIT
