import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { X, SlidersHorizontal, Info, Search, ChevronDown } from 'lucide-react';
import type { EtfRow } from '../types/etf';
import { getFriendlyCategory } from '../lib/categoryMap';
import { inferEtfTheme } from '../lib/etfTheme';
import {
  AGE_BUCKETS,
  AUM_BUCKETS,
  COST_BUCKETS,
  RISK_BUCKETS,
  RETURN_THRESHOLDS,
  countActiveGroups,
  createEmptyFilters,
  extractIssuer,
  type ActiveFilters,
  type AgeBucket,
  type AumBucket,
  type CostBucket,
  type LeverageToggle,
  type RiskBucket,
} from '../lib/etfFilters';

interface FiltersSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: ActiveFilters;
  onChange: (next: ActiveFilters) => void;
  etfs: EtfRow[];
  filteredCount: number;
}

function toggleInSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

export default function FiltersSidePanel({ isOpen, onClose, filters, onChange, etfs, filteredCount }: FiltersSidePanelProps) {
  const { t, i18n } = useTranslation();
  const lang: 'pl' | 'en' = i18n.language?.startsWith('pl') ? 'pl' : 'en';

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const categoryOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of etfs) {
      if (!e.category) continue;
      if (!map.has(e.category)) map.set(e.category, getFriendlyCategory(e.category, lang));
    }
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [etfs, lang]);

  const issuerOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of etfs) {
      const i = extractIssuer(e);
      if (!i) continue;
      counts.set(i, (counts.get(i) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([k]) => k);
  }, [etfs]);

  const currencyOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of etfs) {
      if (!e.currency) continue;
      counts.set(e.currency, (counts.get(e.currency) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([k]) => k);
  }, [etfs]);

  const domicileOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of etfs) {
      if (!e.domicile) continue;
      counts.set(e.domicile, (counts.get(e.domicile) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([k]) => k);
  }, [etfs]);

  const themeOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of etfs) {
      const key = inferEtfTheme(e.name, 'en');
      if (!key) continue;
      if (!map.has(key)) map.set(key, inferEtfTheme(e.name, lang) ?? key);
    }
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [etfs, lang]);

  const activeGroups = countActiveGroups(filters);
  const patch = (p: Partial<ActiveFilters>) => onChange({ ...filters, ...p });
  const reset = () => onChange(createEmptyFilters());

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-2/3 lg:w-1/3 bg-theme-surface border-l border-theme-border shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="filters-panel-title"
      >
        <div className="flex items-center justify-between p-6 border-b border-theme-border">
          <h2 id="filters-panel-title" className="text-2xl font-bold text-theme-text flex items-center gap-3">
            <SlidersHorizontal className="w-6 h-6 text-theme-primary" />
            {t('filters.title')}
            {activeGroups > 0 && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-theme-badge-bg text-theme-badge-text border border-theme-badge-border">
                {t('filters.active', { count: activeGroups })}
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-theme-bg transition-colors text-theme-text-muted hover:text-theme-text"
            title={t('panel.close')}
            aria-label={t('panel.close')}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. Temat — collapsible dropdown, first */}
          {themeOptions.length > 0 && (
            <CollapsibleMultiSelect
              title={t('filters.theme.title')}
              badge={filters.themes.size || null}
              info={t('filters.theme.info')}
              options={themeOptions}
              selected={filters.themes}
              onToggle={(v) => patch({ themes: toggleInSet(filters.themes, v) })}
              searchPlaceholder={t('filters.searchIn')}
            />
          )}

          {/* 2. Stopa zwrotu — only threshold chips */}
          <FilterGroup title={t('filters.return.title')} info={t('filters.return.info')}>
            <div className="flex flex-wrap gap-2">
              <Chip active={filters.returnMin == null} onClick={() => patch({ returnMin: null })} label={t('filters.return.any')} />
              {RETURN_THRESHOLDS.map((th) => (
                <Chip key={th} active={filters.returnMin === th} onClick={() => patch({ returnMin: th })} label={t(`filters.return.gt${th}` as const)} />
              ))}
            </div>
          </FilterGroup>

          {/* 3. Kategoria — collapsible dropdown */}
          <CollapsibleMultiSelect
            title={t('filters.category.title')}
            badge={filters.categories.size || null}
            info={t('filters.category.info')}
            options={categoryOptions}
            selected={filters.categories}
            onToggle={(v) => patch({ categories: toggleInSet(filters.categories, v) })}
            searchPlaceholder={t('filters.searchIn')}
          />

          {/* 4. Issuer — collapsible dropdown */}
          <CollapsibleMultiSelect
            title={t('filters.issuer.title')}
            badge={filters.issuers.size || null}
            info={t('filters.issuer.info')}
            options={issuerOptions.map((k) => [k, k] as [string, string])}
            selected={filters.issuers}
            onToggle={(v) => patch({ issuers: toggleInSet(filters.issuers, v) })}
            searchPlaceholder={t('filters.searchIn')}
          />

          {/* 5. Morningstar */}
          <FilterGroup title={t('filters.morningstar.title')} badge={filters.msStars.size || null} info={t('filters.morningstar.info')}>
            <div className="flex flex-wrap gap-2">
              {([1, 2, 3, 4, 5] as const).map((n) => (
                <Chip key={n} active={filters.msStars.has(n)} onClick={() => patch({ msStars: toggleInSet(filters.msStars, n) })} label={<span className="text-amber-500">{'★'.repeat(n)}</span>} />
              ))}
            </div>
          </FilterGroup>

          {/* 6. Waluta */}
          <FilterGroup title={t('filters.currency.title')} badge={filters.currencies.size || null} info={t('filters.currency.info')}>
            <div className="flex flex-wrap gap-2">
              {currencyOptions.map((c) => (
                <Chip key={c} active={filters.currencies.has(c)} onClick={() => patch({ currencies: toggleInSet(filters.currencies, c) })} label={c} />
              ))}
            </div>
          </FilterGroup>

          {/* 7. Lewarowane — simple yes/no toggle */}
          <FilterGroup title={t('filters.leverage.title')} info={t('filters.leverage.info')}>
            <div className="flex items-center gap-3">
              <ToggleButton
                active={filters.showLeveraged === true}
                onClick={() => patch({ showLeveraged: filters.showLeveraged === true ? null : true })}
                label={t('filters.leverage.yes')}
              />
              <ToggleButton
                active={filters.showLeveraged === false}
                onClick={() => patch({ showLeveraged: filters.showLeveraged === false ? null : false })}
                label={t('filters.leverage.no')}
              />
            </div>
          </FilterGroup>

          {/* 8. Koszty */}
          <FilterGroup title={t('filters.cost.title')} badge={filters.cost.size || null} info={t('filters.cost.info')}>
            <div className="flex flex-wrap gap-2">
              {COST_BUCKETS.map((b) => (
                <Chip key={b} active={filters.cost.has(b)} onClick={() => patch({ cost: toggleInSet(filters.cost, b as CostBucket) })} label={t(`filters.cost.${b}`)} />
              ))}
            </div>
          </FilterGroup>

          {/* 9. Ryzyko */}
          <FilterGroup title={t('filters.risk.title')} badge={filters.risk.size || null} info={t('filters.risk.info')}>
            <div className="flex flex-wrap gap-2">
              {RISK_BUCKETS.map((b) => (
                <Chip key={b} active={filters.risk.has(b)} onClick={() => patch({ risk: toggleInSet(filters.risk, b as RiskBucket) })} label={t(`filters.risk.${b}`)} />
              ))}
            </div>
          </FilterGroup>

          {/* 10. AUM */}
          <FilterGroup title={t('filters.aum.title')} badge={filters.aum.size || null} info={t('filters.aum.info')}>
            <div className="flex flex-wrap gap-2">
              {AUM_BUCKETS.map((b) => (
                <Chip key={b} active={filters.aum.has(b)} onClick={() => patch({ aum: toggleInSet(filters.aum, b as AumBucket) })} label={t(`filters.aum.${b}`)} />
              ))}
            </div>
          </FilterGroup>

          {/* 11. Kraj funduszu */}
          <FilterGroup title={t('filters.domicile.title')} badge={filters.domiciles.size || null} info={t('filters.domicile.info')}>
            <div className="flex flex-wrap gap-2">
              {domicileOptions.map((d) => (
                <Chip key={d} active={filters.domiciles.has(d)} onClick={() => patch({ domiciles: toggleInSet(filters.domiciles, d) })} label={d} />
              ))}
            </div>
          </FilterGroup>

          {/* 12. Dywidenda — simple yes/no toggle */}
          <FilterGroup title={t('filters.yield.title')} info={t('filters.yield.info')}>
            <div className="flex items-center gap-3">
              <ToggleButton
                active={filters.paysDividend === true}
                onClick={() => patch({ paysDividend: filters.paysDividend === true ? null : true })}
                label={t('filters.yield.yes')}
              />
              <ToggleButton
                active={filters.paysDividend === false}
                onClick={() => patch({ paysDividend: filters.paysDividend === false ? null : false })}
                label={t('filters.yield.no')}
              />
            </div>
          </FilterGroup>

          {/* 13. Wiek */}
          <FilterGroup title={t('filters.age.title')} badge={filters.age.size || null} info={t('filters.age.info')}>
            <div className="flex flex-wrap gap-2">
              {AGE_BUCKETS.map((b) => (
                <Chip key={b} active={filters.age.has(b)} onClick={() => patch({ age: toggleInSet(filters.age, b as AgeBucket) })} label={t(`filters.age.${b}`)} />
              ))}
            </div>
          </FilterGroup>

        </div>

        <div className="border-t border-theme-border p-4 flex items-center gap-3">
          <button type="button" onClick={reset} className="btn-secondary flex-1" disabled={activeGroups === 0}>
            {t('filters.clear')}
          </button>
          <button type="button" onClick={onClose} className="btn-primary flex-1">
            {t('filters.apply', { count: filteredCount })}
          </button>
        </div>
      </div>
    </>
  );
}

/* ────────────────────────────────────────────────────── */

function FilterGroup({ title, badge, info, children }: { title: string; badge?: number | null; info?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-semibold text-theme-text uppercase tracking-wider">{title}</h3>
        {badge != null && badge > 0 && (
          <span className="text-xs font-medium px-1.5 py-0.5 rounded-md bg-theme-badge-bg text-theme-badge-text border border-theme-badge-border">{badge}</span>
        )}
        {info && <InfoTooltip text={info} />}
      </div>
      {children}
    </section>
  );
}

function Chip({ active, onClick, label }: { active: boolean; onClick: () => void; label: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${
        active ? 'bg-teal-600 text-white border-teal-600 hover:bg-teal-700' : 'bg-transparent text-theme-text border-theme-border hover:bg-theme-bg'
      }`}
    >
      {label}
    </button>
  );
}

function ToggleButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
        active ? 'bg-teal-600 text-white border-teal-600 hover:bg-teal-700' : 'bg-transparent text-theme-text border-theme-border hover:bg-theme-bg'
      }`}
    >
      {label}
    </button>
  );
}

function CollapsibleMultiSelect({
  title,
  badge,
  info,
  options,
  selected,
  onToggle,
  searchPlaceholder,
}: {
  title: string;
  badge?: number | null;
  info?: string;
  options: Array<[string, string]>;
  selected: Set<string>;
  onToggle: (value: string) => void;
  searchPlaceholder: string;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const filtered = q
    ? options.filter(([k, label]) => k.toLowerCase().includes(q) || label.toLowerCase().includes(q))
    : options;

  return (
    <section>
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-sm font-semibold text-theme-text uppercase tracking-wider">{title}</h3>
        {badge != null && badge > 0 && (
          <span className="text-xs font-medium px-1.5 py-0.5 rounded-md bg-theme-badge-bg text-theme-badge-text border border-theme-badge-border">{badge}</span>
        )}
        {info && <InfoTooltip text={info} />}
      </div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-theme-border bg-theme-bg text-sm text-theme-text hover:border-theme-primary transition-colors"
      >
        <span className="truncate text-theme-text-muted">
          {selected.size === 0
            ? searchPlaceholder
            : `${selected.size} ${t('filters.active', { count: selected.size }).toLowerCase()}`}
        </span>
        <ChevronDown className={`w-4 h-4 text-theme-text-muted shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="mt-2 rounded-lg border border-theme-border bg-theme-bg overflow-hidden">
          <div className="relative border-b border-theme-border">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="block w-full pl-8 pr-2 py-2 text-sm bg-transparent text-theme-text placeholder-theme-text-muted focus:outline-none"
            />
          </div>
          <div className="max-h-48 overflow-y-auto divide-y divide-theme-border">
            {filtered.length === 0 ? (
              <p className="text-sm text-theme-text-muted py-3 text-center">{t('filters.none')}</p>
            ) : (
              filtered.map(([key, label]) => (
                <label key={key} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-theme-bg/80 text-sm">
                  <input
                    type="checkbox"
                    checked={selected.has(key)}
                    onChange={() => onToggle(key)}
                    className="filter-checkbox"
                  />
                  <span className="text-theme-text">{label}</span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </section>
  );
}

const TOOLTIP_MAX_W = 300;
const TOOLTIP_MARGIN = 8;

function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const reposition = useCallback(() => {
    const btn = btnRef.current;
    if (!btn || !open) { setPos(null); return; }
    const rect = btn.getBoundingClientRect();
    const tipH = tooltipRef.current?.offsetHeight ?? 80;

    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    const placeAbove = spaceAbove >= spaceBelow && spaceAbove > tipH + TOOLTIP_MARGIN;
    let top = placeAbove ? rect.top - tipH - TOOLTIP_MARGIN : rect.bottom + TOOLTIP_MARGIN;
    top = Math.max(TOOLTIP_MARGIN, Math.min(top, window.innerHeight - tipH - TOOLTIP_MARGIN));

    const cx = rect.left + rect.width / 2;
    let left = cx - TOOLTIP_MAX_W / 2;
    left = Math.max(TOOLTIP_MARGIN, Math.min(left, window.innerWidth - TOOLTIP_MAX_W - TOOLTIP_MARGIN));
    setPos({ top, left });
  }, [open]);

  useLayoutEffect(() => {
    if (!open) { setPos(null); return; }
    reposition();
    const id = requestAnimationFrame(reposition);
    return () => cancelAnimationFrame(id);
  }, [open, reposition]);

  useEffect(() => {
    if (!open) return;
    const handler = () => reposition();
    window.addEventListener('resize', handler);
    window.addEventListener('scroll', handler, true);
    return () => { window.removeEventListener('resize', handler); window.removeEventListener('scroll', handler, true); };
  }, [open, reposition]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); e.stopPropagation(); } };
    const onClick = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node | null;
      if (t && (btnRef.current?.contains(t) || tooltipRef.current?.contains(t))) return;
      setOpen(false);
    };
    window.addEventListener('keydown', onKey, true);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('touchstart', onClick);
    return () => { window.removeEventListener('keydown', onKey, true); document.removeEventListener('mousedown', onClick); document.removeEventListener('touchstart', onClick); };
  }, [open]);

  const portal = typeof document !== 'undefined' && open && pos
    ? createPortal(
        <div
          ref={tooltipRef}
          role="tooltip"
          className="fixed z-[200] rounded-lg border border-theme-border bg-theme-surface p-3 shadow-xl"
          style={{ top: pos.top, left: pos.left, width: TOOLTIP_MAX_W, maxHeight: 'min(40vh, 240px)', overflowY: 'auto' }}
        >
          <p className="text-sm text-theme-text leading-snug">{text}</p>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="p-0.5 rounded text-theme-text-muted hover:text-theme-primary transition-colors"
        aria-label="Info"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {portal}
    </>
  );
}

