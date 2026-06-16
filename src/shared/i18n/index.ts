import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import en from './resources/en.json';
import ru from './resources/ru.json';
import kk from './resources/kk.json';

const LANGUAGE_KEY = 'APP_LANGUAGE';

const languageDetector = {
  type: 'languageDetector',
  async: true,

  detect: async (callback: (lang: string) => void) => {
    try {
      if (Platform.OS === 'web') {
        const lang = localStorage.getItem(LANGUAGE_KEY);
        callback(lang || 'kk'); // <-- по умолчанию казахский
      } else {
        const lang = await AsyncStorage.getItem(LANGUAGE_KEY);
        callback(lang || 'kk'); // <-- по умолчанию казахский
      }
    } catch {
      callback('kk'); // <-- по умолчанию казахский
    }
  },

  init: () => {},

  cacheUserLanguage: async (lang: string) => {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(LANGUAGE_KEY, lang);
      } else {
        await AsyncStorage.setItem(LANGUAGE_KEY, lang);
      }
    } catch {}
  },
};

i18n
  .use(languageDetector as any)
  .use(initReactI18next)
  .init({
    fallbackLng: 'kk', // <-- базовый язык
    compatibilityJSON: 'v4',
    resources: {
      en: { translation: en },
      ru: { translation: ru },
      kk: { translation: kk },
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;