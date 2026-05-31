"use client";

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
    </aside>
  );
}
