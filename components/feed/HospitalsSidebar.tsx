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
    <aside className="flex flex-col gap-4" aria-label={t("feed.navAria")}>
      <InstitutionsPicker activity={activity} showLegend />
      <AboutStoryCard />
      <ProTipCard />
    </aside>
  );
}
