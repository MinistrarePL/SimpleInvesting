export interface EODPrice {
  date: string;
  adjusted_close: number;
  [key: string]: any;
}

export interface Returns {
  '1W': number | null;
  '1M': number | null;
  '1Q': number | null;
  '1Y': number | null;
}

/**
 * Zwraca najbliższą dostępną cenę dla podanej daty docelowej.
 * Zakładamy, że tablica `prices` jest posortowana od najstarszej do najnowszej daty.
 */
function getClosestPrice(prices: EODPrice[], targetDate: Date): number | null {
  if (prices.length === 0) return null;

  // Szukamy ceny z datą mniejszą lub równą dacie docelowej
  let closestPrice = null;
  let minDiff = Infinity;

  for (const price of prices) {
    const priceDate = new Date(price.date);
    const diff = Math.abs(targetDate.getTime() - priceDate.getTime());
    
    // Szukamy najbliższego dnia roboczego (różnica w czasie jest najmniejsza)
    if (diff < minDiff) {
      minDiff = diff;
      closestPrice = price.adjusted_close;
    }
  }

  return closestPrice;
}

/**
 * Oblicza stopy zwrotu (1W, 1M, 1Q, 1Y) na podstawie tablicy historycznych cen.
 * @param prices Tablica cen z EODHD API (posortowana chronologicznie)
 */
export function calculateReturns(prices: EODPrice[]): Returns {
  if (!prices || prices.length < 2) {
    return { '1W': null, '1M': null, '1Q': null, '1Y': null };
  }

  // Bierzemy najnowszą dostępną cenę (zazwyczaj ostatni element tablicy)
  const latestData = prices[prices.length - 1];
  const currentPrice = latestData.adjusted_close;
  const currentDate = new Date(latestData.date);

  // Funkcja pomocnicza do obliczania procentowej stopy zwrotu
  const calcPercent = (pastPrice: number | null) => {
    if (!pastPrice) return null;
    return Number((((currentPrice - pastPrice) / pastPrice) * 100).toFixed(2));
  };

  // Wyliczamy daty docelowe w przeszłości
  const date1W = new Date(currentDate);
  date1W.setDate(date1W.getDate() - 7);

  const date1M = new Date(currentDate);
  date1M.setMonth(date1M.getMonth() - 1);

  const date1Q = new Date(currentDate);
  date1Q.setMonth(date1Q.getMonth() - 3);

  const date1Y = new Date(currentDate);
  date1Y.setFullYear(date1Y.getFullYear() - 1);

  // Zwracamy wyliczone stopy zwrotu
  return {
    '1W': calcPercent(getClosestPrice(prices, date1W)),
    '1M': calcPercent(getClosestPrice(prices, date1M)),
    '1Q': calcPercent(getClosestPrice(prices, date1Q)),
    '1Y': calcPercent(getClosestPrice(prices, date1Y)),
  };
}
