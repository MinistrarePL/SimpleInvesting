import OpenAI from 'openai';
import type { EtfAiCandidateRow } from './etfAiSearchCandidates';

export type AiSearchIntent = 'ok' | 'no_match' | 'off_topic';

export interface AiSearchModelResult {
  intent: AiSearchIntent;
  etf_ids: string[];
  user_message_pl?: string;
  user_message_en?: string;
}

const SYSTEM_PROMPT = `You are SimpleInvesting's ETF picker. The user speaks Polish or English in "user_query".

You receive ONLY a JSON array "candidates" of ETFs from our database. Each item has id (UUID string), ticker, exchange, name, category, expense_ratio (optional), total_assets (optional), description_snippet (optional Polish text).

RULES — respond with a single JSON object (no markdown) matching this schema:
{"intent":"ok"|"no_match"|"off_topic","etf_ids":[],"user_message_pl":string|null,"user_message_en":string|null}

- intent "off_topic": the user asks about anything NOT related to ETFs, comparing/searching ETFs, investing in funds, portfolios of ETFs listed in our comparison app. Examples off-topic: weather, recipes, general chat, unrelated stocks without ETF context.
- intent "no_match": the question IS about ETFs / investing themes we could normally cover here, BUT none of the given candidates reasonably satisfy the user's criteria. NEVER invent ticker symbols or IDs. etf_ids must be [].
- intent "ok": one or more candidates fit. Populate etf_ids ONLY with UUIDs copied exactly from the candidates list. Maximum 25 ids, best matches first.

Do not output explanations outside the JSON. user_message_*: short polite line (localized) for the banner when intent is no_match or off_topic; optional for ok.`;

export async function runEtfAiSearchModel(options: {
  query: string;
  locale: 'pl' | 'en';
  candidates: EtfAiCandidateRow[];
  apiKey: string;
  model: string;
  /** ms */
  timeoutMs?: number;
}): Promise<AiSearchModelResult> {
  const { query, locale, candidates, apiKey, model } = options;
  const timeoutMs = options.timeoutMs ?? 28000;

  const userPayload = {
    locale,
    user_query: query.trim(),
    candidates,
  };

  const openai = new OpenAI({
    apiKey,
    timeout: timeoutMs,
    maxRetries: 0,
  });

  const completion = await openai.chat.completions.create({
    model,
    temperature: 0.2,
    max_tokens: 1200,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: JSON.stringify(userPayload),
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? '{}';
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('INVALID_JSON_RESPONSE');
  }

  if (typeof parsed !== 'object' || parsed === null || !('intent' in parsed)) {
    throw new Error('INVALID_SHAPE');
  }

  const po = parsed as Record<string, unknown>;
  const intent = po.intent;
  if (intent !== 'ok' && intent !== 'no_match' && intent !== 'off_topic') {
    throw new Error('INVALID_INTENT');
  }

  const idsRaw = po.etf_ids;
  const etf_ids = Array.isArray(idsRaw)
    ? idsRaw.map((x) => (typeof x === 'string' ? x.trim() : '')).filter(Boolean)
    : [];

  return {
    intent,
    etf_ids: etf_ids.slice(0, 25),
    user_message_pl:
      typeof po.user_message_pl === 'string' ? po.user_message_pl : undefined,
    user_message_en:
      typeof po.user_message_en === 'string' ? po.user_message_en : undefined,
  };
}
