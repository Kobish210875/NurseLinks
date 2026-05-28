import Link from "next/link";
import InstitutionJobCard from "@/components/hospitals/InstitutionJobCard";
import type { InstitutionColleague } from "@/lib/data/institution-colleagues";
import type { InstitutionOpenJob } from "@/lib/data/institution-jobs";
import type { MedicalInstitution } from "@/lib/data/medical-institutions";

type InstitutionPageProps = {
  institution: MedicalInstitution;
  colleagues: InstitutionColleague[];
  openJobs: InstitutionOpenJob[];
  defaultApplicantName: string;
  regionLabel: string;
  labels: {
    back: string;
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
};

export default function InstitutionPage({
  institution,
  colleagues,
  openJobs,
  defaultApplicantName,
  regionLabel,
  labels,
}: InstitutionPageProps) {
  return (
    <div className="space-y-4">
      <Link href="/home" className="text-sm font-medium text-primary hover:underline">
        {labels.back}
      </Link>

      <div className="feed-card p-6 text-start">
        <p className="text-xs font-medium text-accent">{regionLabel}</p>
        <h1 className="mt-1 text-xl font-bold text-foreground">{institution.fullName}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{institution.address}</p>
      </div>

      <div className="feed-card p-6 text-start">
        <h2 className="text-sm font-semibold text-foreground">{labels.colleaguesTitle}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{labels.colleaguesHint}</p>

        {colleagues.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">{labels.colleaguesEmpty}</p>
        ) : (
          <ul className="mt-4 space-y-3">
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

      <div className="feed-card p-6 text-start">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">{labels.jobsTitle}</h2>
          <Link
            href={`/jobs?institution=${institution.slug}`}
            className="text-xs font-medium text-primary hover:underline"
          >
            {labels.jobsOpenAll}
          </Link>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{labels.jobsHint}</p>

        {openJobs.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">{labels.jobsEmpty}</p>
        ) : (
          <ul className="mt-4 space-y-3">
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
    </div>
  );
}
