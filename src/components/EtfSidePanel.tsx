import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, CandlestickChart, LineChart as LineChartIcon, Info } from 'lucide-react';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';

interface ETF {
  id: string;
  ticker: string;
  name: string;
  category: string;
  return_1w: number | null;
  return_1m: number | null;
  return_1q: number | null;
  return_1y: number | null;
  last_updated: string;
}

interface EtfSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  etf: ETF | null;
}

// Funkcja generująca sztuczne dane do wykresu na podstawie rocznej stopy zwrotu
const generateMockChartData = (return1y: number | null) => {
  const data = [];
  let currentPrice = 100;
  const trend = return1y ? (return1y / 100) : 0.05;
  const dailyTrend = trend / 30; // Symulujemy 30 punktów danych

  for (let i = 30; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0); // Highstock lubi czyste timestampy
    
    // Generowanie danych OHLC (Open, High, Low, Close)
    const open = currentPrice;
    const noise = (Math.random() - 0.5) * 4;
    const close = open * (1 + dailyTrend) + noise;
    
    // High musi być większe lub równe max(open, close)
    const high = Math.max(open, close) + Math.random() * 2;
    // Low musi być mniejsze lub równe min(open, close)
    const low = Math.min(open, close) - Math.random() * 2;
    
    // Highcharts oczekuje tablicy: [timestamp, open, high, low, close]
    data.push([
      d.getTime(),
      Number(open.toFixed(2)),
      Number(high.toFixed(2)),
      Number(low.toFixed(2)),
      Number(close.toFixed(2))
    ]);
    
    currentPrice = close;
  }
  
  // Highcharts wymaga posortowania danych od najstarszych do najnowszych
  return data.sort((a, b) => a[0] - b[0]);
};

export default function EtfSidePanel({ isOpen, onClose, etf }: EtfSidePanelProps) {
  const { t } = useTranslation();
  const [chartType, setChartType] = useState<'line' | 'candle'>('line');

  // Generujemy dane tylko raz dla danego ETF-a
  const chartData = useMemo(() => {
    if (!etf) return [];
    return generateMockChartData(etf.return_1y);
  }, [etf]);

  // Konfiguracja Highcharts
  const chartOptions = useMemo(() => {
    // Ponieważ Astro renderuje komponenty na serwerze (SSR), obiekt `document` nie istnieje w Node.js.
    // Sprawdzamy czy jesteśmy w przeglądarce, zanim spróbujemy odczytać klasę 'dark' z dokumentu.
    const isBrowser = typeof window !== 'undefined';
    const isDark = isBrowser ? document.documentElement.classList.contains('dark') : false;
    
    const textColor = isDark ? '#f8fafc' : '#0f172a'; // slate-50 : slate-900
    const gridColor = isDark ? '#334155' : '#e2e8f0'; // slate-700 : slate-200
    const primaryColor = isDark ? '#2dd4bf' : '#14b8a6'; // teal-400 : teal-500
    const upColor = isDark ? '#22c55e' : '#16a34a'; // green-500 : green-600
    const downColor = isDark ? '#ef4444' : '#dc2626'; // red-500 : red-600
    const bgColor = 'transparent';

    return {
      chart: {
        backgroundColor: bgColor,
        style: { fontFamily: 'Inter, sans-serif' },
        spacing: [20, 0, 10, 0]
      },
      title: { text: null },
      credits: { enabled: false },
      navigator: { enabled: false },
      scrollbar: { enabled: false },
      rangeSelector: { enabled: false },
      xAxis: {
        type: 'datetime',
        lineColor: gridColor,
        tickColor: gridColor,
        labels: { style: { color: textColor } },
        crosshair: { color: gridColor, dashStyle: 'Dash' }
      },
      yAxis: {
        title: { text: null },
        gridLineColor: gridColor,
        gridLineDashStyle: 'Dash',
        labels: { 
          style: { color: textColor },
          align: 'left',
          x: 5
        },
        crosshair: { color: gridColor, dashStyle: 'Dash' }
      },
      tooltip: {
        backgroundColor: isDark ? '#1e293b' : '#ffffff', // slate-800 : white
        borderColor: gridColor,
        style: { color: textColor },
        split: false,
        shared: true
      },
      plotOptions: {
        candlestick: {
          color: downColor,
          upColor: upColor,
          lineColor: downColor,
          upLineColor: upColor,
          borderWidth: 0,
          borderRadius: 2
        },
        line: {
          color: primaryColor,
          lineWidth: 2,
          marker: { enabled: false }
        }
      },
      series: [{
        type: chartType === 'candle' ? 'candlestick' : 'line',
        name: etf?.ticker,
        data: chartType === 'candle' 
          ? chartData // Candlestick potrzebuje [timestamp, open, high, low, close]
          : chartData.map(d => [d[0], d[4]]), // Line potrzebuje tylko [timestamp, close]
        tooltip: {
          valueDecimals: 2
        }
      }]
    };
  }, [chartData, chartType, etf]);

  // Zamykanie panelem klawiszem ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Blokowanie scrollowania strony pod spodem, gdy panel jest otwarty
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!etf) return null;

  // Funkcja pomocnicza do formatowania stóp zwrotu
  const renderReturn = (val: number | null) => {
    if (val === null) return <span className="text-theme-text-muted">-</span>;
    const isPositive = val > 0;
    const isNegative = val < 0;
    const colorClass = isPositive ? 'text-theme-return-pos' : isNegative ? 'text-theme-return-neg' : 'text-theme-text';
    return (
      <span className={`font-medium ${colorClass}`}>
        {val > 0 ? '+' : ''}{val}%
      </span>
    );
  };

  return (
    <>
      {/* Tło (Backdrop) - z efektem blur */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Boczny Panel */}
      <div 
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-theme-surface border-l border-theme-border shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Nagłówek Panelu */}
        <div className="flex items-center justify-between p-6 border-b border-theme-border">
          <div>
            <h2 className="text-2xl font-bold text-theme-text">{etf.ticker}</h2>
            <p className="text-sm text-theme-text-muted mt-1">{etf.name}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-theme-bg transition-colors text-theme-text-muted hover:text-theme-text"
            title={t('panel.close')}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Zawartość Panelu (Scrollowana) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Sekcja Wykresu */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-theme-text">{t('panel.performance')}</h3>
              
              {/* Przełącznik typu wykresu */}
              <div className="flex bg-theme-bg rounded-lg p-1 border border-theme-border">
                <button
                  onClick={() => setChartType('line')}
                  className={`p-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${chartType === 'line' ? 'bg-theme-surface text-theme-primary shadow-sm' : 'text-theme-text-muted hover:text-theme-text'}`}
                  title={t('panel.chartLine')}
                >
                  <LineChartIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setChartType('candle')}
                  className={`p-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${chartType === 'candle' ? 'bg-theme-surface text-theme-primary shadow-sm' : 'text-theme-text-muted hover:text-theme-text'}`}
                  title={t('panel.chartCandle')}
                >
                  <CandlestickChart className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Wykres Highcharts */}
            <div className="h-80 w-full bg-theme-bg/50 rounded-xl p-4 border border-theme-border overflow-hidden">
              <HighchartsReact
                highcharts={Highcharts}
                constructorType={'stockChart'}
                options={chartOptions}
                containerProps={{ style: { height: '100%', width: '100%' } }}
              />
            </div>
            <div className="mt-2 flex items-start gap-2 text-xs text-theme-text-muted bg-theme-bg p-3 rounded-lg border border-theme-border/50">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{t('panel.mockDataNotice')}</p>
            </div>
          </section>

          {/* Sekcja Szczegółów */}
          <section>
            <h3 className="text-lg font-semibold text-theme-text mb-4">{t('panel.details')}</h3>
            <div className="bg-theme-bg rounded-xl border border-theme-border overflow-hidden">
              <dl className="divide-y divide-theme-border">
                <div className="px-4 py-3 flex justify-between">
                  <dt className="text-sm font-medium text-theme-text-muted">{t('table.exposure')}</dt>
                  <dd className="text-sm font-semibold text-theme-text">{etf.category || 'N/A'}</dd>
                </div>
                <div className="px-4 py-3 flex justify-between">
                  <dt className="text-sm font-medium text-theme-text-muted">{t('table.currency')}</dt>
                  <dd className="text-sm font-semibold text-theme-text">USD</dd>
                </div>
                <div className="px-4 py-3 flex justify-between">
                  <dt className="text-sm font-medium text-theme-text-muted">{t('table.w1')}</dt>
                  <dd className="text-sm">{renderReturn(etf.return_1w)}</dd>
                </div>
                <div className="px-4 py-3 flex justify-between">
                  <dt className="text-sm font-medium text-theme-text-muted">{t('table.m1')}</dt>
                  <dd className="text-sm">{renderReturn(etf.return_1m)}</dd>
                </div>
                <div className="px-4 py-3 flex justify-between">
                  <dt className="text-sm font-medium text-theme-text-muted">{t('table.q1')}</dt>
                  <dd className="text-sm">{renderReturn(etf.return_1q)}</dd>
                </div>
                <div className="px-4 py-3 flex justify-between">
                  <dt className="text-sm font-medium text-theme-text-muted">{t('table.y1')}</dt>
                  <dd className="text-sm">{renderReturn(etf.return_1y)}</dd>
                </div>
              </dl>
            </div>
          </section>

        </div>
      </div>
    </>
  );
}
