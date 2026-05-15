import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
    if (import.meta.env.DEV && (!posthogKey || !surveyId)) {
      const missing = [
        !posthogKey && 'PUBLIC_POSTHOG_KEY',
        !surveyId && 'PUBLIC_POSTHOG_FEEDBACK_SURVEY_ID',
      ].filter(Boolean);
      console.info(
        `[SimpleInvesting] Przycisk „Feedback” nie jest pokazywany — brak ${missing.join(' i ')} w .env (oba są wymagane). Po dodaniu zrestartuj npm run dev.`,
      );
    }
  }, [posthogKey, surveyId]);

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
    const { default: posthog, DisplaySurveyType, SurveyPosition } = await import('posthog-js');

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
      position: SurveyPosition.NextToTrigger,
      selector: '#si-posthog-feedback-trigger',
    });
  }, [surveyId]);

  if (!surveyId || !posthogKey) return null;

  return (
    <div id="si-posthog-feedback-trigger" className="fixed right-0 bottom-16 z-[105] sm:bottom-24">
      <button
        type="button"
        className="flex min-h-[8.5rem] w-11 shrink-0 cursor-pointer items-center justify-center rounded-l-lg border border-theme-border border-r-0 bg-theme-surface py-4 text-sm font-semibold leading-tight tracking-wide text-theme-text shadow-md transition-colors hover:bg-theme-bg focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 focus-visible:ring-offset-theme-bg [text-orientation:mixed] [writing-mode:vertical-rl] sm:min-h-[9.5rem] sm:w-12"
        onClick={() => void openSurvey()}
        aria-label={t('feedback.buttonAria')}
        title={analyticsOk ? undefined : t('feedback.needAnalyticsHint')}
      >
        <span className="select-none">{t('feedback.button')}</span>
      </button>
    </div>
  );
}
