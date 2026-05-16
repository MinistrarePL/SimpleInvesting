/** Normalizacja pod wyszukiwanie leksykalne (PL + ASCII). */
export function normalizeForSearch(text: string): string {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Tokeny alfanumeryczne Unicode (działa dla polskich liter). */
export function tokenize(text: string): string[] {
  const norm = normalizeForSearch(text);
  const tokens = norm.match(/[\p{L}\p{N}]+/gu);
  return tokens ?? [];
}
