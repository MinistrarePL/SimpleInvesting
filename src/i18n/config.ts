import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  pl: {
    translation: {
      header: {
        title: 'Porównywarka ETF',
      },
      table: {
        name: 'Nazwa ETF',
        exposure: 'Ekspozycja / Kategoria',
        returns: 'Stopy zwrotu',
        currency: 'Waluta',
        exchange: 'Giełda',
        aum: 'AUM',
        ter: 'TER',
        ms: 'MS',
        w1: '1 Tydzień',
        m1: '1 Miesiąc',
        q1: '1 Kwartał',
        y1: '1 Rok',
        noData: 'Brak danych',
      },
      search: {
        placeholder: 'Filtruj po nazwie, symbolu, kategorii lub giełdzie…',
      },
      panel: {
        close: 'Zamknij panel',
        chartLine: 'Liniowy',
        chartCandle: 'Świecowy',
        details: 'Szczegóły funduszu',
        performance: 'Wyniki historyczne',
        chartLoading: 'Ładowanie wykresu…',
        chartLoadError: 'Nie udało się załadować danych wykresu.',
        chartEmpty: 'Brak danych historycznych dla tego zakresu.',
        range1m: '1M',
        range3m: '3M',
        range6m: '6M',
        range1y: '1R',
        range5y: '5L',
        loadingDetail: 'Ładowanie danych fundamentalnych…',
        loadError: 'Nie udało się pobrać pełnych danych',
        description: 'Opis',
        keyFacts: 'Kluczowe informacje',
        issuer: 'Emitent',
        domicile: 'Domicyl',
        inception: 'Data startu',
        aum: 'Aktywa (AUM)',
        ter: 'TER (koszty)',
        yield: 'Dywidenda (yield)',
        holdingsCount: 'Liczba spółek w portfelu',
        morningstar: 'Morningstar',
        riskReturn: 'Ryzyko i zwroty (Morningstar)',
        retYtd: 'Zwrot YTD',
        ret3y: 'Zwrot 3Y (śr. roczny)',
        ret5y: 'Zwrot 5Y (śr. roczny)',
        ret10y: 'Zwrot 10Y (śr. roczny)',
        vol1y: 'Zmienność 1Y',
        vol3y: 'Zmienność 3Y',
        sharpe3y: 'Sharpe 3Y',
        beta: 'Beta (5Y)',
        fiftyTwoWeek: 'Zakres 52 tyg.',
        sectors: 'Sektory',
        regions: 'Regiony',
        topHoldings: 'Top 10 holdingów',
        holdingName: 'Nazwa',
        holdingSector: 'Sektor',
      },
      theme: {
        light: 'Jasny motyw',
        dark: 'Ciemny motyw',
      },
      auth: {
        login: 'Logowanie',
        register: 'Rejestracja',
        loginRegisterBtn: 'Logowanie / Rejestracja',
        logout: 'Wyloguj',
        email: 'Adres e-mail',
        password: 'Hasło',
        submitLogin: 'Zaloguj',
        submitRegister: 'Załóż konto',
        noAccount: 'Nie masz konta?',
        hasAccount: 'Masz już konto?',
        successRegister: 'Sprawdź skrzynkę e-mail, aby potwierdzić rejestrację!',
        error: 'Wystąpił błąd podczas uwierzytelniania.',
        forgotPassword: 'Zapomniałeś hasła?',
        resetPassword: 'Zresetuj hasło',
        sendResetLink: 'Wyślij link do resetu',
        backToLogin: 'Wróć do logowania',
        successReset: 'Link do resetu hasła został wysłany na Twój e-mail.',
        updatePassword: 'Ustaw nowe hasło',
        newPassword: 'Nowe hasło',
        submitUpdate: 'Zaktualizuj hasło',
        successUpdate: 'Hasło zostało pomyślnie zaktualizowane!',
        orContinueWith: 'lub kontynuuj za pomocą',
        google: 'Google',
        legalPrefix: 'Akceptuję ',
        termsLink: 'regulamin serwisu',
        legalMiddle: ' i ',
        privacyLink: 'politykę prywatności',
        mustAcceptLegal: 'Aby założyć konto, musisz zaakceptować regulamin i politykę prywatności.',
      }
    }
  },
  en: {
    translation: {
      header: {
        title: 'ETF Comparator',
      },
      table: {
        name: 'ETF Name',
        exposure: 'Exposure / Category',
        returns: 'Returns',
        currency: 'Currency',
        exchange: 'Exchange',
        aum: 'AUM',
        ter: 'TER',
        ms: 'MS',
        w1: '1 Week',
        m1: '1 Month',
        q1: '1 Quarter',
        y1: '1 Year',
        noData: 'No data',
      },
      search: {
        placeholder: 'Filter by name, symbol, category, or exchange…',
      },
      panel: {
        close: 'Close panel',
        chartLine: 'Line',
        chartCandle: 'Candlestick',
        details: 'Fund details',
        performance: 'Historical performance',
        chartLoading: 'Loading chart…',
        chartLoadError: 'Could not load chart data.',
        chartEmpty: 'No historical data for this range.',
        range1m: '1M',
        range3m: '3M',
        range6m: '6M',
        range1y: '1Y',
        range5y: '5Y',
        loadingDetail: 'Loading fundamental data…',
        loadError: 'Could not load full details',
        description: 'Description',
        keyFacts: 'Key facts',
        issuer: 'Issuer',
        domicile: 'Domicile',
        inception: 'Inception date',
        aum: 'Assets (AUM)',
        ter: 'TER (expense ratio)',
        yield: 'Yield (TTM)',
        holdingsCount: 'Holdings count',
        morningstar: 'Morningstar',
        riskReturn: 'Risk & return (Morningstar)',
        retYtd: 'Return YTD',
        ret3y: 'Return 3Y (ann.)',
        ret5y: 'Return 5Y (ann.)',
        ret10y: 'Return 10Y (ann.)',
        vol1y: 'Volatility 1Y',
        vol3y: 'Volatility 3Y',
        sharpe3y: 'Sharpe 3Y',
        beta: 'Beta (5Y)',
        fiftyTwoWeek: '52-week range',
        sectors: 'Sectors',
        regions: 'Regions',
        topHoldings: 'Top 10 holdings',
        holdingName: 'Name',
        holdingSector: 'Sector',
      },
      theme: {
        light: 'Light theme',
        dark: 'Dark theme',
      },
      auth: {
        login: 'Log in',
        register: 'Sign up',
        loginRegisterBtn: 'Login / Register',
        logout: 'Log out',
        email: 'Email address',
        password: 'Password',
        submitLogin: 'Log in',
        submitRegister: 'Create account',
        noAccount: "Don't have an account?",
        hasAccount: 'Already have an account?',
        successRegister: 'Check your email to confirm registration!',
        error: 'An authentication error occurred.',
        forgotPassword: 'Forgot password?',
        resetPassword: 'Reset password',
        sendResetLink: 'Send reset link',
        backToLogin: 'Back to login',
        successReset: 'Password reset link sent to your email.',
        updatePassword: 'Set new password',
        newPassword: 'New password',
        submitUpdate: 'Update password',
        successUpdate: 'Password has been successfully updated!',
        orContinueWith: 'or continue with',
        google: 'Google',
        legalPrefix: 'I accept the ',
        termsLink: 'terms of service',
        legalMiddle: ' and the ',
        privacyLink: 'privacy policy',
        mustAcceptLegal: 'You must accept the terms of service and privacy policy to create an account.',
      }
    }
  }
};

const initialLang = (() => {
  if (typeof window === 'undefined') return 'pl';
  try {
    const stored = localStorage.getItem('si.lang');
    if (stored === 'pl' || stored === 'en') return stored;
  } catch (e) {}
  return 'pl';
})();

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
