import Link from "next/link";
import { createT, getMessages } from "@/lib/i18n/messages";
import { getLocale } from "@/lib/i18n/get-locale";
import { jobFiltersToSearchParams, type JobListFilters } from "@/lib/jobs/search-params";

type JobsPaginationProps = {
  filters: JobListFilters;
  page: number;
  totalPages: number;
};

export default async function JobsPagination({ filters, page, totalPages }: JobsPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const locale = await getLocale();
  const t = createT(getMessages(locale));

  const prevFilters = { ...filters, page: page - 1 };
  const nextFilters = { ...filters, page: page + 1 };
  const prevHref =
    page > 1
      ? `/jobs?${jobFiltersToSearchParams(prevFilters).toString()}`
      : null;
  const nextHref =
    page < totalPages
      ? `/jobs?${jobFiltersToSearchParams(nextFilters).toString()}`
      : null;

  return (
    <nav
      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-white px-4 py-3 text-sm"
      aria-label={t("jobs.paginationAria")}
    >
      {prevHref ? (
        <Link
          href={prevHref}
          className="font-medium text-primary transition hover:underline"
        >
          {t("jobs.paginationPrev")}
        </Link>
      ) : (
        <span className="text-muted-foreground/50">{t("jobs.paginationPrev")}</span>
      )}
      <span className="text-muted-foreground">
        {t("jobs.paginationPage")
          .replace("{page}", String(page))
          .replace("{total}", String(totalPages))}
      </span>
      {nextHref ? (
        <Link
          href={nextHref}
          className="font-medium text-primary transition hover:underline"
        >
          {t("jobs.paginationNext")}
        </Link>
      ) : (
        <span className="text-muted-foreground/50">{t("jobs.paginationNext")}</span>
      )}
    </nav>
  );
}
