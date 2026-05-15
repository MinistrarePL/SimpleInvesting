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

    /* `Right` → inline style `right:30px`; `.ph-survey` ma `bottom:0` → dół po prawej. Z-index PostHoga zasłania ten trigger. */
    posthog.displaySurvey(surveyId, {
      displayType: DisplaySurveyType.Popover,
      ignoreConditions: true,
      ignoreDelay: true,
      position: SurveyPosition.Right,
    });
  }, [surveyId]);

  if (!surveyId || !posthogKey) return null;

  return (
    <div id="si-posthog-feedback-trigger" className="fixed right-0 bottom-16 z-[105] md:bottom-24">
      <button
        type="button"
        className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-l-md border-y border-l border-zinc-700 border-r-0 bg-zinc-950 text-zinc-100 shadow-md transition-colors hover:bg-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 md:size-auto md:min-h-24 md:w-9 md:flex-col md:py-3 md:text-xs md:font-semibold md:leading-tight md:tracking-wide"
        onClick={() => void openSurvey()}
        aria-label={t('feedback.buttonAria')}
        title={analyticsOk ? undefined : t('feedback.needAnalyticsHint')}
      >
        <MessageSquare className="size-[1.125rem] shrink-0 md:hidden" strokeWidth={2} aria-hidden />
        <span className="hidden select-none md:block [text-orientation:mixed] [writing-mode:vertical-rl]">
          {t('feedback.button')}
        </span>
      </button>
    </div>
  );
}
