import JobApplicationCard from "@/components/jobs/JobApplicationCard";
import MarkAllApplicationsRead from "@/components/jobs/MarkAllApplicationsRead";
import MarkApplicationsInboxSeen from "@/components/jobs/MarkApplicationsInboxSeen";
import type { JobApplicationInboxItem } from "@/lib/data/jobs";
import { createT, getMessages } from "@/lib/i18n/messages";
import { getLocale } from "@/lib/i18n/get-locale";

type JobApplicationsInboxProps = {
  items: JobApplicationInboxItem[];
};

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
    <div className="flex flex-col gap-4">
      <MarkApplicationsInboxSeen />
      <div className="feed-card flex flex-col gap-3 p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-start">
            <h2 className="text-sm font-semibold text-foreground">{t("jobs.applicationsInboxTitle")}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{t("jobs.applicationsInboxHint")}</p>
          </div>
          <MarkAllApplicationsRead visible={hasUnread} />
        </div>
        <div className="space-y-4">
          {[...grouped.entries()].map(([jobId, jobItems]) => {
            const job = jobItems[0]?.job;
            if (!job) {
              return null;
            }
            return (
              <section key={jobId} className="rounded-lg border border-border bg-muted/20 p-3">
                <h3 className="mb-2 text-start text-sm font-semibold text-foreground">{job.title}</h3>
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
    </div>
  );
}
