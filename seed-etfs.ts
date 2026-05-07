import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { calculateReturns } from './src/utils/calculateReturns.ts'; // Note: we need to make sure this compiles or we use tsx

// Ręczne parsowanie .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envFile = fs.readFileSync(join(__dirname, '.env'), 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const EODHD_API_KEY = envVars['EODHD_API_KEY'];
const SUPABASE_URL = envVars['PUBLIC_SUPABASE_URL'];
// Używamy SERVICE_ROLE_KEY, ponieważ skrypt działa po stronie serwera i musi mieć uprawnienia do zapisu (omijając RLS)
const SUPABASE_SERVICE_KEY = envVars['SUPABASE_SERVICE_ROLE_KEY'];

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Lista 20 popularnych ETF-ów surowcowych z precyzyjnymi kategoriami
const COMMODITY_ETFS = [
  { ticker: 'GLD', name: 'SPDR Gold Trust', category: 'Złoto fizyczne' },
  { ticker: 'IAU', name: 'iShares Gold Trust', category: 'Złoto fizyczne' },
  { ticker: 'SLV', name: 'iShares Silver Trust', category: 'Srebro fizyczne' },
  { ticker: 'SIVR', name: 'abrdn Physical Silver Shares ETF', category: 'Srebro fizyczne' },
  { ticker: 'PALL', name: 'abrdn Physical Palladium Shares ETF', category: 'Pallad fizyczny' },
  { ticker: 'PPLT', name: 'abrdn Physical Platinum Shares ETF', category: 'Platyna fizyczna' },
  { ticker: 'USO', name: 'United States Oil Fund', category: 'Ropa naftowa (WTI)' },
  { ticker: 'BNO', name: 'United States Brent Oil Fund', category: 'Ropa naftowa (Brent)' },
  { ticker: 'UNG', name: 'United States Natural Gas Fund', category: 'Gaz ziemny' },
  { ticker: 'BOIL', name: 'ProShares Ultra Bloomberg Natural Gas', category: 'Gaz ziemny (Dźwignia 2x)' },
  { ticker: 'DBA', name: 'Invesco DB Agriculture Fund', category: 'Sektor rolniczy (Koszyk)' },
  { ticker: 'DBB', name: 'Invesco DB Base Metals Fund', category: 'Metale przemysłowe' },
  { ticker: 'DBC', name: 'Invesco DB Commodity Index Tracking Fund', category: 'Surowce (Szeroki rynek)' },
  { ticker: 'GSG', name: 'iShares S&P GSCI Commodity-Indexed Trust', category: 'Surowce (Szeroki rynek)' },
  { ticker: 'PDBC', name: 'Invesco Optimum Yield Diversified Commodity Strategy No K-1 ETF', category: 'Surowce (Szeroki rynek)' },
  { ticker: 'CORN', name: 'Teucrium Corn Fund', category: 'Kukurydza' },
  { ticker: 'WEAT', name: 'Teucrium Wheat Fund', category: 'Pszenica' },
  { ticker: 'SOYB', name: 'Teucrium Soybean Fund', category: 'Soja' },
  { ticker: 'CPER', name: 'United States Copper Index Fund', category: 'Miedź' },
  { ticker: 'JJC', name: 'iPath Series B Bloomberg Copper Subindex Total Return ETN', category: 'Miedź' }
];

async function fetchEODData(ticker) {
  // Pobieramy dane z ostatnich ~400 dni, żeby móc policzyć stopę zwrotu za 1 rok (365 dni)
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setDate(toDate.getDate() - 400);

  const fromStr = fromDate.toISOString().split('T')[0];
  const toStr = toDate.toISOString().split('T')[0];

  const url = `https://eodhd.com/api/eod/${ticker}.US?from=${fromStr}&to=${toStr}&api_token=${EODHD_API_KEY}&fmt=json`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Błąd pobierania danych dla ${ticker}: ${response.status}`);
  }
  
  const data = await response.json();
  return data;
}

async function seedDatabase() {
  console.log('🚀 Rozpoczynam pobieranie danych i zapis do Supabase...');

  for (const etf of COMMODITY_ETFS) {
    try {
      console.log(`Pobieranie danych dla: ${etf.ticker} (${etf.name})...`);
      const prices = await fetchEODData(etf.ticker);
      
      if (!prices || prices.length === 0) {
        console.log(`⚠️ Brak danych dla ${etf.ticker}, pomijam.`);
        continue;
      }

      // Wyliczamy stopy zwrotu używając naszej funkcji
      const returns = calculateReturns(prices);

      // Przygotowujemy obiekt do zapisu w bazie
      const dbRecord = {
        ticker: etf.ticker,
        name: etf.name,
        category: etf.category, // Używamy naszej precyzyjnej kategorii
        return_1w: returns['1W'],
        return_1m: returns['1M'],
        return_1q: returns['1Q'],
        return_1y: returns['1Y'],
        last_updated: new Date().toISOString()
      };

      // Zapisujemy do Supabase (upsert = insert lub update jeśli ticker już istnieje)
      const { error } = await supabase
        .from('etfs')
        .upsert(dbRecord, { onConflict: 'ticker' });

      if (error) {
        console.error(`❌ Błąd zapisu do bazy dla ${etf.ticker}:`, error.message);
      } else {
        console.log(`✅ Zapisano ${etf.ticker}: 1W=${returns['1W']}%, 1Y=${returns['1Y']}%`);
      }

      // Małe opóźnienie, żeby nie zablokować API EODHD (rate limiting)
      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (err) {
      console.error(`❌ Błąd przetwarzania ${etf.ticker}:`, err.message);
    }
  }

  console.log('🎉 Zakończono aktualizację bazy danych!');
}

seedDatabase();
