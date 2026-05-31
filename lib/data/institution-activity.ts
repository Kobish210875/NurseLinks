import { getAcceptedConnections } from "@/lib/data/connections";
import {
  MEDICAL_INSTITUTIONS,
  profileMatchesInstitution,
} from "@/lib/data/medical-institutions";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type InstitutionActivityFlags = {
  hasColleague: boolean;
  hasOpenJob: boolean;
};

export type InstitutionActivityMap = Record<string, InstitutionActivityFlags>;

export function institutionHasActivity(flags: InstitutionActivityFlags | undefined): boolean {
  return Boolean(flags?.hasColleague || flags?.hasOpenJob);
}

export async function getInstitutionActivityForUser(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<InstitutionActivityMap> {
  const [connections, jobsResult] = await Promise.all([
    getAcceptedConnections(supabase, userId),
    supabase.from("jobs").select("institution_slug").eq("status", "active" as const),
  ]);

  const jobSlugs = new Set<string>();
  for (const row of (jobsResult.data ?? []) as { institution_slug: string | null }[]) {
    if (row.institution_slug) {
      jobSlugs.add(row.institution_slug);
    }
  }

  const activity: InstitutionActivityMap = {};

  for (const institution of MEDICAL_INSTITUTIONS) {
    const hasColleague = connections.some((member) =>
      profileMatchesInstitution(
        member.workplaceInstitutionSlug,
        member.headline,
        institution,
      ),
    );
    const hasOpenJob = jobSlugs.has(institution.slug);

    if (hasColleague || hasOpenJob) {
      activity[institution.slug] = { hasColleague, hasOpenJob };
    }
  }

  return activity;
}
