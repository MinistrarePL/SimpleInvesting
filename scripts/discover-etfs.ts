/**
 * Odkrywa uniwersum ETF-ów: lista z giełd → bulk EOD (wolumen) → filtr historii EOD.
 * Zapis: data/etf-universe.json
 *
 * Opcjonalnie wczytuje data/etf-whitelist.json — symbole spoza filtra wolumenu/EOD są
 * force-include do uniwersum (gwarantowany seed); przy limicie DISCOVER_MAX_ETFS
 * wpisy whitelisty są zawsze utrzymane, reszta obcinana po wolumenie.
 *
 * Zmienne środowiskowe (opcjonalne):
 * - DISCOVER_MAX_ETFS (domyślnie 3000)
 * - DISCOVER_EXCHANGES — np. "US" lub "US,XETRA" (domyślnie wszystkie)
 * - DISCOVER_MIN_AVGVOL (domyślnie 10000) — min. wolumen ostatniej sesji
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

interface WhitelistEntry {
  code: string;
  exchange: string;
  tag?: string;
}

function entryKey(code: string, exchange: string): string {
  return `${code}.${exchange}`;
}

function loadWhitelist(rootDir: string): WhitelistEntry[] {
  const p = path.join(rootDir, 'data', 'etf-whitelist.json');
  if (!fs.existsSync(p)) {
    console.warn('Brak data/etf-whitelist.json — pomijam whitelistę.');
    return [];
  }
  try {
    const raw = JSON.parse(fs.readFileSync(p, 'utf8')) as unknown;
    if (!Array.isArray(raw)) return [];
    const out: WhitelistEntry[] = [];
    for (const row of raw) {
      if (!row || typeof row !== 'object') continue;
      const o = row as Record<string, unknown>;
      const code = typeof o.code === 'string' ? o.code.trim().toUpperCase() : '';
      const exchange = typeof o.exchange === 'string' ? o.exchange.trim().toUpperCase() : '';
      if (!code || !exchange) continue;
      out.push({
        code,
        exchange,
        tag: typeof o.tag === 'string' ? o.tag : undefined,
      });
    }
    console.log(`Whitelista must-have: ${out.length} par ticker.giełda`);
    return out;
  } catch (e) {
    console.warn('Błąd odczytu etf-whitelist.json:', e);
    return [];
  }
}

const env = loadEnv();
const API_KEY = env['EODHD_API_KEY'];
if (!API_KEY) {
  console.error('Brak EODHD_API_KEY w .env');
  process.exit(1);
}

const MAX_ETFS = Number(process.env.DISCOVER_MAX_ETFS || 3000);
const MIN_VOL = Number(process.env.DISCOVER_MIN_AVGVOL || 10_000);
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
  const rootDir = getRootDir();
  const whitelist = loadWhitelist(rootDir);
  const whitelistKeySet = new Set(whitelist.map((w) => entryKey(w.code, w.exchange)));

  console.log('Discover ETF universe — giełdy:', EXCHANGES.join(', '));
  const { from, to } = eodRange();

  const symbolCache = new Map<string, Map<string, SymbolRow>>();
  const bulkCache = new Map<string, BulkEodRow[]>();

  async function symbolMapFor(ex: string): Promise<Map<string, SymbolRow>> {
    const exUp = ex.toUpperCase();
    let m = symbolCache.get(exUp);
    if (!m) {
      m = await fetchEtfSymbolSet(exUp);
      symbolCache.set(exUp, m);
      await sleep(300);
    }
    return m;
  }

  async function bulkFor(ex: string): Promise<BulkEodRow[]> {
    const exUp = ex.toUpperCase();
    let rows = bulkCache.get(exUp);
    if (!rows) {
      rows = await fetchBulkEod(exUp);
      bulkCache.set(exUp, rows);
      await sleep(300);
    }
    return rows;
  }

  const candidates: UniverseEntry[] = [];

  for (const ex of EXCHANGES) {
    console.log(`\n=== Giełda ${ex} ===`);

    let etfMap: Map<string, SymbolRow>;
    try {
      etfMap = await fetchEtfSymbolSet(ex);
      symbolCache.set(ex.toUpperCase(), etfMap);
      console.log(`  Lista ETF (type=etf): ${etfMap.size} symboli`);
    } catch (e) {
      console.error(`  Błąd exchange-symbol-list ${ex}:`, e);
      continue;
    }
    await sleep(300);

    let bulkRows: BulkEodRow[];
    try {
      bulkRows = await fetchBulkEod(ex);
      bulkCache.set(ex.toUpperCase(), bulkRows);
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
    const k = entryKey(c.code, c.exchange);
    const prev = byKey.get(k);
    if (!prev || (c.volume || 0) > (prev.volume || 0)) byKey.set(k, c);
  }
  let merged = [...byKey.values()].sort(
    (a, b) => (b.volume || 0) - (a.volume || 0)
  );

  console.log(`\nKandydaci po filtrze wolumenu: ${merged.length}`);

  if (merged.length === 0 && whitelist.length === 0) {
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
    process.stdout.write(
      `\r  OK: ${passed.length} (sprawdzono ${Math.min(i + batchSize, merged.length)}/${merged.length})`
    );
    await sleep(EOD_DELAY_MS);
  }
  console.log('');

  const resultByKey = new Map<string, UniverseEntry>();
  for (const e of passed) {
    resultByKey.set(entryKey(e.code, e.exchange), e);
  }

  for (const w of whitelist) {
    const k = entryKey(w.code, w.exchange);
    if (resultByKey.has(k)) continue;

    const ex = w.exchange;
    const symMap = await symbolMapFor(ex);
    const sym = symMap.get(w.code);
    if (!sym) {
      console.warn(
        `[whitelist] Symbol ${w.code}.${ex} nie występuje na liście ETF tej giełdy — pomijam dodanie.`
      );
      continue;
    }

    const bulkRows = await bulkFor(ex);
    let volFromBulk: number | null = null;
    const rowVol = bulkRows.find((r) => (r.code || '').toUpperCase() === w.code);
    if (rowVol && rowVol.volume != null) volFromBulk = rowVol.volume;

    const nDays = await countEodDays(w.code, ex);
    if (nDays < MIN_EOD_DAYS) {
      console.warn(
        `[whitelist] ${w.code}.${ex}: tylko ${nDays} sesji EOD w oknie (wymagane ${MIN_EOD_DAYS}) — dopisuję mimo to.`
      );
    }

    resultByKey.set(k, {
      code: w.code,
      exchange: ex,
      name: sym.Name || w.code,
      currency: sym.Currency || null,
      volume: volFromBulk ?? 0,
    });
    await sleep(EOD_DELAY_MS);
  }

  let finalList = [...resultByKey.values()];

  if (finalList.length > MAX_ETFS) {
    const keptKeys = whitelistKeySet;
    const whitelistEntries = finalList.filter((e) =>
      keptKeys.has(entryKey(e.code, e.exchange))
    );
    const rest = finalList
      .filter((e) => !keptKeys.has(entryKey(e.code, e.exchange)))
      .sort((a, b) => (b.volume || 0) - (a.volume || 0));
    const takeRest = Math.max(0, MAX_ETFS - whitelistEntries.length);
    finalList = [...whitelistEntries, ...rest.slice(0, takeRest)];
    console.warn(
      `Po przycięciu do ${MAX_ETFS}: whitelist=${whitelistEntries.length}, reszta po vol=${takeRest}`
    );
  }

  finalList.sort((a, b) => (b.volume || 0) - (a.volume || 0));

  const outDir = path.join(rootDir, 'data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'etf-universe.json');
  const payload = {
    generatedAt: new Date().toISOString(),
    parameters: {
      exchanges: EXCHANGES,
      minVolume: MIN_VOL,
      minEodDays: MIN_EOD_DAYS,
      maxEtfs: MAX_ETFS,
      whitelistPairs: whitelist.length,
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
