"use client";

import { useState } from "react";
import JobApplyDialog from "@/components/jobs/JobApplyDialog";
import type { InstitutionOpenJob } from "@/lib/data/institution-jobs";

type InstitutionJobCardProps = {
  job: InstitutionOpenJob;
  defaultApplicantName: string;
  applyLabel: string;
  jobsLocationLabel: string;
};

export default function InstitutionJobCard({
  job,
  defaultApplicantName,
  applyLabel,
  jobsLocationLabel,
}: InstitutionJobCardProps) {
  const [applyOpen, setApplyOpen] = useState(false);

  return (
    <>
      <li className="rounded-lg border border-border bg-muted/20 px-3 py-2.5">
        <p className="text-sm font-semibold text-foreground">{job.title}</p>
        {job.bodyPreview ? <p className="mt-1 text-xs text-muted-foreground">{job.bodyPreview}</p> : null}
        <p className="mt-1 text-xs text-muted-foreground">
          {job.city ? `${jobsLocationLabel}: ${job.city} · ` : ""}
          <time dateTime={job.createdAt}>{job.timeLabel}</time>
        </p>
        <button
          type="button"
          onClick={() => setApplyOpen(true)}
          className="mt-2 rounded-full border border-primary px-3 py-1 text-xs font-medium text-primary transition hover:bg-primary/5"
        >
          {applyLabel}
        </button>
      </li>
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
