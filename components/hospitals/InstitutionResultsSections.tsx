import Link from "next/link";
import InstitutionJobCard from "@/components/hospitals/InstitutionJobCard";
import type { InstitutionColleague } from "@/lib/data/institution-colleagues";
import type { InstitutionOpenJob } from "@/lib/data/institution-jobs";

type InstitutionResultsLabels = {
  colleaguesTitle: string;
  colleaguesEmpty: string;
  colleaguesHint: string;
  message: string;
  jobsTitle: string;
  jobsHint: string;
  jobsEmpty: string;
  jobsOpenAll: string;
  jobsLocation: string;
  apply: string;
};

type InstitutionResultsSectionsProps = {
  institutionSlug: string;
  colleagues: InstitutionColleague[];
  openJobs: InstitutionOpenJob[];
  defaultApplicantName: string;
  labels: InstitutionResultsLabels;
  /** Mobile institutions page: jobs first, then colleagues. */
  jobsFirst?: boolean;
  compact?: boolean;
};

export default function InstitutionResultsSections({
  institutionSlug,
  colleagues,
  openJobs,
  defaultApplicantName,
  labels,
  jobsFirst = false,
  compact = false,
}: InstitutionResultsSectionsProps) {
  const cardClass = compact ? "feed-card p-4 text-start" : "feed-card p-6 text-start";
  const sectionGap = compact ? "space-y-3" : "space-y-4";

  const jobsSection = (
    <div className={cardClass}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">{labels.jobsTitle}</h2>
        <Link
          href={`/jobs?institution=${institutionSlug}`}
          className="text-xs font-medium text-primary hover:underline"
        >
          {labels.jobsOpenAll}
        </Link>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{labels.jobsHint}</p>

      {openJobs.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{labels.jobsEmpty}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {openJobs.map((job) => (
            <InstitutionJobCard
              key={job.id}
              job={job}
              defaultApplicantName={defaultApplicantName}
              applyLabel={labels.apply}
              jobsLocationLabel={labels.jobsLocation}
            />
          ))}
        </ul>
      )}
    </div>
  );

  const colleaguesSection = (
    <div className={cardClass}>
      <h2 className="text-sm font-semibold text-foreground">{labels.colleaguesTitle}</h2>
      <p className="mt-1 text-xs text-muted-foreground">{labels.colleaguesHint}</p>

      {colleagues.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{labels.colleaguesEmpty}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {colleagues.map((c) => (
            <li key={c.id} className="flex items-center gap-3">
              <Link
                href={`/profile/${c.id}`}
                className="flex size-11 shrink-0 overflow-hidden rounded-full border border-border bg-primary/10"
              >
                {c.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.avatarUrl} alt="" className="size-full object-cover" />
                ) : (
                  <span className="flex size-full items-center justify-center text-xs font-semibold text-primary">
                    {c.initials}
                  </span>
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/profile/${c.id}`}
                  className="font-semibold text-foreground hover:text-primary hover:underline"
                >
                  {c.fullName}
                </Link>
                {c.subtitle ? (
                  <p className="text-xs text-muted-foreground">{c.subtitle}</p>
                ) : null}
              </div>
              <Link
                href={`/messages/${c.id}`}
                className="shrink-0 rounded-full border border-primary px-3 py-1 text-xs font-medium text-primary transition hover:bg-primary/5"
              >
                {labels.message}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className={sectionGap}>
      {jobsFirst ? (
        <>
          {jobsSection}
          {colleaguesSection}
        </>
      ) : (
        <>
          {colleaguesSection}
          {jobsSection}
        </>
      )}
    </div>
  );
}
