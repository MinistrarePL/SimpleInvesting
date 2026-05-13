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
        rowsPerPage: 'Wierszy na stronę',
        showingRange: 'Wyświetlanie {{from}}–{{to}} z {{total}}',
        pageOf: 'Strona {{current}} z {{total}}',
        prevPage: 'Poprzednia strona',
        nextPage: 'Następna strona',
        infoAria: 'Wyjaśnienie kolumny:',
        info: {
          name:
            'ETF (Exchange-Traded Fund) to fundusz inwestycyjny notowany na giełdzie, który odwzorowuje wybrany indeks, sektor lub klasę aktywów. Kupujesz go jak zwykłą akcję, a w zamian dostajesz ekspozycję na dziesiątki lub setki spółek naraz. Nazwa i ticker pomagają szybko zidentyfikować fundusz.',
          exposure:
            'Kategoria mówi Ci, w co dany ETF inwestuje — np. w akcje z USA, obligacje europejskie czy surowce. Dzięki niej szybko zrozumiesz, na jaki rynek lub sektor stawia fundusz.',
          exchange:
            'Giełda, na której ETF jest notowany i możesz go kupić. Przykłady: XETRA (Niemcy), LSE (Londyn), NYSE (Nowy Jork). Giełda może mieć wpływ na walutę handlu i dostępność w Twoim domu maklerskim.',
          currency:
            'Waluta, w której ETF jest wyceniany i notowany na giełdzie. Jeśli Twoje konto działa w PLN, a ETF jest w USD, to zmiana kursu walut też wpływa na Twój wynik.',
          aum:
            'AUM (Assets Under Management) to łączna wartość aktywów zarządzanych przez fundusz. Im większy AUM, tym zazwyczaj ETF jest bardziej płynny (łatwiejszy do kupna i sprzedaży) i mniej podatny na zamknięcie.',
          ter:
            'TER (Total Expense Ratio) to roczny koszt zarządzania funduszem wyrażony w procentach. Np. TER 0,20% oznacza, że z każdego zainwestowanego 1000 zł rocznie zostanie pobrane 2 zł. Niższy TER = niższe koszty dla Ciebie.',
          ms:
            'Ocena Morningstar (od 1 do 5 gwiazdek) porównuje wyniki funduszu z podobnymi funduszami, uwzględniając ryzyko. 5 gwiazdek oznacza, że ETF wypadł najlepiej w swojej kategorii na tle ryzyka. To nie jest rekomendacja — to historyczne porównanie.',
          w1:
            'Zmiana ceny ETF w ciągu ostatniego tygodnia wyrażona w procentach. Wartość dodatnia (zielona) oznacza wzrost, ujemna (czerwona) — spadek.',
          m1: 'Zmiana ceny ETF w ciągu ostatniego miesiąca wyrażona w procentach.',
          q1: 'Zmiana ceny ETF w ciągu ostatnich 3 miesięcy (kwartał) wyrażona w procentach.',
          y1:
            'Zmiana ceny ETF w ciągu ostatniego roku wyrażona w procentach. To jeden z najczęściej używanych wskaźników do oceny wyników funduszu.',
        },
      },
      search: {
        placeholder: 'Filtruj po nazwie, symbolu, kategorii lub giełdzie…',
      },
      filters: {
        openBtn: 'Filtry',
        title: 'Filtry',
        empty: 'Filtry pojawią się tutaj wkrótce. W tym panelu skonfigurujesz zaawansowane kryteria wyszukiwania funduszy.',
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
        rowsPerPage: 'Rows per page',
        showingRange: 'Showing {{from}}–{{to}} of {{total}}',
        pageOf: 'Page {{current}} of {{total}}',
        prevPage: 'Previous page',
        nextPage: 'Next page',
        infoAria: 'Column explanation:',
        info: {
          name:
            'An ETF (Exchange-Traded Fund) is an investment fund traded on a stock exchange that tracks a specific index, sector, or asset class. You buy it like a regular stock, but gain exposure to dozens or even hundreds of companies at once. The name and ticker help you quickly identify the fund.',
          exposure:
            'The category tells you what the ETF invests in — for example, US equities, European bonds, or commodities. It helps you quickly understand which market or sector the fund targets.',
          exchange:
            'The stock exchange where the ETF is listed and where you can buy it. Examples: XETRA (Germany), LSE (London), NYSE (New York). The exchange affects the trading currency and availability at your broker.',
          currency:
            'The currency in which the ETF is priced and traded on the exchange. If your account is in a different currency, exchange rate fluctuations will also affect your returns.',
          aum:
            'AUM (Assets Under Management) is the total value of assets held by the fund. A larger AUM generally means better liquidity (easier to buy and sell) and a lower risk of the fund being closed.',
          ter:
            'TER (Total Expense Ratio) is the annual management fee expressed as a percentage. For example, a TER of 0.20% means you pay $2 per year for every $1,000 invested. A lower TER means lower costs for you.',
          ms:
            'The Morningstar rating (1 to 5 stars) compares a fund\'s risk-adjusted returns against similar funds. 5 stars means the ETF performed best in its category relative to risk. It is a historical comparison, not a buy recommendation.',
          w1:
            'The ETF\'s price change over the last week, shown as a percentage. A positive value (green) means a gain, negative (red) means a loss.',
          m1: 'The ETF\'s price change over the last month, shown as a percentage.',
          q1: 'The ETF\'s price change over the last 3 months (quarter), shown as a percentage.',
          y1:
            'The ETF\'s price change over the last year, shown as a percentage. This is one of the most common metrics for evaluating fund performance.',
        },
      },
      search: {
        placeholder: 'Filter by name, symbol, category, or exchange…',
      },
      filters: {
        openBtn: 'Filters',
        title: 'Filters',
        empty: 'Filters will appear here soon. This panel will host advanced search criteria for funds.',
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
