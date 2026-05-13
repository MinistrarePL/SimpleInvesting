/**
 * Generuje brakujące opisy EN oraz opisy PL (kolumna description_pl).
 *
 * 1. ETF-y bez opisu EN (NULL / NA) — szablon EN + opis PL; opcjonalnie justETF po ISIN.
 * 2. Wszystkie ETF-y — odświeżenie description_pl z szablonu (polski), aby UI PL było spójne.
 *
 * Wymaga migracji: supabase-migration-description-pl.sql (kolumna description_pl).
 *
 * Usage: npx tsx scripts/generate-descriptions.ts
 * Env: PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY w .env
 */
import { createClient } from '@supabase/supabase-js';
import { loadEnv } from './lib/loadEnv.ts';
import { sleep } from './lib/constants.ts';
import { getFriendlyCategory } from '../src/lib/categoryMap.ts';
import { inferEtfTheme } from '../src/lib/etfTheme.ts';

const env = loadEnv();
const SUPABASE_URL = env['PUBLIC_SUPABASE_URL'];
const SUPABASE_SERVICE_KEY = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Wymagane: PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY w .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const DELAY_MS = 600;

interface EtfWithRelations {
  id: string;
  ticker: string;
  name: string;
  exchange: string | null;
  category: string | null;
  isin: string | null;
  company_name: string | null;
  domicile: string | null;
  inception_date: string | null;
  total_assets: number | null;
  holdings_count: number | null;
  description?: string | null;
  etf_sectors: { sector: string; equity_pct: number | null }[];
  etf_regions: { region: string; equity_pct: number | null }[];
  etf_top_holdings: { rank: number; name: string | null; code: string | null; assets_pct: number | null }[];
}

const ETF_SELECT = `
  id, ticker, name, exchange, category, isin, company_name,
  domicile, inception_date, total_assets, holdings_count,
  description,
  etf_sectors ( sector, equity_pct ),
  etf_regions ( region, equity_pct ),
  etf_top_holdings ( rank, name, code, assets_pct )
`;

async function fetchEtfsMissingDescription(): Promise<EtfWithRelations[]> {
  const pageSize = 1000;
  const all: EtfWithRelations[] = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('etfs')
      .select(ETF_SELECT)
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) throw new Error(`Supabase: ${error.message}`);
    if (!data?.length) break;

    for (const row of data as unknown as EtfWithRelations[]) {
      const desc = row.description as string | null;
      if (!desc || desc === 'NA' || desc === 'N/A' || desc.trim() === '') {
        all.push(row);
      }
    }

    if (data.length < pageSize) break;
  }

  return all;
}

async function fetchAllEtfsWithRelations(): Promise<EtfWithRelations[]> {
  const pageSize = 500;
  const all: EtfWithRelations[] = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('etfs')
      .select(ETF_SELECT)
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) throw new Error(`Supabase: ${error.message}`);
    if (!data?.length) break;

    all.push(...(data as unknown as EtfWithRelations[]));
    if (data.length < pageSize) break;
  }

  return all;
}

async function tryFetchJustEtfDescription(isin: string): Promise<string | null> {
  try {
    const url = `https://www.justetf.com/api/etfs/${isin}/quote?locale=en&currency=USD`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as Record<string, unknown>;
    const desc = json.description || json.investmentPolicy;
    if (typeof desc === 'string' && desc.length > 20) {
      return desc.slice(0, 800);
    }
  } catch {
    // silently fail
  }
  return null;
}

function categoryExposurePhraseEn(category: string | null, name?: string | null): string {
  const themeEn = inferEtfTheme(name, 'en');
  if (themeEn) return themeEn.toLowerCase();
  if (!category) return 'a diversified basket of assets';

  const map: Record<string, string> = {
    'Derivative Income': 'options-based income strategies',
    'Global Large-Cap Blend Equity': 'large-cap equities across global markets',
    'Focused Region': 'equities in a specific geographic region',
    'Foreign Large Blend': 'large-cap international equities',
    'Digital Assets': 'cryptocurrencies and digital assets',
    'Commodities Focused': 'a diversified range of commodities',
    'Global Emerging Markets Equity': 'equities from emerging market economies',
    'Diversified Emerging Mkts': 'a diversified basket of emerging market stocks',
    'High Yield Bond': 'high-yield corporate bonds',
    'Intermediate Core Bond': 'investment-grade bonds with medium-term maturities',
    'Intermediate Core-Plus Bond': 'a broad mix of medium-term bonds',
    'Foreign Large Value': 'undervalued large-cap international stocks',
    'Europe Large-Cap Blend Equity': 'large European companies',
    'Corporate Bond': 'investment-grade corporate bonds',
    'Defined Outcome': 'defined outcome strategies with downside buffers',
    'Equity Energy': 'companies in the oil, gas, and energy sector',
    Financial: 'banks, insurance companies, and financial institutions',
    Health: 'healthcare, pharmaceutical, and biotech companies',
    Industrials: 'industrial and manufacturing companies',
    'Commodities Broad Basket': 'a broad basket of commodities',
    'Global Equity Income': 'high-dividend global equities',
    'Large Blend': 'large-cap US equities',
    'Greater China Region': 'equities from China, Hong Kong, and Taiwan',
    'India Equity': 'Indian equities',
    'Global Large-Stock Blend': 'a blend of global large-cap stocks',
    'Commodities - Precious Metals': 'precious metals such as gold and silver',
    'Emerging Markets Bond': 'bonds from emerging market countries',
    'Europe Stock': 'European equities',
    'Foreign Large Growth': 'growth-oriented large-cap international stocks',
    'Equity Digital Assets': 'companies operating in the crypto and blockchain space',
    'Equity Precious Metals': 'gold mining and precious metals producers',
    'Sector Equity Precious Metals': 'gold mining and precious metals producers',
    'Global Bond-USD Hedged': 'global bonds hedged to US dollars',
    'Global Small/Mid-Cap Equity': 'small and mid-cap companies globally',
    'Commodities - Broad Basket': 'a broad basket of commodities',
    'Equity Hedged': 'equities with hedging to reduce risk',
    'Fixed Term Bond': 'bonds maturing at a fixed date',
    'Global Bond': 'government and corporate bonds globally',
    'High Yield Muni': 'high-yield US municipal bonds',
    'Inflation-Protected Bond': 'inflation-protected government bonds',
    'Japan Large-Cap Blend Equity': 'large Japanese companies',
    'Japan Stock': 'Japanese equities',
    'Consumer Cyclical': 'consumer discretionary companies',
    'Eurozone Large-Cap Equity': 'large eurozone companies',
    Infrastructure: 'infrastructure and utility companies',
    'Intermediate Government': 'medium-term US government bonds',
    'Bank Loan': 'leveraged bank loans (floating rate)',
    'Commodities - Energy': 'energy commodities like oil and natural gas',
    'Energy Limited Partnership': 'energy MLPs and limited partnerships',
    'Global Large-Cap Value Equity': 'undervalued large-cap global stocks',
    'Government Mortgage-Backed Bond': 'government-backed mortgage bonds',
    'China Equity': 'Chinese equities',
    'China Equity - A Shares': 'Chinese A-shares listed on Shanghai and Shenzhen',
    Communications: 'communications and media companies',
    'Consumer Defensive': 'consumer staples and defensive companies',
    'Korea Equity': 'Korean equities',
    'EUR Corporate Bond - Short Term': 'short-term EUR corporate bonds',
    'Foreign Small/Mid Blend': 'small and mid-cap international stocks',
    'Global Emerging Markets ex-China Equity': 'emerging markets excluding China',
    'Global Real Estate': 'global real estate and REITs',
    'Global Small/Mid Stock': 'global small and mid-cap stocks',
    'Asia-Pacific ex-Japan Equity': 'Asia-Pacific equities excluding Japan',
    Convertibles: 'convertible bonds',
    'Emerging-Markets Local-Currency Bond': 'emerging market bonds in local currencies',
    'EUR Corporate Bond': 'EUR-denominated corporate bonds',
    'EUR High Yield Bond': 'high-yield EUR corporate bonds',
    'Foreign Small/Mid Value': 'undervalued small and mid-cap international stocks',
    'GBP Government Bond': 'UK government bonds (Gilts)',
    'Global Diversified Bond - EUR Hedged': 'diversified global bonds hedged to EUR',
    'Global Diversified Bond - GBP Hedged': 'diversified global bonds hedged to GBP',
    'Global Emerging Markets Bond': 'emerging market bonds globally',
    'Global Large-Stock Value': 'undervalued global large-cap stocks',
    'Global Moderate Allocation': 'a balanced mix of stocks and bonds',
    'Asia ex-Japan Equity': 'Asian equities excluding Japan',
    'Asia-Pacific Equity': 'Asia-Pacific equities',
    'Brazil Equity': 'Brazilian equities',
    'EUR Government Bond': 'EUR government bonds',
    'EUR Ultra Short-Term Bond': 'ultra short-term EUR bonds',
    'Europe ex-UK Equity': 'European equities excluding the UK',
    'Global Diversified Bond': 'a diversified basket of global bonds',
    'Global High Yield Bond': 'global high-yield bonds',
    'Global Large-Stock Growth': 'growth-oriented global large-cap stocks',
    'Islamic Global Equity': 'Sharia-compliant global equities',
    'Commodities - Industrial & Broad Metals': 'industrial and base metals',
    'Commodities - Other': 'niche commodities',
    'Convertible Bond - Global': 'global convertible bonds',
    'Equity Market Neutral': 'a market-neutral equity strategy',
    'EUR Money Market - Short Term': 'short-term EUR money market instruments',
    'Europe Equity Income': 'dividend-paying European equities',
    'Europe Flex-Cap Equity': 'European equities across all capitalizations',
    'Europe Large-Cap Value Equity': 'undervalued large European companies',
    'Event Driven': 'event-driven investment strategies',
    'France Equity': 'French equities',
    'French PEA ESTR SWAP': 'EUR money market via ESTR swap (PEA eligible)',
    'GBP Diversified Bond - Short Term': 'short-term diversified GBP bonds',
    'GBP Inflation-Linked Bond': 'GBP inflation-linked bonds',
    'Global Allocation': 'a flexible global multi-asset allocation',
    'Global Conservative Allocation': 'a conservative mix favoring bonds',
    'Global Corporate Bond - CHF Hedged': 'global corporate bonds hedged to CHF',
    'Global Corporate Bond - GBP Hedged': 'global corporate bonds hedged to GBP',
    'Global Diversified Bond - CHF Hedged': 'diversified global bonds hedged to CHF',
    'Global Diversified Bond - USD Hedged': 'diversified global bonds hedged to USD',
    'Global Emerging Markets Bond - CHF Hedged': 'emerging market bonds hedged to CHF',
    'Global Emerging Markets Bond - EUR Hedged': 'emerging market bonds hedged to EUR',
    'Global Emerging Markets Corporate Bond': 'emerging market corporate bonds',
    'Global Emerging Markets Corporate Bond - EUR Hedge': 'EM corporate bonds hedged to EUR',
    'Global High Yield Bond - GBP Hedged': 'global high-yield bonds hedged to GBP',
    'Global Inflation-Linked Bond - EUR Hedged': 'inflation-linked bonds hedged to EUR',
    'Global Large-Cap Growth Equity': 'growth-oriented global large-cap equities',
    'Global Moderately Aggressive Allocation': 'a moderately aggressive multi-asset mix',
    'Global Moderately Conservative Allocation': 'a moderately conservative multi-asset mix',
    'Islamic Equity - Other': 'Sharia-compliant equities',
  };

  return map[category] || 'a diversified basket of assets';
}

function categoryLabelPl(category: string | null, name?: string | null): string {
  const label = getFriendlyCategory(category, 'pl', name);
  if (!label || label === 'N/A') return 'zróżnicowany koszyk aktywów';
  return label;
}

function buildDescriptionFromData(etf: EtfWithRelations): string {
  const parts: string[] = [];

  const issuer = extractIssuer(etf.name, etf.company_name);
  const categoryDesc = categoryExposurePhraseEn(etf.category, etf.name);

  parts.push(`The ${etf.name} provides exposure to ${categoryDesc}.`);

  const topSectors = (etf.etf_sectors || [])
    .filter((s) => (s.equity_pct ?? 0) > 1)
    .sort((a, b) => (b.equity_pct ?? 0) - (a.equity_pct ?? 0))
    .slice(0, 3);

  if (topSectors.length) {
    const sectorText = topSectors
      .map((s) => `${s.sector} (${(s.equity_pct ?? 0).toFixed(0)}%)`)
      .join(', ');
    parts.push(`Key sector exposure: ${sectorText}.`);
  }

  const topRegions = (etf.etf_regions || [])
    .filter((r) => (r.equity_pct ?? 0) > 1)
    .sort((a, b) => (b.equity_pct ?? 0) - (a.equity_pct ?? 0))
    .slice(0, 3);

  if (topRegions.length) {
    const regionText = topRegions
      .map((r) => `${r.region} (${(r.equity_pct ?? 0).toFixed(0)}%)`)
      .join(', ');
    parts.push(`Geographic focus: ${regionText}.`);
  }

  const topHoldings = (etf.etf_top_holdings || [])
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 5)
    .filter((h) => h.name);

  if (topHoldings.length) {
    const holdingNames = topHoldings.map((h) => h.name).join(', ');
    parts.push(`Top holdings include ${holdingNames}.`);
  }

  const metaParts: string[] = [];
  if (issuer) metaParts.push(`managed by ${issuer}`);
  if (etf.domicile) metaParts.push(`domiciled in ${etf.domicile}`);
  if (etf.holdings_count && etf.holdings_count > 0) {
    metaParts.push(`holds ${etf.holdings_count} positions`);
  }
  if (metaParts.length) {
    parts.push(`The fund is ${metaParts.join(', ')}.`);
  }

  return parts.join(' ');
}

function buildDescriptionPl(etf: EtfWithRelations): string {
  const parts: string[] = [];

  const issuer = extractIssuer(etf.name, etf.company_name);
  const catPl = categoryLabelPl(etf.category, etf.name);

  parts.push(`Fundusz ETF „${etf.name}” oferuje ekspozycję na: ${catPl}.`);

  const topSectors = (etf.etf_sectors || [])
    .filter((s) => (s.equity_pct ?? 0) > 1)
    .sort((a, b) => (b.equity_pct ?? 0) - (a.equity_pct ?? 0))
    .slice(0, 3);

  if (topSectors.length) {
    const sectorText = topSectors
      .map((s) => `${s.sector} (${(s.equity_pct ?? 0).toFixed(0)}%)`)
      .join(', ');
    parts.push(`Kluczowe sektory: ${sectorText}.`);
  }

  const topRegions = (etf.etf_regions || [])
    .filter((r) => (r.equity_pct ?? 0) > 1)
    .sort((a, b) => (b.equity_pct ?? 0) - (a.equity_pct ?? 0))
    .slice(0, 3);

  if (topRegions.length) {
    const regionText = topRegions
      .map((r) => `${r.region} (${(r.equity_pct ?? 0).toFixed(0)}%)`)
      .join(', ');
    parts.push(`Obszar geograficzny: ${regionText}.`);
  }

  const topHoldings = (etf.etf_top_holdings || [])
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 5)
    .filter((h) => h.name);

  if (topHoldings.length) {
    const holdingNames = topHoldings.map((h) => h.name).join(', ');
    parts.push(`Największe pozycje w portfelu: ${holdingNames}.`);
  }

  const metaParts: string[] = [];
  if (issuer) metaParts.push(`zarządzany przez ${issuer}`);
  if (etf.domicile) metaParts.push(`domicyl w ${etf.domicile}`);
  if (etf.holdings_count && etf.holdings_count > 0) {
    metaParts.push(`${etf.holdings_count} instrumentów w portfelu`);
  }
  if (metaParts.length) {
    parts.push(`Fundusz jest ${metaParts.join(', ')}.`);
  }

  return parts.join(' ');
}

function extractIssuer(name: string, companyName: string | null): string | null {
  const knownIssuers = [
    'iShares',
    'Vanguard',
    'Invesco',
    'Amundi',
    'Xtrackers',
    'SPDR',
    'WisdomTree',
    'VanEck',
    'UBS',
    'Lyxor',
    'BNP Paribas',
    'HSBC',
    'JPMorgan',
    'Franklin',
    'Fidelity',
    'Schwab',
    'Global X',
    'ARK',
    'L&G',
    'Legal & General',
    'Goldman Sachs',
    'Dimensional',
    'State Street',
  ];
  for (const issuer of knownIssuers) {
    if (name.includes(issuer)) return issuer;
  }
  if (companyName) {
    const short = companyName.split(' - ')[0]?.split(' ').slice(0, 3).join(' ');
    if (short && short.length > 2) return short;
  }
  return null;
}

async function fillMissingEnglishDescriptions(): Promise<void> {
  console.log('\n=== ETF-y bez opisu (EN) ===');
  const etfs = await fetchEtfsMissingDescription();
  console.log(`Znaleziono ${etfs.length} ETF-ów bez opisu EN.\n`);

  if (!etfs.length) {
    console.log('Wszystkie mają opis EN.');
    return;
  }

  let webOk = 0;
  let templateOk = 0;

  for (let i = 0; i < etfs.length; i++) {
    const etf = etfs[i]!;
    process.stdout.write(`\r[EN ${i + 1}/${etfs.length}] ${etf.ticker}.${etf.exchange}    `);

    let description: string | null = null;

    if (etf.isin) {
      description = await tryFetchJustEtfDescription(etf.isin);
      if (description) webOk++;
      await sleep(DELAY_MS);
    }

    if (!description) {
      description = buildDescriptionFromData(etf);
      templateOk++;
    }

    const description_pl = buildDescriptionPl(etf);

    const { error } = await supabase
      .from('etfs')
      .update({ description, description_pl })
      .eq('id', etf.id);

    if (error) {
      console.warn(`\n  UPDATE EN/PL ${etf.ticker}: ${error.message}`);
    }
  }

  console.log(`\nOpisy EN uzupełnione (justETF: ${webOk}, szablon: ${templateOk}).`);
}

async function fillAllPolishDescriptions(): Promise<void> {
  console.log('\n=== Polskie opisy (wszystkie ETF-y) ===');
  const etfs = await fetchAllEtfsWithRelations();
  console.log(`Do przetworzenia: ${etfs.length}\n`);

  let ok = 0;
  for (let i = 0; i < etfs.length; i++) {
    const etf = etfs[i]!;
    process.stdout.write(`\r[PL ${i + 1}/${etfs.length}] ${etf.ticker}.${etf.exchange}    `);

    const description_pl = buildDescriptionPl(etf);

    const { error } = await supabase.from('etfs').update({ description_pl }).eq('id', etf.id);

    if (error) {
      console.warn(`\n  UPDATE PL ${etf.ticker}: ${error.message}`);
      if (error.message.includes('description_pl')) {
        console.error(
          '\nBrak kolumny description_pl — uruchom w Supabase SQL Editor plik supabase-migration-description-pl.sql\n',
        );
        process.exit(1);
      }
    } else {
      ok++;
    }
  }

  console.log(`\nZaktualizowano description_pl dla ${ok} ETF-ów.`);
}

async function main() {
  await fillMissingEnglishDescriptions();
  await fillAllPolishDescriptions();
  console.log('\nGotowe (generate-descriptions).');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
