/**
 * Słownik pojęć dla opisów ETF (PL/EN). Najdłuższe dopasowanie wygrywa;
 * bez nakładania — pierwszy matcher od pozycji i zgodny z granicą „słowa”.
 */

export interface GlossaryEntry {
  /** Frazy do podświetlenia (bez rozróżniania wielkości liter). */
  matchers: string[];
  pl: { label: string; definition: string };
  en: { label: string; definition: string };
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  etf: {
    matchers: ['ETF'],
    pl: {
      label: 'ETF',
      definition:
        'Exchange‑Traded Fund — fundusz inwestycyjny notowany na giełdzie jak akcja. Jedna jednostka daje Ci ekspozycję na cały koszyk akcji lub obligacji.',
    },
    en: {
      label: 'ETF',
      definition:
        'Exchange‑Traded Fund — a fund traded on an exchange like a stock. One share gives exposure to a basket of underlying stocks or bonds.',
    },
  },
  exposure: {
    matchers: ['ekspozycję', 'ekspozycji', 'ekspozycja', 'exposure'],
    pl: {
      label: 'Ekspozycja',
      definition:
        'Udział kapitału funduszu na daną klasę aktywów lub rynek. „Ekspozycja na akcje USA” oznacza, że większość wartości jest powiązana z firmami z USA.',
    },
    en: {
      label: 'Exposure',
      definition:
        'How much of the fund’s assets are tied to a given asset class or market — for example US equities vs bonds.',
    },
  },
  large_cap: {
    matchers: ['large-cap', 'duże spółki'],
    pl: {
      label: 'Duże spółki (large-cap)',
      definition:
        'Największe firmy notowane na giełdzie (wysoka kapitalizacja). Zwykle bardziej stabilne niż małe spółki, ale tempo wzrostu bywa niższe.',
    },
    en: {
      label: 'Large-cap',
      definition:
        'The largest publicly traded companies by market capitalization. Often more stable than small caps, sometimes slower growth.',
    },
  },
  mid_small_cap: {
    matchers: ['small-cap', 'mid-cap', 'średnie spółki', 'małe spółki'],
    pl: {
      label: 'Średnie i małe spółki',
      definition:
        'Mniejsze firmy niż giganci rynkowi — większy potencjał wzrostu, ale zwykle wyższa zmienność i ryzyko.',
    },
    en: {
      label: 'Mid-cap / small-cap',
      definition:
        'Smaller listed companies — historically higher growth potential and higher volatility than large caps.',
    },
  },
  blend: {
    matchers: ['mieszane', 'blend'],
    pl: {
      label: 'Styl mieszany (blend)',
      definition:
        'Miks spółek „wzrostowych” i „wartościowych” bez wyraźnego przechylenia w jedną strategię.',
    },
    en: {
      label: 'Blend',
      definition:
        'A mix of growth and value stocks without a strong tilt to either style.',
    },
  },
  growth: {
    matchers: ['wzrostowe', 'growth'],
    pl: {
      label: 'Styl wzrostowy (growth)',
      definition:
        'Spółki, których przychody lub zyski rosną szybciej niż przeciętnie na rynku; często wyższe wyceny (np. wyższe P/E).',
    },
    en: {
      label: 'Growth',
      definition:
        'Companies expected to grow earnings faster than average — often trade at higher valuations.',
    },
  },
  value: {
    matchers: ['wartościowe', 'value'],
    pl: {
      label: 'Styl wartościowy (value)',
      definition:
        'Spółki wyceniane relatywnie tanio względem fundamentów (np. zysk, wartość księgowa).',
    },
    en: {
      label: 'Value',
      definition:
        'Stocks priced relatively cheaply vs fundamentals such as earnings or book value.',
    },
  },
  dividend: {
    matchers: ['dywidendowe', 'dywidenda', 'dividend'],
    pl: {
      label: 'Dywidenda',
      definition:
        'Część zysku spółki wypłacana akcjonariuszom gotówką. ETF dywidendowy skupia spółki regularnie dzielące się zyskiem.',
    },
    en: {
      label: 'Dividend',
      definition:
        'Cash paid by a company to shareholders. Dividend ETFs focus on stocks that pay steady dividends.',
    },
  },
  emerging_markets: {
    matchers: ['rynki wschodzące', 'emerging markets', 'EM'],
    pl: {
      label: 'Rynki wschodzące',
      definition:
        'Gospodarki rozwijające się (np. część Azji, Ameryki Łacińskiej). Wyższy potencjał wzrostu, ale większa zmienność i ryzyko polityczne lub walutowe.',
    },
    en: {
      label: 'Emerging markets',
      definition:
        'Developing economies — higher growth potential but more volatility and political/currency risk.',
    },
  },
  developed_markets: {
    matchers: ['rynki rozwinięte', 'developed markets'],
    pl: {
      label: 'Rynki rozwinięte',
      definition:
        'Dojrzałe gospodarki z ugruntowanymi rynkami kapitałowymi (np. USA, Europa Zachodnia, Japonia).',
    },
    en: {
      label: 'Developed markets',
      definition:
        'Mature economies with deep capital markets — e.g. US, Western Europe, Japan.',
    },
  },
  eurozone: {
    matchers: ['strefa euro', 'eurozonie', 'eurozone'],
    pl: {
      label: 'Strefa euro',
      definition:
        'Kraje Unii Europejskiej używające wspólnej waluty euro.',
    },
    en: {
      label: 'Eurozone',
      definition:
        'EU countries that use the euro as their currency.',
    },
  },
  a_shares: {
    matchers: ['A-shares'],
    pl: {
      label: 'A-shares',
      definition:
        'Akcje chińskich spółek notowane na giełdach w Szanghaju i Shenzhen, denominowane w juanie.',
    },
    en: {
      label: 'A-shares',
      definition:
        'Chinese mainland stocks listed in Shanghai/Shenzhen, traded in renminbi.',
    },
  },
  bond: {
    matchers: ['obligacji', 'obligacje', 'bonds', 'bond'],
    pl: {
      label: 'Obligacje',
      definition:
        'Papiery dłużne — pożyczasz emitentowi kapitał; on płaci odsetki i zwraca wartość nominalną w terminie zapadalności.',
    },
    en: {
      label: 'Bonds',
      definition:
        'Debt securities — you lend money to the issuer; they pay interest and return principal at maturity.',
    },
  },
  government_bond: {
    matchers: ['obligacje rządowe', 'rządowych', 'Gilts', 'government bonds', 'treasuries'],
    pl: {
      label: 'Obligacje rządowe',
      definition:
        'Dług emitowany przez państwo — zwykle niższe ryzyko niewypłacalności niż obligacje firm (kosztem niższego potencjalnego zwrotu).',
    },
    en: {
      label: 'Government bonds',
      definition:
        'Debt issued by a sovereign government — typically lower credit risk than corporate bonds.',
    },
  },
  corporate_bond: {
    matchers: ['obligacje korporacyjne', 'corporate bonds'],
    pl: {
      label: 'Obligacje korporacyjne',
      definition:
        'Dług firm — wyższe oprocentowanie niż u obligacji rządowych, ale wyższe ryzyko niewypłacalności.',
    },
    en: {
      label: 'Corporate bonds',
      definition:
        'Debt issued by companies — higher yields than governments but higher default risk.',
    },
  },
  high_yield: {
    matchers: ['wysokodochodowe', 'high yield', 'junk'],
    pl: {
      label: 'High yield (junk)',
      definition:
        'Obligacje firm o niższej ocenie kredytowej (poniżej „investment grade”) — wyższy kupon, większe ryzyko defaultu.',
    },
    en: {
      label: 'High yield',
      definition:
        'Below investment-grade corporate bonds — higher coupons but higher default risk.',
    },
  },
  inflation_linked: {
    matchers: ['antyinflacyjne', 'TIPS', 'inflation-linked', 'inflation-protected'],
    pl: {
      label: 'Obligacje indeksowane inflacją',
      definition:
        'Wartość kapitału lub odsetek rośnie w miarę inflacji (np. indeks CPI), chroniąc siłę nabywczą.',
    },
    en: {
      label: 'Inflation-linked bonds',
      definition:
        'Bonds whose principal or coupons adjust with inflation (e.g. CPI-linked), preserving purchasing power.',
    },
  },
  municipal: {
    matchers: ['municypalne', 'municipal'],
    pl: {
      label: 'Obligacje municypalne',
      definition:
        'Dług emitowany przez stany lub miasta w USA — często korzyści podatkowe dla rezydentów USA.',
    },
    en: {
      label: 'Municipal bonds',
      definition:
        'Debt issued by US states/cities — often tax-advantaged for US taxpayers.',
    },
  },
  convertible: {
    matchers: ['zamienne', 'convertible'],
    pl: {
      label: 'Obligacje zamienne',
      definition:
        'Obligacja, którą można w zamian odebrać akcje emitenta — pośrednia forma między długiem a kapitałem.',
    },
    en: {
      label: 'Convertible bonds',
      definition:
        'Bonds that can be exchanged into the issuer’s stock — hybrid debt/equity exposure.',
    },
  },
  leveraged: {
    matchers: ['lewarowane', 'leverage', 'leveraged'],
    pl: {
      label: 'ETF lewarowany',
      definition:
        'Fundusz dążący do wielokrotności dziennego zwrotu indeksu (np. ×2, ×3). Z powodu dziennego „resetu” ścieżki cenowej nadaje się raczej do krótkiego horyzontu — wyższe ryzyko.',
    },
    en: {
      label: 'Leveraged ETF',
      definition:
        'Seeks a multiple of the index’s daily return (e.g. 2x, 3x). Daily reset causes path dependency — typically short-term trading only; high risk.',
    },
  },
  inverse: {
    matchers: ['odwrócone', 'inverse', 'short ETF'],
    pl: {
      label: 'ETF odwrócony (inverse)',
      definition:
        'Strategia licząca na spadek bazowego indeksu w skali dnia — dzienne odświeżanie; nie nadaje się jako długoterminowa „pewna” alternatywa dla shortowania.',
    },
    en: {
      label: 'Inverse ETF',
      definition:
        'Aims for the opposite of the index’s daily move — daily reset; not a simple long-term short substitute.',
    },
  },
  derivative_income: {
    matchers: ['strategie opcyjne', 'opcyjne / dochodowe', 'options-based income', 'covered call'],
    pl: {
      label: 'Strategie opcyjne / dochodowe',
      definition:
        'Często sprzedaż opcji (np. covered call) na portfel akcji — generuje dodatkowy dochód z premii opcyjnych, częściowo kosztem potencjalnego wzrostu kursu.',
    },
    en: {
      label: 'Options / income strategies',
      definition:
        'Often involves selling options (e.g. covered calls) against stock holdings — earns premium income but can cap upside.',
    },
  },
  defined_outcome: {
    matchers: ['buforowane', 'defined outcome', 'buffer'],
    pl: {
      label: 'Defined outcome / bufor',
      definition:
        'Struktura z określonym zakresem zysku i częściowej ochrony przed stratą na ustalonym okresie (warunki z prospektu).',
    },
    en: {
      label: 'Defined outcome',
      definition:
        'Structured exposure with a preset upside cap and partial downside protection over a defined period — see prospectus for terms.',
    },
  },
  mlp: {
    matchers: ['Limited Partnership', 'MLP'],
    pl: {
      label: 'MLP',
      definition:
        'Master Limited Partnership — forma spółki częsta w infrastrukturze energetycznej w USA; często wysokie wypłaty, specyficzne zasady podatkowe.',
    },
    en: {
      label: 'MLP',
      definition:
        'Master Limited Partnership — common in US energy pipelines/infrastructure; often high payouts and distinct tax treatment.',
    },
  },
  reit: {
    matchers: ['REITs', 'REIT'],
    pl: {
      label: 'REIT',
      definition:
        'Real Estate Investment Trust — firma inwestująca w nieruchomości lub hipoteki; często obowiązek wypłaty większości zysków inwestorom.',
    },
    en: {
      label: 'REIT',
      definition:
        'Real Estate Investment Trust — invests in property or mortgages; typically must distribute most income to shareholders.',
    },
  },
  commodities: {
    matchers: ['commodities', 'surowce'],
    pl: {
      label: 'Surowce',
      definition:
        'Towary fizyczne lub ich ceny (ropa, metale, zboża). ETF-y często korzystają z kontraktów futures, nie „beczek ropy” w magazynie.',
    },
    en: {
      label: 'Commodities',
      definition:
        'Physical goods or their prices (oil, metals, grains). ETFs often use futures, not barrels stored in a warehouse.',
    },
  },
  precious_metals: {
    matchers: ['metale szlachetne', 'precious metals'],
    pl: {
      label: 'Metale szlachetne',
      definition:
        'Np. złoto, srebro, platyna — często traktowane jako „bezpieczna przystań” lub zabezpieczenie przed inflacją (bez gwarancji zwrotu).',
    },
    en: {
      label: 'Precious metals',
      definition:
        'Gold, silver, platinum — often viewed as havens or inflation hedges (no guaranteed outcome).',
    },
  },
  hedged: {
    matchers: ['EUR Hedged', 'USD Hedged', 'GBP Hedged', 'CHF Hedged', 'hedged', 'zabezpieczony', 'zabezpieczone'],
    pl: {
      label: 'Zabezpieczenie walutowe (hedged)',
      definition:
        'Wersja funduszu redukująca wpływ kursów walut na wynik — np. aktywa w USD przy koncie w EUR.',
    },
    en: {
      label: 'Currency hedged',
      definition:
        'Share class that reduces the impact of FX moves — e.g. US assets held with EUR accounting.',
    },
  },
  domicile: {
    matchers: ['domiciled in', 'domicyl'],
    pl: {
      label: 'Domicyl',
      definition:
        'Kraj prawny rejestracji funduszu — wpływa na regulacje i często na podatek od dywidend (np. Irlandia, Luksemburg).',
    },
    en: {
      label: 'Domicile',
      definition:
        'Legal home country of the fund — affects regulation and often withholding tax on dividends.',
    },
  },
};

/** Matcher z kluczem — posortowane malejąco po długości frazy */
function sortedMatchers(): { termKey: string; pattern: string; patternLower: string }[] {
  const out: { termKey: string; pattern: string; patternLower: string }[] = [];
  for (const termKey of Object.keys(GLOSSARY)) {
    const entry = GLOSSARY[termKey]!;
    for (const pattern of entry.matchers) {
      out.push({ termKey, pattern, patternLower: pattern.toLowerCase() });
    }
  }
  out.sort((a, b) => b.pattern.length - a.pattern.length || a.pattern.localeCompare(b.pattern));
  return out;
}

const SORTED_MATCHERS = sortedMatchers();

function isWordChar(c: string): boolean {
  return /\p{L}|\p{N}/u.test(c);
}

function boundaryOk(text: string, start: number, end: number): boolean {
  if (start > 0 && isWordChar(text[start - 1]!)) return false;
  if (end < text.length && isWordChar(text[end]!)) return false;
  return true;
}

export type GlossarySegment =
  | { kind: 'text'; value: string }
  | { kind: 'term'; termKey: string; value: string; segmentIndex: number };

export function tokenizeWithGlossary(text: string): GlossarySegment[] {
  const segments: GlossarySegment[] = [];
  let segIdx = 0;
  let runStart = 0;
  let i = 0;

  while (i < text.length) {
    let found: { termKey: string; value: string; len: number } | null = null;
    for (const { termKey, pattern, patternLower } of SORTED_MATCHERS) {
      const len = pattern.length;
      if (i + len > text.length) continue;
      const slice = text.slice(i, i + len);
      if (slice.toLowerCase() !== patternLower) continue;
      if (!boundaryOk(text, i, i + len)) continue;
      found = { termKey, value: slice, len };
      break;
    }

    if (found) {
      if (runStart < i) {
        segments.push({ kind: 'text', value: text.slice(runStart, i) });
      }
      segments.push({ kind: 'term', termKey: found.termKey, value: found.value, segmentIndex: segIdx++ });
      i += found.len;
      runStart = i;
    } else {
      i++;
    }
  }

  if (runStart < text.length) {
    segments.push({ kind: 'text', value: text.slice(runStart) });
  }

  return segments;
}

export function getGlossaryDefinition(termKey: string, lang: 'pl' | 'en'): { label: string; definition: string } | null {
  const entry = GLOSSARY[termKey];
  if (!entry) return null;
  return entry[lang];
}
