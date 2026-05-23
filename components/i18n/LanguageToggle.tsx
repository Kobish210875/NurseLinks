"use client";

import { useLocale } from "./LocaleProvider";

export default function LanguageToggle() {
  const { locale, setLocale, t } = useLocale();
  const nextLocale = locale === "he" ? "en" : "he";
  const label = locale === "he" ? t("lang.switchToEn") : t("lang.switchToHe");

  return (
    <button
      type="button"
      onClick={() => setLocale(nextLocale)}
      className="rounded-md border border-border bg-white px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
      aria-label={t("lang.label")}
    >
      {label}
    </button>
  );
}
