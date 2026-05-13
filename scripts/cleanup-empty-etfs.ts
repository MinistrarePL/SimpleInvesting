/**
 * Usuwa z Supabase ETF-y bez fundamentalnych danych:
 * category IS NULL AND total_assets IS NULL (np. brak wpisu w EODHD).
 * Tabele powiązane (etf_sectors, etf_regions, etf_top_holdings) są czyszczone przez ON DELETE CASCADE.
 *
 * Usage: npx tsx scripts/cleanup-empty-etfs.ts
 * Env: PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY w .env
 */
import { createClient } from '@supabase/supabase-js';
import { loadEnv } from './lib/loadEnv.ts';

const env = loadEnv();
const SUPABASE_URL = env['PUBLIC_SUPABASE_URL'];
const SUPABASE_SERVICE_KEY = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Wymagane: PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY w .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  const { count: beforeCount, error: countErr } = await supabase
    .from('etfs')
    .select('*', { count: 'exact', head: true });

  if (countErr) {
    console.error('Nie można policzyć ETF-ów:', countErr.message);
    process.exit(1);
  }

  const { data: toRemove, error: selErr } = await supabase
    .from('etfs')
    .select('id,ticker,exchange')
    .is('category', null)
    .is('total_assets', null);

  if (selErr) {
    console.error('Zapytanie kandydatów do usunięcia:', selErr.message);
    process.exit(1);
  }

  const rows = toRemove ?? [];
  console.log(`Przed czyszczeniem: ~${beforeCount ?? '?'} ETF-ów`);
  console.log(`Do usunięcia (category IS NULL AND total_assets IS NULL): ${rows.length}`);

  if (!rows.length) {
    console.log('Nic do usunięcia.');
    return;
  }

  const ids = rows.map((r) => r.id as string);

  const chunkSize = 200;
  let deleted = 0;
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const { error: delErr } = await supabase.from('etfs').delete().in('id', chunk);
    if (delErr) {
      console.error(`Błąd usuwania (batch ${i / chunkSize + 1}):`, delErr.message);
      process.exit(1);
    }
    deleted += chunk.length;
    process.stdout.write(`\rUsunięto: ${deleted}/${ids.length}`);
  }

  console.log(`\nGotowe. Usunięto ${deleted} rekordów.`);

  const { count: afterCount } = await supabase.from('etfs').select('*', { count: 'exact', head: true });
  console.log(`Po czyszczeniu: ~${afterCount ?? '?'} ETF-ów`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
