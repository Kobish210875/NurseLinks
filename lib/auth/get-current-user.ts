import type { CvDraft } from "@/app/profile/actions";
import { AUTH_SESSION_TIMEOUT_MS } from "@/lib/auth/auth-timeouts";
import { hasSupabaseAuthCookie } from "@/lib/auth/has-auth-cookie";
import { isTimeoutError, withTimeout } from "@/lib/async/with-timeout";
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
  if (!(await hasSupabaseAuthCookie())) {
    return null;
  }

  const supabase = await createClient();

  let session;
  try {
    ({
      data: { session },
    } = await withTimeout(supabase.auth.getSession(), AUTH_SESSION_TIMEOUT_MS));
  } catch (error) {
    if (isTimeoutError(error)) {
      console.warn("[auth] getCurrentUser: getSession timed out");
    }
    return null;
  }

  const user = session?.user ?? null;

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

  try {
    const { data: profileFull, error: profileError } = await withTimeout(
      supabase.from("profiles").select(fullSelect).eq("id", user.id).maybeSingle<ProfileRow>(),
      AUTH_SESSION_TIMEOUT_MS,
    );

    const profileMsg = profileError?.message?.toLowerCase() ?? "";
    if (profileMsg.includes("workplace_institution_slug") || profileMsg.includes("deleted_at")) {
      const { data: fallback } = await withTimeout(
        supabase
          .from("profiles")
          .select("full_name, headline, city, license_number, avatar_url, cv_draft")
          .eq("id", user.id)
          .maybeSingle<ProfileRow>(),
        AUTH_SESSION_TIMEOUT_MS,
      );
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

  const adminCheckPromise = withTimeout(
    supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle<{ user_id: string }>(),
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
        supabase.rpc("get_profile_cv_draft", { target_id: user.id } as never),
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

function buildUser(
  user: { id: string; email?: string },
  profile: {
    headline?: string | null;
    workplace_institution_slug?: string | null;
    city?: string | null;
    license_number?: string | null;
    avatar_url?: string | null;
  } | null,
  fullName: string,
  cvDraft: CurrentUser["cvDraft"],
  metadata: { headline?: string; city?: string },
  isAdmin: boolean,
): CurrentUser {
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
    isAdmin,
    cvDraft: {
      bio: cvDraft.bio ? truncateProfileText(cvDraft.bio) : undefined,
      experience: cvDraft.experience ? truncateProfileText(cvDraft.experience) : undefined,
      education: cvDraft.education ? truncateProfileText(cvDraft.education) : undefined,
      certifications: cvDraft.certifications
        ? truncateProfileText(cvDraft.certifications)
        : undefined,
    },
  };
}
