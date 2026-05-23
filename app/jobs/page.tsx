import JobFeedList from "@/components/jobs/JobFeedList";
import JobSearchPanel from "@/components/jobs/JobSearchPanel";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  INSTITUTION_OTHER_SLUG,
  MEDICAL_INSTITUTIONS,
} from "@/lib/data/medical-institutions";
import { getJobFeed } from "@/lib/data/jobs";
import { getLocale } from "@/lib/i18n/get-locale";
import { createT, getMessages } from "@/lib/i18n/messages";
import { institutionCityLabel } from "@/lib/profile/display-professional";
import { parseJobListFilters } from "@/lib/jobs/search-params";
import { createClient } from "@/lib/supabase/server";

type JobsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function JobsBrowsePage({ searchParams }: JobsPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const locale = await getLocale();
  const t = createT(getMessages(locale));
  const sp = await searchParams;
  const filters = parseJobListFilters(sp);
  const published = sp.published === "1";

  const supabase = await createClient();
  const feed = await getJobFeed(supabase, user.id, locale, filters);

  const institutions = [
    ...MEDICAL_INSTITUTIONS.map((inst) => ({
      slug: inst.slug,
      label: institutionCityLabel(inst),
    })),
    { slug: INSTITUTION_OTHER_SLUG, label: t("profile.institutionOther") },
  ].sort((a, b) => a.label.localeCompare(b.label, "he"));

  const hasSearchFilters = Boolean(filters.q || filters.institutionSlug);

  return (
    <>
      {published ? (
        <p className="break-words rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 text-sm text-primary">
          {t("jobs.publishedBanner")}
        </p>
      ) : null}
      <JobSearchPanel
        initialQ={filters.q}
        initialInstitution={filters.institutionSlug}
        institutions={institutions}
      />
      <JobFeedList
        feed={feed}
        filters={filters}
        defaultApplicantName={user.fullName}
        hasSearchFilters={hasSearchFilters}
      />
    </>
  );
}
