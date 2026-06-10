"use client";

import { submitJobApplication } from "@/app/actions/jobs";
import { useT } from "@/components/i18n/LocaleProvider";
import { truncateJobTitle } from "@/lib/jobs/field-limits";
import { CV_FILE_ACCEPT } from "@/lib/jobs/cv-file";
import { isHebrewDisplayName } from "@/lib/validation/hebrew-name";
import { isValidIsraeliMobile } from "@/lib/validation/phone";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";

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
  const titleId = useId();
  const fullNameId = useId();
  const phoneId = useId();
  const cvId = useId();
  const cvLabelId = useId();
  const noteId = useId();
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

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);

    const fullName = String(formData.get("fullName") ?? "").trim();
    if (!fullName) {
      setError(t("jobs.applyNameRequired"));
      return;
    }
    if (!isHebrewDisplayName(fullName, 120)) {
      setError(t("jobs.applyInvalidName"));
      return;
    }

    const phoneRaw = String(formData.get("phone") ?? "").trim();
    if (!phoneRaw) {
      setError(t("jobs.applyPhoneRequired"));
      return;
    }
    if (!isValidIsraeliMobile(phoneRaw)) {
      setError(t("jobs.applyInvalidPhone"));
      return;
    }

    const cv = formData.get("cvFile");
    if (!(cv instanceof File) || cv.size === 0) {
      setError(t("jobs.applyCvRequired"));
      return;
    }
    startTransition(async () => {
      try {
        const res = await submitJobApplication(jobId, formData);
        if (res?.error === "invalid-name") {
          setError(t("jobs.applyInvalidName"));
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
        if (res?.error === "cv-required") {
          setError(t("jobs.applyCvRequired"));
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
      aria-labelledby={titleId}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) {
          onClose();
        }
      }}
    >
      <div ref={dialogRef} className="feed-card w-full max-w-md p-5 shadow-lg">
        <h2 id={titleId} className="text-base font-semibold text-foreground">
          {t("jobs.applyTitle")}
        </h2>
        <p className="job-detail-title mt-1 text-sm text-muted-foreground">{truncateJobTitle(jobTitle)}</p>
        <p className="mt-2 text-xs text-muted-foreground">{t("jobs.applyHint")}</p>

        {success ? (
          <p className="mt-4 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary">
            {t("jobs.applySuccess")}
          </p>
        ) : (
          <form noValidate onSubmit={submit} className="mt-4 space-y-3">
            <div className="grid gap-1.5">
              <label htmlFor={fullNameId} className="text-sm font-medium text-foreground">
                {t("jobs.applyName")}
              </label>
              <input
                id={fullNameId}
                name="fullName"
                type="text"
                maxLength={120}
                defaultValue={defaultFullName}
                disabled={pending}
                autoComplete="name"
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15 disabled:opacity-60"
              />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor={phoneId} className="text-sm font-medium text-foreground">
                {t("jobs.applyPhone")}
              </label>
              <input
                id={phoneId}
                name="phone"
                type="tel"
                inputMode="tel"
                placeholder="05XXXXXXXX"
                disabled={pending}
                autoComplete="tel"
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15 disabled:opacity-60"
                dir="ltr"
              />
            </div>
            <div className="grid gap-1.5">
              <span id={cvLabelId} className="text-sm font-medium text-foreground">
                {t("jobs.applyCv")}
              </span>
              <input
                ref={cvInputRef}
                id={cvId}
                name="cvFile"
                type="file"
                disabled={pending}
                accept={CV_FILE_ACCEPT}
                className="sr-only"
                aria-labelledby={cvLabelId}
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
              <label htmlFor={noteId} className="text-sm font-medium text-foreground">
                {t("jobs.applyNote")}
              </label>
              <textarea
                id={noteId}
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
