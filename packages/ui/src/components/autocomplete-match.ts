import { searchKey } from "../saudi/normalize";

export type AutocompleteSuggestion = { value: string; label?: string; detail?: string };

/** The rows whose value or label contains the query (case, accents and Arabic letter forms ignored). An empty query keeps all rows. */
export function matchSuggestions(list: AutocompleteSuggestion[], query: string): AutocompleteSuggestion[] {
  const key = searchKey(query);
  if (!key) return list;
  return list.filter((s) => searchKey(s.value).includes(key) || (s.label !== undefined && searchKey(s.label).includes(key)));
}

const ARABIC = /[ؠ-ي]/;

/**
 * The first plain, case-insensitive match of `query` in `text` as [start, end), for bold text.
 * `null` when there is no plain match, or when the bold would split joined Arabic letters.
 */
export function boldRange(text: string, query: string): [number, number] | null {
  if (!query) return null;
  const lower = text.toLowerCase();
  if (lower.length !== text.length) return null;
  const start = lower.indexOf(query.toLowerCase());
  if (start < 0) return null;
  const end = start + query.length;
  const splits = (i: number) => ARABIC.test(text[i - 1] ?? "") && ARABIC.test(text[i] ?? "");
  return splits(start) || splits(end) ? null : [start, end];
}
