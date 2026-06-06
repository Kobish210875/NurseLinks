"use client";

import AboutStoryCard from "@/components/feed/AboutStoryCard";
import ProTipCard from "@/components/feed/ProTipCard";
import InstitutionsPicker from "@/components/hospitals/InstitutionsPicker";
import { useT } from "@/components/i18n/LocaleProvider";
import type { InstitutionActivityMap } from "@/lib/data/institution-activity";

type SidebarLeftProps = {
  institutionActivity: InstitutionActivityMap;
};

export default function SidebarLeft({ institutionActivity }: SidebarLeftProps) {
  const t = useT();

  return (
    <aside className="contents" aria-label={t("feed.navAria")}>
      <div className="home-feed-sidebar-left-scroll min-h-0 flex-1 overflow-hidden">
        <InstitutionsPicker
          activity={institutionActivity}
          showLegend
          className="home-feed-sidebar-institutions h-full min-h-0 overflow-hidden"
        />
      </div>
      <AboutStoryCard className="home-feed-sidebar-about shrink-0" />
      <ProTipCard className="home-feed-sidebar-tip shrink-0" />
    </aside>
  );
}
