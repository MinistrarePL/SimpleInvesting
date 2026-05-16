-- Chunki z PDF (baza wiedzy dla asystenta AI) — uruchom raz w Supabase SQL Editor.
-- Wyszukiwanie: Postgres full-text (konfiguracja "simple", sensowne dla PL bez stemmera).
-- Dostęp z aplikacji wyłącznie przez SUPABASE_SERVICE_ROLE_KEY (SSR); anon/authenticated bez SELECT.

CREATE TABLE IF NOT EXISTS public.knowledge_chunks (
  id text PRIMARY KEY,
  source_file text NOT NULL,
  source_title text NOT NULL,
  page_start integer NOT NULL,
  page_end integer NOT NULL,
  chunk_index integer NOT NULL,
  chunk_body text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS knowledge_chunks_source_file_idx
  ON public.knowledge_chunks (source_file);

CREATE INDEX IF NOT EXISTS knowledge_chunks_fts_idx
  ON public.knowledge_chunks USING gin (to_tsvector('simple', chunk_body));

ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.knowledge_chunks FROM PUBLIC;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.knowledge_chunks TO service_role;

CREATE OR REPLACE FUNCTION public.search_knowledge_chunks(search_query text, match_count integer DEFAULT 12)
RETURNS TABLE (
  id text,
  source_file text,
  source_title text,
  page_start integer,
  page_end integer,
  chunk_index integer,
  content text,
  rank real
)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  IF search_query IS NULL OR btrim(search_query) = '' THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    k.id,
    k.source_file,
    k.source_title,
    k.page_start,
    k.page_end,
    k.chunk_index,
    k.chunk_body AS content,
    ts_rank(
      to_tsvector('simple', k.chunk_body),
      websearch_to_tsquery('simple', search_query)
    )::real AS rank
  FROM public.knowledge_chunks k
  WHERE to_tsvector('simple', k.chunk_body) @@ websearch_to_tsquery('simple', search_query)
  ORDER BY rank DESC
  LIMIT LEAST(COALESCE(match_count, 12), 50);
END;
$$;

REVOKE ALL ON FUNCTION public.search_knowledge_chunks(text, integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.search_knowledge_chunks(text, integer) TO service_role;

-- Opcjonalnie później: CREATE EXTENSION vector; kolumna embedding + indeks HNSW dla semantycznego RAG (OpenAI embeddings).
