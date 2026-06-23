import type { CvDraft } from "@/app/profile/actions";
import { AUTH_SESSION_TIMEOUT_MS } from "@/lib/auth/auth-timeouts";
import { hasSupabaseAuthCookie } from "@/lib/auth/has-auth-cookie";
import { clearLocalAuthSession, resolveAuthSession } from "@/lib/auth/resolve-auth-session";
import { isTimeoutError, withTimeout } from "@/lib/async/with-timeout";
import { isValidNursingEducationValue } from "@/lib/data/nursing-education-options";
import { resolveWorkplaceSlug } from "@/lib/profile/workplace";
import { truncateHeadline, truncateProfileText } from "@/lib/profile/field-limits";
import { normalizeWorkExperiences } from "@/lib/profile/work-experience";
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
  avatarUrl: string | null;
  initials: string;
  isAdmin: boolean;
  cvDraft: CvDraft;
};

export const getCurrentUser = cache(async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!(await hasSupabaseAuthCookie())) {
    return null;
  }

  const supabase = await createClient();

  let authStatus;
  try {
    authStatus = await withTimeout(resolveAuthSession(supabase), AUTH_SESSION_TIMEOUT_MS);
  } catch (error) {
    if (isTimeoutError(error)) {
      console.warn("[auth] getCurrentUser: resolveAuthSession timed out");
    }
    return null;
  }

  if (authStatus.status === "invalid") {
    await clearLocalAuthSession(supabase);
    return null;
  }

  if (authStatus.status !== "authenticated") {
    return null;
  }

  const userId = authStatus.userId;

  let user: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  } | null = null;
  try {
    const {
      data: { user: authUser },
    } = await withTimeout(supabase.auth.getUser(), AUTH_SESSION_TIMEOUT_MS);
    user = authUser;
  } catch (error) {
    if (isTimeoutError(error)) {
      console.warn("[auth] getCurrentUser: getUser timed out");
    }
    await clearLocalAuthSession(supabase);
    return null;
  }

  if (!user || user.id !== userId) {
    await clearLocalAuthSession(supabase);
    return null;
  }

  type ProfileRow = {
    full_name: string;
    headline: string | null;
    workplace_institution_slug?: string | null;
    city: string | null;
    avatar_url: string | null;
    cv_draft?: CvDraft | null;
    deleted_at?: string | null;
  };

  const fullSelect =
    "full_name, headline, workplace_institution_slug, city, avatar_url, cv_draft, deleted_at";

  let profile: ProfileRow | null = null;

  try {
    const profileResult = (await withTimeout(
      supabase.from("profiles").select(fullSelect).eq("id", userId).maybeSingle<ProfileRow>(),
      AUTH_SESSION_TIMEOUT_MS,
    )) as { data: ProfileRow | null; error: { message?: string } | null };
    const { data: profileFull, error: profileError } = profileResult;

    const profileMsg = profileError?.message?.toLowerCase() ?? "";
    if (profileMsg.includes("workplace_institution_slug") || profileMsg.includes("deleted_at")) {
      const fallbackResult = (await withTimeout(
        supabase
          .from("profiles")
          .select("full_name, headline, city, avatar_url, cv_draft")
          .eq("id", userId)
          .maybeSingle<ProfileRow>(),
        AUTH_SESSION_TIMEOUT_MS,
      )) as { data: ProfileRow | null };
      const { data: fallback } = fallbackResult;
      profile = fallback ?? null;
    } else {
      profile = profileFull ?? null;
    }
  } catch (error) {
    if (isTimeoutError(error)) {
      console.warn("[auth] getCurrentUser: profile query timed out");
    }
    profile = null;
  }

  // No profile row means either the user was hard-deleted by an admin or the
  // signup trigger never ran. Either way deny access — do not fall back to the
  // JWT payload, which remains valid for up to 1 hour after deletion.
  if (!profile || profile.deleted_at) {
    await clearLocalAuthSession(supabase);
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
    cvDraft.experience?.trim() ||
    cvDraft.education?.trim() ||
    cvDraft.educationLevel?.trim() ||
    (cvDraft.workExperiences?.length ?? 0) > 0 ||
    cvDraft.certifications?.trim();

  const adminCheckPromise = withTimeout(
    supabase.from("admin_users").select("user_id").eq("user_id", userId).maybeSingle<{ user_id: string }>(),
    AUTH_SESSION_TIMEOUT_MS,
  ).catch((error: unknown) => {
    if (isTimeoutError(error)) {
      console.warn("[auth] getCurrentUser: admin check timed out");
    }
    return { data: null };
  });

  if (!hasCv) {
    try {
      const { data: rpcCv } = await withTimeout(
        supabase.rpc("get_profile_cv_draft", { target_id: userId } as never),
        AUTH_SESSION_TIMEOUT_MS,
      );
      if (rpcCv && typeof rpcCv === "object" && !Array.isArray(rpcCv)) {
        cvDraft = rpcCv as CurrentUser["cvDraft"];
      }
    } catch (error) {
      if (isTimeoutError(error)) {
        console.warn("[auth] getCurrentUser: cv draft RPC timed out");
      }
    }
    const adminResult = await adminCheckPromise;
    const isAdmin = Boolean(adminResult.data?.user_id);
    return buildUser(user, profile, fullName, cvDraft, metadata, isAdmin);
  }

  const adminResult = await adminCheckPromise;
  const isAdmin = Boolean(adminResult.data?.user_id);
  return buildUser(user, profile, fullName, cvDraft, metadata, isAdmin);
});

function normalizeUserCvDraft(raw: CvDraft): CvDraft {
  const educationLevel =
    typeof raw.educationLevel === "string" && isValidNursingEducationValue(raw.educationLevel)
      ? raw.educationLevel
      : undefined;
  const workExperiences = normalizeWorkExperiences(raw.workExperiences);

  return {
    experience: raw.experience ? truncateProfileText(raw.experience) : undefined,
    education: raw.education ? truncateProfileText(raw.education) : undefined,
    educationLevel,
    workExperiences: workExperiences.length > 0 ? workExperiences : undefined,
    certifications: raw.certifications ? truncateProfileText(raw.certifications) : undefined,
  };
}

function buildUser(
  user: { id: string; email?: string },
  profile: {
    headline?: string | null;
    workplace_institution_slug?: string | null;
    city?: string | null;
    avatar_url?: string | null;
  } | null,
  fullName: string,
  cvDraft: CurrentUser["cvDraft"],
  metadata: { headline?: string; city?: string },
  isAdmin: boolean,
): CurrentUser {
  // When a profiles row exists, it is the source of truth. Do not fall back to
  // auth metadata for cleared fields — metadata may still hold legacy values.
  const hasProfile = profile !== null;

  return {
    id: user.id,
    email: user.email ?? "",
    fullName,
    headline: hasProfile
      ? truncateHeadline(profile?.headline ?? "") || null
      : truncateHeadline(metadata.headline ?? "") || null,
    workplaceInstitutionSlug: resolveWorkplaceSlug(
      profile?.workplace_institution_slug,
      cvDraft,
    ),
    city: hasProfile ? (profile?.city ?? null) : (metadata.city ?? null),
    avatarUrl: profile?.avatar_url ?? null,
    initials: getInitials(fullName),
    isAdmin,
    cvDraft: normalizeUserCvDraft(cvDraft),
  };
}
