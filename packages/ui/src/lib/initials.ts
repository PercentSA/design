/**
 * First letters of the first two words, Latin in upper case: "sara ahmed" → "SA". Arabic skips the
 * article "ال": "محمد العتيبي" → "مع".
 */
export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => [...(word.length > 2 && word.startsWith("ال") ? word.slice(2) : word)][0] ?? "")
    .join("")
    .toUpperCase();
}
