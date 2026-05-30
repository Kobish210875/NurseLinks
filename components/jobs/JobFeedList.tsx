import JobCard from "@/components/jobs/JobCard";
import MarkAllApplicationsRead from "@/components/jobs/MarkAllApplicationsRead";
import JobsPagination from "@/components/jobs/JobsPagination";
import type { JobFeedResult } from "@/lib/data/jobs";
import type { JobListFilters } from "@/lib/jobs/search-params";
import { createT, getMessages } from "@/lib/i18n/messages";
import { getLocale } from "@/lib/i18n/get-locale";

type JobFeedListProps = {
  feed: JobFeedResult;
  filters: JobListFilters;
  defaultApplicantName: string;
  hasSearchFilters: boolean;
  viewMode?: "all" | "search";
};

const panelScrollClass =
  "jobs-panel-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain pe-0.5 max-md:max-h-[min(22rem,calc(100vh-14rem))]";

const jobsBrowseHeightClass = "lg:max-h-[calc(100dvh-11rem)]";

export default async function JobFeedList({
  feed,
  filters,
  defaultApplicantName,
  hasSearchFilters,
  viewMode = "search",
}: JobFeedListProps) {
  const locale = await getLocale();
  const t = createT(getMessages(locale));
  const isEmpty = feed.mine.length === 0 && feed.community.length === 0;
  const hasUnreadApplications = feed.mine.some((job) => job.hasNewApplications);
  const showSideBySide =
    viewMode === "all" && feed.mine.length > 0 && feed.community.length > 0;
  const isSearchView = viewMode === "search";

  if (isEmpty) {
    return (
      <div
        className={`feed-card p-6 text-center text-sm text-muted-foreground ${isSearchView ? `flex min-h-0 flex-1 flex-col justify-center ${jobsBrowseHeightClass}` : ""}`}
      >
        {hasSearchFilters ? t("jobs.emptyFiltered") : t("jobs.empty")}
      </div>
    );
  }

  if (isSearchView) {
    return (
      <section
        className={`feed-card flex min-h-0 min-w-0 flex-1 flex-col p-3 sm:p-4 ${jobsBrowseHeightClass}`}
        aria-label={t("jobs.feedAria")}
      >
        <div className={`${panelScrollClass} lg:max-h-none`} dir="ltr">
          <div className="space-y-4" dir="rtl">
            {feed.mine.length > 0 ? (
              <div>
                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-start text-sm font-semibold text-foreground">
                    {t("jobs.sectionMyPublished")}
                  </h2>
                  <MarkAllApplicationsRead visible={hasUnreadApplications} />
                </div>
                <div className="space-y-1.5">
                  {feed.mine.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      defaultApplicantName={defaultApplicantName}
                      compact
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {feed.community.length > 0 ? (
              <div>
                <h2 className="mb-1.5 text-start text-sm font-semibold text-foreground">
                  {hasSearchFilters ? t("jobs.sectionSearchResults") : t("jobs.sectionCommunity")}
                </h2>
                <div className="space-y-1.5">
                  {feed.community.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      defaultApplicantName={defaultApplicantName}
                      compact
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
        <div className="shrink-0 border-t border-border/60 pt-2">
          <JobsPagination filters={filters} page={feed.page} totalPages={feed.totalPages} />
        </div>
      </section>
    );
  }

  const listLayoutClass = showSideBySide
    ? `lg:grid lg:grid-cols-2 lg:grid-rows-1 lg:items-stretch lg:gap-4 ${jobsBrowseHeightClass}`
    : jobsBrowseHeightClass;

  const sectionClass =
    "feed-card flex min-h-0 min-w-0 flex-1 flex-col p-3 sm:p-4 lg:min-h-[12rem] lg:max-h-full";

  return (
    <div
      className={`flex min-h-0 flex-1 flex-col gap-4 ${listLayoutClass}`}
      aria-label={t("jobs.feedAria")}
    >
      {feed.mine.length > 0 ? (
        <section className={sectionClass}>
          <div className="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-2">
            <h2 className="text-start text-sm font-semibold text-foreground">
              {t("jobs.sectionMyPublished")}
            </h2>
            <MarkAllApplicationsRead visible={hasUnreadApplications} />
          </div>
          <div className={panelScrollClass} dir="ltr">
            <div className="space-y-2" dir="rtl">
              {feed.mine.map((job) => (
                <JobCard key={job.id} job={job} defaultApplicantName={defaultApplicantName} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {feed.community.length > 0 ? (
        <section className={sectionClass}>
          <h2 className="mb-2 shrink-0 text-start text-sm font-semibold text-foreground">
            {t("jobs.sectionCommunity")}
          </h2>
          <div className={panelScrollClass} dir="ltr">
            <div className="space-y-2" dir="rtl">
              {feed.community.map((job) => (
                <JobCard key={job.id} job={job} defaultApplicantName={defaultApplicantName} />
              ))}
            </div>
          </div>
          <div className="shrink-0 pt-2">
            <JobsPagination filters={filters} page={feed.page} totalPages={feed.totalPages} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
