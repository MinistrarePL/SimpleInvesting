-- Dwujezyczne opisy: polska wersja wygenerowana / utrzymywana osobno od description (EN).
-- Uruchom w Supabase → SQL Editor.

ALTER TABLE public.etfs ADD COLUMN IF NOT EXISTS description_pl TEXT;

COMMENT ON COLUMN public.etfs.description_pl IS 'Krótki opis ETF po polsku (UI przy języku PL).';
