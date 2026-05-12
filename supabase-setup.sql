-- Skopiuj ten kod i wklej w Supabase -> SQL Editor -> New Query, a następnie kliknij "Run"
-- Pełny schemat (nowa instalacja). Dla istniejącej bazy użyj najpierw supabase-migration-etfs-extended.sql

CREATE TABLE IF NOT EXISTS public.etfs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticker VARCHAR(20) NOT NULL,
    exchange VARCHAR(20) NOT NULL DEFAULT 'US',
    name VARCHAR(255) NOT NULL,
    currency VARCHAR(10),
    category VARCHAR(200),
    isin VARCHAR(20),
    description TEXT,
    company_name VARCHAR(200),
    domicile VARCHAR(100),
    inception_date DATE,
    total_assets BIGINT,
    expense_ratio NUMERIC(12, 6),
    yield_ttm NUMERIC(12, 6),
    holdings_count INTEGER,
    morningstar_rating SMALLINT,
    morningstar_category_benchmark VARCHAR(300),
    volatility_1y NUMERIC(12, 6),
    volatility_3y NUMERIC(12, 6),
    sharpe_3y NUMERIC(12, 6),
    returns_ytd NUMERIC(12, 6),
    returns_3y NUMERIC(12, 6),
    returns_5y NUMERIC(12, 6),
    returns_10y NUMERIC(12, 6),
    beta NUMERIC(12, 6),
    week_52_high NUMERIC(18, 6),
    week_52_low NUMERIC(18, 6),
    return_1w NUMERIC(10, 2),
    return_1m NUMERIC(10, 2),
    return_1q NUMERIC(10, 2),
    return_1y NUMERIC(10, 2),
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    fundamentals_updated TIMESTAMPTZ,
    CONSTRAINT etfs_ticker_exchange_key UNIQUE (ticker, exchange)
);

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

ALTER TABLE public.etfs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etf_sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etf_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etf_top_holdings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON public.etfs;
CREATE POLICY "Allow public read access" ON public.etfs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access" ON public.etf_sectors;
CREATE POLICY "Allow public read access" ON public.etf_sectors FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access" ON public.etf_regions;
CREATE POLICY "Allow public read access" ON public.etf_regions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access" ON public.etf_top_holdings;
CREATE POLICY "Allow public read access" ON public.etf_top_holdings FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION update_last_updated_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_etfs_last_updated ON public.etfs;
CREATE TRIGGER update_etfs_last_updated
    BEFORE UPDATE ON public.etfs
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated_column();
