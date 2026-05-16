import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import {
  fetchEtfAiCandidates,
} from '../../lib/ai/etfAiSearchCandidates';
import { runEtfAiSearchModel } from '../../lib/ai/etfAiSearchRun';

export const POST: APIRoute = async ({ request }) => {
  const supabaseUrl =
    import.meta.env.PUBLIC_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
  const serviceKey =
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  const apiKey =
    import.meta.env.OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY ||
    import.meta.env.OPENAI_API_KEY_SM ||
    process.env.OPENAI_API_KEY_SM;
  const model =
    import.meta.env.OPENAI_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini';

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        ok: false,
        code: 'MISSING_OPENAI_KEY',
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  if (!supabaseUrl || !serviceKey) {
    return new Response(
      JSON.stringify({
        ok: false,
        code: 'SUPABASE_SERVER_MISCONFIGURED',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, code: 'INVALID_JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const rawQuery =
    body &&
    typeof body === 'object' &&
    'query' in body &&
    typeof (body as { query: unknown }).query === 'string'
      ? (body as { query: string }).query.trim()
      : '';

  const localeRaw =
    body &&
    typeof body === 'object' &&
    'locale' in body &&
    typeof (body as { locale: unknown }).locale === 'string'
      ? (body as { locale: string }).locale
      : 'pl';

  const locale = localeRaw.startsWith('en') ? 'en' : ('pl' as const);

  if (!rawQuery) {
    return new Response(JSON.stringify({ ok: false, code: 'EMPTY_QUERY' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const MAX_QUERY = 500;
  const query =
    rawQuery.length > MAX_QUERY ? rawQuery.slice(0, MAX_QUERY) : rawQuery;

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const candidates = await fetchEtfAiCandidates(supabase, query);

    if (candidates.length === 0) {
      return new Response(
        JSON.stringify({
          ok: true,
          intent: 'no_match',
          ids: [],
          messagePl: '',
          messageEn: '',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const modelOut = await runEtfAiSearchModel({
      query,
      locale,
      candidates,
      apiKey,
      model,
      timeoutMs: 28000,
    });

    const allowed = new Set(candidates.map((c) => c.id));
    const sanitizedIds =
      modelOut.intent === 'ok'
        ? modelOut.etf_ids.filter((id) => allowed.has(id))
        : [];

    let intent =
      modelOut.intent === 'ok' && sanitizedIds.length === 0
        ? ('no_match' as const)
        : modelOut.intent;

    return new Response(
      JSON.stringify({
        ok: true,
        intent,
        ids: intent === 'ok' ? sanitizedIds : [],
        messagePl:
          modelOut.user_message_pl ??
          (locale === 'pl' ? modelOut.user_message_en : ''),
        messageEn:
          modelOut.user_message_en ??
          (locale === 'en' ? modelOut.user_message_pl : ''),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(
      JSON.stringify({
        ok: false,
        code: 'AI_SEARCH_FAILED',
        detail: msg.length > 200 ? `${msg.slice(0, 200)}…` : msg,
      }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
};
