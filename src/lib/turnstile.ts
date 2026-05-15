/**
 * Cloudflare Turnstile - niewidoczna captcha.
 *
 * - `loadTurnstile()` jednorazowo ładuje skrypt CF (render=explicit).
 * - `renderInvisibleTurnstile(container, siteKey)` montuje widget i zwraca id.
 * - `executeTurnstile(widgetId)` zwraca Promise z tokenem (wywoływane przy submit).
 *
 * Bez `PUBLIC_TURNSTILE_SITE_KEY` żądania auth nie wysyłają tokenu — jeśli w Supabase
 * włączona jest ochrona (Bot and Abuse Protection), logowanie się nie powiedzie
 * (komunikat „no captcha_token”). Ustaw klucz także na localhost.
 */

interface TurnstileRenderOptions {
  sitekey: string;
  size?: 'normal' | 'compact' | 'invisible' | 'flexible';
  callback?: (token: string) => void;
  'error-callback'?: () => void;
  'expired-callback'?: () => void;
  'timeout-callback'?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  appearance?: 'always' | 'execute' | 'interaction-only';
  retry?: 'auto' | 'never';
}

interface TurnstileApi {
  render: (container: HTMLElement | string, options: TurnstileRenderOptions) => string;
  execute: (widgetId: string | HTMLElement) => void;
  reset: (widgetId?: string | HTMLElement) => void;
  remove: (widgetId: string | HTMLElement) => void;
  getResponse: (widgetId?: string | HTMLElement) => string | undefined;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let loadPromise: Promise<TurnstileApi | null> | null = null;

/** Pojedyncze pending na cały moduł — w aplikacji mamy maks. jeden widget naraz (AuthModal). */
let pendingResolver: ((token: string | null) => void) | null = null;

function settlePending(token: string | null) {
  const r = pendingResolver;
  pendingResolver = null;
  r?.(token);
}

export function loadTurnstile(): Promise<TurnstileApi | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve) => {
    /** Czekamy aż CF zainicjalizuje globalny obiekt (skrypt async). */
    const waitForReady = () => {
      const deadline = Date.now() + 8000;
      const tick = () => {
        if (window.turnstile) return resolve(window.turnstile);
        if (Date.now() > deadline) return resolve(null);
        window.setTimeout(tick, 50);
      };
      tick();
    };

    if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      waitForReady();
      return;
    }
    const s = document.createElement('script');
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = waitForReady;
    s.onerror = () => resolve(null);
    document.head.appendChild(s);
  });
  return loadPromise;
}

export async function renderInvisibleTurnstile(container: HTMLElement, siteKey: string): Promise<string | null> {
  const ts = await loadTurnstile();
  if (!ts) {
    if (import.meta.env.DEV) console.warn('[turnstile] script failed to load');
    return null;
  }
  if (!container) {
    if (import.meta.env.DEV) console.warn('[turnstile] container missing');
    return null;
  }
  try {
    const id = ts.render(container, {
      sitekey: siteKey,
      size: 'invisible',
      appearance: 'execute',
      retry: 'auto',
      callback: (token: string) => {
        if (import.meta.env.DEV) console.log('[turnstile] token received', token.slice(0, 20) + '…');
        settlePending(token);
      },
      'error-callback': () => {
        if (import.meta.env.DEV) console.warn('[turnstile] error-callback fired');
        settlePending(null);
      },
      'timeout-callback': () => {
        if (import.meta.env.DEV) console.warn('[turnstile] timeout-callback fired');
        settlePending(null);
      },
      'expired-callback': () => {
        if (import.meta.env.DEV) console.warn('[turnstile] expired-callback fired');
        settlePending(null);
      },
    });
    if (import.meta.env.DEV) console.log('[turnstile] widget rendered, id:', id);
    return id;
  } catch (e) {
    if (import.meta.env.DEV) console.error('[turnstile] render failed:', e);
    return null;
  }
}

export async function executeTurnstile(widgetId: string, timeoutMs = 20000): Promise<string | null> {
  const ts = await loadTurnstile();
  if (!ts) return null;
  try {
    ts.reset(widgetId);
  } catch {
    /* ignore */
  }
  return new Promise<string | null>((resolve) => {
    /** Odrzuć poprzedni wiszący execute (zostawiamy ten najnowszy). */
    if (pendingResolver) settlePending(null);
    pendingResolver = resolve;

    const t = window.setTimeout(() => {
      if (pendingResolver === resolve) settlePending(null);
    }, timeoutMs);

    try {
      ts.execute(widgetId);
    } catch {
      window.clearTimeout(t);
      if (pendingResolver === resolve) settlePending(null);
    }
  });
}

export function removeTurnstile(widgetId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.turnstile?.remove(widgetId);
  } catch {
    /* ignore */
  }
}
