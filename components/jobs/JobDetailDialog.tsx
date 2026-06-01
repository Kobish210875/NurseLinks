"use client";

import { markJobApplicationsSeen } from "@/app/actions/jobs";
import JobApplicationCard from "@/components/jobs/JobApplicationCard";
import { useLocale, useT } from "@/components/i18n/LocaleProvider";
import type { JobListing } from "@/lib/data/jobs";
import { formatJobLocation } from "@/lib/jobs/format-location";
import { truncateJobBody, truncateJobTitle } from "@/lib/jobs/field-limits";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef } from "react";

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
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const markedReadRef = useRef(false);
  const scrollLockYRef = useRef(0);
  const locationLine = formatJobLocation(job.hospital, job.city, locale);
  const displayTitle = truncateJobTitle(job.title);
  const displayBody = truncateJobBody(job.body);
  const canApply = !job.isOwner && !job.hasApplied;

  useEffect(() => {
    if (!open) {
      markedReadRef.current = false;
      return;
    }

    scrollLockYRef.current = window.scrollY;
    const { overflow, position, top, width } = document.body.style;
    document.body.classList.add("job-detail-open");
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollLockYRef.current}px`;
    document.body.style.width = "100%";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !markFilledPending) {
        onClose();
      }
    }
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("job-detail-open");
      document.body.style.overflow = overflow;
      document.body.style.position = position;
      document.body.style.top = top;
      document.body.style.width = width;
      window.scrollTo(0, scrollLockYRef.current);
    };
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
      className="job-detail-overlay fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-3 max-md:px-4 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !markFilledPending) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        className="job-detail-panel feed-card flex max-h-[min(78dvh,calc(100dvh-var(--mobile-bottom-nav-offset)-4rem))] w-full min-w-0 max-w-md flex-col overflow-hidden rounded-2xl shadow-xl sm:max-h-[min(85vh,32rem)]"
      >
        <header className="shrink-0 border-b border-border px-4 py-3 text-start sm:px-5 sm:py-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={markFilledPending}
              aria-label={t("jobs.closeDetails")}
              className="job-detail-close shrink-0 rounded-full border border-border bg-white px-3 py-1.5 text-sm font-semibold text-muted-foreground transition hover:bg-muted disabled:opacity-60"
            >
              {t("jobs.closeDetails")}
            </button>
          </div>
          <div className="mt-2 min-w-0">
            <h2
              id={titleId}
              className="job-detail-title text-base font-semibold text-foreground sm:text-lg"
            >
              {displayTitle}
            </h2>
            {locationLine ? (
              <p className="mt-1 text-sm text-muted-foreground md:text-[15px]">
                <span className="font-medium text-foreground/80">{t("jobs.jobLocation")}: </span>
                {locationLine}
              </p>
            ) : null}
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              <time dateTime={job.createdAt}>{job.timeLabel}</time>
            </p>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 sm:px-5 sm:py-4">
          {displayBody ? (
            <p className="job-detail-body whitespace-pre-wrap text-start text-[15px] leading-relaxed text-foreground sm:text-sm">
              {displayBody}
            </p>
          ) : (
            <p className="text-[15px] text-muted-foreground sm:text-sm">{t("jobs.noDescription")}</p>
          )}

          {job.isOwner && job.applications.length > 0 ? (
            <section className="mt-4 rounded-lg border border-border bg-muted/25 p-3 text-start">
              <h3 className="mb-2 text-sm font-semibold text-foreground">{t("jobs.applicationsTitle")}</h3>
              <ul className="space-y-2">
                {job.applications.map((app) => (
                  <li key={app.id}>
                    <JobApplicationCard application={app} onNavigate={onClose} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {footerError ? (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {footerError}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 border-t border-border px-4 py-3 sm:px-5 sm:py-4">
          {canApply ? (
            <button
              type="button"
              onClick={onApply}
              className="rounded-full border border-primary px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/5"
            >
              {t("jobs.apply")}
            </button>
          ) : null}
          {!job.isOwner && job.hasApplied ? (
            <span className="self-center text-sm font-medium text-primary">{t("jobs.applySent")}</span>
          ) : null}
          {job.isOwner ? (
            <button
              type="button"
              onClick={onMarkFilled}
              disabled={markFilledPending}
              className="rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted disabled:opacity-60"
            >
              {markFilledPending ? "..." : t("jobs.markFilled")}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
