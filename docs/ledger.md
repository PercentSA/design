# Ledger

Later work on the design system and its docs site. Each item has an id, the state today, the goal and the scope. The owner approves each item before it starts.

## Docs site

Added 2026-11-05 by the owner. Not started.

### D1. Short component descriptions

- Today: each component page starts with one paragraph that mixes the purpose, the behaviour, the props and the edge cases. The site has about 158 component pages; about 23 descriptions are longer than 600 characters (for example Invoice, LineItemsTable).
- Goal: the description is one or two short sentences: what the part is and when to use it.
- The details move out of the description: props and their rules go to the options of D2; rules that are not a prop (rounding, print colours, server use) go to short notes under the examples.
- Scope: all pages, in English and Arabic (`apps/docs/app/docs/catalogue.ts`, `apps/docs/app/docs/pages/*.ts`). The page meta description uses the new short text.

### D2. Component options with a live view

- Today: a page shows its examples, each with a closed code block. It has no list of props and no controls.
- Goal: each component page has an «Options» section:
  - a table with one row per prop: name, type, default and a short description;
  - a live preview with controls (switch, select, text, number) for the props that change the look or the behaviour;
  - the code under the preview follows the controls.
- Props data: generated from the TypeScript types at build time, or a typed list per page. A test keeps the list the same as the props the package exports.
- The preview works in both languages, right to left in Arabic, and at 360 px.

### D3. Arabic wording

- Today: some Arabic words are literal translations that Arabic developers and designers do not use. Example: «الشيفرة» for "Code":
  - `apps/docs/app/docs/copy.ts:25` (the label of each example's code block);
  - `apps/docs/app/routes/home.tsx:28` («الشيفرة على GitHub»);
  - `apps/docs/app/docs/catalogue.ts:48`, `:50` and `apps/docs/app/docs/pages/code.ts:11` (descriptions);
  - `packages/ui/src/i18n/strings.ts:433` («الشيفرة البرمجية», a provider string that apps show).
- Goal: use the words that Arabic readers use (for example «الكود»).
- Steps:
  1. Make a word list: English term, Arabic today, proposed Arabic, where it is used.
  2. The owner reviews the list.
  3. Apply it to the docs copy, the page descriptions and the provider strings.
- A change in `packages/ui/src/i18n/strings.ts` changes the text in every app that uses the default strings. Name it in the changelog as a visible change.
