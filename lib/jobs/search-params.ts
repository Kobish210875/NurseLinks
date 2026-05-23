export type JobListFilters = {
  q: string;
  institutionSlug: string;
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

  const pageRaw = typeof params.page === "string" ? Number.parseInt(params.page, 10) : 1;
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  return { q, institutionSlug, page };
}

export function jobFiltersToSearchParams(filters: JobListFilters): URLSearchParams {
  const sp = new URLSearchParams();
  if (filters.q) {
    sp.set("q", filters.q);
  }
  if (filters.institutionSlug) {
    sp.set("institution", filters.institutionSlug);
  }
  if (filters.page > 1) {
    sp.set("page", String(filters.page));
  }
  return sp;
}
