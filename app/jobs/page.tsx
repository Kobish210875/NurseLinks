import JobFeedList from "@/components/jobs/JobFeedList";
import JobSearchPanel from "@/components/jobs/JobSearchPanel";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { MEDICAL_INSTITUTIONS } from "@/lib/data/medical-institutions";
import JobApplicationsInbox from "@/components/jobs/JobApplicationsInbox";
import { getJobApplicationsInbox, getJobFeed } from "@/lib/data/jobs";
import { getLocale } from "@/lib/i18n/get-locale";
import { createT, getMessages } from "@/lib/i18n/messages";
import { institutionCityLabel } from "@/lib/profile/display-professional";
import { parseJobListFilters } from "@/lib/jobs/search-params";
import { createClient } from "@/lib/supabase/server";

type JobsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function JobsBrowsePage({ searchParams }: JobsPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const locale = await getLocale();
  const t = createT(getMessages(locale));
  const sp = await searchParams;
  const view =
    sp.view === "all" ? "all" : sp.view === "applications" ? "applications" : "search";
  const filters = parseJobListFilters(sp);
  const published = sp.published === "1";

  const supabase = await createClient();

  if (view === "applications") {
    const inbox = await getJobApplicationsInbox(supabase, user.id, locale);
    return <JobApplicationsInbox items={inbox} />;
  }

  const effectiveFilters =
    view === "all" ? { q: "", institutionSlug: "", city: "", region: "", page: 1 } : filters;
  const feed = await getJobFeed(supabase, user.id, locale, effectiveFilters);

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

  const hasSearchFilters = Boolean(
    effectiveFilters.q ||
      effectiveFilters.institutionSlug ||
      effectiveFilters.city ||
      effectiveFilters.region,
  );

  return (
    <>
      {published ? (
        <p className="break-words rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 text-sm text-primary">
          {t("jobs.publishedBanner")}
        </p>
      ) : null}
      <div
        className={`jobs-browse-grid flex min-h-0 min-w-0 flex-1 flex-col gap-4 ${
          view === "search"
            ? "lg:grid lg:grid-cols-2 lg:grid-rows-1 lg:items-stretch lg:gap-4 lg:overflow-hidden lg:max-h-[calc(100dvh-11rem)]"
            : ""
        }`}
      >
        <div className="jobs-browse-feed order-2 flex min-h-0 min-w-0 flex-col lg:order-1 lg:min-h-0 lg:overflow-hidden">
          <JobFeedList
            feed={feed}
            filters={effectiveFilters}
            defaultApplicantName={user.fullName}
            hasSearchFilters={hasSearchFilters}
            viewMode={view === "all" ? "all" : "search"}
          />
        </div>
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
