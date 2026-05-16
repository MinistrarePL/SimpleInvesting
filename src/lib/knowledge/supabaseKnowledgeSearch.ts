import { createClient } from '@supabase/supabase-js';
import type { KnowledgeHit } from './bm25';
import type { KnowledgeChunk } from './types';

function readSupabaseServerEnv(): { url: string; serviceKey: string } | null {
  const url =
    import.meta.env.PUBLIC_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL || '';
  const serviceKey =
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    '';

  if (!url || !serviceKey) return null;
  return { url, serviceKey };
}

interface RpcRow {
  id: string;
  source_file: string;
  source_title: string;
  page_start: number;
  page_end: number;
  chunk_index: number;
  content: string;
  rank: number | null;
}

/** Full-text search po stronie Supabase (RPC) — wyłącznie SSR z kluczem service_role. */
export async function searchKnowledgeChunksViaSupabase(
  query: string,
  limit: number,
): Promise<KnowledgeHit[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const env = readSupabaseServerEnv();
  if (!env) return [];

  try {
    const supabase = createClient(env.url, env.serviceKey);
    const { data, error } = await supabase.rpc('search_knowledge_chunks', {
      search_query: trimmed,
      match_count: limit,
    });

    if (error) {
      console.warn('[knowledge] Supabase RPC:', error.message);
      return [];
    }

    const rows = (data ?? []) as RpcRow[];
    return rows.map((row) => {
      const chunk: KnowledgeChunk = {
        id: row.id,
        source_file: row.source_file,
        source_title: row.source_title,
        page_start: row.page_start,
        page_end: row.page_end,
        chunk_index: row.chunk_index,
        text: row.content,
      };
      return { chunk, score: row.rank ?? 0 };
    });
  } catch (e) {
    console.warn('[knowledge] Supabase search failed:', e);
    return [];
  }
}
