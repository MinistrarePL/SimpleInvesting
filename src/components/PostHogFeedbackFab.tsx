import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare } from 'lucide-react';
import '../i18n/config';
import { readAnalyticsConsent } from '../lib/analyticsConsent';

declare global {
  interface Window {
    openCookieSettings?: () => void;
  }
}

/**
 * Stały przycisk opinii — ankieta PostHog z trybem **Presentation: API**.
 * Ustaw `PUBLIC_POSTHOG_FEEDBACK_SURVEY_ID` na UUID ankiety z URL / ustawień w PostHogu.
 * Widać też przed zgodą na analitykę — pierwszy klik otwiera ustawienia cookies (PostHog ładuje się dopiero po zgodzie).
 */
export default function PostHogFeedbackFab() {
  const { t, i18n } = useTranslation();
  const surveyId = (import.meta.env.PUBLIC_POSTHOG_FEEDBACK_SURVEY_ID as string | undefined)?.trim();
  const posthogKey = (import.meta.env.PUBLIC_POSTHOG_KEY as string | undefined)?.trim();

  const [analyticsOk, setAnalyticsOk] = useState(false);

  useEffect(() => {
    setAnalyticsOk(readAnalyticsConsent());
    const syncLang = () => {
      try {
        const raw = localStorage.getItem('si.lang');
        if (raw === 'pl' || raw === 'en') void i18n.changeLanguage(raw);
      } catch {
        /* skip */
      }
    };
    syncLang();

    const onConsent = (e: Event) => {
      const d = (e as CustomEvent<{ analytics?: boolean }>).detail;
      setAnalyticsOk(!!d?.analytics);
    };
    window.addEventListener('si:cookie-consent', onConsent);
    window.addEventListener('si:lang-change', syncLang);
    return () => {
      window.removeEventListener('si:cookie-consent', onConsent);
      window.removeEventListener('si:lang-change', syncLang);
    };
  }, [i18n]);

  const openSurvey = useCallback(async () => {
    if (!surveyId) return;
    if (!readAnalyticsConsent()) {
      window.openCookieSettings?.();
      return;
    }
    const { default: posthog, DisplaySurveyType } = await import('posthog-js');

    await new Promise<void>((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        resolve();
      };
      const tid = window.setTimeout(finish, 6000);
      const unsub = posthog.onSurveysLoaded(() => {
        window.clearTimeout(tid);
        unsub();
        finish();
      });
    });

    posthog.displaySurvey(surveyId, {
      displayType: DisplaySurveyType.Popover,
      ignoreConditions: true,
      ignoreDelay: true,
    });
  }, [surveyId]);

  if (!surveyId || !posthogKey) return null;

  return (
    <div className="fixed left-4 bottom-20 z-[105] md:left-5 md:bottom-24">
      <button
        type="button"
        className="flex items-center gap-2 rounded-full border border-theme-border bg-theme-surface px-4 py-2.5 text-sm font-semibold text-theme-text shadow-lg transition-colors hover:bg-theme-bg focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary"
        onClick={() => void openSurvey()}
        aria-label={t('feedback.buttonAria')}
        title={analyticsOk ? undefined : t('feedback.needAnalyticsHint')}
      >
        <MessageSquare className="h-5 w-5 shrink-0 text-theme-primary" aria-hidden />
        {t('feedback.button')}
      </button>
    </div>
  );
}
