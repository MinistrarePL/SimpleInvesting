import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Moon, Sun, Globe, Search, Plus, Loader2, User, LogOut } from 'lucide-react';
import '../i18n/config'; // Inicjalizacja i18n
import EtfSidePanel from './EtfSidePanel';
import AuthModal, { supabase } from './AuthModal';

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
  
  // Stan dla ETF-ów (pozwala na dodawanie nowych do tabeli bez odświeżania)
  const [etfs, setEtfs] = useState<ETF[]>(initialEtfs);

  // Stan dla wyszukiwarki (filtrowanie tabeli)
  const [searchQuery, setSearchQuery] = useState('');

  // Stan dla bocznego panelu
  const [selectedEtf, setSelectedEtf] = useState<ETF | null>(null);

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Filtrowanie ETF-ów na podstawie wpisanego tekstu
  const filteredEtfs = etfs.filter((etf) => {
    const query = searchQuery.toLowerCase();
    return (
      etf.ticker.toLowerCase().includes(query) ||
      etf.name.toLowerCase().includes(query) ||
      (etf.category && etf.category.toLowerCase().includes(query))
    );
  });

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
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors text-base font-bold shadow-sm"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">{t('auth.loginRegisterBtn')}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Główna zawartość - Tabela */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Wyszukiwarka */}
        <div className="mb-6 relative">
          <div className="relative">
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
        </div>

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
                {filteredEtfs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-theme-text-muted">
                      {t('table.noData')}
                    </td>
                  </tr>
                ) : (
                  filteredEtfs.map((etf) => (
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

      {/* Boczny panel ze szczegółami ETF */}
      <EtfSidePanel 
        isOpen={!!selectedEtf} 
        onClose={() => setSelectedEtf(null)} 
        etf={selectedEtf} 
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
