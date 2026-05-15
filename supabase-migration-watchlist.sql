-- Watchlist ETF per authenticated user — run once in Supabase SQL Editor.
-- Policies use auth.uid(); GRANT omit anon (guests cannot read/write watchlist).

CREATE TABLE IF NOT EXISTS public.watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  etf_id uuid NOT NULL REFERENCES public.etfs (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, etf_id)
);

ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, DELETE ON public.watchlist TO authenticated;

CREATE POLICY "Users can view own watchlist"
  ON public.watchlist FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can add to own watchlist"
  ON public.watchlist FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can remove from own watchlist"
  ON public.watchlist FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);
