/** Giełdy docelowe (kody EODHD) */
/** MI (Milano) — brak kodu w EODHD; pomijamy */
export const TARGET_EXCHANGES = ['US', 'XETRA', 'LSE', 'PA', 'AS', 'SW', 'MC'] as const;
export type TargetExchange = (typeof TARGET_EXCHANGES)[number];

export const EODHD_BASE = 'https://eodhd.com/api';

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
