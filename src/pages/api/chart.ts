import type { APIRoute } from 'astro';

const RANGE_KEYS = ['1m', '3m', '6m', '1y', '5y'] as const;
type ChartRange = (typeof RANGE_KEYS)[number];

const INTERVAL_KEYS = ['d', 'w', 'm'] as const;
type ChartInterval = (typeof INTERVAL_KEYS)[number];

type OhlcRow = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number | null;
};

/** Poniedziałek tygodnia UTC (klucz yyyy-mm-dd). */
function weekMondayUtcKey(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  const dow = d.getUTCDay();
  const daysFromMonday = (dow + 6) % 7;
  d.setUTCDate(d.getUTCDate() - daysFromMonday);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function aggregateWeekly(points: OhlcRow[]): OhlcRow[] {
  if (points.length === 0) return [];
  const buckets = new Map<string, OhlcRow[]>();
  for (const p of points) {
    const key = weekMondayUtcKey(p.date);
    let arr = buckets.get(key);
    if (!arr) {
      arr = [];
      buckets.set(key, arr);
    }
    arr.push(p);
  }
  const keys = [...buckets.keys()].sort((a, b) => a.localeCompare(b));
  return keys.map((key) => {
    const pts = buckets.get(key)!.sort((a, b) => a.date.localeCompare(b.date));
    const first = pts[0]!;
    const last = pts[pts.length - 1]!;
    let high = first.high;
    let low = first.low;
    for (const q of pts) {
      high = Math.max(high, q.high);
      low = Math.min(low, q.low);
    }
    return {
      date: last.date,
      open: first.open,
      high,
      low,
      close: last.close,
      volume: null,
    };
  });
}

function aggregateMonthly(points: OhlcRow[]): OhlcRow[] {
  if (points.length === 0) return [];
  const buckets = new Map<string, OhlcRow[]>();
  for (const p of points) {
    const key = p.date.slice(0, 7);
    let arr = buckets.get(key);
    if (!arr) {
      arr = [];
      buckets.set(key, arr);
    }
    arr.push(p);
  }
  const keys = [...buckets.keys()].sort((a, b) => a.localeCompare(b));
  return keys.map((key) => {
    const pts = buckets.get(key)!.sort((a, b) => a.date.localeCompare(b.date));
    const first = pts[0]!;
    const last = pts[pts.length - 1]!;
    let high = first.high;
    let low = first.low;
    for (const q of pts) {
      high = Math.max(high, q.high);
      low = Math.min(low, q.low);
    }
    return {
      date: last.date,
      open: first.open,
      high,
      low,
      close: last.close,
      volume: null,
    };
  });
}

function isSafeSymbol(s: string): boolean {
  return /^[A-Za-z0-9.\-]+$/.test(s) && s.length >= 1 && s.length <= 32;
}

function isSafeExchange(s: string): boolean {
  return /^[A-Za-z]+$/.test(s) && s.length >= 2 && s.length <= 16;
}

function rangeToFromDate(range: ChartRange): string {
  const to = new Date();
  const from = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()));

  switch (range) {
    case '1m':
      from.setUTCMonth(from.getUTCMonth() - 1);
      break;
    case '3m':
      from.setUTCMonth(from.getUTCMonth() - 3);
      break;
    case '6m':
      from.setUTCMonth(from.getUTCMonth() - 6);
      break;
    case '1y':
      from.setUTCFullYear(from.getUTCFullYear() - 1);
      break;
    case '5y':
      from.setUTCFullYear(from.getUTCFullYear() - 5);
      break;
  }

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${from.getUTCFullYear()}-${pad(from.getUTCMonth() + 1)}-${pad(from.getUTCDate())}`;
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const symbol = (url.searchParams.get('symbol') || '').trim();
  const exchange = (url.searchParams.get('exchange') || '').trim().toUpperCase();
  const rangeRaw = (url.searchParams.get('range') || '1y').toLowerCase();
  const intervalRaw = (url.searchParams.get('interval') || 'd').toLowerCase();

  if (!symbol || !isSafeSymbol(symbol)) {
    return new Response(JSON.stringify({ error: 'Invalid or missing "symbol"' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!exchange || !isSafeExchange(exchange)) {
    return new Response(JSON.stringify({ error: 'Invalid or missing "exchange"' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!(RANGE_KEYS as readonly string[]).includes(rangeRaw)) {
    return new Response(JSON.stringify({ error: `Invalid "range"; use ${RANGE_KEYS.join(', ')}` }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!(INTERVAL_KEYS as readonly string[]).includes(intervalRaw)) {
    return new Response(JSON.stringify({ error: `Invalid "interval"; use ${INTERVAL_KEYS.join(', ')}` }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const range = rangeRaw as ChartRange;
  const interval = intervalRaw as ChartInterval;

  const apiKey = import.meta.env.EODHD_API_KEY || process.env.EODHD_API_KEY;
  if (!apiKey || apiKey === 'your_api_key_here') {
    return new Response(JSON.stringify({ error: 'EODHD API key is not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const from = rangeToFromDate(range);
  const to = new Date();
  const toStr = `${to.getUTCFullYear()}-${String(to.getUTCMonth() + 1).padStart(2, '0')}-${String(to.getUTCDate()).padStart(2, '0')}`;

  const fullSym = encodeURIComponent(`${symbol}.${exchange}`);
  const eodUrl = `https://eodhd.com/api/eod/${fullSym}?from=${from}&to=${toStr}&api_token=${apiKey}&fmt=json`;

  try {
    const res = await fetch(eodUrl);
    if (!res.ok) {
      const text = await res.text();
      return new Response(
        JSON.stringify({ error: 'EODHD request failed', status: res.status, detail: text.slice(0, 200) }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      return new Response(JSON.stringify({ error: 'Unexpected EODHD response', points: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, max-age=300' },
      });
    }

    /** Chronological daily OHLC (EODHD), potem opcjonalna agregacja tyg./mies. */
    let points: OhlcRow[] = (
      data as {
        date: string;
        open: number;
        high: number;
        low: number;
        close: number;
        adjusted_close?: number;
        volume?: number;
      }[]
    )
      .filter((row) => row?.date && Number.isFinite(row.adjusted_close ?? row.close))
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((row) => {
        const c = Number(row.adjusted_close ?? row.close);
        const o = Number.isFinite(row.open) ? Number(row.open) : c;
        const h = Number.isFinite(row.high) ? Number(row.high) : c;
        const l = Number.isFinite(row.low) ? Number(row.low) : c;
        return {
          date: row.date,
          open: o,
          high: Math.max(o, h, l, c),
          low: Math.min(o, h, l, c),
          close: c,
          volume: row.volume ?? null,
        };
      });

    if (interval === 'w') points = aggregateWeekly(points);
    else if (interval === 'm') points = aggregateMonthly(points);

    return new Response(JSON.stringify({ range, interval, symbol, exchange, points }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, max-age=300' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Fetch failed', detail: String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
