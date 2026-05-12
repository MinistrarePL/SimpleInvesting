/**
 * Odświeża stopy zwrotu (1W, 1M, 1Q, 1Y) z danych EOD — plan z dostępem do EOD API.
 * Źródło: wszystkie wiersze z public.etfs (ticker + exchange).
 */
import { createClient } from '@supabase/supabase-js';
import { loadEnv } from './lib/loadEnv.ts';
import { EODHD_BASE, sleep } from './lib/constants.ts';
import { calculateReturns } from '../src/utils/calculateReturns.ts';

const env = loadEnv();
const API_KEY = env['EODHD_API_KEY'];
const SUPABASE_URL = env['PUBLIC_SUPABASE_URL'];
const SUPABASE_SERVICE_KEY = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Wymagane: EODHD_API_KEY, PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY w .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const DELAY_MS = Number(process.env.SEED_PRICES_DELAY_MS || 180);
const MAX_ROWS = process.env.SEED_PRICES_MAX ? Number(process.env.SEED_PRICES_MAX) : undefined;
const CONCURRENCY = Math.max(1, Number(process.env.SEED_PRICES_CONCURRENCY || 4));

interface EtfRow {
  id: string;
  ticker: string;
  exchange: string;
}

function eodRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  /* ~560 dni → wystarczająco sesji dla return_1y (≈252) i bufor święta */
  from.setDate(to.getDate() - 560);
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
}

async function fetchEod(code: string, exchange: string) {
  const { from, to } = eodRange();
  const sym = `${code}.${exchange}`;
  const url = `${EODHD_BASE}/eod/${sym}?from=${from}&to=${to}&api_token=${API_KEY}&fmt=json`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
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

async function fetchAllEtfsFromSupabase(): Promise<EtfRow[]> {
  const pageSize = 1000;
  const all: EtfRow[] = [];
  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from('etfs')
      .select('id,ticker,exchange')
      .order('ticker')
      .range(from, to);
    if (error || !data) {
      throw new Error(error?.message || 'Brak danych Supabase');
    }
    const chunk = data as EtfRow[];
    all.push(...chunk);
    if (chunk.length < pageSize) break;
  }
  return all;
}

async function main() {
  let list: EtfRow[];
  try {
    list = await fetchAllEtfsFromSupabase();
  } catch (e) {
    console.error('Supabase:', e);
    process.exit(1);
  }

  if (MAX_ROWS && MAX_ROWS > 0) list = list.slice(0, MAX_ROWS);
  console.log(`Prices seed: ${list.length} ETF-ów (EOD → returns)`);

  const batchSize = CONCURRENCY * 8;
  let ok = 0;
  let fail = 0;

  for (let i = 0; i < list.length; i += batchSize) {
    const slice = list.slice(i, i + batchSize);
    const results = await mapPool(slice, CONCURRENCY, async (row) => {
      try {
        const prices = await fetchEod(row.ticker, row.exchange);
        if (!prices || !Array.isArray(prices) || prices.length < 2) {
          return { row, err: 'brak danych EOD' };
        }
        const returns = calculateReturns(prices as Parameters<typeof calculateReturns>[0]);
        const { error: upErr } = await supabase
          .from('etfs')
          .update({
            return_1w: returns['1W'],
            return_1m: returns['1M'],
            return_1q: returns['1Q'],
            return_1y: returns['1Y'],
            last_updated: new Date().toISOString(),
          })
          .eq('id', row.id);
        if (upErr) return { row, err: upErr.message };
        return { row, err: null };
      } catch (e) {
        return { row, err: String(e) };
      }
    });

    for (const r of results) {
      if (r.err) {
        fail++;
        console.warn(`  ${r.row.ticker}.${r.row.exchange}: ${r.err}`);
      } else ok++;
    }
    process.stdout.write(`\r  OK: ${ok}, błędy: ${fail} / ${Math.min(i + batchSize, list.length)}`);
    await sleep(DELAY_MS);
  }
  console.log('\nGotowe (prices).');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
