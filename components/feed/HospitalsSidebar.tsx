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
    <aside className="home-feed-sidebar-left" aria-label={t("feed.navAria")}>
      <InstitutionsPicker
        activity={activity}
        showLegend
        className="home-feed-sidebar-institutions min-h-0 overflow-hidden"
      />
      <ProTipCard className="home-feed-sidebar-tip" />
      <AboutStoryCard className="home-feed-sidebar-about" />
    </aside>
  );
}
