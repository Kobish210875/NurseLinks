import { Suspense } from "react";
import { redirect } from "next/navigation";
import JobFeedList from "@/components/jobs/JobFeedList";
import JobSearchPanel from "@/components/jobs/JobSearchPanel";
import JobsBrowseSkeleton from "@/components/jobs/JobsBrowseSkeleton";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { MEDICAL_INSTITUTIONS } from "@/lib/data/medical-institutions";
import JobApplicationsInbox from "@/components/jobs/JobApplicationsInbox";
import { getJobApplicationsInbox, getJobFeed } from "@/lib/data/jobs";
import { getLocale } from "@/lib/i18n/get-locale";
import { createT, getMessages } from "@/lib/i18n/messages";
import { institutionCityLabel } from "@/lib/profile/display-professional";
import {
  isJobSearchSubmitted,
  parseJobListFilters,
} from "@/lib/jobs/search-params";
import { createClient } from "@/lib/supabase/server";

type JobsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function JobsBrowseContent({ searchParams }: JobsPageProps) {
  const [user, locale, sp, supabase] = await Promise.all([
    getCurrentUser(),
    getLocale(),
    searchParams,
    createClient(),
  ]);
  if (!user) {
    return null;
  }

  const t = createT(getMessages(locale));
  if (sp.view === "all") {
    redirect("/jobs?run=1");
  }

  const view = sp.view === "applications" ? "applications" : "search";
  const filters = parseJobListFilters(sp);
  const published = sp.published === "1";
  const searchSubmitted = isJobSearchSubmitted(sp);

  if (view === "applications") {
    const inbox = await getJobApplicationsInbox(supabase, user.id, locale);
    return <JobApplicationsInbox items={inbox} />;
  }

  const hasSearchFilters = Boolean(
    filters.institutionSlug || filters.city || filters.region,
  );

  const feed =
    view === "search" && searchSubmitted
      ? await getJobFeed(supabase, user.id, locale, filters)
      : null;

  const institutions = MEDICAL_INSTITUTIONS.map((inst) => ({
    slug: inst.slug,
    label: institutionCityLabel(inst),
  })).sort((a, b) => a.label.localeCompare(b.label, "he"));
  const cities = Array.from(
    new Set(MEDICAL_INSTITUTIONS.map((inst) => inst.locationShort).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b, "he"));
  const regions = [
    { value: "center", label: t("hospitals.regionCenter") },
    { value: "jerusalem", label: t("hospitals.regionJerusalem") },
    { value: "north", label: t("hospitals.regionNorth") },
    { value: "south", label: t("hospitals.regionSouth") },
  ];

  const searchGridClass =
    "lg:grid lg:grid-cols-2 lg:grid-rows-1 lg:items-stretch lg:gap-4 lg:overflow-hidden lg:max-h-[calc(100dvh-11rem)]";

  return (
    <>
      {published ? (
        <p className="break-words rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 text-sm text-primary">
          {t("jobs.publishedBanner")}
        </p>
      ) : null}
      <div
        className={`jobs-browse-grid flex min-h-0 min-w-0 flex-1 flex-col gap-4 ${
          view === "search" ? searchGridClass : ""
        }`}
      >
        {view === "search" ? (
          <div
            className={`jobs-browse-feed order-2 flex min-w-0 flex-col max-md:overflow-visible lg:order-1 lg:min-h-0 lg:overflow-hidden ${
              searchSubmitted ? "" : "max-md:hidden"
            }`}
          >
            <JobFeedList
              feed={feed}
              filters={filters}
              defaultApplicantName={user.fullName}
              hasSearchFilters={hasSearchFilters}
              searchPhase={searchSubmitted ? "results" : "idle"}
              searchSubmitted={searchSubmitted}
            />
          </div>
        ) : null}
        {view === "search" ? (
          <aside className="jobs-browse-search order-1 flex min-h-0 min-w-0 flex-col lg:order-2 lg:min-h-0">
            <JobSearchPanel
              initialInstitution={filters.institutionSlug}
              initialCity={filters.city}
              initialRegion={filters.region}
              institutions={institutions}
              cities={cities}
              regions={regions}
            />
          </aside>
        ) : null}
      </div>
    </>
  );
}

export default function JobsBrowsePage({ searchParams }: JobsPageProps) {
  return (
    <Suspense fallback={<JobsBrowseSkeleton />}>
      <JobsBrowseContent searchParams={searchParams} />
    </Suspense>
  );
}
