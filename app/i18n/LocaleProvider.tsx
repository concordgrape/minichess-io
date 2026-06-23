"use client";

import { createContext, useContext, useState, useRef, useEffect, type ReactNode } from "react";
import en from "./en";
import { locales, LOCALE_COOKIE, type LocaleKey, type LocaleDict } from "./index";

function readLocaleCookie(): LocaleKey {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(/(?:^|; )locale=([^;]*)/);
  return (match?.[1] as LocaleKey | undefined) ?? "en";
}

interface LocaleContextValue {
  locale: LocaleDict;
  localeKey: LocaleKey;
  setLocale: (key: LocaleKey) => void;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: en,
  localeKey: "en",
  setLocale: () => {},
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [localeKey, setLocaleKey] = useState<LocaleKey>(readLocaleCookie);

  function setLocale(key: LocaleKey) {
    document.cookie = `${LOCALE_COOKIE}=${key}; path=/; max-age=31536000; SameSite=Lax`;
    setLocaleKey(key);
  }

  return (
    <LocaleContext.Provider value={{ locale: locales[localeKey], localeKey, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
