import { getInitials } from "@/lib/auth/initials";
import { resolveWorkplaceSlug } from "@/lib/profile/workplace";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type PeopleSearchHit = {
  id: string;
  fullName: string;
  headline: string | null;
  workplaceInstitutionSlug: string | null;
  avatarUrl: string | null;
  initials: string;
};

function escapeIlike(value: string) {
  return value.replace(/[%_\\]/g, "\\$&");
}

/** Prefix search on full_name for navbar autocomplete. */
export async function searchPeopleByNamePrefix(
  supabase: SupabaseClient<Database>,
  userId: string,
  query: string,
  limit = 8,
): Promise<PeopleSearchHit[]> {
  const trimmed = query.trim();
  if (trimmed.length < 1) {
    return [];
  }

  const pattern = `${escapeIlike(trimmed)}%`;

  let { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, headline, workplace_institution_slug, avatar_url, cv_draft")
    .neq("id", userId)
    .ilike("full_name", pattern)
    .order("full_name", { ascending: true })
    .limit(limit);

  if (error?.message?.toLowerCase().includes("workplace_institution_slug")) {
    const fallback = await supabase
      .from("profiles")
      .select("id, full_name, headline, avatar_url, cv_draft")
      .neq("id", userId)
      .ilike("full_name", pattern)
      .order("full_name", { ascending: true })
      .limit(limit);
    data = fallback.data;
  }

  return ((data ?? []) as Array<{
    id: string;
    full_name: string;
    headline: string | null;
    workplace_institution_slug?: string | null;
    avatar_url: string | null;
    cv_draft?: unknown;
  }>).map((p) => {
    const fullName = p.full_name.trim() || "User";
    return {
      id: p.id,
      fullName,
      headline: p.headline,
      workplaceInstitutionSlug: resolveWorkplaceSlug(
        p.workplace_institution_slug,
        p.cv_draft,
      ),
      avatarUrl: p.avatar_url,
      initials: getInitials(fullName),
    };
  });
}
