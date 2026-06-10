import JobApplicationCard from "@/components/jobs/JobApplicationCard";
import MarkAllApplicationsRead from "@/components/jobs/MarkAllApplicationsRead";
import MarkApplicationsInboxSeen from "@/components/jobs/MarkApplicationsInboxSeen";
import type { JobApplicationInboxItem } from "@/lib/data/jobs";
import { truncateJobTitle } from "@/lib/jobs/field-limits";
import { createT, getMessages } from "@/lib/i18n/messages";
import { getLocale } from "@/lib/i18n/get-locale";

type JobApplicationsInboxProps = {
  items: JobApplicationInboxItem[];
};

/** Inner panel scroll on WEB (lg+); mobile uses page scroll — matches JobFeedList. */
const panelScrollClass =
  "lg:jobs-panel-scroll lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:dir-ltr";

const jobsBrowseHeightClass = "lg:max-h-[calc(100dvh-11rem)]";

export default async function JobApplicationsInbox({ items }: JobApplicationsInboxProps) {
  const locale = await getLocale();
  const t = createT(getMessages(locale));
  const hasUnread = items.some((item) => item.application.isUnread);

  if (items.length === 0) {
    return (
      <div className="feed-card p-6 text-center text-sm text-muted-foreground">
        {t("jobs.applicationsInboxEmpty")}
      </div>
    );
  }

  const grouped = new Map<string, JobApplicationInboxItem[]>();
  for (const item of items) {
    const list = grouped.get(item.job.id) ?? [];
    list.push(item);
    grouped.set(item.job.id, list);
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 lg:overflow-hidden">
      <MarkApplicationsInboxSeen />
      <section
        className={`feed-card flex min-w-0 flex-col gap-3 p-3 sm:p-4 lg:min-h-0 lg:flex-1 ${jobsBrowseHeightClass}`}
        aria-label={t("jobs.applicationsInboxTitle")}
      >
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <div className="text-start">
            <h2 className="text-sm font-semibold text-foreground">{t("jobs.applicationsInboxTitle")}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{t("jobs.applicationsInboxHint")}</p>
          </div>
          <MarkAllApplicationsRead visible={hasUnread} />
        </div>
        <div className={panelScrollClass}>
          <div className="space-y-4" dir="rtl">
            {[...grouped.entries()].map(([jobId, jobItems]) => {
              const job = jobItems[0]?.job;
              if (!job) {
                return null;
              }
              return (
                <section key={jobId} className="rounded-lg border border-border bg-muted/20 p-3">
                  <h3 className="job-detail-title mb-2 text-start text-sm font-semibold text-foreground">
                    {truncateJobTitle(job.title)}
                  </h3>
                  <ul className="space-y-2.5 sm:space-y-2">
                    {jobItems.map((item) => (
                      <li key={item.application.id}>
                        <JobApplicationCard application={item.application} />
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
