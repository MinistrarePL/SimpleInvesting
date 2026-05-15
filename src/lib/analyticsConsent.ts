/** Zgoda na analitykę (cookie banner → `CookieBanner`; PostHog tylko gdy true). */
const STORAGE_KEY = 'si.cookieConsent';

export function readAnalyticsConsent(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { analytics?: boolean };
    return !!parsed.analytics;
  } catch {
    return false;
  }
}
