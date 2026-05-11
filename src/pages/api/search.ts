import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const query = url.searchParams.get('q');

  if (!query) {
    return new Response(JSON.stringify({ error: 'Query parameter "q" is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Astro w trybie SSR na Netlify czasami potrzebuje process.env zamiast import.meta.env
  const apiKey = import.meta.env.EODHD_API_KEY || process.env.EODHD_API_KEY;
  
  if (!apiKey || apiKey === 'your_api_key_here') {
    return new Response(JSON.stringify({ error: 'API key is not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // EODHD Search API
    const response = await fetch(`https://eodhd.com/api/search/${query}?api_token=${apiKey}&fmt=json`);
    const data = await response.json();

    // Filter for ETFs only and limit to 10 results to keep the UI clean
    const etfs = data.filter((item: any) => item.Type === 'ETF').slice(0, 10);

    return new Response(JSON.stringify(etfs), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch data from EODHD' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
