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
        w1: '1 Tydzień',
        m1: '1 Miesiąc',
        q1: '1 Kwartał',
        y1: '1 Rok',
        noData: 'Brak danych',
      },
      search: {
        placeholder: 'Filtruj tabelę po nazwie, symbolu lub kategorii...',
      },
      panel: {
        close: 'Zamknij panel',
        chartLine: 'Liniowy',
        chartCandle: 'Świecowy',
        details: 'Szczegóły funduszu',
        performance: 'Wyniki historyczne',
        mockDataNotice: 'Wykres zawiera dane poglądowe. Wymaga podłączenia API.',
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
        w1: '1 Week',
        m1: '1 Month',
        q1: '1 Quarter',
        y1: '1 Year',
        noData: 'No data',
      },
      search: {
        placeholder: 'Filter table by name, symbol, or category...',
      },
      panel: {
        close: 'Close panel',
        chartLine: 'Line',
        chartCandle: 'Candlestick',
        details: 'Fund details',
        performance: 'Historical performance',
        mockDataNotice: 'Chart contains mock data. API connection required.',
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
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'pl', // Domyślny język
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React sam chroni przed XSS
    }
  });

export default i18n;
