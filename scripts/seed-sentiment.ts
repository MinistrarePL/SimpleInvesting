/**
 * Dzienny sentyment z EODHD (Sentiment API) → public.etfs / pola sentiment_*.
 * Uruchamiać maks. 1×/dzień (cron); nie wywołuje się z frontu.
 */
import { createClient } from '@supabase/supabase-js';
import { loadEnv } from './lib/loadEnv.ts';
import { EODHD_BASE, sleep } from './lib/constants.ts';

const env = loadEnv();
const API_KEY = env['EODHD_API_KEY'];
const SUPABASE_URL = env['PUBLIC_SUPABASE_URL'];
const SUPABASE_SERVICE_KEY = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Wymagane: EODHD_API_KEY, PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY w .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const BATCH_SIZE = Math.max(1, Number(process.env.SEED_SENTIMENT_BATCH || 25));
const HISTORY_DAYS = Math.max(7, Number(process.env.SEED_SENTIMENT_HISTORY_DAYS || 45));
const FETCH_DAYS = Math.max(HISTORY_DAYS + 5, Number(process.env.SEED_SENTIMENT_FETCH_DAYS || 90));
const DELAY_MS = Number(process.env.SEED_SENTIMENT_DELAY_MS || 400);
const MAX_ROWS = process.env.SEED_SENTIMENT_MAX ? Number(process.env.SEED_SENTIMENT_MAX) : undefined;

interface EtfRow {
  id: string;
  ticker: string;
  exchange: string | null;
}

interface SentimentDay {
  date: string;
  count: number;
  normalized: number;
}

function eodCode(row: EtfRow): string {
  const ex = (row.exchange || 'US').trim() || 'US';
  return `${row.ticker.trim()}.${ex}`.toLowerCase();
}

function sentimentRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setUTCDate(from.getUTCDate() - FETCH_DAYS);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { from: iso(from), to: iso(to) };
}

/** Buduje mapę lowercase → seria (EODHD bywa różnej wielkości liter w kluczach). */
function normalizeSentimentsPayload(raw: unknown): Map<string, SentimentDay[]> {
  const map = new Map<string, SentimentDay[]>();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return map;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!Array.isArray(v)) continue;
    const series: SentimentDay[] = [];
    for (const item of v) {
      if (!item || typeof item !== 'object') continue;
      const o = item as Record<string, unknown>;
      const date = typeof o.date === 'string' ? o.date : '';
      const count = typeof o.count === 'number' ? o.count : Number(o.count);
      const normalized = typeof o.normalized === 'number' ? o.normalized : Number(o.normalized);
      if (!date || !Number.isFinite(count) || !Number.isFinite(normalized)) continue;
      series.push({ date, count, normalized });
    }
    if (series.length) map.set(k.trim().toLowerCase(), series);
  }
  return map;
}

async function fetchSentimentsBatch(codes: string[]): Promise<Map<string, SentimentDay[]>> {
  const { from, to } = sentimentRange();
  const s = codes.map((c) => encodeURIComponent(c)).join(',');
  const url = `${EODHD_BASE}/sentiments?s=${s}&from=${from}&to=${to}&api_token=${API_KEY}&fmt=json`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`EODHD sentiments ${res.status}: ${text.slice(0, 200)}`);
  }
  const raw = await res.json();
  return normalizeSentimentsPayload(raw);
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

function pickScalarAndHistory(series: SentimentDay[]): {
  latest: SentimentDay;
  history: { date: string; count: number; normalized: number }[];
} {
  const sorted = [...series].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1]!;
  const tail = sorted.slice(-HISTORY_DAYS);
  const history = tail.map((d) => ({ date: d.date, count: d.count, normalized: d.normalized }));
  return { latest, history };
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
  console.log(`Sentiment seed: ${list.length} ETF-ów, batch=${BATCH_SIZE}, historia=${HISTORY_DAYS} dni`);

  let ok = 0;
  let fail = 0;
  let batchFail = 0;

  for (let i = 0; i < list.length; i += BATCH_SIZE) {
    const slice = list.slice(i, i + BATCH_SIZE);
    const codes = slice.map(eodCode);
    let lookup: Map<string, SentimentDay[]>;
    try {
      lookup = await fetchSentimentsBatch(codes);
    } catch (e) {
      batchFail++;
      console.warn(`  batch ${i / BATCH_SIZE + 1}: ${e}`);
      fail += slice.length;
      await sleep(DELAY_MS);
      continue;
    }

    for (const row of slice) {
      const key = eodCode(row);
      const series = lookup.get(key);
      if (!series?.length) {
        fail++;
        console.warn(`  ${key}: brak serii sentymentu`);
        continue;
      }
      const { latest, history } = pickScalarAndHistory(series);
      const { error: upErr } = await supabase
        .from('etfs')
        .update({
          sentiment_normalized: latest.normalized,
          sentiment_article_count: latest.count,
          sentiment_date: latest.date,
          sentiment_history: history,
        })
        .eq('id', row.id);
      if (upErr) {
        fail++;
        console.warn(`  ${key}: ${upErr.message}`);
      } else ok++;
    }

    process.stdout.write(`\r  OK: ${ok}, błędy: ${fail}, błędne batche: ${batchFail} / ${Math.min(i + BATCH_SIZE, list.length)}`);
    await sleep(DELAY_MS);
  }

  console.log('\nGotowe (sentiment).');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
