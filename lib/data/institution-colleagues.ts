import { getAcceptedConnections } from "@/lib/data/connections";
import {
  profileMatchesInstitution,
  type MedicalInstitution,
} from "@/lib/data/medical-institutions";
import { formatProfileHeadline } from "@/lib/profile/display-professional";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type InstitutionColleague = {
  id: string;
  fullName: string;
  profession: string | null;
  subtitle: string | null;
  avatarUrl: string | null;
  initials: string;
};

export async function getColleaguesAtInstitution(
  supabase: SupabaseClient<Database>,
  userId: string,
  institution: MedicalInstitution,
  otherInstitutionLabel: string,
): Promise<InstitutionColleague[]> {
  const connections = await getAcceptedConnections(supabase, userId);

  return connections
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
}
