"use client";

import { markJobFilled } from "@/app/actions/jobs";
import { useLocale, useT } from "@/components/i18n/LocaleProvider";
import JobApplyDialog from "@/components/jobs/JobApplyDialog";
import JobDetailDialog from "@/components/jobs/JobDetailDialog";
import type { JobListing } from "@/lib/data/jobs";
import { formatJobLocation } from "@/lib/jobs/format-location";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type JobCardProps = {
  job: JobListing;
  defaultApplicantName: string;
};

export default function JobCard({ job, defaultApplicantName }: JobCardProps) {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const locationLine = formatJobLocation(job.hospital, job.city, locale);

  function handleMarkFilled() {
    if (!job.isOwner || pending) {
      return;
    }
    if (!window.confirm(t("jobs.markFilledConfirm"))) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await markJobFilled(job.id);
      if (res?.error) {
        setError(t("jobs.markFilledFailed"));
        return;
      }
      setDetailOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <article className="feed-card overflow-hidden transition hover:border-primary/25">
        <button
          type="button"
          onClick={() => setDetailOpen(true)}
          className="flex w-full items-center gap-3 p-3 text-start transition hover:bg-muted/30"
          aria-label={t("jobs.openDetails")}
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h2 className="break-words text-sm font-semibold leading-snug text-foreground">
                {job.title}
              </h2>
              {job.isUnread ? (
                <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                  {t("jobs.newBadge")}
                </span>
              ) : null}
              {job.isOwner && job.hasNewApplications ? (
                <span
                  className="inline-block size-2 shrink-0 rounded-full bg-primary"
                  title={t("jobs.newApplication")}
                  aria-label={t("jobs.newApplication")}
                />
              ) : null}
              {!job.isOwner && job.hasApplied ? (
                <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                  {t("jobs.applySentShort")}
                </span>
              ) : null}
            </div>
            {locationLine ? (
              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                <span className="font-medium text-foreground/75">{t("jobs.jobLocation")}: </span>
                {locationLine}
              </p>
            ) : null}
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              <time dateTime={job.createdAt}>{job.timeLabel}</time>
            </p>
          </div>
          <span className="shrink-0 text-muted-foreground" aria-hidden="true">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="rtl:rotate-180"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </span>
        </button>
      </article>

      <JobDetailDialog
        job={job}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setError(null);
        }}
        onApply={() => {
          setDetailOpen(false);
          setApplyOpen(true);
        }}
        onMarkFilled={handleMarkFilled}
        markFilledPending={pending}
        footerError={error}
      />

      <JobApplyDialog
        jobId={job.id}
        jobTitle={job.title}
        defaultFullName={defaultApplicantName}
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
      />
    </>
  );
}
