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

function CvUploadIcon({ className }: { className?: string }) {
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
  const cvInputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [cvFileName, setCvFileName] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setError(null);
      setSuccess(false);
      setCvFileName(null);
      if (cvInputRef.current) {
        cvInputRef.current.value = "";
      }
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
      try {
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
        if (res?.error === "invalid-cv-file") {
          setError(t("jobs.applyInvalidCvFile"));
          return;
        }
        if (res?.error === "cv-storage-missing") {
          setError(t("jobs.applyCvStorageMissing"));
          return;
        }
        if (res?.error === "cv-upload-failed") {
          setError(t("jobs.applyCvUploadFailed"));
          return;
        }
        if (res?.error === "submit-failed") {
          setError(t("jobs.applyPayloadTooLarge"));
          return;
        }
        if (res?.error) {
          setError(t("jobs.applyFailed"));
          return;
        }
        setSuccess(true);
        router.refresh();
        window.setTimeout(() => onClose(), 1200);
      } catch {
        setError(t("jobs.applyPayloadTooLarge"));
      }
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
              <span id="apply-cv-label" className="text-sm font-medium text-foreground">
                {t("jobs.applyCv")}
              </span>
              <input
                ref={cvInputRef}
                id="apply-cv"
                name="cvFile"
                type="file"
                disabled={pending}
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="sr-only"
                aria-labelledby="apply-cv-label"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  setCvFileName(file?.name ?? null);
                }}
              />
              <button
                type="button"
                disabled={pending}
                onClick={() => cvInputRef.current?.click()}
                className="flex w-full items-center justify-start rounded-lg border border-border bg-white px-3 py-2 transition hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15 disabled:opacity-60"
              >
                <span className="inline-flex items-center gap-1.5 text-sm font-normal text-muted-foreground">
                  <CvUploadIcon className="size-4 shrink-0" />
                  <span>{t("jobs.applyCvBrowse")}</span>
                </span>
              </button>
              {cvFileName ? (
                <p className="truncate text-xs text-muted-foreground" dir="ltr" title={cvFileName}>
                  {cvFileName}
                </p>
              ) : null}
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
