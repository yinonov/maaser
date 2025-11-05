// i18n configuration for HaMaaser mobile app
// Supports Hebrew (RTL) and English (LTR)

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translations
import enTranslation from '../locales/en/translation.json';
import heTranslation from '../locales/he/translation.json';

const LANGUAGE_KEY = '@hamaaser:language';

// Language detector that uses AsyncStorage
const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lang: string) => void) => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLanguage) {
        callback(savedLanguage);
      } else {
        // Default to Hebrew
        callback('he');
      }
    } catch (error) {
      console.error('Error detecting language:', error);
      callback('he');
    }
  },
  init: () => {},
  cacheUserLanguage: async (language: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, language);
    } catch (error) {
      console.error('Error caching language:', error);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources: {
      en: {
        translation: enTranslation,
      },
      he: {
        translation: heTranslation,
      },
    },
    fallbackLng: 'he',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;

// Helper function to check if current language is RTL
export const isRTL = (): boolean => {
  return i18n.language === 'he';
};

// Helper function to get text direction
export const getTextDirection = (): 'rtl' | 'ltr' => {
  return isRTL() ? 'rtl' : 'ltr';
};
