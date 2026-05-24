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
};

export default async function JobFeedList({
  feed,
  filters,
  defaultApplicantName,
  hasSearchFilters,
}: JobFeedListProps) {
  const locale = await getLocale();
  const t = createT(getMessages(locale));
  const isEmpty = feed.mine.length === 0 && feed.community.length === 0;
  const hasUnreadApplications = feed.mine.some((job) => job.hasNewApplications);

  if (isEmpty) {
    return (
      <div className="feed-card p-6 text-center text-sm text-muted-foreground">
        {hasSearchFilters ? t("jobs.emptyFiltered") : t("jobs.empty")}
      </div>
    );
  }

  return (
    <div
      className="jobs-browse-panels flex flex-col gap-4 lg:max-h-[calc(100vh-11rem)] lg:min-h-0"
      aria-label={t("jobs.feedAria")}
    >
      {feed.mine.length > 0 ? (
        <section className="feed-card flex min-h-0 min-w-0 flex-col p-3 sm:p-4">
          <div className="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-2">
            <h2 className="text-start text-sm font-semibold text-foreground">
              {t("jobs.sectionMyPublished")}
            </h2>
            <MarkAllApplicationsRead visible={hasUnreadApplications} />
          </div>
          <div className="jobs-panel-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain pe-0.5 lg:max-h-[min(16rem,40vh)]">
            <div className="space-y-2">
              {feed.mine.map((job) => (
                <JobCard key={job.id} job={job} defaultApplicantName={defaultApplicantName} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {feed.community.length > 0 ? (
        <section className="feed-card flex min-h-0 min-w-0 flex-col p-3 sm:p-4">
          <h2 className="mb-2 shrink-0 text-start text-sm font-semibold text-foreground">
            {hasSearchFilters ? t("jobs.sectionSearchResults") : t("jobs.sectionCommunity")}
          </h2>
          <div className="jobs-panel-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain pe-0.5 lg:max-h-[min(20rem,48vh)]">
            <div className="space-y-2">
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
