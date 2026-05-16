-- Sentiment z EODHD (dzienne agregaty) — uruchom w Supabase SQL Editor dla istniejącej bazy.

ALTER TABLE public.etfs
  ADD COLUMN IF NOT EXISTS sentiment_normalized DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS sentiment_article_count INTEGER,
  ADD COLUMN IF NOT EXISTS sentiment_date DATE,
  ADD COLUMN IF NOT EXISTS sentiment_history JSONB;

COMMENT ON COLUMN public.etfs.sentiment_normalized IS 'EODHD Sentiment API: −1…1, ostatni dzień w sentiment_date';
COMMENT ON COLUMN public.etfs.sentiment_article_count IS 'Liczba artykułów w dniu sentiment_date';
COMMENT ON COLUMN public.etfs.sentiment_date IS 'Data obowiązywania zagregowanego sentymentu';
COMMENT ON COLUMN public.etfs.sentiment_history IS 'Opcjonalnie: ostatnie dni [{date,count,normalized},...]';
