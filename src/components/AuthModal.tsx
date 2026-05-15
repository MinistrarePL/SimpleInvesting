import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { createClient } from '@supabase/supabase-js';
import { X, Mail, Lock, Loader2 } from 'lucide-react';

// Inicjalizacja klienta Supabase dla frontendu (używa klucza anonimowego)
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || '';
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '';
export const supabase = createClient(supabaseUrl, supabaseKey);

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'login' | 'register' | 'reset' | 'update_password';
  /** Opcjonalny tekst pod tytułem (np. wymóg konta dla funkcji). */
  headerNotice?: string | null;
}

export default function AuthModal({ isOpen, onClose, initialView = 'login', headerNotice }: AuthModalProps) {
  const { t } = useTranslation();
  const [view, setView] = useState<'login' | 'register' | 'reset' | 'update_password'>(initialView);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [acceptedLegal, setAcceptedLegal] = useState(false);

  const termsHref = '/terms-of-service';
  const privacyHref = '/privacy-policy';

  // Zamykanie klawiszem ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Resetowanie stanu modala przy jego otwarciu
  useEffect(() => {
    if (isOpen) {
      setView(initialView);
      setError(null);
      setSuccess(null);
      setEmail('');
      setPassword('');
      setAcceptedLegal(false);
    }
  }, [isOpen, initialView]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (view === 'register' && !acceptedLegal) {
      setError(t('auth.mustAcceptLegal'));
      setLoading(false);
      return;
    }

    try {
      if (view === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onClose(); // Sukces -> zamykamy modal
      } else if (view === 'register') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setSuccess(t('auth.successRegister'));
      } else if (view === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setSuccess(t('auth.successReset'));
      } else if (view === 'update_password') {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setSuccess(t('auth.successUpdate'));
        setTimeout(() => onClose(), 2000); // Zamykamy modal po 2 sekundach
      }
    } catch (err: any) {
      setError(err.message || t('auth.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google') => {
    if (view === 'register' && !acceptedLegal) {
      setError(t('auth.mustAcceptLegal'));
      return;
    }
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || t('auth.error'));
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center max-sm:p-0 sm:p-4">
        <div className="bg-theme-surface w-full max-sm:max-w-none max-sm:min-h-[100dvh] max-sm:rounded-none sm:max-w-md sm:rounded-2xl shadow-2xl border border-theme-border overflow-hidden flex flex-col max-sm:border-x-0">
          
          {/* Nagłówek */}
          <div className="flex items-start justify-between gap-3 p-6 border-b border-theme-border">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-theme-text">
                {view === 'login' ? t('auth.login') 
                  : view === 'register' ? t('auth.register') 
                  : view === 'update_password' ? t('auth.updatePassword')
                  : t('auth.resetPassword')}
              </h2>
              {headerNotice && (view === 'login' || view === 'register') && (
                <p className="mt-2 text-sm text-theme-text-muted font-normal leading-snug">
                  {headerNotice}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 p-2 rounded-full hover:bg-theme-bg transition-colors text-theme-text-muted hover:text-theme-text"
              aria-label={t('panel.close')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Formularz */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1 overflow-y-auto min-h-0">
            {error && (
              <div className="p-3 text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400 rounded-lg border border-rose-200 dark:border-rose-800/50">
                {error}
              </div>
            )}
            
            {success && (
              <div className="p-3 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-lg border border-emerald-200 dark:border-emerald-800/50">
                {success}
              </div>
            )}

            {view !== 'update_password' && (
              <div>
                <label className="block text-sm font-medium text-theme-text mb-1">
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-theme-text-muted" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-theme-border rounded-xl bg-theme-bg text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-colors"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
            )}

            {view !== 'reset' && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-theme-text">
                    {view === 'update_password' ? t('auth.newPassword') : t('auth.password')}
                  </label>
                  {view === 'login' && (
                    <button
                      type="button"
                      onClick={() => { setView('reset'); setError(null); setSuccess(null); }}
                      className="text-xs font-medium text-theme-primary hover:text-theme-primary-hover transition-colors"
                    >
                      {t('auth.forgotPassword')}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-theme-text-muted" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-theme-border rounded-xl bg-theme-bg text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {view === 'register' && (
              <label className="flex items-start gap-3 cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  checked={acceptedLegal}
                  onChange={(e) => setAcceptedLegal(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-theme-border text-teal-600 focus:ring-teal-600"
                />
                <span className="text-sm text-theme-text leading-snug">
                  {t('auth.legalPrefix')}
                  <a
                    href={termsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-theme-primary hover:text-theme-primary-hover underline underline-offset-2"
                  >
                    {t('auth.termsLink')}
                  </a>
                  {t('auth.legalMiddle')}
                  <a
                    href={privacyHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-theme-primary hover:text-theme-primary-hover underline underline-offset-2"
                  >
                    {t('auth.privacyLink')}
                  </a>
                  .
                </span>
              </label>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-600 transition-colors disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                view === 'login' ? t('auth.submitLogin') 
                : view === 'register' ? t('auth.submitRegister') 
                : view === 'update_password' ? t('auth.submitUpdate')
                : t('auth.sendResetLink')
              )}
            </button>

            {/* Logowanie przez Social Media (OAuth) */}
            {(view === 'login' || view === 'register') && (
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-theme-border"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-theme-surface text-theme-text-muted">
                      {t('auth.orContinueWith')}
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => handleOAuthLogin('google')}
                    className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-theme-border rounded-xl shadow-sm bg-theme-bg hover:bg-theme-border/50 text-sm font-medium text-theme-text transition-colors"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    {t('auth.google')}
                  </button>
                </div>
              </div>
            )}

            {view !== 'update_password' && (
              <div className="mt-4 text-center text-sm">
                {view === 'reset' ? (
                  <button
                    type="button"
                    onClick={() => { setView('login'); setError(null); setSuccess(null); setAcceptedLegal(false); }}
                    className="font-medium text-theme-primary hover:text-theme-primary-hover transition-colors"
                  >
                    {t('auth.backToLogin')}
                  </button>
                ) : (
                  <>
                    <span className="text-theme-text-muted">
                      {view === 'login' ? t('auth.noAccount') : t('auth.hasAccount')}{' '}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setView(view === 'login' ? 'register' : 'login');
                        setError(null);
                        setSuccess(null);
                        setAcceptedLegal(false);
                      }}
                      className="font-medium text-theme-primary hover:text-theme-primary-hover transition-colors"
                    >
                      {view === 'login' ? t('auth.register') : t('auth.login')}
                    </button>
                  </>
                )}
              </div>
            )}
          </form>
        </div>
      </div>
    </>
  );
}
