/** Wiersz z Supabase `public.etfs` — pola fundamentalne opcjonalne do czasu migracji */
export interface EtfRow {
  id: string;
  ticker: string;
  name: string;
  exchange?: string;
  currency?: string | null;
  category?: string | null;
  isin?: string | null;
  description?: string | null;
  /** Krótki opis po polsku (Supabase description_pl) */
  description_pl?: string | null;
  company_name?: string | null;
  domicile?: string | null;
  inception_date?: string | null;
  total_assets?: number | null;
  expense_ratio?: number | null;
  yield_ttm?: number | null;
  holdings_count?: number | null;
  morningstar_rating?: number | null;
  morningstar_category_benchmark?: string | null;
  volatility_1y?: number | null;
  volatility_3y?: number | null;
  sharpe_3y?: number | null;
  returns_ytd?: number | null;
  returns_3y?: number | null;
  returns_5y?: number | null;
  returns_10y?: number | null;
  beta?: number | null;
  week_52_high?: number | null;
  week_52_low?: number | null;
  return_1w: number | null;
  return_1m: number | null;
  return_1q: number | null;
  return_1y: number | null;
  /** Dzienny sentyment z EODHD (−1…1), data w `sentiment_date` */
  sentiment_normalized?: number | null;
  sentiment_article_count?: number | null;
  sentiment_date?: string | null;
  /** Ostatnie dni dla mini-wykresu w panelu */
  sentiment_history?: { date: string; count: number; normalized: number }[] | null;
  last_updated: string;
  fundamentals_updated?: string | null;
}

export interface EtfSectorRow {
  sector: string;
  equity_pct: number | null;
  relative_to_category: number | null;
}

export interface EtfRegionRow {
  region: string;
  equity_pct: number | null;
  relative_to_category: number | null;
}

export interface EtfHoldingRow {
  rank: number;
  code: string | null;
  name: string | null;
  sector: string | null;
  assets_pct: number | null;
}

export type EtfDetail = EtfRow & {
  etf_sectors?: EtfSectorRow[];
  etf_regions?: EtfRegionRow[];
  etf_top_holdings?: EtfHoldingRow[];
};