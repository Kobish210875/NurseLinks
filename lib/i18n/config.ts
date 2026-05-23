export const LOCALE_COOKIE = "locale";

export type Locale = "he" | "en";

export const defaultLocale: Locale = "he";

export function isLocale(value: string | undefined): value is Locale {
  return value === "he" || value === "en";
}

export function getDirection(locale: Locale) {
  return locale === "he" ? "rtl" : "ltr";
}
