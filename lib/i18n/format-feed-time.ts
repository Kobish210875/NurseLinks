import type { Locale } from "@/lib/i18n/config";

/** Short relative / date label for feed timestamps (server-safe). */
export function formatFeedTimestamp(iso: string, locale: Locale): string {
  const date = new Date(iso);
  const now = Date.now();
  const sec = Math.round((date.getTime() - now) / 1000);
  const abs = Math.abs(sec);

  const rtfLocale = locale === "he" ? "he" : "en";
  const rtf = new Intl.RelativeTimeFormat(rtfLocale, { numeric: "auto" });

  if (abs < 45) {
    return locale === "he" ? "ממש עכשיו" : "just now";
  }
  if (abs < 3600) {
    return rtf.format(Math.round(sec / 60), "minute");
  }
  if (abs < 86400) {
    return rtf.format(Math.round(sec / 3600), "hour");
  }
  if (abs < 604800) {
    return rtf.format(Math.round(sec / 86400), "day");
  }

  return date.toLocaleDateString(locale === "he" ? "he-IL" : "en-US", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}
