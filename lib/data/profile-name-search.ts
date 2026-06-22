import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type ProfileSearchRow = {
  id: string;
  full_name: string;
  headline: string | null;
  workplace_institution_slug?: string | null;
  avatar_url: string | null;
  cv_draft?: unknown;
  deleted_at?: string | null;
};

export function escapeIlikePattern(value: string) {
  return value.replace(/[%_\\]/g, "\\$&");
}

function isMissingRpcError(message: string | undefined): boolean {
  if (!message) {
    return false;
  }
  const lower = message.toLowerCase();
  return (
    lower.includes("search_profiles_by_name") &&
    (lower.includes("does not exist") || lower.includes("could not find"))
  );
}

async function searchProfilesDirect(
  supabase: SupabaseClient<Database>,
  userId: string,
  pattern: string,
  limit: number,
): Promise<ProfileSearchRow[]> {
  let { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, headline, workplace_institution_slug, avatar_url, cv_draft, deleted_at")
    .neq("id", userId)
    .is("deleted_at", null)
    .ilike("full_name", pattern)
    .order("full_name", { ascending: true })
    .limit(limit);

  const errorMsg = error?.message?.toLowerCase() ?? "";
  if (errorMsg.includes("workplace_institution_slug") || errorMsg.includes("deleted_at")) {
    const fallback = await supabase
      .from("profiles")
      .select("id, full_name, headline, avatar_url, cv_draft")
      .neq("id", userId)
      .ilike("full_name", pattern)
      .order("full_name", { ascending: true })
      .limit(limit);
    data = fallback.data;
  }

  return ((data ?? []) as ProfileSearchRow[]).filter((profile) => !profile.deleted_at);
}

/** Search profiles by full_name (ilike). Uses RPC when deployed; falls back to direct query. */
export async function searchProfilesByName(
  supabase: SupabaseClient<Database>,
  userId: string,
  query: string,
  limit: number,
  callerIsAdmin = false,
): Promise<ProfileSearchRow[]> {
  const trimmed = query.trim();
  const pattern = `%${escapeIlikePattern(trimmed)}%`;

  const { data, error } = await supabase.rpc(
    "search_profiles_by_name",
    {
      name_pattern: pattern,
      result_limit: limit,
      exclude_admin: !callerIsAdmin,
    } as never,
  );

  if (!error && data) {
    return (data as ProfileSearchRow[]).filter((profile) => !profile.deleted_at);
  }

  if (!isMissingRpcError(error?.message)) {
    console.warn("[search] search_profiles_by_name RPC failed:", error?.message);
  }

  return searchProfilesDirect(supabase, userId, pattern, limit);
}
