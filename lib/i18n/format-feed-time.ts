import type { Locale } from "@/lib/i18n/config";

/** Hebrew past-relative labels without redundant numeric suffixes (e.g. no "(2)" after שעתיים). */
function formatHebrewRelativePast(absSec: number): string {
  if (absSec < 45) {
    return "ממש עכשיו";
  }
  if (absSec < 3600) {
    const n = Math.max(1, Math.round(absSec / 60));
    if (n === 1) return "לפני דקה";
    if (n === 2) return "לפני שתי דקות";
    return `לפני ${n} דקות`;
  }
  if (absSec < 86400) {
    const n = Math.max(1, Math.round(absSec / 3600));
    if (n === 1) return "לפני שעה";
    if (n === 2) return "לפני שעתיים";
    return `לפני ${n} שעות`;
  }
  if (absSec < 604800) {
    const n = Math.max(1, Math.round(absSec / 86400));
    if (n === 1) return "לפני יום";
    if (n === 2) return "לפני יומיים";
    return `לפני ${n} ימים`;
  }
  return "";
}

/** Short relative / date label for feed timestamps (server-safe). */
export function formatFeedTimestamp(iso: string, locale: Locale): string {
  const date = new Date(iso);
  const now = Date.now();
  const sec = Math.round((date.getTime() - now) / 1000);
  const abs = Math.abs(sec);

  if (locale === "he") {
    const relative = formatHebrewRelativePast(abs);
    if (relative) return relative;
  } else {
    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
    if (abs < 45) {
      return "just now";
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
  }

  return date.toLocaleDateString(locale === "he" ? "he-IL" : "en-US", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}
