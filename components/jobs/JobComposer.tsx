"use client";

import { createJob } from "@/app/actions/jobs";
import { useT } from "@/components/i18n/LocaleProvider";
import InstitutionSelect from "@/components/profile/InstitutionSelect";
import { INSTITUTION_OTHER_SLUG } from "@/lib/data/medical-institutions";
import { JOB_BODY_MAX_LENGTH, JOB_TITLE_MAX_LENGTH } from "@/lib/jobs/field-limits";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";

export default function JobComposer() {
  const t = useT();
  const router = useRouter();
  const jobTitleId = useId();
  const jobBodyId = useId();
  const institutionId = useId();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [institutionSlug, setInstitutionSlug] = useState("");
  const isOtherInstitution = institutionSlug === INSTITUTION_OTHER_SLUG;

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await createJob(formData);
      if (res?.error === "invalid-institution") {
        setError(t("jobs.invalidInstitution"));
        return;
      }
      if (res?.error) {
        setError(t("jobs.publishFailed"));
        return;
      }
      router.push("/jobs?published=1");
      router.refresh();
    });
  }

  return (
    <form action={submit} className="feed-card space-y-4 p-4">
      <div className="grid gap-1.5">
        <label htmlFor={jobTitleId} className="text-sm font-medium text-foreground">
          {t("jobs.fieldTitle")}
        </label>
        <input
          id={jobTitleId}
          name="title"
          type="text"
          required
          maxLength={JOB_TITLE_MAX_LENGTH}
          disabled={pending}
          placeholder={t("jobs.fieldTitlePlaceholder")}
          className="w-full max-w-full rounded-lg border border-border bg-white px-3 py-2 text-base outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15 disabled:opacity-60 md:text-sm"
        />
      </div>
      <InstitutionSelect
        name="workplaceInstitution"
        labelKey="jobs.fieldHospital"
        placeholderKey="profile.institutionPlaceholder"
        showCity
        disabled={pending}
        triggerId={institutionId}
        onSlugChange={setInstitutionSlug}
      />
      {isOtherInstitution ? (
        <p className="text-xs text-muted-foreground">{t("jobs.institutionOtherHint")}</p>
      ) : null}
      <div className="grid gap-1.5">
        <label htmlFor={jobBodyId} className="text-sm font-medium text-foreground">
          {t("jobs.fieldDescription")}
        </label>
        <textarea
          id={jobBodyId}
          name="body"
          rows={4}
          required
          maxLength={JOB_BODY_MAX_LENGTH}
          disabled={pending}
          placeholder={
            isOtherInstitution
              ? t("jobs.fieldDescriptionPlaceholderOther")
              : t("jobs.fieldDescriptionPlaceholder")
          }
          className="w-full max-w-full resize-y rounded-lg border border-border bg-white px-3 py-2 text-base outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15 disabled:opacity-60 md:text-sm"
        />
      </div>
      {error ? (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
        >
          {pending ? "..." : t("jobs.publishSubmit")}
        </button>
      </div>
    </form>
  );
}
