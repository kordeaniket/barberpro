import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './en';
import mr from './mr';

const LANGUAGES = { en, mr };
const LANG_STORAGE_KEY = 'barberpro_app_language';

const I18nContext = createContext({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState('en');

  useEffect(() => {
    AsyncStorage.getItem(LANG_STORAGE_KEY)
      .then((saved) => {
        if (saved && LANGUAGES[saved]) {
          setLangState(saved);
        }
      })
      .catch(() => {});
  }, []);

  const setLang = useCallback(async (nextLang) => {
    if (!LANGUAGES[nextLang]) return;
    setLangState(nextLang);
    try {
      await AsyncStorage.setItem(LANG_STORAGE_KEY, nextLang);
    } catch {}
  }, []);

  const t = useCallback(
    (path, fallback) => {
      const parts = String(path).split('.');
      let cur = LANGUAGES[lang] || en;
      for (const p of parts) {
        if (cur && typeof cur === 'object' && p in cur) {
          cur = cur[p];
        } else {
          cur = undefined;
          break;
        }
      }
      if (typeof cur === 'string') return cur;
      // Fallback to English
      let enCur = en;
      for (const p of parts) {
        if (enCur && typeof enCur === 'object' && p in enCur) enCur = enCur[p];
        else {
          enCur = undefined;
          break;
        }
      }
      return typeof enCur === 'string' ? enCur : fallback || path;
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useTranslation = () => useContext(I18nContext);
