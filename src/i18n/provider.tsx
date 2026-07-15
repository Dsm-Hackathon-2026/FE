"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";

import { en, ko, type MessageKey } from "@/i18n/dictionaries";

export type Locale = "ko" | "en";
export type Translate = (key: MessageKey, values?: Record<string, string | number>) => string;

const STORAGE_KEY = "seongdeok-locale";
const CHANGE_EVENT = "seongdeok-locale-change";

function readLocale(): Locale {
  const storedLocale = window.localStorage.getItem(STORAGE_KEY);
  return storedLocale === "en" ? "en" : "ko";
}

function subscribeToLocale(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(CHANGE_EVENT, onStoreChange);
  };
}

type I18nContextValue = { locale: Locale; setLocale: (locale: Locale) => void; t: Translate };
const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore<Locale>(subscribeToLocale, readLocale, () => "ko");

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((nextLocale: Locale) => {
    window.localStorage.setItem(STORAGE_KEY, nextLocale);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const t = useCallback<Translate>((key, values) => {
    const template = (locale === "en" ? en : ko)[key];
    if (!values) return template;
    return Object.entries(values).reduce(
      (message, [name, value]) => message.replaceAll(`{${name}}`, String(value)),
      template,
    );
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);
  return <I18nContext value={value}>{children}</I18nContext>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used within I18nProvider");
  return value;
}
