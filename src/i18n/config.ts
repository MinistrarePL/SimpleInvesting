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
        clear: 'Wyczyść',
        apply: 'Pokaż {{count}} ETF-ów',
        searchIn: 'Szukaj…',
        none: 'Brak wyników',
        active: '{{count}} aktywnych',
        return: {
          title: 'Stopa zwrotu (min)',
          period: 'Okres',
          any: 'Dowolna',
          gt0: '> 0%',
          gt5: '> 5%',
          gt10: '> 10%',
          gt20: '> 20%',
          info: 'Pokazuje tylko fundusze, które w ostatnim roku zarobiły co najmniej tyle. Wyższy próg = krótsza, ale „mocniejsza” lista. Pamiętaj: wysokie zwroty z przeszłości nie gwarantują takich w przyszłości i często idą w parze z większym ryzykiem.',
        },
        category: {
          title: 'Ekspozycja / kategoria',
          info: 'W co tak naprawdę inwestujesz: akcje USA, obligacje europejskie, surowce, rynki wschodzące itd. To najważniejszy wybór — decyduje, na czym zarobisz, a na czym stracisz, gdy zmieni się sytuacja na rynku.',
        },
        issuer: {
          title: 'Emitent',
          info: 'Firma, która tworzy i zarządza funduszem (np. iShares, Vanguard, Xtrackers). Duzi, znani emitenci dają zwykle większą płynność, niższe koszty i mniejsze ryzyko zamknięcia ETF-a.',
        },
        morningstar: {
          title: 'Ocena Morningstar',
          info: 'Ocena 1–5 gwiazdek porównuje wyniki funduszu z podobnymi, uwzględniając ryzyko. Wyższa = historycznie lepiej niż konkurencja. To spojrzenie w przeszłość, nie rekomendacja na przyszłość.',
        },
        currency: {
          title: 'Waluta',
          info: 'Waluta notowania ETF-a. Jeśli inwestujesz w PLN, a fundusz jest w USD lub EUR, do Twojego wyniku dochodzi zmiana kursu walut — może pomóc, ale też zaszkodzić.',
        },
        leverage: {
          title: 'Fundusze lewarowane',
          yes: 'Tak',
          no: 'Nie',
          info: 'ETF lewarowany lub odwrócony mnoży dzienne zmiany indeksu (np. ×2, ×3 lub –1). To narzędzia spekulacyjne na krótki termin — w długim okresie zwykle tracą wartość i nie nadają się do „kup i trzymaj”.',
        },
        cost: {
          title: 'Koszty (TER)',
          low: 'Niskie (≤ 0,20%)',
          medium: 'Średnie (0,20–0,50%)',
          high: 'Wysokie (> 0,50%)',
          info: 'TER to roczna opłata za zarządzanie, którą fundusz pobiera „po cichu” z Twoich pieniędzy. Niski koszt (≤ 0,20%) typowy dla szerokich indeksów; wysoki (> 0,50%) typowy dla ETF-ów tematycznych lub aktywnych — w długim terminie potrafi mocno zjeść zysk.',
        },
        risk: {
          title: 'Ryzyko (zmienność)',
          very_low: 'Bardzo niskie',
          low: 'Niskie',
          medium: 'Średnie',
          high: 'Wysokie',
          very_high: 'Bardzo wysokie',
          info: 'Jak mocno cena ETF-a potrafi skakać w górę i w dół. Niskie ≈ obligacje krótkoterminowe (spokojnie, ale mało zarobisz), średnie ≈ szeroki rynek akcji, wysokie ≈ rynki wschodzące lub pojedyncze sektory. Fundusze lewarowane są automatycznie „bardzo wysokie”.',
        },
        aum: {
          title: 'Wielkość (AUM)',
          small: 'Małe (< 50M)',
          mid: 'Średnie (50M – 500M)',
          large: 'Duże (500M – 1B)',
          mega: 'Bardzo duże (> 1B)',
          info: 'Łączna kwota pieniędzy zarządzanych przez fundusz. Duże ETF-y są bardziej płynne (łatwiej je kupić i sprzedać po dobrej cenie) i rzadziej są zamykane. Małe (< 50M) bywają wycofywane, co zmusza do sprzedaży w nieodpowiednim momencie.',
        },
        domicile: {
          title: 'Kraj funduszu',
          info: 'Kraj, w którym formalnie zarejestrowany jest ETF (np. Irlandia, Luksemburg, USA). Wpływa na podatki od dywidend i to, jak rozliczasz fundusz w Polsce. Dla inwestora z UE zwykle wygodniejsze są fundusze irlandzkie i luksemburskie.',
        },
        yield: {
          title: 'Dywidenda',
          yes: 'Tak',
          no: 'Nie',
          info: 'Czy fundusz wypłaca dywidendy. „Tak” = ETF dystrybuujący — regularnie dostajesz wypłaty (dobre, jeśli chcesz pasywny dochód). „Nie” = ETF akumulujący — zyski są automatycznie reinwestowane, co zwykle daje lepszy efekt długoterminowy i bywa wygodniejsze podatkowo.',
        },
        age: {
          title: 'Wiek funduszu',
          lt1y: '< 1 rok',
          y1to3: '1 – 3 lata',
          y3to5: '3 – 5 lat',
          gt5y: '> 5 lat',
          info: 'Jak długo ETF istnieje na rynku. Starsze fundusze mają sprawdzoną historię w różnych warunkach (hossy, bessy, kryzysy), są zwykle większe i bardziej płynne. Bardzo młode (< 1 rok) trudniej ocenić.',
        },
        theme: {
          title: 'Temat',
          info: 'Konkretny pomysł inwestycyjny widoczny w nazwie funduszu (AI, lit, biotechnologia, woda itp.). Tematyczne ETF-y dają precyzyjny strzał w trend, ale są zwykle droższe, bardziej zmienne i mniej zdywersyfikowane niż fundusze na szeroki rynek.',
        },
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
        domicile: 'Kraj funduszu',
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
        clear: 'Clear',
        apply: 'Show {{count}} ETFs',
        searchIn: 'Search…',
        none: 'No results',
        active: '{{count}} active',
        return: {
          title: 'Return (min)',
          period: 'Period',
          any: 'Any',
          gt0: '> 0%',
          gt5: '> 5%',
          gt10: '> 10%',
          gt20: '> 20%',
          info: 'Shows only funds that gained at least this much over the past year. A higher bar means a shorter, more aggressive shortlist. Remember: strong past returns are no promise of the future and usually come with higher risk.',
        },
        category: {
          title: 'Exposure / category',
          info: 'What the ETF actually invests in: US stocks, European bonds, commodities, emerging markets and so on. This is your most important choice — it decides what drives your gains and losses when markets move.',
        },
        issuer: {
          title: 'Issuer',
          info: 'The company that builds and runs the fund (e.g. iShares, Vanguard, Xtrackers). Big, established issuers typically mean better liquidity, lower costs, and less risk of the fund being closed.',
        },
        morningstar: {
          title: 'Morningstar rating',
          info: '1–5 stars compare risk-adjusted returns against similar funds. More stars = historically better than peers. Backward-looking — not a buy recommendation for the future.',
        },
        currency: {
          title: 'Currency',
          info: 'The currency the ETF trades in. If your account is in a different currency, exchange-rate moves will add to (or subtract from) your returns on top of the fund itself.',
        },
        leverage: {
          title: 'Leveraged funds',
          yes: 'Yes',
          no: 'No',
          info: 'Leveraged or inverse ETFs multiply the daily move of an index (e.g. ×2, ×3 or –1). They are short-term speculation tools — over longer periods they tend to decay and are not suited for buy-and-hold investing.',
        },
        cost: {
          title: 'Cost (TER)',
          low: 'Low (≤ 0.20%)',
          medium: 'Medium (0.20–0.50%)',
          high: 'High (> 0.50%)',
          info: 'TER is the yearly management fee silently taken from your money. Low (≤ 0.20%) is typical for broad index ETFs; high (> 0.50%) is common for thematic or active funds — over many years it can eat a big chunk of your return.',
        },
        risk: {
          title: 'Risk (volatility)',
          very_low: 'Very low',
          low: 'Low',
          medium: 'Medium',
          high: 'High',
          very_high: 'Very high',
          info: 'How much the price can swing up and down. Low ≈ short-term bonds (calm but small returns), medium ≈ broad equity, high ≈ emerging markets or single sectors. Leveraged funds are automatically marked “Very high”.',
        },
        aum: {
          title: 'Size (AUM)',
          small: 'Small (< 50M)',
          mid: 'Mid (50M – 500M)',
          large: 'Large (500M – 1B)',
          mega: 'Very large (> 1B)',
          info: 'Total money the fund manages. Large ETFs are more liquid (easier to buy and sell at a fair price) and less likely to be closed. Small funds (< 50M) sometimes get wound down, forcing you to sell at a bad time.',
        },
        domicile: {
          title: 'Fund country',
          info: 'The country where the ETF is legally registered (e.g. Ireland, Luxembourg, US). It affects taxes on dividends and how you report the fund at home. For EU investors, Irish and Luxembourg funds are usually the most convenient.',
        },
        yield: {
          title: 'Dividend',
          yes: 'Yes',
          no: 'No',
          info: 'Whether the fund pays out dividends. “Yes” = distributing ETF — you receive regular payouts (good if you want passive income). “No” = accumulating ETF — profits are reinvested for you, which usually compounds better over time and is often more tax-efficient.',
        },
        age: {
          title: 'Fund age',
          lt1y: '< 1 year',
          y1to3: '1 – 3 years',
          y3to5: '3 – 5 years',
          gt5y: '> 5 years',
          info: 'How long the ETF has been around. Older funds have a track record across different market conditions (bull, bear, crises), tend to be larger and more liquid. Very young funds (< 1 year) are harder to judge.',
        },
        theme: {
          title: 'Theme',
          info: 'A specific investment idea visible in the fund name (AI, lithium, biotech, water, etc.). Thematic ETFs let you bet on a trend precisely, but tend to be pricier, more volatile, and less diversified than broad-market funds.',
        },
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
        domicile: 'Fund country',
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
