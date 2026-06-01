export type JobListFilters = {
  q: string;
  institutionSlug: string;
  city: string;
  region: string;
  page: number;
};

const MAX_QUERY_LEN = 80;
export const JOB_COMMUNITY_PAGE_SIZE = 20;

export function parseJobListFilters(
  params: Record<string, string | string[] | undefined>,
): JobListFilters {
  const rawQ = typeof params.q === "string" ? params.q.trim() : "";
  const q = rawQ.length > MAX_QUERY_LEN ? rawQ.slice(0, MAX_QUERY_LEN) : rawQ;

  const institutionSlug =
    typeof params.institution === "string" ? params.institution.trim() : "";
  const city = typeof params.city === "string" ? params.city.trim() : "";
  const region = typeof params.region === "string" ? params.region.trim() : "";

  const pageRaw = typeof params.page === "string" ? Number.parseInt(params.page, 10) : 1;
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  return { q, institutionSlug, city, region, page };
}

export function isJobSearchSubmitted(
  params: Record<string, string | string[] | undefined>,
): boolean {
  return params.run === "1";
}

export function jobFiltersToSearchParams(
  filters: JobListFilters,
  options?: { submitted?: boolean },
): URLSearchParams {
  const sp = new URLSearchParams();
  if (filters.q) {
    sp.set("q", filters.q);
  }
  if (filters.institutionSlug) {
    sp.set("institution", filters.institutionSlug);
  }
  if (filters.city) {
    sp.set("city", filters.city);
  }
  if (filters.region) {
    sp.set("region", filters.region);
  }
  if (filters.page > 1) {
    sp.set("page", String(filters.page));
  }
  if (options?.submitted) {
    sp.set("run", "1");
  }
  return sp;
}
