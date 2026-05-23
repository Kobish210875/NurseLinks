import type { CvDraft } from "@/app/profile/actions";
import { getInitials } from "@/lib/auth/initials";
import { resolveWorkplaceSlug } from "@/lib/profile/workplace";
import { resolveConnectionStatus, loadConnectionRows } from "@/lib/data/connections";
import type { ConnectionStatus } from "@/lib/network/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type ProfileView = {
  id: string;
  fullName: string;
  headline: string | null;
  workplaceInstitutionSlug: string | null;
  city: string | null;
  licenseNumber: string | null;
  avatarUrl: string | null;
  initials: string;
  cvDraft: CvDraft;
  connectionStatus: ConnectionStatus;
};

type ProfileRow = {
  id: string;
  full_name: string;
  headline: string | null;
  workplace_institution_slug: string | null;
  city: string | null;
  license_number: string | null;
  avatar_url: string | null;
  cv_draft?: CvDraft | null;
};

function normalizeCvDraft(raw: unknown): CvDraft {
  if (!raw || typeof raw !== "object") {
    return {};
  }
  const o = raw as Record<string, unknown>;
  return {
    bio: typeof o.bio === "string" ? o.bio : undefined,
    experience: typeof o.experience === "string" ? o.experience : undefined,
    education: typeof o.education === "string" ? o.education : undefined,
    certifications: typeof o.certifications === "string" ? o.certifications : undefined,
    workplace_institution_slug:
      typeof o.workplace_institution_slug === "string"
        ? o.workplace_institution_slug
        : undefined,
  };
}

function cvHasContent(cv: CvDraft) {
  return Boolean(
    cv.bio?.trim() ||
      cv.experience?.trim() ||
      cv.education?.trim() ||
      cv.certifications?.trim(),
  );
}

async function fetchCvDraft(
  supabase: SupabaseClient<Database>,
  profileId: string,
  fromProfile: CvDraft,
): Promise<CvDraft> {
  if (cvHasContent(fromProfile)) {
    return fromProfile;
  }

  const { data, error } = await supabase.rpc(
    "get_profile_cv_draft",
    { target_id: profileId } as never,
  );

  if (error || data == null) {
    return fromProfile;
  }

  return normalizeCvDraft(data);
}

export async function getProfileView(
  supabase: SupabaseClient<Database>,
  profileId: string,
  viewerId: string,
): Promise<ProfileView | null> {
  const withCv = await supabase
    .from("profiles")
    .select("id, full_name, headline, workplace_institution_slug, city, license_number, avatar_url, cv_draft")
    .eq("id", profileId)
    .maybeSingle();

  let profile: ProfileRow | null = null;

  const errMsg = withCv.error?.message?.toLowerCase() ?? "";
  if (errMsg.includes("workplace_institution_slug")) {
    const { data: fallback } = await supabase
      .from("profiles")
      .select("id, full_name, headline, city, license_number, avatar_url, cv_draft")
      .eq("id", profileId)
      .maybeSingle();
    profile = (fallback as ProfileRow | null) ?? null;
  } else if (errMsg.includes("cv_draft")) {
    const { data: fallback } = await supabase
      .from("profiles")
      .select("id, full_name, headline, city, license_number, avatar_url")
      .eq("id", profileId)
      .maybeSingle();
    profile = (fallback as ProfileRow | null) ?? null;
  } else {
    profile = (withCv.data as ProfileRow | null) ?? null;
  }

  if (!profile) {
    return null;
  }

  const fullName = profile.full_name?.trim() || "User";

  const cvDraft = await fetchCvDraft(
    supabase,
    profileId,
    normalizeCvDraft(profile.cv_draft),
  );

  const connectionRows = await loadConnectionRows(supabase, viewerId);
  const { status: connectionStatus } = resolveConnectionStatus(
    viewerId,
    profileId,
    connectionRows,
  );

  return {
    id: profile.id,
    fullName,
    headline: profile.headline,
    workplaceInstitutionSlug: resolveWorkplaceSlug(
      profile.workplace_institution_slug,
      cvDraft,
    ),
    city: profile.city,
    licenseNumber: profile.license_number,
    avatarUrl: profile.avatar_url,
    initials: getInitials(fullName),
    cvDraft,
    connectionStatus,
  };
}
