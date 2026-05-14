import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Session } from '@supabase/supabase-js';
import { X, Mail, Lock, Loader2, Settings } from 'lucide-react';
import { supabase } from './AuthModal';

const MIN_PASSWORD = 6;

interface AccountSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session;
  onAccountDeleted: () => void;
}

export default function AccountSettingsPanel({
  isOpen,
  onClose,
  session,
  onAccountDeleted,
}: AccountSettingsPanelProps) {
  const { t } = useTranslation();
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const confirmWord = t('auth.deleteConfirmWord');

  useEffect(() => {
    if (!isOpen) return;
    setNewEmail('');
    setPassword('');
    setPassword2('');
    setDeleteConfirm('');
    setError(null);
    setSuccess(null);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
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

  const currentEmail = session.user.email ?? '';

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed || trimmed === currentEmail.toLowerCase()) {
      setError(t('auth.error'));
      return;
    }
    setLoadingEmail(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ email: trimmed });
      if (err) throw err;
      setSuccess(t('auth.emailChangeSuccess'));
      setNewEmail('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('auth.error'));
    } finally {
      setLoadingEmail(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (password.length < MIN_PASSWORD) {
      setError(t('auth.passwordTooShort'));
      return;
    }
    if (password !== password2) {
      setError(t('auth.passwordsMismatch'));
      return;
    }
    setLoadingPassword(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      setSuccess(t('auth.successUpdate'));
      setPassword('');
      setPassword2('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('auth.error'));
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleDelete = async () => {
    setError(null);
    setSuccess(null);
    if (deleteConfirm.trim() !== confirmWord) return;
    setLoadingDelete(true);
    try {
      const token = session.access_token;
      const res = await fetch('/api/delete-account', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        let msg = t('auth.deleteError');
        try {
          const j = (await res.json()) as { error?: string };
          if (j?.error) msg = j.error;
        } catch (_) {}
        throw new Error(msg);
      }
      await supabase.auth.signOut();
      onAccountDeleted();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('auth.deleteError'));
    } finally {
      setLoadingDelete(false);
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[min(40vw,32rem)] max-w-full bg-theme-surface border-l border-theme-border shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-settings-title"
      >
        <div className="flex items-center justify-between p-6 border-b border-theme-border shrink-0">
          <h2 id="account-settings-title" className="text-xl font-bold text-theme-text flex items-center gap-3">
            <Settings className="w-6 h-6 text-theme-primary shrink-0" aria-hidden />
            {t('auth.settingsTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-theme-bg transition-colors text-theme-text-muted hover:text-theme-text"
            title={t('panel.close')}
            aria-label={t('panel.close')}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thumb-theme p-6 space-y-8">
          {(error || success) && (
            <div className="space-y-2">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800/50">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 rounded-lg border border-green-200 dark:border-green-800/50">
                  {success}
                </div>
              )}
            </div>
          )}

          <section aria-labelledby="section-email">
            <h3 id="section-email" className="text-sm font-semibold text-theme-text mb-3 uppercase tracking-wide">
              {t('auth.email')}
            </h3>
            <div className="mb-3">
              <label className="block text-xs text-theme-text-muted mb-1">{t('auth.currentEmail')}</label>
              <p className="text-sm text-theme-text font-medium break-all">{currentEmail || '—'}</p>
            </div>
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-theme-text mb-1">
                  {t('auth.newEmailField')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-theme-text-muted" />
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-theme-border rounded-xl bg-theme-bg text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary"
                    autoComplete="email"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loadingEmail || !newEmail.trim()}
                className="btn-secondary w-full justify-center"
              >
                {loadingEmail ? <Loader2 className="w-5 h-5 animate-spin" /> : t('auth.saveEmail')}
              </button>
            </form>
          </section>

          <section aria-labelledby="section-password">
            <h3 id="section-password" className="text-sm font-semibold text-theme-text mb-3 uppercase tracking-wide">
              {t('auth.changePassword')}
            </h3>
            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-theme-text mb-1">{t('auth.newPassword')}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-theme-text-muted" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-theme-border rounded-xl bg-theme-bg text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary"
                    minLength={MIN_PASSWORD}
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-text mb-1">{t('auth.repeatPassword')}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-theme-text-muted" />
                  <input
                    type="password"
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-theme-border rounded-xl bg-theme-bg text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary"
                    minLength={MIN_PASSWORD}
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loadingPassword || !password}
                className="btn-primary w-full justify-center"
              >
                {loadingPassword ? <Loader2 className="w-5 h-5 animate-spin" /> : t('auth.savePassword')}
              </button>
            </form>
          </section>

          <section className="border-t border-theme-border pt-6" aria-labelledby="section-delete">
            <h3 id="section-delete" className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">
              {t('auth.dangerZone')}
            </h3>
            <p className="text-sm text-theme-text-muted mb-4">{t('auth.deleteAccountWarning')}</p>
            <label className="block text-sm font-medium text-theme-text mb-1">
              {t('auth.deleteConfirmLabel')} <strong className="text-theme-text">{confirmWord}</strong>
            </label>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              className="block w-full px-3 py-2.5 border border-theme-border rounded-xl bg-theme-bg text-theme-text mb-3 focus:outline-none focus:ring-2 focus:ring-red-600"
              autoComplete="off"
            />
            <button
              type="button"
              disabled={loadingDelete || deleteConfirm.trim() !== confirmWord}
              onClick={() => void handleDelete()}
              className="w-full py-2.5 px-4 rounded-xl border-2 border-red-600 bg-transparent text-red-600 dark:text-red-400 dark:border-red-500 font-semibold hover:bg-red-600/10 transition-colors disabled:opacity-50"
            >
              {loadingDelete ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : t('auth.deleteAccountSubmit')}
            </button>
          </section>
        </div>
      </div>
    </>
  );
}
