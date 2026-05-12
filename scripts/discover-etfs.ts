/**
 * Odkrywa uniwersum ETF-ów: lista z giełd → bulk EOD (wolumen) → filtr historii EOD.
 * Zapis: data/etf-universe.json
 *
 * Zmienne środowiskowe (opcjonalne):
 * - DISCOVER_MAX_ETFS (domyślnie 2500)
 * - DISCOVER_EXCHANGES — np. "US" lub "US,XETRA" (domyślnie wszystkie)
 * - DISCOVER_MIN_AVGVOL (domyślnie 50000) — min. wolumen ostatniej sesji
 * - DISCOVER_MIN_EOD_DAYS (domyślnie 250) — min. liczba sesji EOD (≈rok handlowy)
 * - DISCOVER_CONCURRENCY (domyślnie 5)
 * - DISCOVER_EOD_DELAY_MS (domyślnie 150)
 */
import fs from 'fs';
import path from 'path';
import { loadEnv, getRootDir } from './lib/loadEnv.ts';
import { EODHD_BASE, TARGET_EXCHANGES, sleep } from './lib/constants.ts';

interface SymbolRow {
  Code: string;
  Name?: string;
  Type?: string;
  Exchange?: string;
  Currency?: string;
}

interface BulkEodRow {
  code: string;
  exchange_short_name?: string;
  volume?: number;
  adjusted_close?: number;
  name?: string;
}

interface UniverseEntry {
  code: string;
  exchange: string;
  name: string;
  currency: string | null;
  volume: number | null;
}

const env = loadEnv();
const API_KEY = env['EODHD_API_KEY'];
if (!API_KEY) {
  console.error('Brak EODHD_API_KEY w .env');
  process.exit(1);
}

const MAX_ETFS = Number(process.env.DISCOVER_MAX_ETFS || 2500);
const MIN_VOL = Number(process.env.DISCOVER_MIN_AVGVOL || 50_000);
const MIN_EOD_DAYS = Number(process.env.DISCOVER_MIN_EOD_DAYS || 250);
const CONCURRENCY = Math.max(1, Number(process.env.DISCOVER_CONCURRENCY || 5));
const EOD_DELAY_MS = Number(process.env.DISCOVER_EOD_DELAY_MS || 150);

const EX_FILTER = process.env.DISCOVER_EXCHANGES?.trim();
const EXCHANGES = EX_FILTER
  ? EX_FILTER.split(/[\s,]+/).filter(Boolean)
  : [...TARGET_EXCHANGES];

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} ${url.split('api_token')[0]}… ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

async function fetchEtfSymbolSet(exchange: string): Promise<Map<string, SymbolRow>> {
  const url = `${EODHD_BASE}/exchange-symbol-list/${exchange}?api_token=${API_KEY}&fmt=json&type=etf`;
  const rows = await fetchJson<SymbolRow[]>(url);
  const map = new Map<string, SymbolRow>();
  for (const row of rows || []) {
    if (!row?.Code) continue;
    map.set(row.Code.toUpperCase(), { ...row, Code: row.Code.toUpperCase() });
  }
  return map;
}

async function fetchBulkEod(exchange: string): Promise<BulkEodRow[]> {
  const url = `${EODHD_BASE}/eod-bulk-last-day/${exchange}?api_token=${API_KEY}&fmt=json`;
  return fetchJson<BulkEodRow[]>(url);
}

function eodRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - Math.ceil(MIN_EOD_DAYS * 1.6));
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
}

async function countEodDays(code: string, exchange: string): Promise<number> {
  const { from, to } = eodRange();
  const url = `${EODHD_BASE}/eod/${code}.${exchange}?from=${from}&to=${to}&api_token=${API_KEY}&fmt=json`;
  try {
    const prices = await fetchJson<unknown[]>(url);
    return Array.isArray(prices) ? prices.length : 0;
  } catch {
    return 0;
  }
}

async function mapPool<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (true) {
      const i = next++;
      if (i >= items.length) break;
      results[i] = await fn(items[i]!, i);
    }
  }
  const n = Math.min(Math.max(1, limit), items.length || 1);
  await Promise.all(Array.from({ length: n }, () => worker()));
  return results;
}

async function main() {
  console.log('Discover ETF universe — giełdy:', EXCHANGES.join(', '));
  const { from, to } = eodRange();

  const candidates: UniverseEntry[] = [];

  for (const ex of EXCHANGES) {
    console.log(`\n=== Giełda ${ex} ===`);

    let etfMap: Map<string, SymbolRow>;
    try {
      etfMap = await fetchEtfSymbolSet(ex);
      console.log(`  Lista ETF (type=etf): ${etfMap.size} symboli`);
    } catch (e) {
      console.error(`  Błąd exchange-symbol-list ${ex}:`, e);
      continue;
    }
    await sleep(300);

    let bulkRows: BulkEodRow[];
    try {
      bulkRows = await fetchBulkEod(ex);
      console.log(`  Bulk EOD: ${bulkRows.length} wierszy`);
    } catch (e) {
      console.error(`  Błąd eod-bulk-last-day ${ex}:`, e);
      continue;
    }
    await sleep(300);

    let matched = 0;
    for (const row of bulkRows) {
      const code = (row.code || '').toUpperCase();
      if (!code || !etfMap.has(code)) continue;
      const vol = row.volume ?? 0;
      if (vol < MIN_VOL) continue;
      const sym = etfMap.get(code)!;
      candidates.push({
        code,
        exchange: ex.toUpperCase(),
        name: sym.Name || row.name || code,
        currency: sym.Currency || null,
        volume: vol,
      });
      matched++;
    }
    console.log(`  ETF-y z vol >= ${MIN_VOL}: ${matched}`);
  }

  const byKey = new Map<string, UniverseEntry>();
  for (const c of candidates) {
    const k = `${c.code}.${c.exchange}`;
    const prev = byKey.get(k);
    if (!prev || (c.volume || 0) > (prev.volume || 0)) byKey.set(k, c);
  }
  let merged = [...byKey.values()].sort(
    (a, b) => (b.volume || 0) - (a.volume || 0)
  );

  console.log(`\nKandydaci po filtrze wolumenu: ${merged.length}`);

  if (merged.length === 0) {
    console.log('Brak kandydatów — kończę.');
    return;
  }

  console.log(`Filtrowanie historii EOD (>= ${MIN_EOD_DAYS} sesji, okno ${from}…${to})…`);

  const passed: UniverseEntry[] = [];
  const batchSize = CONCURRENCY * 4;
  for (let i = 0; i < merged.length; i += batchSize) {
    const slice = merged.slice(i, i + batchSize);
    const counts = await mapPool(slice, CONCURRENCY, async (entry, _i) => {
      const n = await countEodDays(entry.code, entry.exchange);
      return { entry, n };
    });
    for (const { entry, n } of counts) {
      if (n >= MIN_EOD_DAYS) {
        passed.push(entry);
      }
    }
    process.stdout.write(`\r  OK: ${passed.length} (sprawdzono ${Math.min(i + batchSize, merged.length)}/${merged.length})`);
    await sleep(EOD_DELAY_MS);
  }
  console.log('');

  passed.sort((a, b) => (b.volume || 0) - (a.volume || 0));
  const finalList = passed.slice(0, MAX_ETFS);

  const outDir = path.join(getRootDir(), 'data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'etf-universe.json');
  const payload = {
    generatedAt: new Date().toISOString(),
    parameters: {
      exchanges: EXCHANGES,
      minVolume: MIN_VOL,
      minEodDays: MIN_EOD_DAYS,
      maxEtfs: MAX_ETFS,
    },
    count: finalList.length,
    entries: finalList,
  };
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`\nZapisano ${finalList.length} instrumentów → ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
