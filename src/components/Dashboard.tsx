import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
  Moon,
  Sun,
  Globe,
  Search,
  User,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Info,
  X,
  SlidersHorizontal,
  Shrink,
  Expand,
} from 'lucide-react';
import '../i18n/config'; // Inicjalizacja i18n
import EtfSidePanel from './EtfSidePanel';
import FiltersSidePanel from './FiltersSidePanel';
import AuthModal, { supabase } from './AuthModal';
import AccountSettingsPanel from './AccountSettingsPanel';
import UserMenu from './UserMenu';
import HoverTooltip from './HoverTooltip';
import { useIsMdBreakpointUp, useShowHoverPortalTooltips } from '../lib/pointerPreference';
import type { EtfRow } from '../types/etf';
import { getFriendlyCategory } from '../lib/categoryMap';
import { applyFilters, classifyAum, classifyCost, createEmptyFilters, exposureKeyLabel, type ActiveFilters } from '../lib/etfFilters';

function removeFromSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  next.delete(value);
  return next;
}

/** Natywny `title` na komórkach tabel często nie pojawia się od razu (opóźnienie przeglądarki); podpowiedź w portalu + `fixed` omija przycinanie przy `overflow`. */
function PreciseHoverTip({
  tooltip,
  className,
  children,
}: {
  tooltip: string;
  className?: string;
  children: React.ReactNode;
}) {
  const showPortal = useShowHoverPortalTooltips();
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  const reposition = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setCoords({ top: rect.bottom + 8, left: rect.left + rect.width / 2 });
  }, []);

  useLayoutEffect(() => {
    if (!showPortal || !open) {
      setCoords(null);
      return;
    }
    reposition();
    const id = requestAnimationFrame(reposition);
    return () => cancelAnimationFrame(id);
  }, [showPortal, open, reposition]);

  useEffect(() => {
    if (!showPortal || !open) return;
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [showPortal, open, reposition]);

  if (!showPortal) {
    return <span className={className ?? ''}>{children}</span>;
  }

  return (
    <>
      <span
        ref={anchorRef}
        className={className ?? ''}
        tabIndex={0}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={(e) => {
          const nextFocus = e.relatedTarget as Node | null;
          if (nextFocus && anchorRef.current?.contains(nextFocus)) return;
          setOpen(false);
        }}
      >
        {children}
      </span>
      {typeof document !== 'undefined' &&
        open &&
        coords &&
        createPortal(
          <span
            role="tooltip"
            className="pointer-events-none fixed z-[220] whitespace-nowrap rounded-md border border-theme-border bg-theme-surface px-2.5 py-1 text-xs font-medium tabular-nums text-theme-text shadow-lg"
            style={{ top: coords.top, left: coords.left, transform: 'translateX(-50%)' }}
          >
            {tooltip}
          </span>,
          document.body,
        )}
    </>
  );
}

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

const GRID_DENSITY_KEY = 'si.grid-density';
/** Deprecated: był zapisywany w localStorage; czyszczone przy migracji na RDW. */
const GRID_DENSITY_LS_OVERRIDE_KEY = 'si.grid-density-override';
/** Ręczny wybór tylko do końca sesji zakładki — nie „przykleja” comfort z większego monitora na laptopie. */
const GRID_DENSITY_SESSION_OVERRIDE_KEY = 'si.grid-density-session-override';
/** Szerokość viewportu ≥ tej wartości ⇒ tryb comfort (auto). Poniżej ⇒ compact. */
const GRID_COMFORT_MIN_WIDTH_PX = 1536;
/** Licznik otwarć panelu szczegółów ETF dla niezalogowanych (bez konta). */
const ETF_DETAIL_OPEN_COUNT_KEY = 'si.etf-detail-open-count';
const ETF_DETAIL_OPEN_LIMIT = 3;

function readEtfDetailOpenCount(): number {
  try {
    const v = localStorage.getItem(ETF_DETAIL_OPEN_COUNT_KEY);
    if (v == null) return 0;
    const n = parseInt(v, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

function writeEtfDetailOpenCount(n: number) {
  try {
    localStorage.setItem(ETF_DETAIL_OPEN_COUNT_KEY, String(n));
  } catch {
    /* ignore */
  }
}

type GridDensity = 'comfort' | 'compact';

interface DashboardProps {
  initialEtfs: EtfRow[];
}

export default function Dashboard({ initialEtfs }: DashboardProps) {
  const { t, i18n } = useTranslation();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [viewportGridDensity, setViewportGridDensity] = useState<GridDensity>(() =>
    typeof window !== 'undefined' &&
    window.matchMedia(`(min-width: ${GRID_COMFORT_MIN_WIDTH_PX}px)`).matches
      ? 'comfort'
      : 'compact',
  );
  const [gridDensityOverride, setGridDensityOverride] = useState<GridDensity | null>(() => {
    try {
      const s = sessionStorage.getItem(GRID_DENSITY_SESSION_OVERRIDE_KEY);
      if (s === 'compact' || s === 'comfort') return s;
    } catch {
      /* ignore */
    }
    return null;
  });

  const isMdUp = useIsMdBreakpointUp();
  const gridDensity: GridDensity = !isMdUp ? 'compact' : (gridDensityOverride ?? viewportGridDensity);
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
  const [authHeaderNotice, setAuthHeaderNotice] = useState<string | undefined>(undefined);
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false);
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
        setAuthHeaderNotice(undefined);
        setIsAuthModalOpen(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  /** Otwarcie kart szczegółów ETF dla gościa: po przekroczeniu limitu wymuszamy modal logowania. */
  const handleEtfRowClick = useCallback(
    (etf: EtfRow) => {
      if (session) {
        setSelectedEtf(etf);
        return;
      }
      const count = readEtfDetailOpenCount();
      if (count >= ETF_DETAIL_OPEN_LIMIT) {
        setAuthView('login');
        setAuthHeaderNotice(t('panel.viewLimitReached'));
        setIsAuthModalOpen(true);
        return;
      }
      writeEtfDetailOpenCount(count + 1);
      setSelectedEtf(etf);
    },
    [session, t],
  );

  /** Stare klucze w localStorage blokowały RDW (np. comfort z dużego ekranu na laptopie). */
  useEffect(() => {
    try {
      localStorage.removeItem(GRID_DENSITY_KEY);
      localStorage.removeItem(GRID_DENSITY_LS_OVERRIDE_KEY);
    } catch {
      /* ignore */
    }
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

  const langUi: 'pl' | 'en' = i18n.language?.startsWith('pl') ? 'pl' : 'en';

  type ActiveFilterChip = { key: string; label: string; onRemove: () => void };

  const activeFilterChips: ActiveFilterChip[] = useMemo(() => {
    const out: ActiveFilterChip[] = [];

    if (filters.returnMin != null) {
      const th = filters.returnMin;
      const labelSuffix =
        th === 0 ? 'gt0' : th === 5 ? 'gt5' : th === 10 ? 'gt10' : 'gt20';
      out.push({
        key: `return:${th}`,
        label: `${t('filters.return.title')}: ${t(`filters.return.${labelSuffix}`)}`,
        onRemove: () => setFilters((f) => ({ ...f, returnMin: null })),
      });
    }

    for (const expKey of filters.categories) {
      out.push({
        key: `exp:${expKey}`,
        label: `${t('filters.category.title')}: ${exposureKeyLabel(expKey, langUi)}`,
        onRemove: () => setFilters((f) => ({ ...f, categories: removeFromSet(f.categories, expKey) })),
      });
    }

    for (const issuer of filters.issuers) {
      out.push({
        key: `issuer:${issuer}`,
        label: `${t('filters.issuer.title')}: ${issuer}`,
        onRemove: () => setFilters((f) => ({ ...f, issuers: removeFromSet(f.issuers, issuer) })),
      });
    }

    for (const n of filters.msStars) {
      out.push({
        key: `ms:${n}`,
        label: `${t('filters.morningstar.title')}: ${'★'.repeat(n)}`,
        onRemove: () =>
          setFilters((f) => ({ ...f, msStars: removeFromSet(f.msStars, n as 1 | 2 | 3 | 4 | 5) })),
      });
    }

    for (const cur of filters.currencies) {
      out.push({
        key: `cur:${cur}`,
        label: `${t('filters.currency.title')}: ${cur}`,
        onRemove: () => setFilters((f) => ({ ...f, currencies: removeFromSet(f.currencies, cur) })),
      });
    }

    if (filters.showLeveraged != null) {
      out.push({
        key: `lev:${filters.showLeveraged}`,
        label: `${t('filters.leverage.title')}: ${filters.showLeveraged ? t('filters.leverage.yes') : t('filters.leverage.no')}`,
        onRemove: () => setFilters((f) => ({ ...f, showLeveraged: null })),
      });
    }

    for (const bucket of filters.cost) {
      out.push({
        key: `cost:${bucket}`,
        label: `${t('filters.cost.title')}: ${t(`filters.cost.${bucket}`)}`,
        onRemove: () => setFilters((f) => ({ ...f, cost: removeFromSet(f.cost, bucket) })),
      });
    }

    for (const bucket of filters.risk) {
      out.push({
        key: `risk:${bucket}`,
        label: `${t('filters.risk.title')}: ${t(`filters.risk.${bucket}`)}`,
        onRemove: () => setFilters((f) => ({ ...f, risk: removeFromSet(f.risk, bucket) })),
      });
    }

    for (const bucket of filters.aum) {
      out.push({
        key: `aum:${bucket}`,
        label: `${t('filters.aum.title')}: ${t(`filters.aum.${bucket}`)}`,
        onRemove: () => setFilters((f) => ({ ...f, aum: removeFromSet(f.aum, bucket) })),
      });
    }

    for (const d of filters.domiciles) {
      out.push({
        key: `dom:${d}`,
        label: `${t('filters.domicile.title')}: ${d}`,
        onRemove: () => setFilters((f) => ({ ...f, domiciles: removeFromSet(f.domiciles, d) })),
      });
    }

    if (filters.paysDividend != null) {
      out.push({
        key: `div:${filters.paysDividend}`,
        label: `${t('filters.yield.title')}: ${filters.paysDividend ? t('filters.yield.yes') : t('filters.yield.no')}`,
        onRemove: () => setFilters((f) => ({ ...f, paysDividend: null })),
      });
    }

    for (const bucket of filters.age) {
      out.push({
        key: `age:${bucket}`,
        label: `${t('filters.age.title')}: ${t(`filters.age.${bucket}`)}`,
        onRemove: () => setFilters((f) => ({ ...f, age: removeFromSet(f.age, bucket) })),
      });
    }

    return out;
  }, [filters, langUi, t]);
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

  const tableHScrollRef = useRef<HTMLDivElement>(null);
  const tableTopScrollRef = useRef<HTMLDivElement>(null);
  const isHScrollSync = useRef(false);
  const [hScrollMirrorWidth, setHScrollMirrorWidth] = useState(0);

  useLayoutEffect(() => {
    const bot = tableHScrollRef.current;
    if (!bot) return;

    const update = () => {
      setHScrollMirrorWidth(bot.scrollWidth);
    };

    update();

    const ro = new ResizeObserver(update);
    ro.observe(bot);
    const table = bot.querySelector('table');
    if (table) ro.observe(table);
    window.addEventListener('resize', update);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [paginatedEtfs, filteredCount, pageIndex, pageSize]);

  const onTopTableHScroll = useCallback(() => {
    const bot = tableHScrollRef.current;
    const top = tableTopScrollRef.current;
    if (!bot || !top || isHScrollSync.current) return;
    isHScrollSync.current = true;
    bot.scrollLeft = top.scrollLeft;
    window.requestAnimationFrame(() => {
      isHScrollSync.current = false;
    });
  }, []);

  const onBottomTableHScroll = useCallback(() => {
    const bot = tableHScrollRef.current;
    const top = tableTopScrollRef.current;
    if (!bot || !top || isHScrollSync.current) return;
    isHScrollSync.current = true;
    top.scrollLeft = bot.scrollLeft;
    window.requestAnimationFrame(() => {
      isHScrollSync.current = false;
    });
  }, []);

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

  useLayoutEffect(() => {
    const mq = window.matchMedia(`(min-width: ${GRID_COMFORT_MIN_WIDTH_PX}px)`);
    const sync = () => setViewportGridDensity(mq.matches ? 'comfort' : 'compact');
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
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

  const toggleGridDensity = () => {
    if (!isMdUp) return;
    const effective = gridDensityOverride ?? viewportGridDensity;
    const next: GridDensity = effective === 'comfort' ? 'compact' : 'comfort';
    setGridDensityOverride(next);
    try {
      sessionStorage.setItem(GRID_DENSITY_SESSION_OVERRIDE_KEY, next);
    } catch {
      /* ignore */
    }
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'pl' ? 'en' : 'pl';
    i18n.changeLanguage(newLang);
    try { localStorage.setItem('si.lang', newLang); } catch (e) {}
    window.dispatchEvent(new CustomEvent('si:lang-change', { detail: newLang }));
  };

  const compact = gridDensity === 'compact';
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
          'rounded-lg border border-theme-border bg-theme-surface text-theme-text text-xs py-1 pl-2 pr-7 focus:outline-none focus:ring-2 focus:ring-theme-primary',
        pagerBtn: 'p-1.5',
        pagerChevron: 'w-4 h-4',
        ic: 'w-3 h-3',
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
          'rounded-lg border border-theme-border bg-theme-surface text-theme-text text-sm py-1.5 pl-2 pr-8 focus:outline-none focus:ring-2 focus:ring-theme-primary',
        pagerBtn: 'p-2',
        pagerChevron: 'w-5 h-5',
        ic: 'w-3.5 h-3.5',
      };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ChevronsUpDown className={`${gx.ic} opacity-40`} />;
    if (sortDir === 'asc') return <ChevronUp className={gx.ic} />;
    return <ChevronDown className={gx.ic} />;
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
      <Info className={gx.ic} strokeWidth={2} />
    </button>
  );

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
              className="h-6 w-auto sm:h-8" 
            />
          </div>

          {/* Kontrolki (Język, Motyw, Logowanie) */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            
            <HoverTooltip
              tooltip={
                i18n.language.startsWith('pl') ? t('header.tooltipLangPl') : t('header.tooltipLangEn')
              }
            >
              <button
                type="button"
                onClick={toggleLanguage}
                className="flex items-center gap-1.5 px-2 py-2 rounded-md hover:bg-theme-bg transition-colors text-sm font-medium"
              >
                <Globe className="w-4 h-4 text-theme-primary" />
                <span className="uppercase">{i18n.language}</span>
              </button>
            </HoverTooltip>

            <HoverTooltip
              tooltip={theme === 'light' ? t('header.tooltipThemeLight') : t('header.tooltipThemeDark')}
            >
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-md hover:bg-theme-bg transition-colors text-theme-primary"
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
            </HoverTooltip>

            {isMdUp && (
            <HoverTooltip
              tooltip={
                gridDensity === 'comfort'
                  ? t('header.tooltipGridComfort')
                  : t('header.tooltipGridCompact')
              }
            >
              <button
                type="button"
                onClick={toggleGridDensity}
                className="p-2 rounded-md hover:bg-theme-bg transition-colors text-theme-primary"
                aria-label={
                  gridDensity === 'comfort'
                    ? t('table.densitySwitchCompact')
                    : t('table.densitySwitchComfort')
                }
                aria-pressed={gridDensity === 'compact'}
              >
                {gridDensity === 'comfort' ? (
                  <Shrink className="w-5 h-5" />
                ) : (
                  <Expand className="w-5 h-5" />
                )}
              </button>
            </HoverTooltip>
            )}

            <div className="w-px h-6 bg-theme-border mx-1 hidden sm:block"></div>

            {/* Przycisk Logowania / Profilu (Skrajnie po prawej) */}
            {session ? (
              <>
                <UserMenu
                  session={session}
                  onLogout={handleLogout}
                  onOpenSettings={() => setIsAccountSettingsOpen(true)}
                />
                <AccountSettingsPanel
                  isOpen={isAccountSettingsOpen}
                  onClose={() => setIsAccountSettingsOpen(false)}
                  session={session}
                  onAccountDeleted={() => setSession(null)}
                />
              </>
            ) : (
              <HoverTooltip tooltip={t('auth.loginRegisterBtn')}>
                <button
                  type="button"
                  onClick={() => {
                    setAuthView('login');
                    setAuthHeaderNotice(undefined);
                    setIsAuthModalOpen(true);
                  }}
                  className="btn-secondary"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('auth.loginRegisterBtn')}</span>
                </button>
              </HoverTooltip>
            )}
          </div>
        </div>
      </header>

      {/* Główna zawartość - Tabela */}
      <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Wyszukiwarka + Filtry */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3 sm:items-stretch">
          <div className="relative min-w-0 flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-theme-text-muted" />
            </div>
            <input
              type="text"
              className={`block w-full pl-10 py-3 border border-theme-border rounded-xl leading-5 bg-theme-surface text-theme-text placeholder-theme-text-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary sm:text-sm transition-colors ${searchQuery ? 'pr-10' : 'pr-3'}`}
              placeholder={t('search.placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery !== '' && (
              <HoverTooltip tooltip={t('search.clear')} className="absolute inset-y-0 right-0 flex items-center">
                <button
                  type="button"
                  className="flex h-full items-center pr-3 text-theme-text-muted hover:text-theme-text rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary"
                  onClick={() => setSearchQuery('')}
                  aria-label={t('search.clear')}
                >
                  <X className="h-5 w-5 shrink-0" aria-hidden />
                </button>
              </HoverTooltip>
            )}
          </div>
          <div className="flex w-full justify-end sm:contents">
            <HoverTooltip
              tooltip={session ? t('filters.title') : t('filters.requireAccountForFilters')}
              className="shrink-0 inline-flex"
            >
              <button
                type="button"
                onClick={() => {
                  if (session) {
                    setIsFiltersOpen(true);
                  } else {
                    setAuthView('login');
                    setAuthHeaderNotice(t('filters.requireAccountForFilters'));
                    setIsAuthModalOpen(true);
                  }
                }}
                className="btn-primary shrink-0"
                aria-haspopup="dialog"
                aria-expanded={isFiltersOpen}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>{t('filters.openBtn')}</span>
              </button>
            </HoverTooltip>
          </div>
        </div>

        {activeFilterChips.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2" role="list" aria-label={t('filters.title')}>
            {activeFilterChips.map((chip) => (
              <div
                key={chip.key}
                role="listitem"
                className="inline-flex max-w-full items-center gap-0.5 rounded-full border border-theme-border bg-theme-bg/80 py-1 pl-3 pr-1 text-theme-text shadow-sm"
              >
                <span className="min-w-0 truncate text-sm" title={chip.label}>
                  {chip.label}
                </span>
                <button
                  type="button"
                  onClick={chip.onRemove}
                  className="shrink-0 rounded-full p-1 text-theme-text-muted hover:bg-theme-bg hover:text-theme-text focus:outline-none focus:ring-2 focus:ring-teal-600"
                  aria-label={`${chip.label}: ${t('filters.removeChip')}`}
                >
                  <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border overflow-hidden">
          <div
            ref={tableTopScrollRef}
            onScroll={onTopTableHScroll}
            className="hidden md:block overflow-x-auto scrollbar-thumb-theme border-b border-theme-border bg-theme-surface shrink-0"
          >
            <div
              aria-hidden
              className="h-px pointer-events-none shrink-0"
              style={{ width: Math.max(hScrollMirrorWidth, 1) }}
            />
          </div>
          <div
            ref={tableHScrollRef}
            onScroll={onBottomTableHScroll}
            className="overflow-x-auto scrollbar-x-hide table-h-scroll-touch"
          >
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead>
                <tr className="border-b border-theme-border">
                  <th
                    className={`bg-theme-surface font-semibold text-theme-text-muted uppercase whitespace-nowrap cursor-pointer select-none hover:text-theme-text transition-colors shadow-[0_1px_0_0_var(--color-theme-border)] ${gx.thWide}`}
                    onClick={() => handleSort('ticker')}
                  >
                    <span className={`inline-flex items-center ${gx.hdrGap}`}>
                      {t('table.name')}
                      <SortIcon column="ticker" />
                      <ColumnInfoBtn col="name" />
                    </span>
                  </th>
                  <th
                    className={`bg-theme-surface shadow-[0_1px_0_0_var(--color-theme-border)] font-semibold text-theme-text-muted uppercase whitespace-nowrap cursor-pointer select-none hover:text-theme-text transition-colors ${gx.thWide}`}
                    onClick={() => handleSort('category')}
                  >
                    <span className={`inline-flex items-center ${gx.hdrGap}`}>
                      {t('table.exposure')}
                      <SortIcon column="category" />
                      <ColumnInfoBtn col="exposure" />
                    </span>
                  </th>
                  <th
                    className={`bg-theme-surface shadow-[0_1px_0_0_var(--color-theme-border)] font-semibold text-theme-text-muted uppercase whitespace-nowrap text-right cursor-pointer select-none hover:text-theme-text transition-colors ${gx.thWide}`}
                    onClick={() => handleSort('return_1w')}
                  >
                    <span className={`inline-flex items-center justify-end ${gx.hdrGap}`}>
                      {t('table.w1')}
                      <SortIcon column="return_1w" />
                      <ColumnInfoBtn col="w1" />
                    </span>
                  </th>
                  <th
                    className={`bg-theme-surface shadow-[0_1px_0_0_var(--color-theme-border)] font-semibold text-theme-text-muted uppercase whitespace-nowrap text-right cursor-pointer select-none hover:text-theme-text transition-colors ${gx.thWide}`}
                    onClick={() => handleSort('return_1m')}
                  >
                    <span className={`inline-flex items-center justify-end ${gx.hdrGap}`}>
                      {t('table.m1')}
                      <SortIcon column="return_1m" />
                      <ColumnInfoBtn col="m1" />
                    </span>
                  </th>
                  <th
                    className={`bg-theme-surface shadow-[0_1px_0_0_var(--color-theme-border)] font-semibold text-theme-text-muted uppercase whitespace-nowrap text-right cursor-pointer select-none hover:text-theme-text transition-colors ${gx.thWide}`}
                    onClick={() => handleSort('return_1q')}
                  >
                    <span className={`inline-flex items-center justify-end ${gx.hdrGap}`}>
                      {t('table.q1')}
                      <SortIcon column="return_1q" />
                      <ColumnInfoBtn col="q1" />
                    </span>
                  </th>
                  <th
                    className={`bg-theme-surface shadow-[0_1px_0_0_var(--color-theme-border)] font-semibold text-theme-text-muted uppercase whitespace-nowrap text-right cursor-pointer select-none hover:text-theme-text transition-colors ${gx.thWide}`}
                    onClick={() => handleSort('return_1y')}
                  >
                    <span className={`inline-flex items-center justify-end ${gx.hdrGap}`}>
                      {t('table.y1')}
                      <SortIcon column="return_1y" />
                      <ColumnInfoBtn col="y1" />
                    </span>
                  </th>
                  <th
                    className={`bg-theme-surface shadow-[0_1px_0_0_var(--color-theme-border)] font-semibold text-theme-text-muted uppercase whitespace-nowrap cursor-pointer select-none hover:text-theme-text transition-colors ${gx.thNarrow}`}
                    onClick={() => handleSort('currency')}
                  >
                    <span className={`inline-flex items-center ${gx.hdrGap}`}>
                      {t('table.currency')}
                      <SortIcon column="currency" />
                      <ColumnInfoBtn col="currency" />
                    </span>
                  </th>
                  <th
                    className={`bg-theme-surface shadow-[0_1px_0_0_var(--color-theme-border)] font-semibold text-theme-text-muted uppercase whitespace-nowrap text-right cursor-pointer select-none hover:text-theme-text transition-colors ${gx.thNarrow}`}
                    onClick={() => handleSort('total_assets')}
                  >
                    <span className={`inline-flex items-center justify-end ${gx.hdrGap}`}>
                      {t('table.aum')}
                      <SortIcon column="total_assets" />
                      <ColumnInfoBtn col="aum" />
                    </span>
                  </th>
                  <th
                    className={`bg-theme-surface shadow-[0_1px_0_0_var(--color-theme-border)] font-semibold text-theme-text-muted uppercase whitespace-nowrap text-right cursor-pointer select-none hover:text-theme-text transition-colors ${gx.thNarrow}`}
                    onClick={() => handleSort('expense_ratio')}
                  >
                    <span className={`inline-flex items-center justify-end ${gx.hdrGap}`}>
                      {t('table.ter')}
                      <SortIcon column="expense_ratio" />
                      <ColumnInfoBtn col="ter" />
                    </span>
                  </th>
                  <th
                    className={`bg-theme-surface shadow-[0_1px_0_0_var(--color-theme-border)] font-semibold text-theme-text-muted uppercase whitespace-nowrap text-center cursor-pointer select-none hover:text-theme-text transition-colors ${gx.thNarrow}`}
                    onClick={() => handleSort('morningstar_rating')}
                  >
                    <span className={`inline-flex items-center justify-center ${gx.hdrGap}`}>
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
                    <td colSpan={10} className={`text-center text-theme-text-muted ${gx.emptyRow}`}>
                      {t('table.noData')}
                    </td>
                  </tr>
                ) : (
                  paginatedEtfs.map((etf) => (
                    <tr
                      key={etf.id}
                      onClick={() => handleEtfRowClick(etf)}
                      className="hover:bg-theme-bg/50 transition-colors group cursor-pointer"
                    >
                      <td className={gx.tdWide}>
                        <div className="flex flex-col">
                          <span className="font-bold text-theme-text">{etf.ticker}</span>
                          <span
                            className={`${gx.nameSub} text-theme-text-muted truncate max-w-[250px]`}
                            title={etf.name}
                          >
                            {etf.name}
                          </span>
                        </div>
                      </td>
                      <td className={gx.tdWide}>
                        <span
                          className={`inline-flex items-center bg-theme-badge-bg text-theme-badge-text border border-theme-badge-border ${gx.badge}`}
                        >
                          {getFriendlyCategory(etf.category, i18n.language as 'pl' | 'en', etf.name)}
                        </span>
                      </td>
                      <td className={`${gx.tdWide} text-right`}>{renderReturn(etf.return_1w)}</td>
                      <td className={`${gx.tdWide} text-right`}>{renderReturn(etf.return_1m)}</td>
                      <td className={`${gx.tdWide} text-right`}>{renderReturn(etf.return_1q)}</td>
                      <td className={`${gx.tdWide} text-right`}>{renderReturn(etf.return_1y)}</td>
                      <td className={gx.tdCurrency}>{etf.currency || '—'}</td>
                      <td className={gx.tdAumTer}>
                        <PreciseHoverTip
                          tooltip={
                            etf.total_assets != null && Number.isFinite(etf.total_assets)
                              ? new Intl.NumberFormat(langUi === 'pl' ? 'pl-PL' : 'en-US', {
                                  maximumFractionDigits: 0,
                                }).format(etf.total_assets)
                              : t('table.noData')
                          }
                          className="inline-flex w-full min-w-0 cursor-default justify-end"
                        >
                          {(() => {
                            const b = classifyAum(etf.total_assets);
                            if (!b) return <span className="tabular-nums text-theme-text-muted">—</span>;
                            return (
                              <span className="inline-block max-w-full truncate align-bottom tabular-nums">
                                {t(`table.sizeTier.${b}`)}
                              </span>
                            );
                          })()}
                        </PreciseHoverTip>
                      </td>
                      <td className={gx.tdAumTer}>
                        <PreciseHoverTip
                          tooltip={
                            etf.expense_ratio != null && Number.isFinite(etf.expense_ratio)
                              ? formatTer(etf.expense_ratio)
                              : t('table.noData')
                          }
                          className="inline-flex w-full min-w-0 cursor-default justify-end"
                        >
                          {(() => {
                            const b = classifyCost(etf.expense_ratio);
                            if (!b) return <span className="tabular-nums text-theme-text-muted">—</span>;
                            return (
                              <span className="inline-block max-w-full truncate align-bottom tabular-nums">
                                {t(`table.costTier.${b}`)}
                              </span>
                            );
                          })()}
                        </PreciseHoverTip>
                      </td>
                      <td className={gx.tdStars}>{renderStars(etf.morningstar_rating ?? null)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div
            className={`flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-theme-border bg-theme-bg/30 ${gx.pagerBar}`}
          >
            <p className={`${gx.pagerText} text-theme-text-muted order-2 sm:order-1`}>
              {t('table.showingRange', { from: rangeFrom, to: rangeTo, total: filteredCount })}
              <span className="hidden sm:inline"> · </span>
              <span className="block sm:inline">{t('table.pageOf', { current: pageIndex + 1, total: totalPages })}</span>
            </p>
            <div
              className={`flex flex-wrap items-center order-1 sm:order-2 sm:justify-end ${gx.pagerControls}`}
            >
              <label className={`flex items-center text-theme-text-muted whitespace-nowrap ${gx.pagerLabel}`}>
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
                  disabled={pageIndex <= 0}
                  onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
                  className={`${gx.pagerBtn} rounded-lg border border-theme-border bg-theme-surface text-theme-text hover:bg-theme-bg disabled:opacity-40 disabled:pointer-events-none transition-colors`}
                >
                  <ChevronLeft className={gx.pagerChevron} />
                </button>
                <button
                  type="button"
                  aria-label={t('table.nextPage')}
                  disabled={pageIndex >= totalPages - 1 || filteredCount === 0}
                  onClick={() => setPageIndex((i) => Math.min(totalPages - 1, i + 1))}
                  className={`${gx.pagerBtn} rounded-lg border border-theme-border bg-theme-surface text-theme-text hover:bg-theme-bg disabled:opacity-40 disabled:pointer-events-none transition-colors`}
                >
                  <ChevronRight className={gx.pagerChevron} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Wyjaśnienia nagłówków tabeli */}
      {infoColumn && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center max-sm:p-0 sm:p-4"
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
            className="relative z-[1] max-sm:max-w-none max-sm:h-full max-sm:min-h-[100dvh] max-sm:rounded-none max-sm:overflow-y-auto w-full max-w-md sm:rounded-xl border border-theme-border bg-theme-surface max-sm:border-x-0 p-5 shadow-2xl text-theme-text text-left flex flex-col"
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
        onClose={() => {
          setIsAuthModalOpen(false);
          setAuthHeaderNotice(undefined);
        }}
        initialView={authView}
        headerNotice={authHeaderNotice}
      />
    </div>
  );
}
