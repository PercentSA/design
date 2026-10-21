/** Pages to show: always the first and last, the current one with `siblings` on each side; a gap hides at least 2 pages. */
export function paginationRange(page: number, total: number, siblings = 1): (number | "gap")[] {
  const slots = siblings * 2 + 5;
  const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  if (total <= slots) return range(1, total);
  const left = page - siblings;
  const right = page + siblings;
  if (left <= 3) return [...range(1, slots - 2), "gap", total];
  if (right >= total - 2) return [1, "gap", ...range(total - slots + 3, total)];
  return [1, "gap", ...range(left, right), "gap", total];
}
