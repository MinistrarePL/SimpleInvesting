import { useEffect, useRef } from 'react';

const CONSENT_STORAGE_KEY = 'si.cookieConsent';

function readAnalyticsConsent(): boolean {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { analytics?: boolean };
    return !!parsed.analytics;
  } catch {
    return false;
  }
}



/**
 * Initializes PostHog (EU cloud) only after analytics cookie consent.
 * Pair with PUBLIC_POSTHOG_KEY and optional PUBLIC_POSTHOG_HOST (default EU ingestion URL).
 */
export default function PostHogInit() {
  /** SDK został załadowany i przynajmniej raz wywołano init (nie powtarzamy init w tej samej sesji). */
  const sdkReady = useRef(false);

  useEffect(() => {
    const key = import.meta.env.PUBLIC_POSTHOG_KEY as string | undefined;
    const host =
      (import.meta.env.PUBLIC_POSTHOG_HOST as string | undefined)?.trim() || 'https://eu.i.posthog.com';
    if (!key?.trim()) return;

    const applyConsent = async (analyticsAllowed: boolean) => {
      const posthog = (await import('posthog-js')).default;

      if (!analyticsAllowed) {
        if (sdkReady.current) {
          posthog.opt_out_capturing();
          posthog.reset();
        }
        return;
      }

      if (!sdkReady.current) {
        posthog.init(key.trim(), {
          api_host: host,
          person_profiles: 'identified_only',
          capture_pageview: true,
          capture_pageleave: true,
          persistence: 'localStorage+cookie',
          disable_surveys: true,
          /** GDPR: maskuj wszystkie pola formularzy w nagraniach sesji (hasła, e-mail itd.). */
          session_recording: {
            maskAllInputs: true,
            maskTextSelector: '[data-private], input, textarea',
          },
        });
        sdkReady.current = true;
      }
      posthog.opt_in_capturing();
    };

    void applyConsent(readAnalyticsConsent());

    const onConsent = (e: Event) => {
      const d = (e as CustomEvent<{ analytics?: boolean }>).detail;
      void applyConsent(!!d?.analytics);
    };

    window.addEventListener('si:cookie-consent', onConsent);
    return () => window.removeEventListener('si:cookie-consent', onConsent);
  }, []);

  return null;
}
