/** Jednostka wiedzy z książek ETF — wygenerowana przez `npm run extract:knowledge`. */
export interface KnowledgeChunk {
  id: string;
  /** Nazwa pliku PDF (np. podrecznik-....pdf). */
  source_file: string;
  /** Krótki tytuł do cytowań dla modelu i UI. */
  source_title: string;
  page_start: number;
  page_end: number;
  chunk_index: number;
  text: string;
}
