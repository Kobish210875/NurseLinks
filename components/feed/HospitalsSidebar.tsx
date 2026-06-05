"use client";

import AboutStoryCard from "@/components/feed/AboutStoryCard";
import ProTipCard from "@/components/feed/ProTipCard";
import InstitutionsPicker from "@/components/hospitals/InstitutionsPicker";
import { useT } from "@/components/i18n/LocaleProvider";
import type { InstitutionActivityMap } from "@/lib/data/institution-activity";

type HospitalsSidebarProps = {
  activity: InstitutionActivityMap;
};

export default function HospitalsSidebar({ activity }: HospitalsSidebarProps) {
  const t = useT();

  return (
    <aside
      className="flex h-full min-h-0 flex-col gap-4 overflow-hidden"
      aria-label={t("feed.navAria")}
    >
      <InstitutionsPicker activity={activity} showLegend className="min-h-0 flex-1" />
      <AboutStoryCard className="shrink-0" />
      <ProTipCard className="home-feed-pro-tip-card shrink-0" />
    </aside>
  );
}
