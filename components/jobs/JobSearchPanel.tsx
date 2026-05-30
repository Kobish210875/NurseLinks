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
  initialInstitution: string;
  initialCity: string;
  initialRegion: string;
  institutions: JobInstitutionFilterOption[];
  cities: string[];
  regions: Array<{ value: string; label: string }>;
};

export default function JobSearchPanel({
  initialInstitution,
  initialCity,
  initialRegion,
  institutions,
  cities,
  regions,
}: JobSearchPanelProps) {
  const t = useT();
  const router = useRouter();
  const [institution, setInstitution] = useState(initialInstitution);
  const [city, setCity] = useState(initialCity);
  const [region, setRegion] = useState(initialRegion);

  const hasInstitution = Boolean(institution);
  const hasCity = Boolean(city);
  const hasRegion = Boolean(region);

  function applyFilters(next?: Partial<{ institution: string; city: string; region: string }>) {
    const filters: JobListFilters = {
      q: "",
      institutionSlug: next?.institution ?? institution,
      city: next?.city ?? city,
      region: next?.region ?? region,
      page: 1,
    };
    const sp = jobFiltersToSearchParams(filters);
    router.push(sp.size ? `/jobs?${sp.toString()}` : "/jobs");
  }

  function reset() {
    setInstitution("");
    setCity("");
    setRegion("");
    router.push("/jobs");
  }

  return (
    <section className="feed-card flex h-full min-h-0 min-w-0 flex-col space-y-3 p-3 sm:p-4 lg:max-h-[calc(100dvh-11rem)] lg:space-y-2.5 lg:p-3">
      <div className="shrink-0">
        <h2 className="text-[15px] font-semibold text-foreground sm:text-sm">{t("jobs.searchTitle")}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground sm:text-xs lg:leading-snug">{t("jobs.searchHint")}</p>
      </div>

      <form
        className="flex min-h-0 flex-1 flex-col space-y-3 lg:space-y-2"
        onSubmit={(event) => {
          event.preventDefault();
          applyFilters();
        }}
      >
        <div className="grid gap-1.5 lg:gap-1">
          <label
            htmlFor="job-search-region"
            className="text-sm font-medium text-foreground lg:text-xs"
          >
            {t("jobs.searchRegion")}
          </label>
          <select
            id="job-search-region"
            value={region}
            disabled={hasCity || hasInstitution}
            onChange={(event) => {
              const value = event.target.value;
              setRegion(value);
              if (value) {
                setInstitution("");
              }
            }}
            className="w-full max-w-full rounded-lg border border-border bg-white px-3 py-2 text-base outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-muted/40 md:text-sm lg:px-2.5 lg:py-1.5 lg:text-xs"
          >
            <option value="">{t("jobs.searchRegionAll")}</option>
            {regions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-1.5 lg:gap-1">
          <label
            htmlFor="job-search-city"
            className="text-sm font-medium text-foreground lg:text-xs"
          >
            {t("jobs.searchCity")}
          </label>
          <select
            id="job-search-city"
            value={city}
            disabled={hasRegion || hasInstitution}
            onChange={(event) => {
              const value = event.target.value;
              setCity(value);
              if (value) {
                setInstitution("");
              }
            }}
            className="w-full max-w-full rounded-lg border border-border bg-white px-3 py-2 text-base outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-muted/40 md:text-sm lg:px-2.5 lg:py-1.5 lg:text-xs"
          >
            <option value="">{t("jobs.searchCityAll")}</option>
            {cities.map((cityOption) => (
              <option key={cityOption} value={cityOption}>
                {cityOption}
              </option>
            ))}
          </select>
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
            disabled={hasRegion || hasCity}
            onChange={(event) => {
              setInstitution(event.target.value);
              if (event.target.value) {
                setRegion("");
                setCity("");
              }
            }}
            className="w-full max-w-full rounded-lg border border-border bg-white px-3 py-2 text-base outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-muted/40 md:text-sm lg:px-2.5 lg:py-1.5 lg:text-xs"
          >
            <option value="">{t("jobs.searchInstitutionAll")}</option>
            {institutions.map((inst) => (
              <option key={inst.slug} value={inst.slug}>
                {inst.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-auto flex flex-wrap gap-2 pt-1 lg:flex-col lg:gap-1.5 lg:pt-2">
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
