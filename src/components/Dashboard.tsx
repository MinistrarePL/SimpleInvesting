import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Moon,
  Sun,
  Globe,
  Search,
  User,
  LogOut,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Info,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import '../i18n/config'; // Inicjalizacja i18n
import EtfSidePanel from './EtfSidePanel';
import FiltersSidePanel from './FiltersSidePanel';
import AuthModal, { supabase } from './AuthModal';
import type { EtfRow } from '../types/etf';
import { getFriendlyCategory } from '../lib/categoryMap';
import { applyFilters, createEmptyFilters, type ActiveFilters } from '../lib/etfFilters';

type SortKey =
  | 'ticker'
  | 'category'
  | 'currency'
  | 'total_assets'
  | 'expense_ratio'
  | 'morningstar_rating'
  | 'return_1w'
  | 'return_1m'
  | 'return_1q'
  | 'return_1y';
type SortDir = 'asc' | 'desc';

/** Klucze mapujące na `table.*` i `table.info.*` w i18n */
type TableInfoColumnKey =
  | 'name'
  | 'exposure'
  | 'currency'
  | 'aum'
  | 'ter'
  | 'ms'
  | 'w1'
  | 'm1'
  | 'q1'
  | 'y1';

const PAGE_SIZE_OPTIONS = [20, 50, 100, 200] as const;
type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];

interface DashboardProps {
  initialEtfs: EtfRow[];
}

export default function Dashboard({ initialEtfs }: DashboardProps) {
  const { t, i18n } = useTranslation();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // Stan dla ETF-ów (pozwala na dodawanie nowych do tabeli bez odświeżania)
  const [etfs, setEtfs] = useState<EtfRow[]>(initialEtfs);

  // Stan dla wyszukiwarki (filtrowanie tabeli)
  const [searchQuery, setSearchQuery] = useState('');

  // Stan sortowania tabeli
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const [pageSize, setPageSize] = useState<PageSizeOption>(100);
  const [pageIndex, setPageIndex] = useState(0);

  // Stan dla bocznego panelu
  const [selectedEtf, setSelectedEtf] = useState<EtfRow | null>(null);

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<ActiveFilters>(() => createEmptyFilters());

  const [infoColumn, setInfoColumn] = useState<TableInfoColumnKey | null>(null);

  // Stan autoryzacji
  const [session, setSession] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'register' | 'reset' | 'update_password'>('login');

  // Nasłuchiwanie na zmiany stanu logowania w Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      
      // Automatyczne wykrycie, że użytkownik kliknął w link do resetu hasła
      if (event === 'PASSWORD_RECOVERY') {
        setAuthView('update_password');
        setIsAuthModalOpen(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!infoColumn) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setInfoColumn(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [infoColumn]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Filtrowanie ETF-ów na podstawie wpisanego tekstu + zaawansowanych filtrów
  const filteredEtfs = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const text = etfs.filter((etf) =>
      etf.ticker.toLowerCase().includes(query) ||
      etf.name.toLowerCase().includes(query) ||
      (etf.category && etf.category.toLowerCase().includes(query)) ||
      (etf.currency && etf.currency.toLowerCase().includes(query))
    );
    const filtered = applyFilters(text, filters);

    if (!sortKey) return filtered;

    return [...filtered].sort((a, b) => {
      let valA: string | number | null;
      let valB: string | number | null;

      if (sortKey === 'ticker') {
        valA = a.ticker.toLowerCase();
        valB = b.ticker.toLowerCase();
      } else if (sortKey === 'category') {
        valA = (a.category || '').toLowerCase();
        valB = (b.category || '').toLowerCase();
      } else if (sortKey === 'currency') {
        valA = (a.currency || '').toLowerCase();
        valB = (b.currency || '').toLowerCase();
      } else {
        valA = a[sortKey] as number | null;
        valB = b[sortKey] as number | null;
      }

      if (valA == null && valB == null) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;

      let cmp: number;
      if (typeof valA === 'string' && typeof valB === 'string') {
        cmp = valA.localeCompare(valB);
      } else {
        cmp = (valA as number) - (valB as number);
      }

      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [etfs, searchQuery, sortKey, sortDir, filters]);

  const filteredCount = filteredEtfs.length;
  const totalPages = filteredCount === 0 ? 1 : Math.ceil(filteredCount / pageSize);

  useEffect(() => {
    setPageIndex((i) => Math.min(i, Math.max(0, totalPages - 1)));
  }, [totalPages]);

  useEffect(() => {
    setPageIndex(0);
  }, [searchQuery, sortKey, sortDir, filters]);

  const paginatedEtfs = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredEtfs.slice(start, start + pageSize);
  }, [filteredEtfs, pageIndex, pageSize]);

  const rangeFrom = filteredCount === 0 ? 0 : pageIndex * pageSize + 1;
  const rangeTo = filteredCount === 0 ? 0 : Math.min(filteredCount, (pageIndex + 1) * pageSize);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      if (sortDir === 'asc') {
        setSortDir('desc');
      } else {
        setSortKey(null);
        setSortDir('asc');
      }
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ChevronsUpDown className="w-3.5 h-3.5 opacity-40" />;
    if (sortDir === 'asc') return <ChevronUp className="w-3.5 h-3.5" />;
    return <ChevronDown className="w-3.5 h-3.5" />;
  };

  const ColumnInfoBtn = ({ col }: { col: TableInfoColumnKey }) => (
    <button
      type="button"
      className="p-0.5 rounded text-theme-text-muted hover:text-theme-primary transition-colors shrink-0"
      aria-label={`${t('table.infoAria')} ${t(`table.${col}`)}`}
      onClick={(e) => {
        e.stopPropagation();
        setInfoColumn(col);
      }}
    >
      <Info className="w-3.5 h-3.5" strokeWidth={2} />
    </button>
  );

  // Inicjalizacja motywu na podstawie localStorage lub preferencji systemowych
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'pl' ? 'en' : 'pl';
    i18n.changeLanguage(newLang);
    try { localStorage.setItem('si.lang', newLang); } catch (e) {}
    window.dispatchEvent(new CustomEvent('si:lang-change', { detail: newLang }));
  };

  // Funkcja pomocnicza do formatowania stóp zwrotu z kolorami
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
        {val > 0 ? '+' : ''}{val}%
      </span>
    );
  };

  const formatAum = (n: number | null) => {
    if (n == null || !Number.isFinite(n)) return '—';
    if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
    if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
    return String(Math.round(n));
  };

  const formatTer = (n: number | null) => {
    if (n == null || !Number.isFinite(n)) return '—';
    return `${n.toFixed(2)}%`;
  };

  const renderStars = (rating: number | null) => {
    if (rating == null || rating < 1 || rating > 5) return <span className="text-theme-text-muted">—</span>;
    return <span className="text-amber-500 tracking-tight">{'★'.repeat(rating)}</span>;
  };

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text transition-colors duration-300">
      {/* Header */}
      <header className="border-b border-theme-border bg-theme-surface sticky top-0 z-10">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img 
              src={theme === 'dark' ? '/logo_dark.svg' : '/logo_light.svg'} 
              alt="SimpleInvesting Logo" 
              className="h-8 w-auto" 
            />
          </div>

          {/* Kontrolki (Język, Motyw, Logowanie) */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            <button 
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-theme-bg transition-colors text-sm font-medium"
              title="Zmień język / Change language"
            >
              <Globe className="w-4 h-4 text-theme-primary" />
              <span className="uppercase">{i18n.language}</span>
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-md hover:bg-theme-bg transition-colors text-theme-primary"
              title={theme === 'light' ? t('theme.dark') : t('theme.light')}
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            <div className="w-px h-6 bg-theme-border mx-1 hidden sm:block"></div>

            {/* Przycisk Logowania / Profilu (Skrajnie po prawej) */}
            {session ? (
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-theme-bg transition-colors text-base font-medium text-theme-text-muted hover:text-red-500"
                title={t('auth.logout')}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{t('auth.logout')}</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setAuthView('login');
                  setIsAuthModalOpen(true);
                }}
                className="btn-secondary"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">{t('auth.loginRegisterBtn')}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Główna zawartość - Tabela */}
      <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Wyszukiwarka + Filtry */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3 sm:items-stretch">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-theme-text-muted" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 border border-theme-border rounded-xl leading-5 bg-theme-surface text-theme-text placeholder-theme-text-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary sm:text-sm transition-colors"
              placeholder={t('search.placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={() => setIsFiltersOpen(true)}
            className="btn-primary shrink-0"
            aria-haspopup="dialog"
            aria-expanded={isFiltersOpen}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>{t('filters.openBtn')}</span>
          </button>
        </div>

        <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border overflow-hidden">
          <div className="overflow-x-auto scrollbar-theme">
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead>
                <tr className="border-b border-theme-border bg-theme-bg/50">
                  <th
                    className="py-4 px-6 font-semibold text-sm text-theme-text-muted uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:text-theme-text transition-colors"
                    onClick={() => handleSort('ticker')}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {t('table.name')}
                      <SortIcon column="ticker" />
                      <ColumnInfoBtn col="name" />
                    </span>
                  </th>
                  <th
                    className="py-4 px-6 font-semibold text-sm text-theme-text-muted uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:text-theme-text transition-colors"
                    onClick={() => handleSort('category')}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {t('table.exposure')}
                      <SortIcon column="category" />
                      <ColumnInfoBtn col="exposure" />
                    </span>
                  </th>
                  <th
                    className="py-4 px-6 font-semibold text-sm text-theme-text-muted uppercase tracking-wider whitespace-nowrap text-right cursor-pointer select-none hover:text-theme-text transition-colors"
                    onClick={() => handleSort('return_1w')}
                  >
                    <span className="inline-flex items-center justify-end gap-1.5">
                      {t('table.w1')}
                      <SortIcon column="return_1w" />
                      <ColumnInfoBtn col="w1" />
                    </span>
                  </th>
                  <th
                    className="py-4 px-6 font-semibold text-sm text-theme-text-muted uppercase tracking-wider whitespace-nowrap text-right cursor-pointer select-none hover:text-theme-text transition-colors"
                    onClick={() => handleSort('return_1m')}
                  >
                    <span className="inline-flex items-center justify-end gap-1.5">
                      {t('table.m1')}
                      <SortIcon column="return_1m" />
                      <ColumnInfoBtn col="m1" />
                    </span>
                  </th>
                  <th
                    className="py-4 px-6 font-semibold text-sm text-theme-text-muted uppercase tracking-wider whitespace-nowrap text-right cursor-pointer select-none hover:text-theme-text transition-colors"
                    onClick={() => handleSort('return_1q')}
                  >
                    <span className="inline-flex items-center justify-end gap-1.5">
                      {t('table.q1')}
                      <SortIcon column="return_1q" />
                      <ColumnInfoBtn col="q1" />
                    </span>
                  </th>
                  <th
                    className="py-4 px-6 font-semibold text-sm text-theme-text-muted uppercase tracking-wider whitespace-nowrap text-right cursor-pointer select-none hover:text-theme-text transition-colors"
                    onClick={() => handleSort('return_1y')}
                  >
                    <span className="inline-flex items-center justify-end gap-1.5">
                      {t('table.y1')}
                      <SortIcon column="return_1y" />
                      <ColumnInfoBtn col="y1" />
                    </span>
                  </th>
                  <th
                    className="py-4 px-4 font-semibold text-sm text-theme-text-muted uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:text-theme-text transition-colors"
                    onClick={() => handleSort('currency')}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {t('table.currency')}
                      <SortIcon column="currency" />
                      <ColumnInfoBtn col="currency" />
                    </span>
                  </th>
                  <th
                    className="py-4 px-4 font-semibold text-sm text-theme-text-muted uppercase tracking-wider whitespace-nowrap text-right cursor-pointer select-none hover:text-theme-text transition-colors"
                    onClick={() => handleSort('total_assets')}
                  >
                    <span className="inline-flex items-center justify-end gap-1.5">
                      {t('table.aum')}
                      <SortIcon column="total_assets" />
                      <ColumnInfoBtn col="aum" />
                    </span>
                  </th>
                  <th
                    className="py-4 px-4 font-semibold text-sm text-theme-text-muted uppercase tracking-wider whitespace-nowrap text-right cursor-pointer select-none hover:text-theme-text transition-colors"
                    onClick={() => handleSort('expense_ratio')}
                  >
                    <span className="inline-flex items-center justify-end gap-1.5">
                      {t('table.ter')}
                      <SortIcon column="expense_ratio" />
                      <ColumnInfoBtn col="ter" />
                    </span>
                  </th>
                  <th
                    className="py-4 px-4 font-semibold text-sm text-theme-text-muted uppercase tracking-wider whitespace-nowrap text-center cursor-pointer select-none hover:text-theme-text transition-colors"
                    onClick={() => handleSort('morningstar_rating')}
                  >
                    <span className="inline-flex items-center justify-center gap-1.5">
                      {t('table.ms')}
                      <SortIcon column="morningstar_rating" />
                      <ColumnInfoBtn col="ms" />
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border">
                {filteredCount === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-theme-text-muted">
                      {t('table.noData')}
                    </td>
                  </tr>
                ) : (
                  paginatedEtfs.map((etf) => (
                    <tr 
                      key={etf.id} 
                      onClick={() => setSelectedEtf(etf)}
                      className="hover:bg-theme-bg/50 transition-colors group cursor-pointer"
                    >
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-theme-text">{etf.ticker}</span>
                          <span className="text-sm text-theme-text-muted truncate max-w-[250px]" title={etf.name}>
                            {etf.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-theme-badge-bg text-theme-badge-text border border-theme-badge-border">
                          {getFriendlyCategory(etf.category, i18n.language as 'pl' | 'en', etf.name)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        {renderReturn(etf.return_1w)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {renderReturn(etf.return_1m)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {renderReturn(etf.return_1q)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {renderReturn(etf.return_1y)}
                      </td>
                      <td className="py-4 px-4 text-sm font-medium text-theme-text-muted whitespace-nowrap">
                        {etf.currency || '—'}
                      </td>
                      <td className="py-4 px-4 text-sm text-right text-theme-text tabular-nums">
                        {formatAum(etf.total_assets)}
                      </td>
                      <td className="py-4 px-4 text-sm text-right text-theme-text tabular-nums">
                        {formatTer(etf.expense_ratio)}
                      </td>
                      <td className="py-4 px-4 text-sm text-center">
                        {renderStars(etf.morningstar_rating)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-theme-border px-4 py-3 bg-theme-bg/30">
            <p className="text-sm text-theme-text-muted order-2 sm:order-1">
              {t('table.showingRange', { from: rangeFrom, to: rangeTo, total: filteredCount })}
              <span className="hidden sm:inline"> · </span>
              <span className="block sm:inline">{t('table.pageOf', { current: pageIndex + 1, total: totalPages })}</span>
            </p>
            <div className="flex flex-wrap items-center gap-3 order-1 sm:order-2 sm:justify-end">
              <label className="flex items-center gap-2 text-sm text-theme-text-muted whitespace-nowrap">
                <span>{t('table.rowsPerPage')}</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    const v = Number(e.target.value) as PageSizeOption;
                    if (PAGE_SIZE_OPTIONS.includes(v)) {
                      setPageSize(v);
                      setPageIndex(0);
                    }
                  }}
                  className="rounded-lg border border-theme-border bg-theme-surface text-theme-text text-sm py-1.5 pl-2 pr-8 focus:outline-none focus:ring-2 focus:ring-theme-primary"
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
                  disabled={pageIndex <= 0}
                  onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
                  className="p-2 rounded-lg border border-theme-border bg-theme-surface text-theme-text hover:bg-theme-bg disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  aria-label={t('table.nextPage')}
                  disabled={pageIndex >= totalPages - 1 || filteredCount === 0}
                  onClick={() => setPageIndex((i) => Math.min(totalPages - 1, i + 1))}
                  className="p-2 rounded-lg border border-theme-border bg-theme-surface text-theme-text hover:bg-theme-bg disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Wyjaśnienia nagłówków tabeli */}
      {infoColumn && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm border-0 cursor-default"
            aria-label={t('panel.close')}
            onClick={() => setInfoColumn(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="column-info-title"
            className="relative z-[1] max-w-md w-full rounded-xl border border-theme-border bg-theme-surface p-5 shadow-2xl text-theme-text text-left"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute top-3 right-3 p-2 rounded-lg text-theme-text-muted hover:text-theme-text hover:bg-theme-bg transition-colors"
              aria-label={t('panel.close')}
              onClick={() => setInfoColumn(null)}
            >
              <X className="w-5 h-5" />
            </button>
            <h3 id="column-info-title" className="font-bold text-lg pr-10 mb-3 text-theme-text">
              {t(`table.${infoColumn}`)}
            </h3>
            <p className="text-sm leading-relaxed text-theme-text-muted">{t(`table.info.${infoColumn}`)}</p>
          </div>
        </div>
      )}

      {/* Boczny panel ze szczegółami ETF */}
      <EtfSidePanel 
        isOpen={!!selectedEtf} 
        onClose={() => setSelectedEtf(null)} 
        etf={selectedEtf} 
      />

      {/* Boczny panel filtrów */}
      <FiltersSidePanel
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        filters={filters}
        onChange={setFilters}
        etfs={etfs}
        filteredCount={filteredCount}
      />

      {/* Modal logowania / rejestracji */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        initialView={authView}
      />
    </div>
  );
}
