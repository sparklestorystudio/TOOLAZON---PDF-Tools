import React, { createContext, useContext, useState, useEffect } from 'react';
import { LanguageCode } from '../types';
import { TRANS_DICT, LANGUAGES } from '../translations';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, fallback?: string) => string;
  availableLanguages: typeof LANGUAGES;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<LanguageCode>('en');

  // Load saved language from local storage if available
  useEffect(() => {
    const saved = localStorage.getItem('toolazon_lang') as LanguageCode;
    if (saved && TRANS_DICT[saved]) {
      setLanguage(saved);
    }
  }, []);

  const changeLanguage = (lang: LanguageCode) => {
    setLanguage(lang);
    localStorage.setItem('toolazon_lang', lang);
  };

  const t = (key: string, fallback?: string): string => {
    const dict = TRANS_DICT[language] || TRANS_DICT['en'];
    // 1. Try exact match
    if (dict[key]) return dict[key];
    
    // 2. Try English fallback if missing in current language
    if (TRANS_DICT['en'][key]) return TRANS_DICT['en'][key];
    
    // 3. Return fallback string or key
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t, availableLanguages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};
