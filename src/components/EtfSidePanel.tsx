import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { X, CandlestickChart, LineChart as LineChartIcon, Info } from 'lucide-react';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { EtfDetail, EtfRow } from '../types/etf';
import { supabase } from './AuthModal';
import { getFriendlyCategory } from '../lib/categoryMap';
import GlossaryText from './GlossaryText';

interface EtfSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  etf: EtfRow | null;
}

const PIE_COLORS = [
  '#14b8a6', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6', '#10b981', '#ef4444', '#3b82f6', '#84cc16', '#64748b',
];

type ChartRange = '1m' | '3m' | '6m' | '1y' | '5y';

interface ChartOHLCRow {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

function eodDateUtcMs(dateStr: string): number {
  const [y, mo, d] = dateStr.split('-').map(Number);
  if (!y || !mo || !d) return NaN;
  return Date.UTC(y, mo - 1, d);
}

function formatAum(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return '—';
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return String(Math.round(n));
}

function fmtPct(n: number | null | undefined, digits = 2) {
  if (n == null || !Number.isFinite(n)) return '—';
  return `${n.toFixed(digits)}%`;
}

export default function EtfSidePanel({ isOpen, onClose, etf }: EtfSidePanelProps) {
  const { t, i18n } = useTranslation();
  const [chartType, setChartType] = useState<'line' | 'candle'>('line');
  const [chartRange, setChartRange] = useState<ChartRange>('1y');
  const [chartPoints, setChartPoints] = useState<ChartOHLCRow[]>([]);
  const [chartFetch, setChartFetch] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [detail, setDetail] = useState<EtfDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !etf?.id) {
      setDetail(null);
      setDetailError(null);
      return;
    }

    let cancelled = false;
    (async () => {
      setDetailLoading(true);
      setDetailError(null);
      const { data, error } = await supabase
        .from('etfs')
        .select(
          `*,
          etf_sectors ( sector, equity_pct, relative_to_category ),
          etf_regions ( region, equity_pct, relative_to_category ),
          etf_top_holdings ( rank, code, name, sector, assets_pct )
        `
        )
        .eq('id', etf.id)
        .single();

      if (cancelled) return;
      setDetailLoading(false);
      if (error) {
        setDetailError(error.message);
        setDetail({ ...etf } as EtfDetail);
      } else {
        setDetail(data as EtfDetail);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, etf?.id, etf]);

  useEffect(() => {
    if (isOpen) setChartRange('1y');
  }, [isOpen, etf?.id]);

  useEffect(() => {
    if (!isOpen || !etf?.ticker) {
      setChartPoints([]);
      setChartFetch('idle');
      return;
    }

    const ex = etf.exchange || 'US';
    let cancelled = false;
    setChartFetch('loading');

    const q = `/api/chart?symbol=${encodeURIComponent(etf.ticker)}&exchange=${encodeURIComponent(ex)}&range=${chartRange}`;
    fetch(q)
      .then((res) => res.json())
      .then((data: { error?: string; points?: ChartOHLCRow[] }) => {
        if (cancelled) return;
        if (data?.error || !Array.isArray(data.points)) {
          setChartFetch('error');
          setChartPoints([]);
          return;
        }
        setChartPoints(data.points);
        setChartFetch(data.points.length ? 'ok' : 'idle');
      })
      .catch(() => {
        if (!cancelled) {
          setChartFetch('error');
          setChartPoints([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, etf?.ticker, etf?.exchange, chartRange]);

  const d = detail ?? etf;

  const panelDescription =
    d == null
      ? ''
      : i18n.language?.startsWith('pl')
        ? (d.description_pl || d.description) || ''
        : d.description || '';

  const glossaryLang: 'pl' | 'en' = i18n.language?.startsWith('pl') ? 'pl' : 'en';

  const ohlcMs = useMemo(() => {
    const rows: number[][] = [];
    for (const p of chartPoints) {
      const t = eodDateUtcMs(p.date);
      if (!Number.isFinite(t)) continue;
      rows.push([t, p.open, p.high, p.low, p.close]);
    }
    return rows;
  }, [chartPoints]);

  const RANGE_TABS: { key: ChartRange; labelKey: string }[] = [
    { key: '1m', labelKey: 'panel.range1m' },
    { key: '3m', labelKey: 'panel.range3m' },
    { key: '6m', labelKey: 'panel.range6m' },
    { key: '1y', labelKey: 'panel.range1y' },
    { key: '5y', labelKey: 'panel.range5y' },
  ];

  const sectorChartData = useMemo(() => {
    const rows = d?.etf_sectors?.filter((s) => (s.equity_pct ?? 0) > 0) ?? [];
    return rows.map((s) => ({ name: s.sector, value: Number(s.equity_pct) }));
  }, [d]);

  const regionChartData = useMemo(() => {
    const rows = d?.etf_regions?.filter((r) => (r.equity_pct ?? 0) > 0) ?? [];
    return rows.map((s) => ({ name: s.region, value: Number(s.equity_pct) }));
  }, [d]);

  const sortedHoldings = useMemo(() => {
    const h = d?.etf_top_holdings ?? [];
    return [...h].sort((a, b) => a.rank - b.rank);
  }, [d]);

  const chartOptions = useMemo(() => {
    const isBrowser = typeof window !== 'undefined';
    const isDark = isBrowser ? document.documentElement.classList.contains('dark') : false;

    const textColor = isDark ? '#f8fafc' : '#0f172a';
    const gridColor = isDark ? '#334155' : '#e2e8f0';
    const primaryColor = isDark ? '#2dd4bf' : '#14b8a6';
    const upColor = isDark ? '#22c55e' : '#16a34a';
    const downColor = isDark ? '#ef4444' : '#dc2626';
    const bgColor = 'transparent';

    return {
      chart: {
        backgroundColor: bgColor,
        style: { fontFamily: 'Inter, sans-serif' },
        spacing: [20, 0, 10, 0],
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
        crosshair: { color: gridColor, dashStyle: 'Dash' },
      },
      yAxis: {
        title: { text: null },
        gridLineColor: gridColor,
        gridLineDashStyle: 'Dash',
        labels: {
          style: { color: textColor },
          align: 'left',
          x: 5,
        },
        crosshair: { color: gridColor, dashStyle: 'Dash' },
      },
      tooltip: {
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        borderColor: gridColor,
        style: { color: textColor },
        split: false,
        shared: true,
      },
      plotOptions: {
        candlestick: {
          color: downColor,
          upColor: upColor,
          lineColor: downColor,
          upLineColor: upColor,
          borderWidth: 0,
          borderRadius: 2,
        },
        line: {
          color: primaryColor,
          lineWidth: 2,
          marker: { enabled: false },
        },
      },
      series:
        chartFetch === 'ok' && ohlcMs.length
          ? [
              {
                type: chartType === 'candle' ? 'candlestick' : 'line',
                name: etf?.ticker,
                data:
                  chartType === 'candle'
                    ? ohlcMs
                    : ohlcMs.map((row) => [row[0]!, row[4]!] as [number, number]),
                tooltip: {
                  valueDecimals: 2,
                },
              },
            ]
          : [],
    };
  }, [ohlcMs, chartType, etf, chartFetch]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!etf) return null;

  const renderReturn = (val: number | null) => {
    if (val === null) return <span className="text-theme-text-muted">-</span>;
    const isPositive = val > 0;
    const isNegative = val < 0;
    const colorClass = isPositive ? 'text-theme-return-pos' : isNegative ? 'text-theme-return-neg' : 'text-theme-text';
    return (
      <span className={`font-medium ${colorClass}`}>
        {val > 0 ? '+' : ''}
        {val}%
      </span>
    );
  };

  const msStars =
    d.morningstar_rating != null && d.morningstar_rating >= 1 && d.morningstar_rating <= 5 ? (
      <span className="text-amber-500">{'★'.repeat(d.morningstar_rating)}</span>
    ) : (
      <span className="text-theme-text-muted">—</span>
    );

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-theme-surface border-l border-theme-border shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between p-6 border-b border-theme-border">
          <div>
            <h2 className="text-2xl font-bold text-theme-text">
              {etf.ticker}
              <span className="ml-2 text-sm font-normal text-theme-text-muted">· {etf.exchange || 'US'}</span>
            </h2>
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

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {detailLoading && (
            <p className="text-sm text-theme-text-muted">{t('panel.loadingDetail')}</p>
          )}
          {detailError && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              {t('panel.loadError')}: {detailError}
            </p>
          )}

          {panelDescription && (
            <section>
              <h3 className="text-lg font-semibold text-theme-text mb-2">{t('panel.description')}</h3>
              <p className="text-sm text-theme-text-muted leading-relaxed whitespace-pre-wrap">
                <GlossaryText text={panelDescription} lang={glossaryLang} />
              </p>
            </section>
          )}

          <section>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h3 className="text-lg font-semibold text-theme-text">{t('panel.performance')}</h3>
              <div className="flex flex-wrap items-center gap-2 justify-end">
                <div className="flex bg-theme-bg rounded-lg p-1 border border-theme-border flex-wrap">
                  {RANGE_TABS.map(({ key, labelKey }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setChartRange(key)}
                      className={`px-2 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${chartRange === key ? 'bg-theme-surface text-theme-primary shadow-sm' : 'text-theme-text-muted hover:text-theme-text'}`}
                    >
                      {t(labelKey)}
                    </button>
                  ))}
                </div>
                <div className="flex bg-theme-bg rounded-lg p-1 border border-theme-border">
                  <button
                    type="button"
                    onClick={() => setChartType('line')}
                    className={`p-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${chartType === 'line' ? 'bg-theme-surface text-theme-primary shadow-sm' : 'text-theme-text-muted hover:text-theme-text'}`}
                    title={t('panel.chartLine')}
                  >
                    <LineChartIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartType('candle')}
                    className={`p-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${chartType === 'candle' ? 'bg-theme-surface text-theme-primary shadow-sm' : 'text-theme-text-muted hover:text-theme-text'}`}
                    title={t('panel.chartCandle')}
                  >
                    <CandlestickChart className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              <div className="rounded-lg border border-theme-border bg-theme-bg px-3 py-2 text-center">
                <div className="text-theme-text-muted text-xs">{t('table.w1')}</div>
                <div className="text-sm tabular-nums">{renderReturn(etf.return_1w)}</div>
              </div>
              <div className="rounded-lg border border-theme-border bg-theme-bg px-3 py-2 text-center">
                <div className="text-theme-text-muted text-xs">{t('table.m1')}</div>
                <div className="text-sm tabular-nums">{renderReturn(etf.return_1m)}</div>
              </div>
              <div className="rounded-lg border border-theme-border bg-theme-bg px-3 py-2 text-center">
                <div className="text-theme-text-muted text-xs">{t('table.q1')}</div>
                <div className="text-sm tabular-nums">{renderReturn(etf.return_1q)}</div>
              </div>
              <div className="rounded-lg border border-theme-border bg-theme-bg px-3 py-2 text-center">
                <div className="text-theme-text-muted text-xs">{t('table.y1')}</div>
                <div className="text-sm tabular-nums">{renderReturn(etf.return_1y)}</div>
              </div>
            </div>

            <div className="relative h-80 w-full bg-theme-bg/50 rounded-xl p-4 border border-theme-border overflow-hidden">
              <HighchartsReact
                highcharts={Highcharts}
                constructorType={'stockChart'}
                options={chartOptions}
                containerProps={{ style: { height: '100%', width: '100%' } }}
              />
              {chartFetch === 'loading' && (
                <div className="absolute inset-0 flex items-center justify-center bg-theme-surface/70 text-sm text-theme-text-muted">
                  {t('panel.chartLoading')}
                </div>
              )}
              {chartFetch === 'error' && (
                <div className="absolute bottom-2 left-2 right-2 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg p-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{t('panel.chartLoadError')}</p>
                </div>
              )}
            </div>
            {chartFetch === 'ok' && !ohlcMs.length && (
              <p className="mt-2 text-xs text-theme-text-muted">{t('panel.chartEmpty')}</p>
            )}
          </section>

          <section>
            <h3 className="text-lg font-semibold text-theme-text mb-4">{t('panel.keyFacts')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-theme-border bg-theme-bg px-3 py-2">
                <div className="text-theme-text-muted text-xs">{t('table.exposure')}</div>
                <div className="font-medium text-theme-text">{getFriendlyCategory(d.category, glossaryLang, d.name)}</div>
              </div>
              <div className="rounded-lg border border-theme-border bg-theme-bg px-3 py-2">
                <div className="text-theme-text-muted text-xs">{t('table.currency')}</div>
                <div className="font-medium text-theme-text">{d.currency || '—'}</div>
              </div>
              <div className="rounded-lg border border-theme-border bg-theme-bg px-3 py-2">
                <div className="text-theme-text-muted text-xs">{t('panel.issuer')}</div>
                <div className="font-medium text-theme-text">{d.company_name || '—'}</div>
              </div>
              <div className="rounded-lg border border-theme-border bg-theme-bg px-3 py-2">
                <div className="text-theme-text-muted text-xs">{t('panel.domicile')}</div>
                <div className="font-medium text-theme-text">{d.domicile || '—'}</div>
              </div>
              <div className="rounded-lg border border-theme-border bg-theme-bg px-3 py-2">
                <div className="text-theme-text-muted text-xs">{t('panel.inception')}</div>
                <div className="font-medium text-theme-text">{d.inception_date || '—'}</div>
              </div>
              <div className="rounded-lg border border-theme-border bg-theme-bg px-3 py-2">
                <div className="text-theme-text-muted text-xs">ISIN</div>
                <div className="font-medium text-theme-text">{d.isin || '—'}</div>
              </div>
              <div className="rounded-lg border border-theme-border bg-theme-bg px-3 py-2">
                <div className="text-theme-text-muted text-xs">{t('panel.aum')}</div>
                <div className="font-medium text-theme-text">{formatAum(d.total_assets)}</div>
              </div>
              <div className="rounded-lg border border-theme-border bg-theme-bg px-3 py-2">
                <div className="text-theme-text-muted text-xs">{t('panel.ter')}</div>
                <div className="font-medium text-theme-text">{fmtPct(d.expense_ratio)}</div>
              </div>
              <div className="rounded-lg border border-theme-border bg-theme-bg px-3 py-2">
                <div className="text-theme-text-muted text-xs">{t('panel.yield')}</div>
                <div className="font-medium text-theme-text">{fmtPct(d.yield_ttm)}</div>
              </div>
              <div className="rounded-lg border border-theme-border bg-theme-bg px-3 py-2">
                <div className="text-theme-text-muted text-xs">{t('panel.holdingsCount')}</div>
                <div className="font-medium text-theme-text">{d.holdings_count ?? '—'}</div>
              </div>
              <div className="rounded-lg border border-theme-border bg-theme-bg px-3 py-2 sm:col-span-2">
                <div className="text-theme-text-muted text-xs">{t('panel.morningstar')}</div>
                <div className="font-medium text-theme-text flex items-center gap-2">{msStars}</div>
                {d.morningstar_category_benchmark && (
                  <div className="text-xs text-theme-text-muted mt-1">{d.morningstar_category_benchmark}</div>
                )}
              </div>
            </div>
          </section>

          {sectorChartData.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-theme-text mb-4">{t('panel.sectors')}</h3>
              <div className="h-64 w-full rounded-xl border border-theme-border bg-theme-bg/50 p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sectorChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={false}>
                      {sectorChartData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => `${v?.toFixed?.(2) ?? v}%`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {regionChartData.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-theme-text mb-4">{t('panel.regions')}</h3>
              <div className="h-64 w-full rounded-xl border border-theme-border bg-theme-bg/50 p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={regionChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={false}>
                      {regionChartData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[(i + 3) % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => `${v?.toFixed?.(2) ?? v}%`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {sortedHoldings.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-theme-text mb-4">{t('panel.topHoldings')}</h3>
              <div className="overflow-x-auto rounded-xl border border-theme-border">
                <table className="w-full text-sm text-left">
                  <thead className="bg-theme-bg text-theme-text-muted">
                    <tr>
                      <th className="px-3 py-2">#</th>
                      <th className="px-3 py-2">{t('panel.holdingName')}</th>
                      <th className="px-3 py-2">{t('panel.holdingSector')}</th>
                      <th className="px-3 py-2 text-right">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-border">
                    {sortedHoldings.map((h) => (
                      <tr key={h.rank}>
                        <td className="px-3 py-2 text-theme-text-muted">{h.rank}</td>
                        <td className="px-3 py-2">
                          <div className="font-medium text-theme-text">{h.name || h.code || '—'}</div>
                          {h.code && <div className="text-xs text-theme-text-muted">{h.code}</div>}
                        </td>
                        <td className="px-3 py-2 text-theme-text-muted">{h.sector || '—'}</td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {h.assets_pct != null ? `${h.assets_pct.toFixed(2)}%` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3 flex justify-between gap-4">
      <dt className="text-sm font-medium text-theme-text-muted">{label}</dt>
      <dd className="text-sm font-semibold text-theme-text tabular-nums">{value}</dd>
    </div>
  );
}
