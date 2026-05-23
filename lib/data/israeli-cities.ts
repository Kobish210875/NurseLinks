import cities from "./israeli-cities-bilingual.json";
import type { Locale } from "@/lib/i18n/config";

export type CityEntry = { he: string; en: string };

/** Fixes RTL-flipped parentheses in source data: )שבט( → (שבט) */
export function normalizeHebrewCityName(name: string): string {
  return name.replace(/\)([^)]+)\(/g, "($1)");
}

const rawCities = cities as CityEntry[];

export const ISRAELI_CITIES: CityEntry[] = rawCities.map((c) => ({
  he: normalizeHebrewCityName(c.he),
  en: c.en,
}));

const citySetHe = new Set(ISRAELI_CITIES.map((c) => c.he));
const cityByHe = new Map(ISRAELI_CITIES.map((c) => [c.he, c]));
const cityByEnLower = new Map(
  ISRAELI_CITIES.map((c) => [c.en.toLowerCase(), c]),
);

/** Canonical Hebrew city name for DB storage, or null if invalid. */
export function resolveCityCanonical(city: string): string | null {
  const trimmed = city.trim();
  if (!trimmed) {
    return null;
  }
  const normalized = normalizeHebrewCityName(trimmed);
  if (citySetHe.has(normalized)) {
    return normalized;
  }
  if (citySetHe.has(trimmed)) {
    return trimmed;
  }
  return cityByEnLower.get(trimmed.toLowerCase())?.he ?? null;
}

export function isValidIsraeliCity(city: string) {
  return resolveCityCanonical(city) !== null;
}

export function getCityDisplayName(cityHe: string, locale: Locale) {
  const normalized = normalizeHebrewCityName(cityHe);
  if (locale === "en") {
    return cityByHe.get(normalized)?.en ?? cityByHe.get(cityHe)?.en ?? cityHe;
  }
  return cityByHe.has(normalized) ? normalized : cityHe;
}

export function filterIsraeliCities(query: string, locale: Locale = "he", limit = 12) {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const normalized = trimmed.toLowerCase();
  const matches: CityEntry[] = [];

  for (const city of ISRAELI_CITIES) {
    const label = locale === "en" ? city.en : city.he;
    const matchesQuery =
      label.toLowerCase().includes(normalized) ||
      city.he.includes(trimmed) ||
      city.en.toLowerCase().includes(normalized);

    if (matchesQuery) {
      matches.push(city);
      if (matches.length >= limit) {
        break;
      }
    }
  }

  return matches;
}

export function getCityLabel(entry: CityEntry, locale: Locale) {
  return locale === "en" ? entry.en : entry.he;
}
