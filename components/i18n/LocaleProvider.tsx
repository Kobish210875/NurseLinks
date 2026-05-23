"use client";

import { createContext, useContext, useMemo } from "react";
import { useRouter } from "next/navigation";
import { setLocale as setLocaleCookie } from "@/app/actions/locale";
import type { Locale } from "@/lib/i18n/config";
import { createT, type Messages } from "@/lib/i18n/messages";

type LocaleContextValue = {
  locale: Locale;
  t: (key: string) => string;
  setLocale: (locale: Locale) => Promise<void>;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

type LocaleProviderProps = {
  children: React.ReactNode;
  locale: Locale;
  messages: Messages;
};

export function LocaleProvider({ children, locale, messages }: LocaleProviderProps) {
  const router = useRouter();

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      t: createT(messages),
      setLocale: async (nextLocale: Locale) => {
        if (nextLocale === locale) {
          return;
        }
        await setLocaleCookie(nextLocale);
        router.refresh();
      },
    }),
    [locale, messages, router],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return context;
}

export function useT() {
  return useLocale().t;
}
