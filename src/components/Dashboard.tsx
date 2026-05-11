import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Moon, Sun, Globe } from 'lucide-react';
import '../i18n/config'; // Inicjalizacja i18n

// Typy danych z Supabase
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

interface DashboardProps {
  initialEtfs: ETF[];
}

export default function Dashboard({ initialEtfs }: DashboardProps) {
  const { t, i18n } = useTranslation();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Inicjalizacja motywu na podstawie localStorage lub preferencji systemowych
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMatchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
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
  };

  // Funkcja pomocnicza do formatowania stóp zwrotu z kolorami
  const renderReturn = (val: number | null) => {
    if (val === null) return <span className="text-theme-text-muted">-</span>;
    const isPositive = val > 0;
    const isNegative = val < 0;
    
    // Używamy ciemniejszych odcieni zieleni i czerwieni dla lepszego kontrastu w jasnym motywie
    const colorClass = isPositive 
      ? 'text-green-600 dark:text-green-500' 
      : isNegative 
        ? 'text-red-600 dark:text-red-500' 
        : 'text-theme-text';
    
    return (
      <span className={`font-medium ${colorClass}`}>
        {val > 0 ? '+' : ''}{val}%
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text transition-colors duration-300">
      {/* Header */}
      <header className="border-b border-theme-border bg-theme-surface sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img 
              src={theme === 'dark' ? '/logo_dark.svg' : '/logo_light.svg'} 
              alt="SimpleInvesting Logo" 
              className="h-8 w-auto" 
            />
          </div>

          {/* Kontrolki (Język i Motyw) */}
          <div className="flex items-center gap-4">
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
          </div>
        </div>
      </header>

      {/* Główna zawartość - Tabela */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-theme-surface rounded-xl shadow-sm border border-theme-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-theme-border bg-theme-bg/50">
                  <th className="py-4 px-6 font-semibold text-sm text-theme-text-muted uppercase tracking-wider">
                    {t('table.name')}
                  </th>
                  <th className="py-4 px-6 font-semibold text-sm text-theme-text-muted uppercase tracking-wider">
                    {t('table.exposure')}
                  </th>
                  <th className="py-4 px-6 font-semibold text-sm text-theme-text-muted uppercase tracking-wider">
                    {t('table.currency')}
                  </th>
                  <th className="py-4 px-6 font-semibold text-sm text-theme-text-muted uppercase tracking-wider text-right">
                    {t('table.w1')}
                  </th>
                  <th className="py-4 px-6 font-semibold text-sm text-theme-text-muted uppercase tracking-wider text-right">
                    {t('table.m1')}
                  </th>
                  <th className="py-4 px-6 font-semibold text-sm text-theme-text-muted uppercase tracking-wider text-right">
                    {t('table.q1')}
                  </th>
                  <th className="py-4 px-6 font-semibold text-sm text-theme-text-muted uppercase tracking-wider text-right">
                    {t('table.y1')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border">
                {initialEtfs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-theme-text-muted">
                      {t('table.noData')}
                    </td>
                  </tr>
                ) : (
                  initialEtfs.map((etf) => (
                    <tr key={etf.id} className="hover:bg-theme-bg/50 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-theme-text">{etf.ticker}</span>
                          <span className="text-sm text-theme-text-muted truncate max-w-[250px]" title={etf.name}>
                            {etf.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-theme-primary/15 text-teal-800 dark:text-theme-primary border border-theme-primary/20">
                          {etf.category || 'N/A'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-theme-text-muted">
                        USD
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
