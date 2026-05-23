"use client";

import Link from "next/link";
import { markJobApplicationsSeen } from "@/app/actions/jobs";
import { useLocale, useT } from "@/components/i18n/LocaleProvider";
import type { JobListing } from "@/lib/data/jobs";
import { formatJobLocation } from "@/lib/jobs/format-location";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

type JobDetailDialogProps = {
  job: JobListing;
  open: boolean;
  onClose: () => void;
  onApply: () => void;
  onMarkFilled: () => void;
  markFilledPending: boolean;
  footerError: string | null;
};

export default function JobDetailDialog({
  job,
  open,
  onClose,
  onApply,
  onMarkFilled,
  markFilledPending,
  footerError,
}: JobDetailDialogProps) {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  const markedReadRef = useRef(false);
  const locationLine = formatJobLocation(job.hospital, job.city, locale);
  const canApply = !job.isOwner && !job.hasApplied;

  useEffect(() => {
    if (!open) {
      markedReadRef.current = false;
      return;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !markFilledPending) {
        onClose();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, markFilledPending]);

  const hasUnreadApplications = job.applications.some((app) => app.isUnread);

  useEffect(() => {
    if (!open || !job.isOwner || !hasUnreadApplications || markedReadRef.current) {
      return;
    }
    markedReadRef.current = true;
    void (async () => {
      await markJobApplicationsSeen(job.id);
      router.refresh();
    })();
  }, [open, job.id, job.isOwner, hasUnreadApplications, router]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="job-detail-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !markFilledPending) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        className="feed-card max-h-[min(85vh,32rem)] w-full max-w-md overflow-y-auto p-5 shadow-lg"
      >
        <header className="text-start">
          <h2 id="job-detail-title" className="text-base font-semibold text-foreground">
            {job.title}
          </h2>
          {locationLine ? (
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="font-medium text-foreground/80">{t("jobs.jobLocation")}: </span>
              {locationLine}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-muted-foreground">
            <time dateTime={job.createdAt}>{job.timeLabel}</time>
          </p>
        </header>

        {job.body.trim() ? (
          <p className="mt-4 whitespace-pre-wrap text-start text-sm leading-relaxed text-foreground">
            {job.body}
          </p>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">{t("jobs.noDescription")}</p>
        )}

        {job.isOwner && job.applications.length > 0 ? (
          <section className="mt-4 rounded-lg border border-border bg-muted/25 p-3 text-start">
            <h3 className="mb-2 text-xs font-semibold text-foreground">{t("jobs.applicationsTitle")}</h3>
            <ul className="space-y-2">
              {job.applications.map((app) => (
                <li
                  key={app.id}
                  className="rounded-md border border-border/80 bg-white px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    {app.isUnread ? (
                      <span
                        className="inline-block size-2 shrink-0 rounded-full bg-primary"
                        aria-hidden="true"
                      />
                    ) : null}
                    <Link
                      href={`/profile/${app.applicantId}`}
                      className="font-medium text-primary hover:underline"
                      onClick={() => onClose()}
                    >
                      {app.fullName}
                    </Link>
                  </div>
                  <p className="mt-0.5 text-foreground" dir="ltr">
                    <a href={`tel:${app.phone}`} className="hover:text-primary hover:underline">
                      {app.phone}
                    </a>
                  </p>
                  {app.note ? (
                    <p className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">{app.note}</p>
                  ) : null}
                  <p className="mt-1 text-[10px] text-muted-foreground">{app.timeLabel}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {footerError ? (
          <p className="mt-3 text-xs text-red-600" role="alert">
            {footerError}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
          {canApply ? (
            <button
              type="button"
              onClick={onApply}
              className="rounded-full border border-primary px-4 py-1.5 text-sm font-medium text-primary transition hover:bg-primary/5"
            >
              {t("jobs.apply")}
            </button>
          ) : null}
          {!job.isOwner && job.hasApplied ? (
            <span className="self-center text-xs font-medium text-primary">{t("jobs.applySent")}</span>
          ) : null}
          {job.isOwner ? (
            <button
              type="button"
              onClick={onMarkFilled}
              disabled={markFilledPending}
              className="rounded-full border border-border bg-white px-4 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted disabled:opacity-60"
            >
              {markFilledPending ? "..." : t("jobs.markFilled")}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            disabled={markFilledPending}
            className="rounded-full border border-border bg-white px-4 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted disabled:opacity-60"
          >
            {t("profile.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
