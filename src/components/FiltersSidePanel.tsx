import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, SlidersHorizontal } from 'lucide-react';

interface FiltersSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FiltersSidePanel({ isOpen, onClose }: FiltersSidePanelProps) {
  const { t } = useTranslation();

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
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-theme-surface border-l border-theme-border shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="filters-panel-title"
      >
        <div className="flex items-center justify-between p-6 border-b border-theme-border">
          <h2 id="filters-panel-title" className="text-2xl font-bold text-theme-text flex items-center gap-3">
            <SlidersHorizontal className="w-6 h-6 text-theme-primary" />
            {t('filters.title')}
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

        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-sm text-theme-text-muted leading-relaxed">{t('filters.empty')}</p>
        </div>
      </div>
    </>
  );
}
