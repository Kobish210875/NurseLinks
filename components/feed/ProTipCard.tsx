"use client";

import { useT } from "@/components/i18n/LocaleProvider";

type ProTipCardProps = {
  className?: string;
};

export default function ProTipCard({ className = "" }: ProTipCardProps) {
  const t = useT();

  return (
    <div className={`feed-card border-accent/20 bg-accent/5 p-4 text-start ${className}`}>
      <p className="text-sm font-medium text-foreground">{t("feed.proTipTitle")}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("feed.proTipBody")}</p>
    </div>
  );
}
