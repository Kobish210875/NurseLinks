"use client";

import { submitJobApplication } from "@/app/actions/jobs";
import { useT } from "@/components/i18n/LocaleProvider";
import { isHebrewDisplayName } from "@/lib/validation/hebrew-name";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

type JobApplyDialogProps = {
  jobId: string;
  jobTitle: string;
  defaultFullName: string;
  open: boolean;
  onClose: () => void;
};

export default function JobApplyDialog({
  jobId,
  jobTitle,
  defaultFullName,
  open,
  onClose,
}: JobApplyDialogProps) {
  const t = useT();
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open) {
      setError(null);
      setSuccess(false);
      return;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) {
        onClose();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, pending]);

  if (!open) {
    return null;
  }

  function submit(formData: FormData) {
    setError(null);
    const fullName = String(formData.get("fullName") ?? "").trim();
    if (!isHebrewDisplayName(fullName, 120)) {
      setError(t("errors.invalid-hebrew-name"));
      return;
    }
    startTransition(async () => {
      const res = await submitJobApplication(jobId, formData);
      if (res?.error === "invalid-name") {
        setError(t("errors.invalid-hebrew-name"));
        return;
      }
      if (res?.error === "invalid-phone") {
        setError(t("jobs.applyInvalidPhone"));
        return;
      }
      if (res?.error === "already-applied") {
        setError(t("jobs.applyAlready"));
        return;
      }
      if (res?.error === "not-configured") {
        setError(t("jobs.applyNotConfigured"));
        return;
      }
      if (res?.error) {
        setError(t("jobs.applyFailed"));
        return;
      }
      setSuccess(true);
      router.refresh();
      window.setTimeout(() => onClose(), 1200);
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="job-apply-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) {
          onClose();
        }
      }}
    >
      <div ref={dialogRef} className="feed-card w-full max-w-md p-5 shadow-lg">
        <h2 id="job-apply-title" className="text-base font-semibold text-foreground">
          {t("jobs.applyTitle")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{jobTitle}</p>
        <p className="mt-2 text-xs text-muted-foreground">{t("jobs.applyHint")}</p>

        {success ? (
          <p className="mt-4 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary">
            {t("jobs.applySuccess")}
          </p>
        ) : (
          <form action={submit} className="mt-4 space-y-3">
            <div className="grid gap-1.5">
              <label htmlFor="apply-full-name" className="text-sm font-medium text-foreground">
                {t("jobs.applyName")}
              </label>
              <input
                id="apply-full-name"
                name="fullName"
                type="text"
                required
                maxLength={120}
                defaultValue={defaultFullName}
                disabled={pending}
                autoComplete="name"
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15 disabled:opacity-60"
              />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="apply-phone" className="text-sm font-medium text-foreground">
                {t("jobs.applyPhone")}
              </label>
              <input
                id="apply-phone"
                name="phone"
                type="tel"
                required
                inputMode="tel"
                placeholder="05XXXXXXXX"
                disabled={pending}
                autoComplete="tel"
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15 disabled:opacity-60"
                dir="ltr"
              />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="apply-note" className="text-sm font-medium text-foreground">
                {t("jobs.applyNote")}
              </label>
              <textarea
                id="apply-note"
                name="note"
                rows={3}
                maxLength={500}
                disabled={pending}
                className="w-full resize-y rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15 disabled:opacity-60"
              />
            </div>
            {error ? (
              <p className="text-xs text-red-600" role="alert">
                {error}
              </p>
            ) : null}
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={pending}
                className="flex-1 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
              >
                {pending ? "..." : t("jobs.applySubmit")}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={onClose}
                className="rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted disabled:opacity-60"
              >
                {t("profile.cancel")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
