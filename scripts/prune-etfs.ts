/**
 * Po seed-fundamentals: zawęża katalog ETF-ów do PRUNE_TOTAL_TARGET (~2400)
 * wg gating (AUM, wiek), composite quality score (core) i cap leveraged po wolumenie.
 *
 * Env:
 * - PRUNE_TOTAL_TARGET (default 2400)
 * - PRUNE_LEVERAGED_CAP (default 30)
 * - PRUNE_MIN_AUM (default 30_000_000)
 * - PRUNE_MIN_AGE_YEARS (default 2)
 * - PRUNE_W_AUM, PRUNE_W_TER, PRUNE_W_MS, PRUNE_W_EFF (default 0.5, 0.2, 0.15, 0.15)
 * - PRUNE_DRY_RUN — "true" | "1" → tylko raport, bez DELETE
 *
 * Wymaga: PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { loadEnv, getRootDir } from './lib/loadEnv.ts';

const LEV_CAT = /^(Trading--(Leveraged|Inverse)|Trading - Leveraged\/Inverse)/i;
const LEV_NAME =
  /(^|[^\p{L}\p{N}])(2x|3x|inverse|leveraged|ultra(?![\s-]*short)|short(?![\s-]*(?:term|duration|dated|maturity)))([^\p{L}\p{N}]|$)/iu;

function isLeveragedFromRow(name: string | null, category: string | null): boolean {
  const cat = category ?? '';
  const n = name ?? '';
  if (LEV_CAT.test(cat)) return true;
  return LEV_NAME.test(n);
}

interface WhitelistEntry {
  code: string;
  exchange: string;
}

function loadWhitelist(rootDir: string): WhitelistEntry[] {
  const p = path.join(rootDir, 'data', 'etf-whitelist.json');
  if (!fs.existsSync(p)) {
    console.warn('Brak data/etf-whitelist.json — brak bypass whitelist w prune.');
    return [];
  }
  const raw = JSON.parse(fs.readFileSync(p, 'utf8')) as unknown;
  if (!Array.isArray(raw)) return [];
  const out: WhitelistEntry[] = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue;
    const o = row as Record<string, unknown>;
    const code = typeof o.code === 'string' ? o.code.trim().toUpperCase() : '';
    const exchange = typeof o.exchange === 'string' ? o.exchange.trim().toUpperCase() : '';
    if (code && exchange) out.push({ code, exchange });
  }
  return out;
}

function loadVolumeMap(rootDir: string): Map<string, number> {
  const p = path.join(rootDir, 'data', 'etf-universe.json');
  const m = new Map<string, number>();
  if (!fs.existsSync(p)) {
    console.warn('Brak data/etf-universe.json — wolumen leveraged = 0.');
    return m;
  }
  try {
    const j = JSON.parse(fs.readFileSync(p, 'utf8')) as {
      entries?: Array<{ code: string; exchange: string; volume?: number | null }>;
    };
    for (const e of j.entries || []) {
      const k = `${e.code.toUpperCase()}.${e.exchange.toUpperCase()}`;
      const v = e.volume ?? 0;
      m.set(k, Math.max(m.get(k) ?? 0, v));
    }
  } catch (e) {
    console.warn('Błąd odczytu etf-universe.json:', e);
  }
  return m;
}

interface EtfRow {
  id: string;
  ticker: string;
  exchange: string;
  name: string | null;
  category: string | null;
  total_assets: number | null;
  expense_ratio: number | null;
  morningstar_rating: number | null;
  sharpe_3y: number | null;
  returns_3y: number | null;
  inception_date: string | null;
}

function rowKey(ticker: string, exchange: string): string {
  return `${ticker.toUpperCase()}.${exchange.toUpperCase()}`;
}

function parseBoolEnv(v: string | undefined): boolean {
  if (!v) return false;
  const s = v.trim().toLowerCase();
  return s === '1' || s === 'true' || s === 'yes';
}

function inceptionTooYoung(inception: string | null, minYears: number): boolean {
  if (!inception) return true;
  const d = new Date(inception);
  if (Number.isNaN(d.getTime())) return true;
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - minYears);
  return d > cutoff;
}

/** wartość rośnie = lepszy wynik: najmniejsza→0, największa→1 */
function pctRankAscending(values: number[]): number[] {
  const n = values.length;
  if (n === 0) return [];
  if (n === 1) return [0.5];
  const order = values.map((v, i) => ({ v, i }));
  order.sort((a, b) => a.v - b.v);
  const pct = new Array(n);
  for (let r = 0; r < n; r++) pct[order[r]!.i] = r / (n - 1);
  return pct;
}

interface GatingDiag {
  byNullAum: number;
  byLowAum: number;
  byAge: number;
}

function gatingFails(
  r: EtfRow,
  minAum: number,
  minYears: number
): 'ok' | 'null_aum' | 'low_aum' | 'age' {
  if (r.total_assets == null) return 'null_aum';
  if (r.total_assets < minAum) return 'low_aum';
  if (inceptionTooYoung(r.inception_date, minYears)) return 'age';
  return 'ok';
}

/** Uzupełnia tablicę [0..n) percentylami dla skończonego podzbioru (reszta NaN). */
function assignPercentiles(
  poolLength: number,
  indices: number[],
  values: number[],
  lowerIsBetter: boolean
): number[] {
  const out = Array.from({ length: poolLength }, () => NaN);
  const n = values.length;
  if (n === 0) return out;
  if (n === 1) {
    out[indices[0]!] = 0.5;
    return out;
  }
  const tagged = indices.map((i, k) => ({ i, v: values[k]! }));
  tagged.sort((a, b) => a.v - b.v);
  const ascPct = pctRankAscending(tagged.map((t) => t.v));
  for (let k = 0; k < tagged.length; k++) {
    const pAsc = ascPct[k]!;
    out[tagged[k]!.i] = lowerIsBetter ? 1 - pAsc : pAsc;
  }
  return out;
}

function computeQualityForPool(pool: EtfRow[]): Map<string, number> {
  const qualities = new Map<string, number>();
  const nPool = pool.length;
  if (nPool === 0) return qualities;

  const logIdx: number[] = [];
  const logVals: number[] = [];
  for (let i = 0; i < nPool; i++) {
    const ta = pool[i]!.total_assets;
    if (ta != null && ta > 0 && Number.isFinite(ta)) {
      logIdx.push(i);
      logVals.push(Math.log(ta));
    }
  }
  const pctLogPerRow = assignPercentiles(nPool, logIdx, logVals, false);

  const terIdx: number[] = [];
  const terVals: number[] = [];
  for (let i = 0; i < nPool; i++) {
    const t = pool[i]!.expense_ratio;
    if (t != null && Number.isFinite(t)) {
      terIdx.push(i);
      terVals.push(t);
    }
  }
  const pctTerPerRow = assignPercentiles(nPool, terIdx, terVals, true);

  const effIdx: number[] = [];
  const effVals: number[] = [];
  for (let i = 0; i < nPool; i++) {
    const r = pool[i]!;
    if (r.sharpe_3y != null && Number.isFinite(r.sharpe_3y)) {
      effIdx.push(i);
      effVals.push(r.sharpe_3y);
    } else if (r.returns_3y != null && Number.isFinite(r.returns_3y)) {
      effIdx.push(i);
      effVals.push(r.returns_3y);
    }
  }
  const pctEffPerRow = assignPercentiles(nPool, effIdx, effVals, false);

  const W_AUM = Number(process.env.PRUNE_W_AUM ?? 0.5);
  const W_TER = Number(process.env.PRUNE_W_TER ?? 0.2);
  const W_MS = Number(process.env.PRUNE_W_MS ?? 0.15);
  const W_EFF = Number(process.env.PRUNE_W_EFF ?? 0.15);

  for (let i = 0; i < pool.length; i++) {
    const r = pool[i]!;
    const pctLog = pctLogPerRow[i]!;
    const pctTer = pctTerPerRow[i]!;
    const pctEff = pctEffPerRow[i]!;
    const ms = r.morningstar_rating;
    const scoreMs = ms != null && ms >= 1 && ms <= 5 ? (ms - 1) / 4 : NaN;

    let wSum = 0;
    let acc = 0;
    if (Number.isFinite(pctLog)) {
      acc += W_AUM * pctLog;
      wSum += W_AUM;
    }
    if (Number.isFinite(pctTer)) {
      acc += W_TER * pctTer;
      wSum += W_TER;
    }
    if (Number.isFinite(scoreMs)) {
      acc += W_MS * scoreMs;
      wSum += W_MS;
    }
    if (Number.isFinite(pctEff)) {
      acc += W_EFF * pctEff;
      wSum += W_EFF;
    }
    qualities.set(r.id, wSum > 0 ? acc / wSum : 0);
  }

  return qualities;
}

const env = loadEnv();
const SUPABASE_URL = env['PUBLIC_SUPABASE_URL'];
const SUPABASE_SERVICE_KEY = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Wymagane: PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY w .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const PRUNE_TOTAL_TARGET = Number(process.env.PRUNE_TOTAL_TARGET || 2400);
const PRUNE_LEVERAGED_CAP = Number(process.env.PRUNE_LEVERAGED_CAP || 30);
const PRUNE_MIN_AUM = Number(process.env.PRUNE_MIN_AUM || 30_000_000);
const PRUNE_MIN_AGE_YEARS = Number(process.env.PRUNE_MIN_AGE_YEARS || 2);
const DRY_RUN = parseBoolEnv(process.env.PRUNE_DRY_RUN);

async function fetchAllEtfs(): Promise<EtfRow[]> {
  const pageSize = 1000;
  const all: EtfRow[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('etfs')
      .select(
        'id,ticker,exchange,name,category,total_assets,expense_ratio,morningstar_rating,sharpe_3y,returns_3y,inception_date'
      )
      .range(from, from + pageSize - 1);
    if (error) {
      console.error('Supabase select:', error.message);
      process.exit(1);
    }
    const rows = (data || []) as EtfRow[];
    all.push(...rows);
    if (rows.length < pageSize) break;
  }
  return all;
}

async function main() {
  const rootDir = getRootDir();
  const whitelist = loadWhitelist(rootDir);
  const wlSet = new Set(whitelist.map((w) => rowKey(w.code, w.exchange)));
  const volumeMap = loadVolumeMap(rootDir);

  console.log('Ładowanie ETF z Supabase…');
  const all = await fetchAllEtfs();
  console.log(`  Łącznie w bazie: ${all.length}`);
  console.log(
    `  Parametry: TARGET=${PRUNE_TOTAL_TARGET}, LEV_CAP=${PRUNE_LEVERAGED_CAP}, MIN_AUM=${PRUNE_MIN_AUM}, MIN_AGE=${PRUNE_MIN_AGE_YEARS} lat, DRY_RUN=${DRY_RUN}`
  );

  const whitelistRows = all.filter((r) => wlSet.has(rowKey(r.ticker, r.exchange)));
  const leveragedRows = all.filter((r) => isLeveragedFromRow(r.name, r.category));
  const leveragedNonWl = leveragedRows.filter((r) => !wlSet.has(rowKey(r.ticker, r.exchange)));

  leveragedNonWl.sort(
    (a, b) =>
      (volumeMap.get(rowKey(b.ticker, b.exchange)) ?? 0) -
      (volumeMap.get(rowKey(a.ticker, a.exchange)) ?? 0)
  );

  const WL = whitelistRows.length;
  const maxLevSlots = Math.max(0, PRUNE_TOTAL_TARGET - WL);
  const kLev = Math.min(PRUNE_LEVERAGED_CAP, leveragedNonWl.length, maxLevSlots);
  const keptLevIds = new Set(leveragedNonWl.slice(0, kLev).map((r) => r.id));

  const keepIds = new Set<string>();
  for (const r of whitelistRows) keepIds.add(r.id);
  for (const id of keptLevIds) keepIds.add(id);

  let gatingDiag: GatingDiag = { byNullAum: 0, byLowAum: 0, byAge: 0 };
  const coreCandidates: EtfRow[] = [];
  for (const r of all) {
    const key = rowKey(r.ticker, r.exchange);
    if (wlSet.has(key)) continue;
    if (isLeveragedFromRow(r.name, r.category)) continue;
    const g = gatingFails(r, PRUNE_MIN_AUM, PRUNE_MIN_AGE_YEARS);
    if (g !== 'ok') {
      if (g === 'null_aum') gatingDiag.byNullAum++;
      else if (g === 'low_aum') gatingDiag.byLowAum++;
      else gatingDiag.byAge++;
      continue;
    }
    coreCandidates.push(r);
  }

  const qualityMap = computeQualityForPool(coreCandidates);
  coreCandidates.sort((a, b) => (qualityMap.get(b.id) ?? 0) - (qualityMap.get(a.id) ?? 0));

  const coreSlots = Math.max(0, PRUNE_TOTAL_TARGET - WL - kLev);
  for (let i = 0; i < Math.min(coreSlots, coreCandidates.length); i++) {
    keepIds.add(coreCandidates[i]!.id);
  }

  if (WL > PRUNE_TOTAL_TARGET) {
    console.warn(
      `Uwaga: whitelist w DB (${WL}) przekracza PRUNE_TOTAL_TARGET (${PRUNE_TOTAL_TARGET}) — końcowa liczba ETF będzie większa niż target.`
    );
  }

  const deleteRows = all.filter((r) => !keepIds.has(r.id));
  console.log('\n--- Podsumowanie ---');
  console.log(`Whitelist w DB (obecnych): ${WL}`);
  console.log(`Leveraged wybrane (TOP ${kLev} wg wolumenu, bez whitelist): ${kLev}`);
  console.log(
    `Core wybrane po quality: ${Math.min(coreSlots, coreCandidates.length)} (budżet slotów=${coreSlots})`
  );
  console.log(`Łącznie KEEP: ${keepIds.size}`);
  console.log(`Do usunięcia: ${deleteRows.length}`);
  console.log(`Odrzucone przez gating (core):`, gatingDiag);

  const topCore = coreCandidates.slice(0, 30).map((r) => ({
    ticker: r.ticker,
    ex: r.exchange,
    quality: qualityMap.get(r.id)?.toFixed(4),
    aum: r.total_assets,
    ter: r.expense_ratio,
    ms: r.morningstar_rating,
    sharpe: r.sharpe_3y,
  }));
  console.log('\nTOP 30 core (quality preview):');
  console.table(topCore);

  deleteRows.sort((a, b) => (b.total_assets ?? 0) - (a.total_assets ?? 0));
  const topDel = deleteRows.slice(0, 30).map((r) => ({
    ticker: r.ticker,
    ex: r.exchange,
    aum: r.total_assets,
    name: (r.name || '').slice(0, 48),
  }));
  console.log('\nTOP 30 do usunięcia (wg AUM) — sanity:');
  console.table(topDel);

  if (DRY_RUN) {
    console.log('\nDRY_RUN — bez DELETE.');
    return;
  }

  const idsToDelete = deleteRows.map((r) => r.id);
  const chunkSize = 200;
  let del = 0;
  for (let i = 0; i < idsToDelete.length; i += chunkSize) {
    const chunk = idsToDelete.slice(i, i + chunkSize);
    const { error } = await supabase.from('etfs').delete().in('id', chunk);
    if (error) {
      console.error('DELETE error:', error.message);
      process.exit(1);
    }
    del += chunk.length;
    process.stdout.write(`\rUsunięto ${del}/${idsToDelete.length}`);
  }
  console.log('\nGotowe.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
