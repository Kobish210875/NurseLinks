import { formatFeedTimestamp } from "@/lib/i18n/format-feed-time";
import type { Locale } from "@/lib/i18n/config";
import { JOB_BODY_MAX_LENGTH, truncateJobBody, truncateJobTitle } from "@/lib/jobs/field-limits";
import { formatProfileHeadline } from "@/lib/profile/display-professional";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getAcceptedConnections } from "@/lib/data/connections";
import type { InstitutionColleague } from "@/lib/data/institution-colleagues";
import type { InstitutionOpenJob } from "@/lib/data/institution-jobs";
import { MEDICAL_INSTITUTIONS, profileMatchesInstitution } from "@/lib/data/medical-institutions";

export type InstitutionDetails = {
  colleagues: InstitutionColleague[];
  openJobs: InstitutionOpenJob[];
};

export type InstitutionDetailsMap = Record<string, InstitutionDetails>;

type JobRow = {
  id: string;
  title: string;
  body: string;
  city: string | null;
  created_at: string;
  institution_slug: string | null;
};

function toJobPreview(body: string) {
  const normalized = truncateJobBody(body.replace(/\s+/g, " "));
  if (normalized.length <= JOB_BODY_MAX_LENGTH) {
    return normalized;
  }
  return `${normalized.slice(0, JOB_BODY_MAX_LENGTH - 1)}…`;
}

function mapJobRow(row: JobRow, locale: Locale): InstitutionOpenJob {
  return {
    id: row.id,
    title: truncateJobTitle(row.title),
    bodyPreview: toJobPreview(row.body),
    city: row.city,
    createdAt: row.created_at,
    timeLabel: formatFeedTimestamp(row.created_at, locale),
  };
}

/** Jobs + connected colleagues grouped by institution — two DB round-trips total. */
export async function getInstitutionDetailsMap(
  supabase: SupabaseClient<Database>,
  userId: string,
  locale: Locale,
  otherInstitutionLabel: string,
): Promise<InstitutionDetailsMap> {
  const [connections, jobsResult] = await Promise.all([
    getAcceptedConnections(supabase, userId),
    supabase
      .from("jobs")
      .select("id, title, body, city, created_at, institution_slug")
      .eq("status", "active")
      .not("institution_slug", "is", null)
      .order("created_at", { ascending: false }),
  ]);

  const jobsBySlug = new Map<string, InstitutionOpenJob[]>();
  for (const row of (jobsResult.data ?? []) as JobRow[]) {
    if (!row.institution_slug) {
      continue;
    }
    const list = jobsBySlug.get(row.institution_slug) ?? [];
    if (list.length >= 20) {
      continue;
    }
    list.push(mapJobRow(row, locale));
    jobsBySlug.set(row.institution_slug, list);
  }

  const map: InstitutionDetailsMap = {};

  for (const institution of MEDICAL_INSTITUTIONS) {
    const colleagues = connections
      .filter((member) =>
        profileMatchesInstitution(
          member.workplaceInstitutionSlug,
          member.headline,
          institution,
        ),
      )
      .map((member) => ({
        id: member.id,
        fullName: member.fullName,
        profession: member.headline,
        subtitle: formatProfileHeadline(
          member.headline,
          member.workplaceInstitutionSlug,
          otherInstitutionLabel,
        ),
        avatarUrl: member.avatarUrl,
        initials: member.initials,
      }));

    const openJobs = jobsBySlug.get(institution.slug) ?? [];

    if (colleagues.length > 0 || openJobs.length > 0) {
      map[institution.slug] = { colleagues, openJobs };
    }
  }

  return map;
}
