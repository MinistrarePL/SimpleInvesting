import type { KnowledgeChunk } from './types';
import { tokenize } from './tokenize';

/** Okapi BM25 — szybkie wyszukiwanie pełnotekstowe bez embeddings (offline). */
const K1 = 1.5;
const B = 0.75;

export interface KnowledgeHit {
  chunk: KnowledgeChunk;
  score: number;
}

interface DocStats {
  lengths: number[];
  avgdl: number;
  df: Map<string, number>;
  postings: Map<string, Map<number, number>>;
}

function buildStats(chunks: KnowledgeChunk[]): DocStats {
  const lengths: number[] = [];
  const df = new Map<string, number>();
  const postings = new Map<string, Map<number, number>>();

  for (let i = 0; i < chunks.length; i++) {
    const tokens = tokenize(chunks[i].text);
    lengths.push(tokens.length);
    const tfLocal = new Map<string, number>();
    for (const t of tokens) {
      tfLocal.set(t, (tfLocal.get(t) ?? 0) + 1);
    }
    for (const [term, freq] of tfLocal) {
      df.set(term, (df.get(term) ?? 0) + 1);
      let row = postings.get(term);
      if (!row) {
        row = new Map();
        postings.set(term, row);
      }
      row.set(i, freq);
    }
  }

  const sumLen = lengths.reduce((a, b) => a + b, 0);
  const avgdl = lengths.length ? sumLen / lengths.length : 0;

  return { lengths, avgdl, df, postings };
}

export function createBm25Index(chunks: KnowledgeChunk[]) {
  const N = chunks.length;
  const stats = buildStats(chunks);

  function idf(term: string): number {
    const n = stats.df.get(term);
    if (!n || N === 0) return 0;
    return Math.log(1 + (N - n + 0.5) / (n + 0.5));
  }

  function scoreDoc(docIdx: number, queryTerms: string[]): number {
    const dl = stats.lengths[docIdx] ?? 0;
    let s = 0;
    for (const term of queryTerms) {
      const freqInDoc = stats.postings.get(term)?.get(docIdx);
      if (freqInDoc === undefined) continue;
      const idfTerm = idf(term);
      const denom =
        freqInDoc + K1 * (1 - B + (B * dl) / (stats.avgdl || 1));
      s += idfTerm * ((freqInDoc * (K1 + 1)) / denom);
    }
    return s;
  }

  function search(query: string, limit = 8): KnowledgeHit[] {
    const qTerms = tokenize(query);
    if (qTerms.length === 0 || N === 0) return [];

    const candidates = new Set<number>();
    for (const t of qTerms) {
      const row = stats.postings.get(t);
      if (!row) continue;
      for (const docIdx of row.keys()) {
        candidates.add(docIdx);
      }
    }

    const hits: KnowledgeHit[] = [];
    for (const docIdx of candidates) {
      const score = scoreDoc(docIdx, qTerms);
      if (score > 0) {
        hits.push({ chunk: chunks[docIdx], score });
      }
    }
    hits.sort((a, b) => b.score - a.score);
    return hits.slice(0, limit);
  }

  return { search };
}
