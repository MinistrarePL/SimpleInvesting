import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { calculateReturns } from '../../utils/calculateReturns';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { ticker, name } = body;

    if (!ticker) {
      return new Response(JSON.stringify({ error: 'Ticker is required' }), { status: 400 });
    }

    const apiKey = import.meta.env.EODHD_API_KEY || process.env.EODHD_API_KEY;
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!apiKey || !supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error' }), { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Pobieramy dane z ostatnich ~400 dni
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(toDate.getDate() - 400);
    const fromStr = fromDate.toISOString().split('T')[0];
    const toStr = toDate.toISOString().split('T')[0];

    // Używamy giełdy US domyślnie, ale EODHD obsługuje też inne (wymagałoby to przekazania pełnego kodu np. VOO.US)
    // Nasza wyszukiwarka zwraca pole Code i Exchange, więc najlepiej użyć połączonego formatu
    const fullTicker = ticker.includes('.') ? ticker : `${ticker}.US`;

    const url = `https://eodhd.com/api/eod/${fullTicker}?from=${fromStr}&to=${toStr}&api_token=${apiKey}&fmt=json`;
    const response = await fetch(url);
    
    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch EOD data' }), { status: 500 });
    }

    const prices = await response.json();
    if (!prices || prices.length === 0) {
      return new Response(JSON.stringify({ error: 'No historical data found for this ticker' }), { status: 404 });
    }

    const returns = calculateReturns(prices);

    const dbRecord = {
      ticker: ticker,
      name: name || ticker,
      category: 'Dodane przez użytkownika', // Domyślna kategoria dla nowych
      return_1w: returns['1W'],
      return_1m: returns['1M'],
      return_1q: returns['1Q'],
      return_1y: returns['1Y'],
      last_updated: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('etfs')
      .upsert(dbRecord, { onConflict: 'ticker' })
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
