import JobCard from "@/components/jobs/JobCard";
import MarkAllApplicationsRead from "@/components/jobs/MarkAllApplicationsRead";
import JobsPagination from "@/components/jobs/JobsPagination";
import type { JobFeedResult } from "@/lib/data/jobs";
import type { JobListFilters } from "@/lib/jobs/search-params";
import { createT, getMessages } from "@/lib/i18n/messages";
import { getLocale } from "@/lib/i18n/get-locale";

type JobFeedListProps = {
  feed: JobFeedResult | null;
  filters: JobListFilters;
  defaultApplicantName: string;
  hasSearchFilters: boolean;
  /** idle = prompt only; results = after user clicked Search */
  searchPhase?: "idle" | "results";
  searchSubmitted?: boolean;
};

/** Inner panel scroll only on WEB (lg+); mobile uses natural page scroll. */
const panelScrollClass =
  "lg:jobs-panel-scroll lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:dir-ltr";

const jobsBrowseHeightClass = "lg:max-h-[calc(100dvh-11rem)]";

export default async function JobFeedList({
  feed,
  filters,
  defaultApplicantName,
  hasSearchFilters,
  searchPhase = "results",
  searchSubmitted = false,
}: JobFeedListProps) {
  const locale = await getLocale();
  const t = createT(getMessages(locale));

  if (searchPhase === "idle") {
    return (
      <div
        className={`feed-card flex min-h-[12rem] flex-col items-center justify-center p-6 text-center text-sm leading-relaxed text-muted-foreground lg:min-h-0 lg:flex-1 ${jobsBrowseHeightClass}`}
      >
        <p className="max-w-sm">{t("jobs.searchPrompt")}</p>
      </div>
    );
  }

  if (!feed) {
    return null;
  }

  const isEmpty = feed.mine.length === 0 && feed.community.length === 0;
  const hasUnreadApplications = feed.mine.some((job) => job.hasNewApplications);

  if (isEmpty) {
    return (
      <div
        className={`feed-card flex min-h-0 flex-1 flex-col justify-center p-6 text-center text-sm text-muted-foreground ${jobsBrowseHeightClass}`}
      >
        {searchSubmitted && hasSearchFilters
          ? t("jobs.emptyFiltered")
          : t("jobs.empty")}
      </div>
    );
  }

  return (
    <section
      className={`feed-card flex min-w-0 flex-col p-3 sm:p-4 lg:min-h-0 lg:flex-1 ${jobsBrowseHeightClass}`}
      aria-label={t("jobs.feedAria")}
    >
      <div className={panelScrollClass}>
        <div className="space-y-4" dir="rtl">
          {feed.mine.length > 0 ? (
            <div className="rounded-xl border border-primary/25 bg-primary/[0.06] p-3 sm:p-3.5">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-primary/15 pb-2">
                <h2 className="text-start text-sm font-semibold text-primary">
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
                    variant="mine"
                  />
                ))}
              </div>
            </div>
          ) : null}

          {feed.community.length > 0 ? (
            <div className="rounded-xl border border-sky-200/90 bg-sky-50/80 p-3 sm:p-3.5">
              <h2 className="mb-2 border-b border-sky-200/80 pb-2 text-start text-sm font-semibold text-sky-900">
                {t("jobs.sectionCommunity")}
              </h2>
              <div className="space-y-1.5">
                {feed.community.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    defaultApplicantName={defaultApplicantName}
                    compact
                    variant="community"
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <div className="shrink-0 border-t border-border/60 pt-2">
        <JobsPagination
          filters={filters}
          page={feed.page}
          totalPages={feed.totalPages}
          searchSubmitted={searchSubmitted}
        />
      </div>
    </section>
  );
}
