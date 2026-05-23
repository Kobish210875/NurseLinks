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
    <section className="feed-card space-y-3 p-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">{t("jobs.searchTitle")}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{t("jobs.searchHint")}</p>
      </div>

      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          applyFilters();
        }}
      >
        <div className="grid gap-1.5">
          <label htmlFor="job-search-q" className="text-sm font-medium text-foreground">
            {t("jobs.searchQuery")}
          </label>
          <input
            id="job-search-q"
            type="search"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder={t("jobs.searchQueryPlaceholder")}
            maxLength={80}
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
          />
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="job-search-institution" className="text-sm font-medium text-foreground">
            {t("jobs.searchInstitution")}
          </label>
          <select
            id="job-search-institution"
            value={institution}
            onChange={(event) => setInstitution(event.target.value)}
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
          >
            <option value="">{t("jobs.searchInstitutionAll")}</option>
            {institutions.map((inst) => (
              <option key={inst.slug} value={inst.slug}>
                {inst.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="submit"
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            {t("jobs.searchSubmit")}
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted"
          >
            {t("jobs.searchReset")}
          </button>
        </div>
      </form>
    </section>
  );
}
