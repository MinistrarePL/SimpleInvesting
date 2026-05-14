/**
 * Pobiera dane fundamentalne z EODHD i zapisuje do Supabase (tabela etfs + etf_sectors, etf_regions, etf_top_holdings).
 * Wymaga aktywnego planu z dostępem do Fundamentals API.
 *
 * Ocena Morningstar (`morningstar_rating`): z bloku `ETF_Data.MorningStar` (EODHD — wielkie „S”)
 * oraz zapasowych pól; endpoint najpierw `/api/v1.1/fundamentals/`, przy 404 — `/api/fundamentals/`.
 *
 * Wejście: data/etf-universe.json (z scripts/discover-etfs.ts)
 *
 * Po seed: opcjonalnie `npm run prune:etfs` (wymaga zsynchronizowanego etf-universe.json
 * dla rankingu leveraged wg wolumenu; zob. scripts/prune-etfs.ts).
 *
 * Opcjonalnie:
 * - SEED_FUNDAMENTALS_MAX (np. 50) — limit rekordów do przetworzenia (test)
 * - SEED_FUNDAMENTALS_DELAY_MS (domyślnie 220) — opóźnienie między tickerami (rate limit; fundamentals = 10 calls)
 */
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { loadEnv, getRootDir } from './lib/loadEnv.ts';
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
const DELAY_MS = Number(process.env.SEED_FUNDAMENTALS_DELAY_MS || 220);
const MAX_ROWS = process.env.SEED_FUNDAMENTALS_MAX
  ? Number(process.env.SEED_FUNDAMENTALS_MAX)
  : undefined;

interface UniverseFile {
  entries: Array<{ code: string; exchange: string; name: string; currency?: string | null }>;
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

/**
 * Ocena Morningstar (1–5 gwiazdek) w odpowiedzi EODHD bywa pod różnymi kluczami lub jako tekst.
 * W odpowiedzi EODHD blok jest pod kluczem `MorningStar` (wielkie „S”), nie `Morningstar`.
 */
function pickMorningstarRating(
  etfData: Record<string, unknown>,
  morningstar: Record<string, unknown>,
  general: Record<string, unknown>,
  performance: Record<string, unknown>,
  highlights: Record<string, unknown>
): number | null {
  const starFromString = (s: string): number | null => {
    const t = s.trim();
    if (!t) return null;
    const starGlyphs = (t.match(/★|⭐|\u2605/g) || []).length;
    if (starGlyphs >= 1 && starGlyphs <= 5) return starGlyphs;
    const word = t.match(/\b([1-5])\s*(?:star|stars|gwiazd|gw\.?)\b/i);
    if (word) return Number(word[1]);
    return null;
  };

  const fromUnknown = (v: unknown): number | null => {
    if (v == null || v === '') return null;
    if (typeof v === 'string') {
      const parsed = starFromString(v);
      if (parsed != null) return parsed;
    }
    const n = num(v);
    if (n == null) return null;
    const rounded = Math.round(n);
    if (rounded >= 1 && rounded <= 5) return rounded;
    return null;
  };

  const candidates: unknown[] = [
    morningstar.Ratio,
    morningstar.Rating,
    morningstar.Morningstar_Rating,
    morningstar.Mstar_Rating,
    morningstar.Stars,
    morningstar.Star_Rating,
    performance.Morningstar_Rating,
    performance.Mstar_Rating,
    highlights.Morningstar_Rating,
    highlights.MorningstarRating,
    etfData.Morningstar_Rating,
    etfData.MorningstarRating,
    general.Morningstar_Rating,
    general.MorningstarRating,
  ];

  for (const v of candidates) {
    const r = fromUnknown(v);
    if (r != null) return r;
  }

  return null;
}

function parseDate(v: unknown): string | null {
  if (!v || typeof v !== 'string') return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0]!;
}

function pickExpenseRatio(etfData: Record<string, unknown>): number | null {
  const net = num(etfData.NetExpenseRatio);
  const ongoing = num(etfData.Ongoing_Charge);
  if (net != null) {
    // Dokumentacja: 0.0015 = 0.15% — zapisujemy w % dla czytelności w UI
    if (Math.abs(net) < 1) return Number((net * 100).toFixed(4));
    return net;
  }
  if (ongoing != null) return ongoing;
  return null;
}

async function fetchFundamentals(fullSymbol: string): Promise<Record<string, unknown> | null> {
  const sym = encodeURIComponent(fullSymbol);
  const urls = [
    `${EODHD_BASE}/v1.1/fundamentals/${sym}?api_token=${API_KEY}&fmt=json`,
    `${EODHD_BASE}/fundamentals/${sym}?api_token=${API_KEY}&fmt=json`,
  ];
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i]!;
    const res = await fetch(url);
    if (res.ok) {
      return (await res.json()) as Record<string, unknown>;
    }
    if (res.status === 404 && i === 0) continue;
    console.warn(`  fundamentals ${fullSymbol}: HTTP ${res.status}`);
    return null;
  }
  return null;
}

async function replaceChildRows(
  etfId: string,
  sectors: { sector: string; equity_pct: number | null; relative_to_category: number | null }[],
  regions: { region: string; equity_pct: number | null; relative_to_category: number | null }[],
  holdings: { rank: number; code: string | null; name: string | null; sector: string | null; assets_pct: number | null }[]
) {
  await supabase.from('etf_sectors').delete().eq('etf_id', etfId);
  await supabase.from('etf_regions').delete().eq('etf_id', etfId);
  await supabase.from('etf_top_holdings').delete().eq('etf_id', etfId);

  if (sectors.length) {
    const { error } = await supabase.from('etf_sectors').insert(
      sectors.map((s) => ({ etf_id: etfId, ...s }))
    );
    if (error) console.warn('  etf_sectors insert:', error.message);
  }
  if (regions.length) {
    const { error } = await supabase.from('etf_regions').insert(
      regions.map((r) => ({ etf_id: etfId, ...r }))
    );
    if (error) console.warn('  etf_regions insert:', error.message);
  }
  if (holdings.length) {
    const { error } = await supabase.from('etf_top_holdings').insert(
      holdings.map((h) => ({ etf_id: etfId, ...h }))
    );
    if (error) console.warn('  etf_top_holdings insert:', error.message);
  }
}

function parseSectorWeights(raw: unknown) {
  const out: { sector: string; equity_pct: number | null; relative_to_category: number | null }[] = [];
  if (!raw || typeof raw !== 'object') return out;
  for (const [sector, val] of Object.entries(raw as Record<string, Record<string, unknown>>)) {
    if (!val || typeof val !== 'object') continue;
    out.push({
      sector,
      equity_pct: num(val['Equity_%']),
      relative_to_category: num(val['Relative_to_Category']),
    });
  }
  return out;
}

function parseWorldRegions(raw: unknown) {
  const out: { region: string; equity_pct: number | null; relative_to_category: number | null }[] = [];
  if (!raw || typeof raw !== 'object') return out;
  for (const [region, val] of Object.entries(raw as Record<string, Record<string, unknown>>)) {
    if (!val || typeof val !== 'object') continue;
    out.push({
      region,
      equity_pct: num(val['Equity_%']),
      relative_to_category: num(val['Relative_to_Category']),
    });
  }
  return out;
}

function parseTop10(raw: unknown) {
  const tmp: {
    code: string | null;
    name: string | null;
    sector: string | null;
    assets_pct: number | null;
  }[] = [];
  if (!raw || typeof raw !== 'object') return [];
  for (const [_key, val] of Object.entries(raw as Record<string, Record<string, unknown>>)) {
    if (!val || typeof val !== 'object') continue;
    tmp.push({
      code: val.Code != null ? String(val.Code) : null,
      name: val.Name != null ? String(val.Name) : null,
      sector: val.Sector != null ? String(val.Sector) : null,
      assets_pct: num(val['Assets_%']),
    });
  }
  tmp.sort((a, b) => (b.assets_pct ?? 0) - (a.assets_pct ?? 0));
  return tmp.slice(0, 10).map((h, i) => ({
    rank: i + 1,
    code: h.code,
    name: h.name,
    sector: h.sector,
    assets_pct: h.assets_pct,
  }));
}

async function main() {
  const universePath = path.join(getRootDir(), 'data', 'etf-universe.json');
  if (!fs.existsSync(universePath)) {
    console.error('Brak pliku', universePath, '— najpierw uruchom: npm run discover:etfs');
    process.exit(1);
  }
  const universe = JSON.parse(fs.readFileSync(universePath, 'utf8')) as UniverseFile;
  let entries = universe.entries || [];
  if (MAX_ROWS && MAX_ROWS > 0) entries = entries.slice(0, MAX_ROWS);

  console.log(`Fundamentals seed: ${entries.length} instrumentów`);

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]!;
    const full = `${e.code}.${e.exchange}`;
    process.stdout.write(`\r[${i + 1}/${entries.length}] ${full}    `);

    const data = await fetchFundamentals(full);
    if (!data) {
      await sleep(DELAY_MS);
      continue;
    }

    const general = (data.General || {}) as Record<string, unknown>;
    const technicals = (data.Technicals || {}) as Record<string, unknown>;
    const highlights = (data.Highlights || {}) as Record<string, unknown>;
    const etfData = (data.ETF_Data || {}) as Record<string, unknown>;
    const performance = (etfData.Performance || {}) as Record<string, unknown>;
    const morningstar = (etfData.MorningStar || etfData.Morningstar || {}) as Record<string, unknown>;

    const retYtd = num(performance.Returns_YTD) ?? num(etfData.Returns_YTD);
    const ret3y = num(performance.Returns_3Y) ?? num(etfData.Returns_3Y);
    const ret5y = num(performance.Returns_5Y) ?? num(etfData.Returns_5Y);
    const ret10y = num(performance.Returns_10Y) ?? num(etfData.Returns_10Y);

    const name = (general.Name as string) || e.name || e.code;
    const category = (general.Category as string) || null;
    const rawDesc = (general.Description as string) || null;
    const hasUsefulDesc = rawDesc && rawDesc !== 'NA' && rawDesc !== 'N/A' && rawDesc.trim().length > 5;
    const currency = (general.CurrencyCode as string) || e.currency || null;
    const isin = (etfData.ISIN as string) || null;
    const companyName = (etfData.Company_Name as string) || null;
    const domicile = (etfData.Domicile as string) || null;
    const inceptionDate = parseDate(etfData.Inception_Date);
    const totalAssets = num(etfData.TotalAssets) != null ? Math.round(num(etfData.TotalAssets)!) : null;
    const expenseRatio = pickExpenseRatio(etfData);
    const yieldTtm = num(etfData.Yield);
    const holdingsCount = num(etfData.Holdings_Count) != null ? Math.round(num(etfData.Holdings_Count)!) : null;

    const msRating = pickMorningstarRating(etfData, morningstar, general, performance, highlights);

    // Opisy: description (EN) tylko gdy EODHD ma sensowny tekst.
    // description_pl nie jest ustawiane tutaj — pozostaje wygenerowany przez scripts/generate-descriptions.ts.
    const row: Record<string, unknown> = {
      ticker: e.code,
      exchange: e.exchange,
      name,
      category,
      currency,
      isin,
      company_name: companyName,
      domicile,
      inception_date: inceptionDate,
      total_assets: totalAssets,
      expense_ratio: expenseRatio,
      yield_ttm: yieldTtm,
      holdings_count: holdingsCount,
      morningstar_rating: msRating,
      morningstar_category_benchmark: (morningstar.Category_Benchmark as string) || null,
      volatility_1y: num(etfData['1y_Volatility']),
      volatility_3y: num(etfData['3y_Volatility']),
      sharpe_3y: num(etfData['3y_SharpRatio']),
      returns_ytd: retYtd,
      returns_3y: ret3y,
      returns_5y: ret5y,
      returns_10y: ret10y,
      beta: num(technicals.Beta),
      week_52_high: num(technicals['52WeekHigh']),
      week_52_low: num(technicals['52WeekLow']),
      fundamentals_updated: new Date().toISOString(),
    };

    if (hasUsefulDesc) {
      row.description = rawDesc;
    }

    const { data: upserted, error } = await supabase
      .from('etfs')
      .upsert(row, { onConflict: 'ticker,exchange' })
      .select('id')
      .single();

    if (error || !upserted) {
      console.warn(`\n  upsert błąd ${full}:`, error?.message);
      await sleep(DELAY_MS);
      continue;
    }

    const etfId = upserted.id as string;
    const sectors = parseSectorWeights(etfData.Sector_Weights);
    const regions = parseWorldRegions(etfData.World_Regions);
    const holdings = parseTop10(etfData.Top_10_Holdings);

    await replaceChildRows(etfId, sectors, regions, holdings);
    await sleep(DELAY_MS);
  }

  console.log('\nGotowe (fundamentals).');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
