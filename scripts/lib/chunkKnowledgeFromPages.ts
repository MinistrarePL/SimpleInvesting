import type { KnowledgeChunk } from '../../src/lib/knowledge/types';

const MAX_CHARS = 2400;
const OVERLAP = 450;
/** Minimalny rozmiar okna przy „dociąganiu” granicy zdań/znaków podziału. */
const MIN_WINDOW_CHARS = 100;

interface PageSpan {
  start: number;
  end: number;
  page: number;
}

function buildDocumentWithSpans(pages: { pageNum: number; text: string }[]): {
  full: string;
  spans: PageSpan[];
} {
  let full = '';
  const spans: PageSpan[] = [];

  for (const { pageNum, text } of pages) {
    const piece = text.length > 0 ? `${text}\n\n` : '';
    const start = full.length;
    full += piece;
    const end = full.length;
    if (piece.length > 0) {
      spans.push({ start, end, page: pageNum });
    }
  }

  return { full, spans };
}

function pageForOffset(spans: PageSpan[], offset: number): number {
  if (spans.length === 0) return 1;
  let lo = 0;
  let hi = spans.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const s = spans[mid];
    if (offset < s.start) hi = mid - 1;
    else if (offset >= s.end) lo = mid + 1;
    else return s.page;
  }
  return spans[spans.length - 1].page;
}

export function slugFromPdfBasename(baseName: string): string {
  const stem = baseName.replace(/\.pdf$/i, '');
  return stem
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export function titleFromPdfBasename(baseName: string): string {
  const stem = baseName.replace(/\.pdf$/i, '');
  return stem
    .replace(/-ebookpoint$/i, '')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);
}

/** Dzieli tekst stron na nakładające się chunki z przybliżonym zakresem stron do cytowań. */
export function chunkPagesIntoKnowledge(options: {
  pages: { pageNum: number; text: string }[];
  sourceFile: string;
  sourceTitle: string;
}): KnowledgeChunk[] {
  const { full, spans } = buildDocumentWithSpans(options.pages);
  if (!full.trim()) return [];

  const slug = slugFromPdfBasename(options.sourceFile);
  const chunks: KnowledgeChunk[] = [];

  let start = 0;
  let chunkIndex = 0;

  while (start < full.length) {
    let end = Math.min(start + MAX_CHARS, full.length);

    if (end < full.length) {
      const windowStart = Math.max(start, end - 140);
      const slice = full.slice(windowStart, end);
      const lastBreak = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('\n'));
      const lastSpace = slice.lastIndexOf(' ');
      const prefer =
        lastBreak !== -1 && windowStart + lastBreak + 1 > start + MAX_CHARS * 0.45
          ? windowStart + lastBreak + (slice[lastBreak] === '.' ? 2 : 1)
          : lastSpace !== -1 && windowStart + lastSpace + 1 > start + MAX_CHARS * 0.45
            ? windowStart + lastSpace + 1
            : end;
      end = Math.min(Math.max(prefer, start + MIN_WINDOW_CHARS), full.length);
    }

    const sliceText = full.slice(start, end).trim();

    if (sliceText.length > 0) {
      const ps = pageForOffset(spans, start);
      const pe = pageForOffset(spans, Math.max(end - 1, start));
      chunks.push({
        id: `${slug}#${chunkIndex}`,
        source_file: options.sourceFile,
        source_title: options.sourceTitle,
        page_start: Math.min(ps, pe),
        page_end: Math.max(ps, pe),
        chunk_index: chunkIndex,
        text: sliceText,
      });
      chunkIndex += 1;
    }

    if (end >= full.length) break;
    const nextStart = Math.max(0, end - OVERLAP);
    start = nextStart <= start ? end : nextStart;
  }

  return chunks;
}
