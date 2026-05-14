import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Session } from '@supabase/supabase-js';
import { LogOut, ChevronDown, Settings } from 'lucide-react';
function displayName(session: Session): string {
  const m = session.user.user_metadata as Record<string, unknown>;
  const full = m?.full_name;
  const nm = m?.name;
  if (typeof full === 'string' && full.trim()) return full.trim();
  if (typeof nm === 'string' && nm.trim()) return nm.trim();
  const email = session.user.email;
  if (!email) return '?';
  return email.split('@')[0] ?? email;
}

function initials(session: Session): string {
  const name = displayName(session);
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  if (parts.length === 1 && parts[0]!.length >= 2) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]?.[0] ?? '?').toUpperCase();
}

export interface UserMenuProps {
  session: Session;
  onLogout: () => void | Promise<void>;
  onOpenSettings: () => void;
}

export default function UserMenu({ session, onLogout, onOpenSettings }: UserMenuProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const avatarUrl =
    typeof session.user.user_metadata?.avatar_url === 'string'
      ? session.user.user_metadata.avatar_url
      : null;
  const name = displayName(session);
  const label = initials(session);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onDocMouse = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('mousedown', onDocMouse);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocMouse);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={wrapRef}>
        <button
          type="button"
          className="flex items-center gap-2 pl-1 pr-2 py-1.5 rounded-xl max-w-[220px] sm:max-w-[280px] transition-opacity hover:opacity-90"
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label={t('auth.accountMenuAria')}
          onClick={() => setOpen((v) => !v)}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="h-9 w-9 rounded-full object-cover shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="h-9 w-9 rounded-full bg-teal-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
              {label}
            </span>
          )}
          <span className="min-w-0 truncate text-sm font-medium text-theme-text hidden sm:inline-block">
            {name}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-theme-text-muted shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-1 w-56 rounded-xl border border-theme-border bg-theme-surface shadow-xl z-50 py-1"
        >
          <button
            type="button"
            role="menuitem"
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-theme-text hover:bg-theme-bg text-left"
            onClick={() => {
              setOpen(false);
              onOpenSettings();
            }}
          >
            <Settings className="w-4 h-4 text-theme-text-muted shrink-0" />
            {t('auth.accountSettings')}
          </button>
          <button
            type="button"
            role="menuitem"
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-theme-text-muted hover:text-red-500 hover:bg-theme-bg text-left"
            onClick={() => {
              setOpen(false);
              void onLogout();
            }}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {t('auth.logout')}
          </button>
        </div>
      )}
    </div>
  );
}
