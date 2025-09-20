// src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import pt from './locales/pt.json';

i18n.use(LanguageDetector).use(initReactI18next).init({
    resources: {
        en: { translation: en.translation },
        pt: { translation: pt.translation },
    },
    // Remova a linha 'lng', permitindo que o LanguageDetector funcione
    fallbackLng: 'en',
    interpolation: {
        escapeValue: false,
    },
});

i18n.on('languageChanged', (lng) => {
    localStorage.setItem('i18nextLng', lng);
});

export default i18n;