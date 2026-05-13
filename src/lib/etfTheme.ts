/**
 * Wyciąga konkretny temat z nazwy ETF (np. "Sprott Lithium Miners ETF" → "Producenci litu").
 * Najpierw usuwa znane nazwy emitentów, potem szuka pierwszego pasującego matchera
 * (longest-first); jeśli żaden nie pasuje — zwraca `null`.
 */

interface ThemeRule {
  /** Frazy szukane w nazwie ETF (case-insensitive). */
  keywords: string[];
  pl: string;
  en: string;
}

const ISSUERS: string[] = [
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
  'GlobalX',
  'ARK',
  'L&G',
  'Legal & General',
  'Goldman Sachs',
  'Dimensional',
  'State Street',
  'Sprott',
  'First Trust',
  'KraneShares',
  'ProShares',
  'Direxion',
  'Roundhill',
  'BlackRock',
  'Charles Schwab',
];

const RAW_RULES: ThemeRule[] = [
  // ── Metale i wydobycie ──────────────────────────────────────────
  { keywords: ['Rare Earth', 'Strategic Metals'], pl: 'Metale ziem rzadkich i strategiczne', en: 'Rare Earth & Strategic Metals' },
  { keywords: ['Battery Metals', 'Battery Materials', 'Battery Tech', 'Battery'], pl: 'Producenci akumulatorów i metali bateryjnych', en: 'Battery & Battery Metals' },
  { keywords: ['Lithium'], pl: 'Producenci litu', en: 'Lithium Miners' },
  { keywords: ['Uranium'], pl: 'Wydobycie uranu', en: 'Uranium Mining' },
  { keywords: ['Copper'], pl: 'Wydobycie miedzi', en: 'Copper Mining' },
  { keywords: ['Nickel'], pl: 'Wydobycie niklu', en: 'Nickel Mining' },
  { keywords: ['Cobalt'], pl: 'Wydobycie kobaltu', en: 'Cobalt Mining' },
  { keywords: ['Aluminum', 'Aluminium'], pl: 'Aluminium', en: 'Aluminum' },
  { keywords: ['Iron Ore', 'Iron'], pl: 'Ruda żelaza', en: 'Iron Ore' },
  { keywords: ['Steel'], pl: 'Stal', en: 'Steel' },
  { keywords: ['Zinc'], pl: 'Cynk', en: 'Zinc' },
  { keywords: ['Tin'], pl: 'Cyna', en: 'Tin' },

  // ── Metale szlachetne ───────────────────────────────────────────
  { keywords: ['Precious Metals'], pl: 'Metale szlachetne', en: 'Precious Metals' },
  { keywords: ['Gold Miners', 'Gold Mining', 'Gold'], pl: 'Producenci złota', en: 'Gold Miners' },
  { keywords: ['Silver Miners', 'Silver Mining', 'Silver'], pl: 'Producenci srebra', en: 'Silver Miners' },
  { keywords: ['Platinum'], pl: 'Platyna', en: 'Platinum' },
  { keywords: ['Palladium'], pl: 'Pallad', en: 'Palladium' },

  // ── Energia ────────────────────────────────────────────────────
  { keywords: ['Clean Energy', 'Renewable Energy', 'Green Energy'], pl: 'Energia odnawialna', en: 'Clean & Renewable Energy' },
  { keywords: ['Natural Gas', 'Nat Gas'], pl: 'Gaz ziemny', en: 'Natural Gas' },
  { keywords: ['Nuclear', 'Atomic'], pl: 'Energia jądrowa', en: 'Nuclear Energy' },
  { keywords: ['Solar'], pl: 'Energia słoneczna', en: 'Solar Energy' },
  { keywords: ['Wind'], pl: 'Energia wiatrowa', en: 'Wind Energy' },
  { keywords: ['Hydrogen'], pl: 'Wodór', en: 'Hydrogen' },
  { keywords: ['Pipeline', 'Midstream', 'MLP'], pl: 'Rurociągi i midstream', en: 'Pipelines & Midstream' },
  { keywords: ['Oil & Gas', 'Oil and Gas'], pl: 'Ropa i gaz', en: 'Oil & Gas' },
  { keywords: ['Crude Oil', 'Crude'], pl: 'Ropa naftowa', en: 'Crude Oil' },
  { keywords: ['Oil'], pl: 'Ropa naftowa', en: 'Oil' },
  { keywords: ['Coal'], pl: 'Węgiel', en: 'Coal' },

  // ── Rolnictwo, leśnictwo, woda, karbon ──────────────────────────
  { keywords: ['Agribusiness', 'Agriculture'], pl: 'Rolnictwo i agrobiznes', en: 'Agriculture & Agribusiness' },
  { keywords: ['Timber', 'Forestry'], pl: 'Drewno i leśnictwo', en: 'Timber & Forestry' },
  { keywords: ['Water'], pl: 'Woda', en: 'Water' },
  { keywords: ['Carbon Allowances', 'Carbon Credits', 'Carbon Emission', 'Carbon'], pl: 'Handel emisjami CO2', en: 'Carbon Credits' },

  // ── Technologia ────────────────────────────────────────────────
  { keywords: ['Semiconductor'], pl: 'Półprzewodniki', en: 'Semiconductors' },
  { keywords: ['Cybersecurity', 'Cyber Security'], pl: 'Cyberbezpieczeństwo', en: 'Cybersecurity' },
  { keywords: ['Artificial Intelligence', 'AI &', 'A.I.'], pl: 'Sztuczna inteligencja', en: 'Artificial Intelligence' },
  { keywords: ['Cloud Computing', 'Cloud'], pl: 'Chmura obliczeniowa', en: 'Cloud Computing' },
  { keywords: ['Robotics & Automation', 'Robotics', 'Automation'], pl: 'Robotyka i automatyzacja', en: 'Robotics & Automation' },
  { keywords: ['Blockchain', 'Crypto'], pl: 'Blockchain i kryptowaluty', en: 'Blockchain & Crypto' },
  { keywords: ['Metaverse'], pl: 'Metawersum', en: 'Metaverse' },
  { keywords: ['Social Media'], pl: 'Media społecznościowe', en: 'Social Media' },
  { keywords: ['Video Games', 'Esports', 'E-Sports', 'Gaming'], pl: 'Gry video i e-sport', en: 'Video Games & Esports' },
  { keywords: ['5G'], pl: 'Sieci 5G', en: '5G Networks' },
  { keywords: ['Internet'], pl: 'Internet i e-commerce', en: 'Internet' },
  { keywords: ['Digital Economy', 'Digital Transformation'], pl: 'Cyfryzacja gospodarki', en: 'Digital Economy' },
  { keywords: ['FinTech', 'Fintech'], pl: 'FinTech', en: 'FinTech' },

  // ── Zdrowie ────────────────────────────────────────────────────
  { keywords: ['Biotechnology', 'Biotech'], pl: 'Biotechnologia', en: 'Biotechnology' },
  { keywords: ['Genomics', 'Genomic', 'Genome'], pl: 'Genomika', en: 'Genomics' },
  { keywords: ['Medical Devices', 'Medical Device'], pl: 'Urządzenia medyczne', en: 'Medical Devices' },
  { keywords: ['Cannabis', 'Marijuana'], pl: 'Konopie i marihuana', en: 'Cannabis' },
  { keywords: ['Cancer', 'Oncology'], pl: 'Onkologia', en: 'Cancer / Oncology' },
  { keywords: ['Longevity', 'Aging'], pl: 'Długowieczność', en: 'Longevity & Aging' },
  { keywords: ['Pharmaceutical', 'Pharma'], pl: 'Farmacja', en: 'Pharmaceuticals' },

  // ── Finanse ────────────────────────────────────────────────────
  { keywords: ['Regional Banks', 'Community Banks', 'Banks', 'Banking'], pl: 'Banki', en: 'Banks' },
  { keywords: ['Insurance'], pl: 'Ubezpieczenia', en: 'Insurance' },
  { keywords: ['Mortgage REIT'], pl: 'REIT-y hipoteczne', en: 'Mortgage REITs' },
  { keywords: ['REIT', 'Real Estate'], pl: 'Nieruchomości (REIT)', en: 'Real Estate (REITs)' },
  { keywords: ['Private Equity'], pl: 'Private equity', en: 'Private Equity' },

  // ── Obronność, infrastruktura, inne ────────────────────────────
  { keywords: ['Aerospace & Defense', 'Aerospace and Defense', 'Defense', 'Defence', 'Aerospace'], pl: 'Obronność i lotnictwo', en: 'Defense & Aerospace' },
  { keywords: ['Infrastructure'], pl: 'Infrastruktura', en: 'Infrastructure' },
  { keywords: ['Sustainability', 'Sustainable', 'ESG'], pl: 'ESG i zrównoważony rozwój', en: 'ESG & Sustainability' },
  { keywords: ['Disruptive', 'Disruption', 'Innovation', 'Innovators'], pl: 'Innowacje i disruptors', en: 'Innovation & Disruptors' },
  { keywords: ['Travel & Leisure', 'Travel and Leisure', 'Travel', 'Leisure'], pl: 'Turystyka i rozrywka', en: 'Travel & Leisure' },
  { keywords: ['Luxury'], pl: 'Dobra luksusowe', en: 'Luxury Goods' },
  { keywords: ['Homebuilders', 'Home Construction'], pl: 'Deweloperzy mieszkaniowi', en: 'Homebuilders' },
];

function maxKeyLen(rule: ThemeRule): number {
  return rule.keywords.reduce((acc, k) => Math.max(acc, k.length), 0);
}

const THEME_RULES: ThemeRule[] = [...RAW_RULES].sort((a, b) => maxKeyLen(b) - maxKeyLen(a));

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripIssuers(name: string): string {
  let out = name;
  for (const issuer of ISSUERS) {
    const re = new RegExp(`\\b${escapeRegex(issuer)}\\b`, 'gi');
    out = out.replace(re, ' ');
  }
  return out.replace(/\s+/g, ' ').trim();
}

function findKeyword(haystack: string, keyword: string): number {
  const re = new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegex(keyword)}([^\\p{L}\\p{N}]|$)`, 'iu');
  const m = re.exec(haystack);
  if (!m) return -1;
  return m.index + m[1]!.length;
}

export function inferEtfTheme(name: string | null | undefined, lang: 'pl' | 'en'): string | null {
  if (!name) return null;
  const stripped = stripIssuers(name);
  if (!stripped) return null;

  let best: { rule: ThemeRule; idx: number; len: number } | null = null;

  for (const rule of THEME_RULES) {
    for (const keyword of rule.keywords) {
      const idx = findKeyword(stripped, keyword);
      if (idx < 0) continue;
      const len = keyword.length;
      if (
        !best ||
        idx < best.idx ||
        (idx === best.idx && len > best.len)
      ) {
        best = { rule, idx, len };
      }
      break;
    }
  }

  return best ? best.rule[lang] : null;
}

/** Etykieta tematu do wyświetlania przy chipach filtrowania — stan przechował `inferEtfTheme(_, 'en')`. */
export function localizedThemeCanon(enCanon: string, lang: 'pl' | 'en'): string {
  const rule = THEME_RULES.find((r) => r.en === enCanon);
  if (!rule) return enCanon;
  return rule[lang];
}
