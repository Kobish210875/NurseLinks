import { getInitials } from "@/lib/auth/initials";
import { getAcceptedConnections } from "@/lib/data/connections";
import {
  searchProfilesByName,
  type ProfileSearchRow,
} from "@/lib/data/profile-name-search";
import { resolveWorkplaceSlug } from "@/lib/profile/workplace";
import { isHebrewNameSearchQuery } from "@/lib/validation/hebrew-name";
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

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function nameMatchesQuery(fullName: string, query: string) {
  const normalizedName = normalizeSearchText(fullName);
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return false;
  }
  if (normalizedName.includes(normalizedQuery)) {
    return true;
  }
  return normalizedQuery
    .split(" ")
    .filter((part) => part.length >= 2)
    .every((part) => normalizedName.includes(part));
}

function toPeopleSearchHit(profile: ProfileSearchRow): PeopleSearchHit {
  const fullName = profile.full_name.trim() || "User";
  return {
    id: profile.id,
    fullName,
    headline: profile.headline,
    workplaceInstitutionSlug: resolveWorkplaceSlug(
      profile.workplace_institution_slug,
      profile.cv_draft,
    ),
    avatarUrl: profile.avatar_url,
    initials: getInitials(fullName),
  };
}

/** Name search for navbar autocomplete (substring match; connections ranked first). */
export async function searchPeopleByNamePrefix(
  supabase: SupabaseClient<Database>,
  userId: string,
  query: string,
  limit = 8,
  callerIsAdmin = false,
): Promise<PeopleSearchHit[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2 || !isHebrewNameSearchQuery(trimmed)) {
    return [];
  }

  const dbHits = (
    await searchProfilesByName(supabase, userId, trimmed, limit, callerIsAdmin)
  ).map(toPeopleSearchHit);

  const connections = await getAcceptedConnections(supabase, userId);
  const connectionHits: PeopleSearchHit[] = connections
    .filter((member) => nameMatchesQuery(member.fullName, trimmed))
    .map((member) => ({
      id: member.id,
      fullName: member.fullName,
      headline: member.headline,
      workplaceInstitutionSlug: member.workplaceInstitutionSlug,
      avatarUrl: member.avatarUrl,
      initials: member.initials,
    }));

  const seen = new Set<string>();
  const merged: PeopleSearchHit[] = [];

  for (const hit of [...connectionHits, ...dbHits]) {
    if (seen.has(hit.id)) {
      continue;
    }
    seen.add(hit.id);
    merged.push(hit);
    if (merged.length >= limit) {
      break;
    }
  }

  return merged;
}
