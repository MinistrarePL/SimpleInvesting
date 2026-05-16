import fs from 'fs';
import { createBm25Index, type KnowledgeHit } from './bm25';
import { getKnowledgeChunksPath, loadKnowledgeChunksFromFile } from './loadChunks';
import { searchKnowledgeChunksViaSupabase } from './supabaseKnowledgeSearch';

let cachedIndex: ReturnType<typeof createBm25Index> | null = null;
let cachedSig = '';

function cacheSignature(projectRoot?: string): string {
  try {
    const chunksPath = getKnowledgeChunksPath(projectRoot);
    if (fs.existsSync(chunksPath)) {
      return `fs:${fs.statSync(chunksPath).mtimeMs}`;
    }
  } catch {
    /* ignore */
  }
  return 'none';
}

function searchKnowledgeLocal(
  query: string,
  limit: number,
  projectRoot?: string,
): KnowledgeHit[] {
  const sig = cacheSignature(projectRoot);
  const chunks = loadKnowledgeChunksFromFile(getKnowledgeChunksPath(projectRoot));

  if (chunks.length === 0) return [];

  const stale = sig !== cachedSig || cachedIndex === null;

  if (stale) {
    cachedIndex = createBm25Index(chunks);
    cachedSig = sig;
  }

  return cachedIndex!.search(query, limit);
}

/**
 * Wyszukiwanie w bazie wiedzy: Supabase FTS (produkcja) lub BM25 na JSONL (offline / backup).
 */
export async function searchKnowledgeBase(
  query: string,
  options?: { limit?: number; projectRoot?: string },
): Promise<KnowledgeHit[]> {
  const limit = options?.limit ?? 8;
  const root = options?.projectRoot;

  const remote = await searchKnowledgeChunksViaSupabase(query, limit);
  if (remote.length > 0) return remote;

  return searchKnowledgeLocal(query, limit, root);
}
