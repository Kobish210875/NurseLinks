"use client";

import Link from "next/link";
import { useT } from "@/components/i18n/LocaleProvider";
import type { JobApplicationView } from "@/lib/data/jobs";

type JobApplicationCardProps = {
  application: JobApplicationView;
  jobTitle?: string;
  onNavigate?: () => void;
};

export default function JobApplicationCard({
  application,
  jobTitle,
  onNavigate,
}: JobApplicationCardProps) {
  const t = useT();

  return (
    <article className="rounded-md border border-border/80 bg-white px-3 py-3 text-start sm:py-2.5">
      {jobTitle ? (
        <p className="mb-2 text-xs font-semibold text-muted-foreground">{jobTitle}</p>
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {application.isUnread ? (
            <span className="mt-1.5 inline-block size-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
          ) : null}
          <Link
            href={`/profile/${application.applicantId}`}
            className="break-words text-[15px] font-semibold text-primary hover:underline sm:text-sm"
            onClick={() => onNavigate?.()}
          >
            {application.fullName}
          </Link>
        </div>
        <time className="shrink-0 text-[11px] text-muted-foreground sm:text-xs">
          {application.timeLabel}
        </time>
      </div>

      <dl className="mt-2.5 space-y-2 border-t border-border/60 pt-2.5 sm:mt-2 sm:space-y-1.5 sm:pt-2">
        <div className="flex flex-col gap-0.5">
          <dt className="text-[11px] font-medium text-muted-foreground sm:text-xs">
            {t("jobs.applyPhone")}
          </dt>
          <dd className="m-0">
            <a
              href={`tel:${application.phone}`}
              dir="ltr"
              className="inline-block text-start text-[15px] font-medium text-foreground hover:text-primary hover:underline sm:text-sm"
            >
              {application.phone}
            </a>
          </dd>
        </div>

        {application.note ? (
          <div className="flex flex-col gap-0.5">
            <dt className="text-[11px] font-medium text-muted-foreground sm:text-xs">
              {t("jobs.applicationNoteLabel")}
            </dt>
            <dd className="m-0 whitespace-pre-wrap text-sm text-foreground">{application.note}</dd>
          </div>
        ) : null}

        <div className="flex flex-col gap-1">
          <dt className="text-[11px] font-medium text-muted-foreground sm:text-xs">
            {t("jobs.applicationCvLabel")}
          </dt>
          <dd className="m-0">
            {application.cvUrl ? (
              <a
                href={application.cvUrl}
                target="_blank"
                rel="noopener noreferrer"
                download={application.cvFileName ?? undefined}
                className="flex w-full flex-col gap-1 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5 text-start transition hover:bg-primary/10 sm:inline-flex sm:w-auto sm:flex-row sm:items-center sm:gap-1.5 sm:rounded-full sm:py-1.5"
              >
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <CvDownloadIcon className="size-3.5 shrink-0" />
                  {t("jobs.downloadCv")}
                </span>
                {application.cvFileName ? (
                  <span
                    className="break-all text-[11px] font-normal leading-snug text-primary/80 sm:max-w-[10rem] sm:truncate sm:break-normal"
                    dir="ltr"
                  >
                    {application.cvFileName}
                  </span>
                ) : null}
              </a>
            ) : (
              <p className="text-xs text-muted-foreground">{t("jobs.noCvAttached")}</p>
            )}
          </dd>
        </div>
      </dl>
    </article>
  );
}

function CvDownloadIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 3v12" />
      <path d="m7 8 5-5 5 5" />
      <path d="M5 21h14" />
    </svg>
  );
}
