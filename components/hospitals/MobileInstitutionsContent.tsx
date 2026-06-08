"use client";

import InstitutionResultsSections from "@/components/hospitals/InstitutionResultsSections";
import InstitutionsPicker from "@/components/hospitals/InstitutionsPicker";
import { useT } from "@/components/i18n/LocaleProvider";
import {
  institutionHasActivity,
  type InstitutionActivityMap,
} from "@/lib/data/institution-activity";
import type { InstitutionDetailsMap } from "@/lib/data/institution-details";
import {
  getInstitutionBySlug,
  getInstitutionsByRegionSorted,
  type InstitutionRegion,
} from "@/lib/data/medical-institutions";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type MobileInstitutionsContentProps = {
  activity: InstitutionActivityMap;
  detailsMap: InstitutionDetailsMap;
  defaultApplicantName: string;
};

function defaultSlugForRegion(region: InstitutionRegion, activity: InstitutionActivityMap): string | null {
  const institutions = getInstitutionsByRegionSorted(region);
  const withActivity = institutions.find((inst) => institutionHasActivity(activity[inst.slug]));
  return withActivity?.slug ?? institutions[0]?.slug ?? null;
}

/** Mobile-only institutions explorer — desktop users are sent back to home. */
export default function MobileInstitutionsContent({
  activity,
  detailsMap,
  defaultApplicantName,
}: MobileInstitutionsContentProps) {
  const t = useT();
  const router = useRouter();
  const [selectedSlug, setSelectedSlug] = useState<string | null>(() =>
    defaultSlugForRegion("center", activity),
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const redirectDesktop = () => {
      if (mq.matches) {
        router.replace("/home");
      }
    };
    redirectDesktop();
    mq.addEventListener("change", redirectDesktop);
    return () => mq.removeEventListener("change", redirectDesktop);
  }, [router]);

  const handleRegionChange = useCallback(
    (region: InstitutionRegion) => {
      setSelectedSlug(defaultSlugForRegion(region, activity));
    },
    [activity],
  );

  const institution = selectedSlug ? getInstitutionBySlug(selectedSlug) : undefined;
  const details = selectedSlug ? detailsMap[selectedSlug] : undefined;
  const colleagues = details?.colleagues ?? [];
  const openJobs = details?.openJobs ?? [];

  const labels = {
    colleaguesTitle: t("hospitals.colleaguesTitle"),
    colleaguesEmpty: t("hospitals.colleaguesEmpty"),
    colleaguesHint: t("hospitals.colleaguesHint"),
    message: t("network.message"),
    jobsTitle: t("hospitals.jobsTitle"),
    jobsHint: t("hospitals.jobsHint"),
    jobsEmpty: t("hospitals.jobsEmpty"),
    jobsOpenAll: t("hospitals.jobsOpenAll"),
    jobsLocation: t("jobs.jobLocation"),
    apply: t("jobs.apply"),
  };

  return (
    <div className="flex flex-col gap-3">
      <InstitutionsPicker
        activity={activity}
        showLegend
        className="min-h-0 shadow-sm"
        selectedSlug={selectedSlug}
        onSelect={setSelectedSlug}
        onRegionChange={handleRegionChange}
      />

      {institution ? (
        <div className="space-y-2">
          <div className="px-1 text-start">
            <h3 className="text-base font-semibold text-foreground">{institution.fullName}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">{institution.address}</p>
          </div>
          <InstitutionResultsSections
            institutionSlug={institution.slug}
            colleagues={colleagues}
            openJobs={openJobs}
            defaultApplicantName={defaultApplicantName}
            labels={labels}
            jobsFirst
            compact
          />
        </div>
      ) : (
        <p className="feed-card p-4 text-center text-sm text-muted-foreground">
          {t("hospitals.mobileSelectInstitution")}
        </p>
      )}
    </div>
  );
}
