"use client";

import { useT } from "@/components/i18n/LocaleProvider";
import type { JobListFilters } from "@/lib/jobs/search-params";
import { jobFiltersToSearchParams } from "@/lib/jobs/search-params";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type JobInstitutionFilterOption = {
  slug: string;
  label: string;
};

type JobSearchPanelProps = {
  initialQ: string;
  initialInstitution: string;
  institutions: JobInstitutionFilterOption[];
};

export default function JobSearchPanel({
  initialQ,
  initialInstitution,
  institutions,
}: JobSearchPanelProps) {
  const t = useT();
  const router = useRouter();
  const [q, setQ] = useState(initialQ);
  const [institution, setInstitution] = useState(initialInstitution);

  function applyFilters(next?: Partial<{ q: string; institution: string }>) {
    const filters: JobListFilters = {
      q: next?.q ?? q,
      institutionSlug: next?.institution ?? institution,
      page: 1,
    };
    const sp = jobFiltersToSearchParams(filters);
    router.push(sp.size ? `/jobs?${sp.toString()}` : "/jobs");
  }

  function reset() {
    setQ("");
    setInstitution("");
    router.push("/jobs");
  }

  return (
    <section className="feed-card min-w-0 space-y-3 p-3 sm:p-4 lg:space-y-2.5 lg:p-3">
      <div>
        <h2 className="text-[15px] font-semibold text-foreground sm:text-sm">{t("jobs.searchTitle")}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground sm:text-xs lg:leading-snug">{t("jobs.searchHint")}</p>
      </div>

      <form
        className="space-y-3 lg:space-y-2"
        onSubmit={(event) => {
          event.preventDefault();
          applyFilters();
        }}
      >
        <div className="grid gap-1.5 lg:gap-1">
          <label
            htmlFor="job-search-q"
            className="text-sm font-medium text-foreground lg:text-xs"
          >
            {t("jobs.searchQuery")}
          </label>
          <input
            id="job-search-q"
            type="search"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder={t("jobs.searchQueryPlaceholder")}
            maxLength={80}
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15 lg:px-2.5 lg:py-1.5 lg:text-xs"
          />
        </div>

        <div className="grid gap-1.5 lg:gap-1">
          <label
            htmlFor="job-search-institution"
            className="text-sm font-medium text-foreground lg:text-xs"
          >
            {t("jobs.searchInstitution")}
          </label>
          <select
            id="job-search-institution"
            value={institution}
            onChange={(event) => setInstitution(event.target.value)}
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15 lg:px-2.5 lg:py-1.5 lg:text-xs"
          >
            <option value="">{t("jobs.searchInstitutionAll")}</option>
            {institutions.map((inst) => (
              <option key={inst.slug} value={inst.slug}>
                {inst.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2 pt-1 lg:flex-col lg:gap-1.5 lg:pt-0">
          <button
            type="submit"
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 lg:w-full lg:px-3 lg:py-1.5 lg:text-xs"
          >
            {t("jobs.searchSubmit")}
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted lg:w-full lg:px-3 lg:py-1.5 lg:text-xs"
          >
            {t("jobs.searchReset")}
          </button>
        </div>
      </form>
    </section>
  );
}
