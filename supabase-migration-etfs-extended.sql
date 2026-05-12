-- Migracja: rozszerzenie tabeli etfs + tabele pomocnicze (fundamenty ETF)
-- Uruchom w Supabase SQL Editor po istniejącym supabase-setup.sql

-- 1) Kolumna exchange (domyślnie US dla istniejących wierszy)
ALTER TABLE public.etfs ADD COLUMN IF NOT EXISTS exchange VARCHAR(20) DEFAULT 'US';
UPDATE public.etfs SET exchange = 'US' WHERE exchange IS NULL;
ALTER TABLE public.etfs ALTER COLUMN exchange SET NOT NULL;

-- 2) Zmiana unikalności: (ticker, exchange) zamiast samego tickera
ALTER TABLE public.etfs DROP CONSTRAINT IF EXISTS etfs_ticker_key;
ALTER TABLE public.etfs DROP CONSTRAINT IF EXISTS etfs_ticker_exchange_key;
ALTER TABLE public.etfs ADD CONSTRAINT etfs_ticker_exchange_key UNIQUE (ticker, exchange);

-- 3) Nowe kolumny fundamentalne / metadane
ALTER TABLE public.etfs ADD COLUMN IF NOT EXISTS currency VARCHAR(10);
ALTER TABLE public.etfs ADD COLUMN IF NOT EXISTS isin VARCHAR(20);
ALTER TABLE public.etfs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.etfs ADD COLUMN IF NOT EXISTS company_name VARCHAR(200);
ALTER TABLE public.etfs ADD COLUMN IF NOT EXISTS domicile VARCHAR(100);
ALTER TABLE public.etfs ADD COLUMN IF NOT EXISTS inception_date DATE;
ALTER TABLE public.etfs ADD COLUMN IF NOT EXISTS total_assets BIGINT;
ALTER TABLE public.etfs ADD COLUMN IF NOT EXISTS expense_ratio NUMERIC(12, 6);
ALTER TABLE public.etfs ADD COLUMN IF NOT EXISTS yield_ttm NUMERIC(12, 6);
ALTER TABLE public.etfs ADD COLUMN IF NOT EXISTS holdings_count INTEGER;
ALTER TABLE public.etfs ADD COLUMN IF NOT EXISTS morningstar_rating SMALLINT;
ALTER TABLE public.etfs ADD COLUMN IF NOT EXISTS morningstar_category_benchmark VARCHAR(300);
ALTER TABLE public.etfs ADD COLUMN IF NOT EXISTS volatility_1y NUMERIC(12, 6);
ALTER TABLE public.etfs ADD COLUMN IF NOT EXISTS volatility_3y NUMERIC(12, 6);
ALTER TABLE public.etfs ADD COLUMN IF NOT EXISTS sharpe_3y NUMERIC(12, 6);
ALTER TABLE public.etfs ADD COLUMN IF NOT EXISTS returns_ytd NUMERIC(12, 6);
ALTER TABLE public.etfs ADD COLUMN IF NOT EXISTS returns_3y NUMERIC(12, 6);
ALTER TABLE public.etfs ADD COLUMN IF NOT EXISTS returns_5y NUMERIC(12, 6);
ALTER TABLE public.etfs ADD COLUMN IF NOT EXISTS returns_10y NUMERIC(12, 6);
ALTER TABLE public.etfs ADD COLUMN IF NOT EXISTS beta NUMERIC(12, 6);
ALTER TABLE public.etfs ADD COLUMN IF NOT EXISTS week_52_high NUMERIC(18, 6);
ALTER TABLE public.etfs ADD COLUMN IF NOT EXISTS week_52_low NUMERIC(18, 6);
ALTER TABLE public.etfs ADD COLUMN IF NOT EXISTS fundamentals_updated TIMESTAMPTZ;

-- 4) Tabele sektorów, regionów, top holdingów
CREATE TABLE IF NOT EXISTS public.etf_sectors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    etf_id UUID NOT NULL REFERENCES public.etfs(id) ON DELETE CASCADE,
    sector VARCHAR(120) NOT NULL,
    equity_pct NUMERIC(10, 4),
    relative_to_category NUMERIC(10, 4)
);

CREATE TABLE IF NOT EXISTS public.etf_regions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    etf_id UUID NOT NULL REFERENCES public.etfs(id) ON DELETE CASCADE,
    region VARCHAR(120) NOT NULL,
    equity_pct NUMERIC(10, 4),
    relative_to_category NUMERIC(10, 4)
);

CREATE TABLE IF NOT EXISTS public.etf_top_holdings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    etf_id UUID NOT NULL REFERENCES public.etfs(id) ON DELETE CASCADE,
    rank SMALLINT NOT NULL,
    code VARCHAR(40),
    name VARCHAR(300),
    sector VARCHAR(120),
    assets_pct NUMERIC(10, 4)
);

CREATE INDEX IF NOT EXISTS idx_etf_sectors_etf_id ON public.etf_sectors(etf_id);
CREATE INDEX IF NOT EXISTS idx_etf_regions_etf_id ON public.etf_regions(etf_id);
CREATE INDEX IF NOT EXISTS idx_etf_top_holdings_etf_id ON public.etf_top_holdings(etf_id);
CREATE INDEX IF NOT EXISTS idx_etfs_exchange ON public.etfs(exchange);
CREATE INDEX IF NOT EXISTS idx_etfs_return_1y ON public.etfs(return_1y DESC NULLS LAST);

-- 5) RLS — odczyt publiczny (jak etfs)
ALTER TABLE public.etf_sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etf_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etf_top_holdings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON public.etf_sectors;
CREATE POLICY "Allow public read access" ON public.etf_sectors FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access" ON public.etf_regions;
CREATE POLICY "Allow public read access" ON public.etf_regions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access" ON public.etf_top_holdings;
CREATE POLICY "Allow public read access" ON public.etf_top_holdings FOR SELECT USING (true);
