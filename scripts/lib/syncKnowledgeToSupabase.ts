import { createClient } from '@supabase/supabase-js';
import type { KnowledgeChunk } from '../../src/lib/knowledge/types';
import { loadEnv } from './loadEnv';

export async function syncKnowledgeChunksToSupabase(
  chunks: KnowledgeChunk[],
  sourcePdfFiles: string[],
): Promise<void> {
  const env = loadEnv();
  const url =
    env.PUBLIC_SUPABASE_URL ?? process.env.PUBLIC_SUPABASE_URL ?? '';
  const key =
    env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    '';

  if (!url || !key) {
    console.warn(
      'Supabase sync pominięty: ustaw PUBLIC_SUPABASE_URL i SUPABASE_SERVICE_ROLE_KEY (.env lub Netlify).',
    );
    return;
  }

  try {
    const supabase = createClient(url, key);

    for (const name of sourcePdfFiles) {
      const { error } = await supabase.from('knowledge_chunks').delete().eq('source_file', name);
      if (error) {
        throw new Error(`delete (${name}): ${error.message}`);
      }
    }

    const rows = chunks.map((c) => ({
      id: c.id,
      source_file: c.source_file,
      source_title: c.source_title,
      page_start: c.page_start,
      page_end: c.page_end,
      chunk_index: c.chunk_index,
      chunk_body: c.text,
    }));

    const BATCH = 250;
    for (let i = 0; i < rows.length; i += BATCH) {
      const slice = rows.slice(i, i + BATCH);
      const { error } = await supabase.from('knowledge_chunks').upsert(slice, {
        onConflict: 'id',
      });
      if (error) {
        throw new Error(`upsert: ${error.message}`);
      }
    }

    console.log(`Supabase: zsynchronizowano ${chunks.length} wierszy w knowledge_chunks.`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(
      `Supabase sync nie powiódł się (${msg}). Uruchom supabase-migration-knowledge.sql w SQL Editor i ponów extract lub build.`,
    );
  }
}
