"use client";

import { useT } from "@/components/i18n/LocaleProvider";

export default function ProTipCard() {
  const t = useT();

  return (
    <div className="feed-card border-accent/20 bg-accent/5 p-4 text-start">
      <p className="text-sm font-medium text-foreground">{t("feed.proTipTitle")}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("feed.proTipBody")}</p>
    </div>
  );
}
