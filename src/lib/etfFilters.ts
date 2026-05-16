import type { EtfRow } from '../types/etf';
import { getFriendlyCategory } from './categoryMap';
import { inferEtfTheme, localizedThemeCanon } from './etfTheme';
import { getSentimentTone, type SentimentTone } from './sentimentLabel';

export type RiskBucket = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
export type CostBucket = 'low' | 'medium' | 'high';
export type AumBucket = 'small' | 'mid' | 'large' | 'mega';
export type AgeBucket = 'lt1y' | 'y1to3' | 'y3to5' | 'gt5y';

export type ReturnPeriodKey = 'return_1w' | 'return_1m' | 'return_1q' | 'return_1y';
export type LeverageMode = 'any' | 'exclude' | 'only';
export type LeverageToggle = boolean | null;

export type { SentimentTone };

export interface ActiveFilters {
  returnPeriod: ReturnPeriodKey;
  returnMin: number | null;
  categories: Set<string>;
  issuers: Set<string>;
  sentimentTones: Set<SentimentTone>;
  msStars: Set<1 | 2 | 3 | 4 | 5>;
  currencies: Set<string>;
  showLeveraged: LeverageToggle;
  cost: Set<CostBucket>;
  risk: Set<RiskBucket>;
  aum: Set<AumBucket>;
  domiciles: Set<string>;
  paysDividend: boolean | null;
  age: Set<AgeBucket>;
}

export function createEmptyFilters(): ActiveFilters {
  return {
    returnPeriod: 'return_1y',
    returnMin: null,
    categories: new Set(),
    issuers: new Set(),
    sentimentTones: new Set(),
    msStars: new Set(),
    currencies: new Set(),
    showLeveraged: null,
    cost: new Set(),
    risk: new Set(),
    aum: new Set(),
    domiciles: new Set(),
    paysDividend: null,
    age: new Set(),
  };
}

export function isFiltersEmpty(f: ActiveFilters): boolean {
  return (
    f.returnMin == null &&
    f.categories.size === 0 &&
    f.issuers.size === 0 &&
    f.sentimentTones.size === 0 &&
    f.msStars.size === 0 &&
    f.currencies.size === 0 &&
    f.showLeveraged == null &&
    f.cost.size === 0 &&
    f.risk.size === 0 &&
    f.aum.size === 0 &&
    f.domiciles.size === 0 &&
    f.paysDividend == null &&
    f.age.size === 0
  );
}

export function countActiveGroups(f: ActiveFilters): number {
  let n = 0;
  if (f.returnMin != null) n++;
  if (f.categories.size) n++;
  if (f.issuers.size) n++;
  if (f.sentimentTones.size) n++;
  if (f.msStars.size) n++;
  if (f.currencies.size) n++;
  if (f.showLeveraged != null) n++;
  if (f.cost.size) n++;
  if (f.risk.size) n++;
  if (f.aum.size) n++;
  if (f.domiciles.size) n++;
  if (f.paysDividend != null) n++;
  if (f.age.size) n++;
  return n;
}

const LEVERAGE_NAME_RE = /(^|[^\p{L}\p{N}])(2x|3x|inverse|leveraged|ultra(?![\s-]*short)|short(?![\s-]*(?:term|duration|dated|maturity)))([^\p{L}\p{N}]|$)/iu;
const LEVERAGE_CATEGORY_RE = /^(Trading--(Leveraged|Inverse)|Trading - Leveraged\/Inverse)/i;

export function isLeveraged(etf: Pick<EtfRow, 'category' | 'name'>): boolean {
  const cat = etf.category ?? '';
  if (LEVERAGE_CATEGORY_RE.test(cat)) return true;
  const name = etf.name ?? '';
  return LEVERAGE_NAME_RE.test(name);
}

export function classifyRisk(etf: EtfRow): RiskBucket | null {
  if (isLeveraged(etf)) return 'very_high';
  const vol = etf.volatility_1y ?? etf.volatility_3y;
  if (vol == null || !Number.isFinite(vol)) return null;
  if (vol < 3) return 'very_low';
  if (vol < 8) return 'low';
  if (vol < 15) return 'medium';
  if (vol < 25) return 'high';
  return 'very_high';
}

export function classifyCost(expense_ratio: number | null | undefined): CostBucket | null {
  if (expense_ratio == null || !Number.isFinite(expense_ratio)) return null;
  if (expense_ratio <= 0.2) return 'low';
  if (expense_ratio <= 0.5) return 'medium';
  return 'high';
}

export function classifyAum(total_assets: number | null | undefined): AumBucket | null {
  if (total_assets == null || !Number.isFinite(total_assets)) return null;
  if (total_assets < 50_000_000) return 'small';
  if (total_assets < 500_000_000) return 'mid';
  if (total_assets < 1_000_000_000) return 'large';
  return 'mega';
}

function yearsBetween(iso: string, now: Date): number {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return NaN;
  const ms = now.getTime() - d.getTime();
  return ms / (1000 * 60 * 60 * 24 * 365.25);
}

export function classifyAge(inception_date: string | null | undefined, now: Date = new Date()): AgeBucket | null {
  if (!inception_date) return null;
  const yrs = yearsBetween(inception_date, now);
  if (!Number.isFinite(yrs) || yrs < 0) return null;
  if (yrs < 1) return 'lt1y';
  if (yrs < 3) return 'y1to3';
  if (yrs < 5) return 'y3to5';
  return 'gt5y';
}

/** Krótka nazwa issuera z `etf.name` (np. "iShares" / "Vanguard"). Fallback do company_name. */
export function extractIssuer(etf: Pick<EtfRow, 'name' | 'company_name'>): string | null {
  const known = [
    'iShares', 'Vanguard', 'Invesco', 'Amundi', 'Xtrackers', 'SPDR', 'WisdomTree', 'VanEck',
    'UBS', 'Lyxor', 'BNP Paribas', 'HSBC', 'JPMorgan', 'Franklin', 'Fidelity', 'Schwab',
    'Global X', 'ARK', 'L&G', 'Legal & General', 'Goldman Sachs', 'Dimensional', 'State Street',
    'Sprott', 'First Trust', 'KraneShares', 'ProShares', 'Direxion', 'Roundhill', 'BlackRock',
    'Charles Schwab', 'PIMCO',
  ];
  const name = etf.name ?? '';
  for (const k of known) {
    if (name.includes(k)) return k;
  }
  if (etf.company_name) {
    const short = etf.company_name.split(' - ')[0]?.split(' ').slice(0, 3).join(' ').trim();
    if (short && short.length > 2) return short;
  }
  return null;
}

export interface FilterClassification {
  risk: RiskBucket | null;
  cost: CostBucket | null;
  aum: AumBucket | null;
  age: AgeBucket | null;
  leveraged: boolean;
  issuer: string | null;
  theme: string | null;
}

export function classifyEtf(etf: EtfRow): FilterClassification {
  return {
    risk: classifyRisk(etf),
    cost: classifyCost(etf.expense_ratio),
    aum: classifyAum(etf.total_assets),
    age: classifyAge(etf.inception_date),
    leveraged: isLeveraged(etf),
    issuer: extractIssuer(etf),
    theme: inferThemeKey(etf.name),
  };
}

/** Klucz tematu z `etfTheme` — kanoniczna etykieta EN (np. "Semiconductors"). */
function inferThemeKey(name: string | null | undefined): string | null {
  if (!name) return null;
  return inferEtfTheme(name, 'en');
}

const EXP_THEME = 'theme:';
const EXP_CAT = 'cat:';

/**
 * Klucz zgodny z kolumną tabeli: jeśli z nazwy wynika temat → `theme:<enCanon>`,
 * w przeciwnym razie `cat:<surowa kategoria Morningstar>` (może być pusty string).
 */
export function exposureFilterKey(etf: Pick<EtfRow, 'name' | 'category'>): string {
  const t = inferThemeKey(etf.name);
  if (t) return `${EXP_THEME}${t}`;
  return `${EXP_CAT}${etf.category ?? ''}`;
}

/** Etykieta do UI (chip, dropdown) dla klucza z `exposureFilterKey`. */
export function exposureKeyLabel(key: string, lang: 'pl' | 'en'): string {
  if (key.startsWith(EXP_THEME)) {
    return localizedThemeCanon(key.slice(EXP_THEME.length), lang);
  }
  if (key.startsWith(EXP_CAT)) {
    const raw = key.slice(EXP_CAT.length);
    return getFriendlyCategory(raw || null, lang);
  }
  return key;
}

function passesReturn(etf: EtfRow, f: ActiveFilters): boolean {
  if (f.returnMin == null) return true;
  const v = etf[f.returnPeriod];
  if (v == null) return false;
  return v >= f.returnMin;
}

export function applyFilters(etfs: EtfRow[], f: ActiveFilters): EtfRow[] {
  if (isFiltersEmpty(f)) return etfs;
  const now = new Date();

  return etfs.filter((etf) => {
    if (!passesReturn(etf, f)) return false;

    if (f.categories.size) {
      const ek = exposureFilterKey(etf);
      if (!f.categories.has(ek)) return false;
    }

    if (f.issuers.size) {
      const issuer = extractIssuer(etf);
      if (!issuer || !f.issuers.has(issuer)) return false;
    }

    if (f.sentimentTones.size) {
      const s = etf.sentiment_normalized;
      if (s == null || !Number.isFinite(s)) return false;
      if (!f.sentimentTones.has(getSentimentTone(s))) return false;
    }

    if (f.msStars.size) {
      const ms = etf.morningstar_rating;
      if (ms == null || !f.msStars.has(ms as 1 | 2 | 3 | 4 | 5)) return false;
    }

    if (f.currencies.size && (!etf.currency || !f.currencies.has(etf.currency))) return false;

    if (f.showLeveraged != null) {
      const lev = isLeveraged(etf);
      if (f.showLeveraged && !lev) return false;
      if (!f.showLeveraged && lev) return false;
    }

    if (f.cost.size) {
      const c = classifyCost(etf.expense_ratio);
      if (c == null || !f.cost.has(c)) return false;
    }

    if (f.risk.size) {
      const r = classifyRisk(etf);
      if (r == null || !f.risk.has(r)) return false;
    }

    if (f.aum.size) {
      const a = classifyAum(etf.total_assets);
      if (a == null || !f.aum.has(a)) return false;
    }

    if (f.domiciles.size && (!etf.domicile || !f.domiciles.has(etf.domicile))) return false;

    if (f.paysDividend != null) {
      const pays = etf.yield_ttm != null && etf.yield_ttm > 0;
      if (f.paysDividend && !pays) return false;
      if (!f.paysDividend && pays) return false;
    }

    if (f.age.size) {
      const ag = classifyAge(etf.inception_date, now);
      if (ag == null || !f.age.has(ag)) return false;
    }

    return true;
  });
}

export const RISK_BUCKETS: RiskBucket[] = ['very_low', 'low', 'medium', 'high', 'very_high'];
export const COST_BUCKETS: CostBucket[] = ['low', 'medium', 'high'];
export const AUM_BUCKETS: AumBucket[] = ['small', 'mid', 'large', 'mega'];
export const AGE_BUCKETS: AgeBucket[] = ['lt1y', 'y1to3', 'y3to5', 'gt5y'];
export const RETURN_THRESHOLDS = [0, 5, 10, 20] as const;
