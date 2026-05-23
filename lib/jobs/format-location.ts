import { getCityDisplayName } from "@/lib/data/israeli-cities";
import type { Locale } from "@/lib/i18n/config";

/** Single line for job location (supports legacy hospital + city rows). */
export function formatJobLocation(
  hospital: string | null | undefined,
  city: string | null | undefined,
  locale: Locale,
): string | null {
  const hospitalTrim = hospital?.trim() ?? "";
  const cityTrim = city?.trim() ?? "";
  if (!hospitalTrim && !cityTrim) {
    return null;
  }

  const cityLabel = cityTrim ? getCityDisplayName(cityTrim, locale) ?? cityTrim : null;
  if (hospitalTrim && cityLabel && !hospitalTrim.includes(cityLabel)) {
    return `${hospitalTrim}, ${cityLabel}`;
  }
  return hospitalTrim || cityLabel;
}
