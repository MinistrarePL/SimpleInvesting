import type { SupabaseClient } from '@supabase/supabase-js';

/** Pola dla modelu AI — jak najmniej tekstu przy zachowaniu sensu wyboru. */
export interface EtfAiCandidateRow {
  id: string;
  ticker: string;
  exchange: string | null;
  name: string;
  category: string | null;
  expense_ratio: number | null;
  total_assets: number | null;
  description_snippet: string | null;
}

const MAX_CANDIDATES = 120;
const MATCH_TARGET = 25;
const SNIPPET_MAX = 280;

const STOP_WORDS = new Set(
  [
    'the',
    'and',
    'for',
    'with',
    'that',
    'this',
    'from',
    'jest',
    'oraz',
    'jaki',
    'jakie',
    'jaka',
    'jakich',
    'podaj',
    'lista',
    'listę',
    'bardzo',
    'może',
    'moze',
    'chce',
    'chcę',
    'szukam',
    'pokaż',
    'proszę',
    'prosze',
    'tni',
    'etc',
    'etf',
    'etfs',
    'fund',
    'funds',
  ].map((s) => s.toLowerCase()),
);

function truncateSnippet(text: string | null | undefined): string | null {
  if (!text || !text.trim()) return null;
  const t = text.replace(/\s+/g, ' ').trim();
  return t.length <= SNIPPET_MAX ? t : `${t.slice(0, SNIPPET_MAX)}…`;
}

function normalizeRow(raw: Record<string, unknown>): EtfAiCandidateRow {
  return {
    id: String(raw.id),
    ticker: String(raw.ticker ?? ''),
    exchange:
      raw.exchange === null || raw.exchange === undefined
        ? null
        : String(raw.exchange),
    name: String(raw.name ?? ''),
    category:
      raw.category === null || raw.category === undefined
        ? null
        : String(raw.category),
    expense_ratio:
      typeof raw.expense_ratio === 'number' ? raw.expense_ratio : null,
    total_assets:
      typeof raw.total_assets === 'number' ? raw.total_assets : null,
    description_snippet: truncateSnippet(
      typeof raw.description_pl === 'string' ? raw.description_pl : null,
    ),
  };
}

/** Tokeny alfanum (PL) dla ilike na name/category. */
export function extractAiSearchTokens(raw: string): string[] {
  const words = raw
    .toLowerCase()
    .normalize('NFKC')
    .match(/[\p{L}\p{N}]+/gu);
  if (!words) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of words) {
    if (w.length < 3) continue;
    if (STOP_WORDS.has(w)) continue;
    if (seen.has(w)) continue;
    seen.add(w);
    out.push(w);
  }
  return out.slice(0, 12);
}

/**
 * Najpierw dopasowania ilike po tokenach, przy małej bazie dopina duże AUM jako kontekst.
 */
export async function fetchEtfAiCandidates(
  supabase: SupabaseClient,
  userQuery: string,
): Promise<EtfAiCandidateRow[]> {
  const tokens = extractAiSearchTokens(userQuery);
  const map = new Map<string, EtfAiCandidateRow>();
  const cols =
    'id,ticker,exchange,name,category,expense_ratio,total_assets,description_pl';

  for (const token of tokens) {
    if (map.size >= MAX_CANDIDATES) break;
    const pat = `%${token}%`;
    const [nameRes, catRes] = await Promise.all([
      supabase.from('etfs').select(cols).ilike('name', pat).limit(50),
      supabase.from('etfs').select(cols).ilike('category', pat).limit(50),
    ]);
    const rows = [
      ...(nameRes.data ?? []),
      ...(catRes.data ?? []),
    ] as Record<string, unknown>[];
    for (const raw of rows) {
      map.set(String(raw.id), normalizeRow(raw));
      if (map.size >= MAX_CANDIDATES) break;
    }
  }

  if (map.size < MATCH_TARGET || tokens.length === 0) {
    const { data: top } = await supabase
      .from('etfs')
      .select(cols)
      .not('category', 'is', null)
      .not('total_assets', 'is', null)
      .order('total_assets', { ascending: false, nullsFirst: false })
      .limit(90);
    for (const raw of (top ?? []) as Record<string, unknown>[]) {
      if (map.size >= MAX_CANDIDATES) break;
      if (!map.has(String(raw.id))) {
        map.set(String(raw.id), normalizeRow(raw));
      }
    }
  }

  return Array.from(map.values()).slice(0, MAX_CANDIDATES);
}
