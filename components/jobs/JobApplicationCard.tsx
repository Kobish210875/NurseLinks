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
    <article className="rounded-md border border-border/80 bg-white px-3 py-2.5 text-start text-[15px] sm:text-sm">
      {jobTitle ? (
        <p className="mb-1 text-xs font-semibold text-muted-foreground">{jobTitle}</p>
      ) : null}
      <div className="flex items-center gap-2">
        {application.isUnread ? (
          <span className="inline-block size-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
        ) : null}
        <Link
          href={`/profile/${application.applicantId}`}
          className="font-medium text-primary hover:underline"
          onClick={() => onNavigate?.()}
        >
          {application.fullName}
        </Link>
      </div>
      <p className="mt-0.5 text-foreground" dir="ltr">
        <a href={`tel:${application.phone}`} className="hover:text-primary hover:underline">
          {application.phone}
        </a>
      </p>
      {application.note ? (
        <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{application.note}</p>
      ) : null}
      {application.cvUrl ? (
        <a
          href={application.cvUrl}
          target="_blank"
          rel="noopener noreferrer"
          download={application.cvFileName ?? undefined}
          className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10"
        >
          <CvDownloadIcon className="size-3.5 shrink-0" />
          <span>{t("jobs.downloadCv")}</span>
          {application.cvFileName ? (
            <span className="max-w-[10rem] truncate font-normal text-primary/80" dir="ltr">
              ({application.cvFileName})
            </span>
          ) : null}
        </a>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">{t("jobs.noCvAttached")}</p>
      )}
      <p className="mt-1.5 text-xs text-muted-foreground">{application.timeLabel}</p>
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
