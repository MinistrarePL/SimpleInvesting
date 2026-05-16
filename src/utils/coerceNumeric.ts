/** Bezpieczne liczby z Supabase / JSON (np. string lub nietypowe typy po serializacji). */

export function toFiniteNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function toFiniteInt(value: unknown): number | null {
  const n = toFiniteNumber(value);
  if (n == null) return null;
  const i = Math.trunc(n);
  return Number.isFinite(i) ? i : null;
}
