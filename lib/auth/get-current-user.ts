import type { CvDraft } from "@/app/profile/actions";
import { isCurrentUserAdmin } from "@/lib/auth/admin";
import { resolveWorkplaceSlug } from "@/lib/profile/workplace";
import { truncateHeadline, truncateProfileText } from "@/lib/profile/field-limits";
import { sanitizeLicenseNumber } from "@/lib/validation/license-number";
import { createClient } from "@/lib/supabase/server";
import { cache } from "react";
import { getInitials } from "./initials";

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
  headline: string | null;
  workplaceInstitutionSlug: string | null;
  city: string | null;
  licenseNumber: string | null;
  avatarUrl: string | null;
  initials: string;
  isAdmin: boolean;
  cvDraft: {
    bio?: string;
    experience?: string;
    education?: string;
    certifications?: string;
  };
};

export const getCurrentUser = cache(async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  type ProfileRow = {
    full_name: string;
    headline: string | null;
    workplace_institution_slug?: string | null;
    city: string | null;
    license_number: string | null;
    avatar_url: string | null;
    cv_draft?: CvDraft | null;
    deleted_at?: string | null;
  };

  const fullSelect =
    "full_name, headline, workplace_institution_slug, city, license_number, avatar_url, cv_draft, deleted_at";

  let profile: ProfileRow | null = null;

  const { data: profileFull, error: profileError } = await supabase
    .from("profiles")
    .select(fullSelect)
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  const profileMsg = profileError?.message?.toLowerCase() ?? "";
  if (profileMsg.includes("workplace_institution_slug") || profileMsg.includes("deleted_at")) {
    const { data: fallback } = await supabase
      .from("profiles")
      .select("full_name, headline, city, license_number, avatar_url, cv_draft")
      .eq("id", user.id)
      .maybeSingle<ProfileRow>();
    profile = fallback ?? null;
  } else {
    profile = profileFull ?? null;
  }

  if (profile?.deleted_at) {
    return null;
  }

  const metadata = user.user_metadata as {
    full_name?: string;
    headline?: string;
    city?: string;
    cv_draft?: CurrentUser["cvDraft"];
  };

  const fullName =
    profile?.full_name?.trim() ||
    metadata.full_name?.trim() ||
    user.email?.split("@")[0] ||
    "User";

  let cvDraft =
    (profile?.cv_draft as CurrentUser["cvDraft"] | null | undefined) ??
    metadata.cv_draft ??
    {};

  const hasCv =
    cvDraft.bio?.trim() ||
    cvDraft.experience?.trim() ||
    cvDraft.education?.trim() ||
    cvDraft.certifications?.trim();

  if (!hasCv) {
    const { data: rpcCv } = await supabase.rpc(
      "get_profile_cv_draft",
      { target_id: user.id } as never,
    );
    if (rpcCv && typeof rpcCv === "object") {
      cvDraft = rpcCv as CurrentUser["cvDraft"];
    }
  }

  return {
    id: user.id,
    email: user.email ?? "",
    fullName,
    headline: truncateHeadline(profile?.headline ?? metadata.headline ?? "") || null,
    workplaceInstitutionSlug: resolveWorkplaceSlug(
      profile?.workplace_institution_slug,
      cvDraft,
    ),
    city: profile?.city ?? metadata.city ?? null,
    licenseNumber: sanitizeLicenseNumber(profile?.license_number ?? "") || null,
    avatarUrl: profile?.avatar_url ?? null,
    initials: getInitials(fullName),
    isAdmin: await isCurrentUserAdmin(),
    cvDraft: {
      bio: cvDraft.bio ? truncateProfileText(cvDraft.bio) : undefined,
      experience: cvDraft.experience ? truncateProfileText(cvDraft.experience) : undefined,
      education: cvDraft.education ? truncateProfileText(cvDraft.education) : undefined,
      certifications: cvDraft.certifications
        ? truncateProfileText(cvDraft.certifications)
        : undefined,
    },
  };
});
