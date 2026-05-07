-- Skopiuj ten kod i wklej w Supabase -> SQL Editor -> New Query, a następnie kliknij "Run"

CREATE TABLE IF NOT EXISTS public.etfs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticker VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    return_1w NUMERIC(10, 2),
    return_1m NUMERIC(10, 2),
    return_1q NUMERIC(10, 2),
    return_1y NUMERIC(10, 2),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Zabezpieczenia (Row Level Security)
-- Pozwalamy każdemu (anonimowemu użytkownikowi) na odczyt danych z tabeli
ALTER TABLE public.etfs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" 
ON public.etfs 
FOR SELECT 
USING (true);

-- Włączamy rozszerzenie do automatycznej aktualizacji daty (opcjonalnie)
CREATE OR REPLACE FUNCTION update_last_updated_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_etfs_last_updated
    BEFORE UPDATE ON public.etfs
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated_column();
