"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

import en from "@/content/i18n/en.json";
import zh from "@/content/i18n/zh.json";

export type Locale = "en" | "zh";
type Dict = Record<string, string>;

const dicts: Record<Locale, Dict> = { en, zh };

interface I18nContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: "en",
  setLocale: () => {},
  t: (k) => dicts.en[k] ?? k,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("devforge:locale") as Locale | null;
    if (saved && (saved === "en" || saved === "zh")) setLocaleState(saved);
    setMounted(true);
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("devforge:locale", l);
  };

  const t = (key: string): string => dicts[locale]?.[key] ?? key;

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
