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
    <div className="space-y-4" aria-label={t("jobs.feedAria")}>
      {feed.mine.length > 0 ? (
        <section className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-start text-sm font-semibold text-foreground">
              {t("jobs.sectionMyPublished")}
            </h2>
            <MarkAllApplicationsRead visible={hasUnreadApplications} />
          </div>
          <div className="space-y-2">
            {feed.mine.map((job) => (
              <JobCard key={job.id} job={job} defaultApplicantName={defaultApplicantName} />
            ))}
          </div>
        </section>
      ) : null}

      {feed.community.length > 0 ? (
        <section className="space-y-2">
          {feed.mine.length > 0 ? (
            <h2 className="text-start text-sm font-semibold text-foreground">
              {t("jobs.sectionCommunity")}
            </h2>
          ) : null}
          <div className="space-y-2">
            {feed.community.map((job) => (
              <JobCard key={job.id} job={job} defaultApplicantName={defaultApplicantName} />
            ))}
          </div>
          <JobsPagination filters={filters} page={feed.page} totalPages={feed.totalPages} />
        </section>
      ) : null}
    </div>
  );
}
