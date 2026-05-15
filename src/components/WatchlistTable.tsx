import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import type { EtfRow } from '../types/etf';
import { getFriendlyCategory } from '../lib/categoryMap';
import { classifyAum, classifyCost } from '../lib/etfFilters';

const PAGE_SIZE_OPTIONS = [20, 50, 100, 200] as const;
export type PageSizeOptionWatch = (typeof PAGE_SIZE_OPTIONS)[number];

interface WatchlistTableProps {
  rows: EtfRow[];
  /** Total ETFs in watchlist (after any future filters). */
  totalCount: number;
  compact: boolean;
  pageSize: PageSizeOptionWatch;
  pageIndex: number;
  onPageSizeChange: (n: PageSizeOptionWatch) => void;
  onPageIndexChange: (i: number) => void;
  onRowClick: (etf: EtfRow) => void;
  /** Remove ETF from watchlist; event for stopPropagation. */
  onRemoveFromWatchlist: (etfId: string, event: React.MouseEvent) => void;
}

export default function WatchlistTable({
  rows,
  totalCount,
  compact,
  pageSize,
  pageIndex,
  onPageSizeChange,
  onPageIndexChange,
  onRowClick,
  onRemoveFromWatchlist,
}: WatchlistTableProps) {
  const { t, i18n } = useTranslation();
  const langUi: 'pl' | 'en' = i18n.language?.startsWith('pl') ? 'pl' : 'en';

  const gx = compact
    ? {
        thWide: 'py-2 px-3 text-[13px] tracking-wide',
        thNarrow: 'py-2 px-2 text-[13px] tracking-wide',
        tdWide: 'py-2 px-3 text-[13px] leading-snug',
        tdCurrency: 'py-2 px-2 text-[13px] font-medium text-theme-text-muted whitespace-nowrap',
        tdAumTer: 'py-2 px-2 text-[13px] text-right text-theme-text max-w-[13rem]',
        tdStars: 'py-2 px-2 text-[13px] text-center',
        emptyRow: 'py-4 text-[13px]',
        hdrGap: 'gap-1',
        nameSub: 'text-[13px]',
        badge: 'px-1.5 py-px rounded-full text-[13px] font-medium',
        pagerBar: 'gap-2 px-3 py-2',
        pagerControls: 'gap-2',
        pagerText: 'text-xs',
        pagerLabel: 'text-xs gap-1.5',
        pagerSelect:
          'rounded-lg border border-theme-border bg-theme-surface text-theme-text text-xs py-1 pl-2 pr-7 focus:outline-none focus:ring-2 focus:ring-teal-600',
        pagerBtn: 'p-1.5',
        pagerChevron: 'w-3 h-3',
        actionBtn: 'p-1.5 rounded-md hover:bg-theme-bg text-theme-text-muted hover:text-rose-600',
      }
    : {
        thWide: 'py-4 px-6 text-sm tracking-wider',
        thNarrow: 'py-4 px-4 text-sm tracking-wider',
        tdWide: 'py-4 px-6',
        tdCurrency: 'py-4 px-4 text-base font-medium text-theme-text-muted whitespace-nowrap',
        tdAumTer: 'py-4 px-4 text-base text-right text-theme-text max-w-[13rem]',
        tdStars: 'py-4 px-4 text-base text-center',
        emptyRow: 'py-8',
        hdrGap: 'gap-1.5',
        nameSub: 'text-sm',
        badge: 'px-2.5 py-0.5 rounded-full text-sm font-medium',
        pagerBar: 'gap-3 px-4 py-3',
        pagerControls: 'gap-3',
        pagerText: 'text-sm',
        pagerLabel: 'text-sm gap-2',
        pagerSelect:
          'rounded-lg border border-theme-border bg-theme-surface text-theme-text text-sm py-1.5 pl-2 pr-8 focus:outline-none focus:ring-2 focus:ring-teal-600',
        pagerBtn: 'p-2',
        pagerChevron: 'w-5 h-5',
        actionBtn: 'p-2 rounded-lg hover:bg-theme-bg text-theme-text-muted hover:text-rose-600',
      };

  const renderReturn = (val: number | null) => {
    if (val === null) return <span className="text-theme-text-muted">-</span>;
    const isPositive = val > 0;
    const isNegative = val < 0;
    const colorClass = isPositive
      ? 'text-theme-return-pos'
      : isNegative
        ? 'text-theme-return-neg'
        : 'text-theme-text';
    return (
      <span className={`font-medium ${colorClass}`}>
        {val > 0 ? '+' : ''}
        {val}%
      </span>
    );
  };

  const formatTer = (n: number | null) => {
    if (n == null || !Number.isFinite(n)) return '—';
    return `${n.toFixed(2)}%`;
  };

  const renderStars = (rating: number | null) => {
    if (rating == null || rating < 1 || rating > 5) return <span className="text-theme-text-muted">—</span>;
    return <span className="text-amber-500 tracking-tight">{'★'.repeat(rating)}</span>;
  };

  const totalPages = totalCount === 0 ? 1 : Math.ceil(totalCount / pageSize);
  const safePage = Math.min(pageIndex, Math.max(0, totalPages - 1));
  const rangeFrom = totalCount === 0 ? 0 : safePage * pageSize + 1;
  const rangeTo = Math.min((safePage + 1) * pageSize, totalCount);

  if (totalCount === 0) {
    return (
      <div className="rounded-xl border border-theme-border bg-theme-surface p-8 text-center text-theme-text-muted">
        <p>{t('watchlist.empty')}</p>
      </div>
    );
  }

  return (
    <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border overflow-hidden">
      <div className="overflow-x-auto scrollbar-x-hide table-h-scroll-touch">
        <table className="w-full text-left border-collapse min-w-[1100px]">
          <thead>
            <tr className="border-b border-theme-border">
              <th className={`bg-theme-surface font-semibold text-theme-text-muted uppercase whitespace-nowrap ${gx.thWide} shadow-[0_1px_0_0_var(--color-theme-border)]`}>
                {t('table.name')}
              </th>
              <th className={`bg-theme-surface shadow-[0_1px_0_0_var(--color-theme-border)] font-semibold text-theme-text-muted uppercase whitespace-nowrap ${gx.thWide}`}>
                {t('table.exposure')}
              </th>
              <th
                className={`bg-theme-surface shadow-[0_1px_0_0_var(--color-theme-border)] font-semibold text-theme-text-muted uppercase whitespace-nowrap text-right ${gx.thWide}`}
              >
                {t('table.w1')}
              </th>
              <th
                className={`bg-theme-surface shadow-[0_1px_0_0_var(--color-theme-border)] font-semibold text-theme-text-muted uppercase whitespace-nowrap text-right ${gx.thWide}`}
              >
                {t('table.m1')}
              </th>
              <th
                className={`bg-theme-surface shadow-[0_1px_0_0_var(--color-theme-border)] font-semibold text-theme-text-muted uppercase whitespace-nowrap text-right ${gx.thWide}`}
              >
                {t('table.q1')}
              </th>
              <th
                className={`bg-theme-surface shadow-[0_1px_0_0_var(--color-theme-border)] font-semibold text-theme-text-muted uppercase whitespace-nowrap text-right ${gx.thWide}`}
              >
                {t('table.y1')}
              </th>
              <th className={`bg-theme-surface shadow-[0_1px_0_0_var(--color-theme-border)] font-semibold text-theme-text-muted uppercase whitespace-nowrap ${gx.thNarrow}`}>
                {t('table.currency')}
              </th>
              <th
                className={`bg-theme-surface shadow-[0_1px_0_0_var(--color-theme-border)] font-semibold text-theme-text-muted uppercase whitespace-nowrap text-right ${gx.thNarrow}`}
              >
                {t('table.aum')}
              </th>
              <th
                className={`bg-theme-surface shadow-[0_1px_0_0_var(--color-theme-border)] font-semibold text-theme-text-muted uppercase whitespace-nowrap text-right ${gx.thNarrow}`}
              >
                {t('table.ter')}
              </th>
              <th
                className={`bg-theme-surface shadow-[0_1px_0_0_var(--color-theme-border)] font-semibold text-theme-text-muted uppercase whitespace-nowrap text-center ${gx.thNarrow}`}
              >
                {t('table.ms')}
              </th>
              <th
                aria-label={t('watchlist.removeAria')}
                className={`bg-theme-surface shadow-[0_1px_0_0_var(--color-theme-border)] font-semibold text-theme-text-muted uppercase whitespace-nowrap text-center ${gx.thNarrow} w-12`}
              />
            </tr>
          </thead>
          <tbody className="divide-y divide-theme-border">
            {rows.map((etf) => (
              <tr
                key={etf.id}
                onClick={() => onRowClick(etf)}
                className="hover:bg-theme-bg/50 transition-colors group cursor-pointer"
              >
                <td className={gx.tdWide}>
                  <div className="flex flex-col">
                    <span className="font-bold text-theme-text">{etf.ticker}</span>
                    <span className={`${gx.nameSub} text-theme-text-muted truncate max-w-[250px]`} title={etf.name}>
                      {etf.name}
                    </span>
                  </div>
                </td>
                <td className={gx.tdWide}>
                  <span
                    className={`inline-flex items-center bg-theme-badge-bg text-theme-badge-text border border-theme-badge-border ${gx.badge}`}
                  >
                    {getFriendlyCategory(etf.category, langUi, etf.name)}
                  </span>
                </td>
                <td className={`${gx.tdWide} text-right`}>{renderReturn(etf.return_1w)}</td>
                <td className={`${gx.tdWide} text-right`}>{renderReturn(etf.return_1m)}</td>
                <td className={`${gx.tdWide} text-right`}>{renderReturn(etf.return_1q)}</td>
                <td className={`${gx.tdWide} text-right`}>{renderReturn(etf.return_1y)}</td>
                <td className={gx.tdCurrency}>{etf.currency || '—'}</td>
                <td className={gx.tdAumTer} title={etf.total_assets != null ? String(etf.total_assets) : undefined}>
                  {(() => {
                    const b = classifyAum(etf.total_assets);
                    if (!b) return <span className="tabular-nums text-theme-text-muted">—</span>;
                    return (
                      <span className="inline-block max-w-full truncate align-bottom tabular-nums">
                        {t(`table.sizeTier.${b}`)}
                      </span>
                    );
                  })()}
                </td>
                <td className={gx.tdAumTer} title={etf.expense_ratio != null ? formatTer(etf.expense_ratio) : undefined}>
                  {(() => {
                    const b = classifyCost(etf.expense_ratio);
                    if (!b) return <span className="tabular-nums text-theme-text-muted">—</span>;
                    return (
                      <span className="inline-block max-w-full truncate align-bottom tabular-nums">
                        {t(`table.costTier.${b}`)}
                      </span>
                    );
                  })()}
                </td>
                <td className={gx.tdStars}>{renderStars(etf.morningstar_rating ?? null)}</td>
                <td className={`${gx.tdStars} align-middle`}>
                  <button
                    type="button"
                    aria-label={`${etf.ticker}: ${t('watchlist.removeAria')}`}
                    title={t('watchlist.removeAria')}
                    className={gx.actionBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFromWatchlist(etf.id, e);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div
        className={`flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-theme-border bg-theme-bg/30 ${gx.pagerBar}`}
      >
        <p className={`${gx.pagerText} text-theme-text-muted order-2 sm:order-1`}>
          {t('table.showingRange', { from: rangeFrom, to: rangeTo, total: totalCount })}
          <span className="hidden sm:inline"> · </span>
          <span className="block sm:inline">{t('table.pageOf', { current: safePage + 1, total: totalPages })}</span>
        </p>
        <div className={`flex flex-wrap items-center order-1 sm:order-2 sm:justify-end ${gx.pagerControls}`}>
          <label className={`flex items-center text-theme-text-muted whitespace-nowrap ${gx.pagerLabel}`}>
            <span>{t('table.rowsPerPage')}</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const v = Number(e.target.value) as PageSizeOptionWatch;
                if (PAGE_SIZE_OPTIONS.includes(v)) {
                  onPageSizeChange(v);
                  onPageIndexChange(0);
                }
              }}
              className={gx.pagerSelect}
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label={t('table.prevPage')}
              disabled={safePage <= 0}
              onClick={() => onPageIndexChange(Math.max(0, safePage - 1))}
              className={`${gx.pagerBtn} rounded-lg border border-theme-border bg-theme-surface text-theme-text hover:bg-theme-bg disabled:opacity-40 disabled:pointer-events-none transition-colors`}
            >
              <ChevronLeft className={gx.pagerChevron} />
            </button>
            <button
              type="button"
              aria-label={t('table.nextPage')}
              disabled={safePage >= totalPages - 1 || totalCount === 0}
              onClick={() => onPageIndexChange(Math.min(totalPages - 1, safePage + 1))}
              className={`${gx.pagerBtn} rounded-lg border border-theme-border bg-theme-surface text-theme-text hover:bg-theme-bg disabled:opacity-40 disabled:pointer-events-none transition-colors`}
            >
              <ChevronRight className={gx.pagerChevron} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
