import fs from 'fs';
import path from 'path';
import type { KnowledgeChunk } from './types';
import { getProjectRoot } from '../projectRoot';

/** Ścieżka do wygenerowanego indeksu JSONL (debug / BM25 offline po ekstrakcji). */
export const KNOWLEDGE_CHUNKS_RELATIVE = path.join(
  'knowledge_base',
  '.generated',
  'chunks.jsonl',
);

export function getKnowledgeChunksPath(projectRoot?: string): string {
  const root = projectRoot ?? getProjectRoot();
  return path.join(root, KNOWLEDGE_CHUNKS_RELATIVE);
}

/** Ładuje chunki z JSONL (jedna linia = jeden JSON). */
export function loadKnowledgeChunksFromFile(filePath: string): KnowledgeChunk[] {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, 'utf8');
  const chunks: KnowledgeChunk[] = [];
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      chunks.push(JSON.parse(trimmed) as KnowledgeChunk);
    } catch {
      // pomiń uszkodzoną linię
    }
  }
  return chunks;
}
