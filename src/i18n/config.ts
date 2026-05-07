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
      theme: {
        light: 'Jasny motyw',
        dark: 'Ciemny motyw',
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
      theme: {
        light: 'Light theme',
        dark: 'Dark theme',
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
