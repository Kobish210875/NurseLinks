import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

type EnsureProfileResult = "ok" | "deleted" | "failed";

function getUserProfileDefaults(user: User) {
  const metadata = user.user_metadata as {
    full_name?: string;
    headline?: string | null;
  };

  return {
    fullName: metadata.full_name?.trim() || user.email?.split("@")[0] || "User",
    headline: metadata.headline?.trim() || null,
  };
}

export async function ensureAuthUserProfile(
  supabase: SupabaseClient<Database>,
  user: User,
): Promise<EnsureProfileResult> {
  const profileWithDeletedAt = await supabase
    .from("profiles")
    .select("id, deleted_at")
    .eq("id", user.id)
    .maybeSingle<{ id: string; deleted_at: string | null }>();

  if (profileWithDeletedAt.error?.message.toLowerCase().includes("deleted_at")) {
    const { data: legacyProfile, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle<{ id: string }>();

    if (error) {
      return "failed";
    }
    if (legacyProfile) {
      return "ok";
    }
  } else if (profileWithDeletedAt.error) {
    return "failed";
  } else if (profileWithDeletedAt.data?.deleted_at) {
    return "deleted";
  } else if (profileWithDeletedAt.data) {
    return "ok";
  }

  const { fullName, headline } = getUserProfileDefaults(user);
  const profileClient = createAdminClient() ?? supabase;
  const { error } = await profileClient.from("profiles").upsert(
    [
      {
        id: user.id,
        full_name: fullName,
        headline,
      },
    ] as never,
    { onConflict: "id" },
  );

  return error ? "failed" : "ok";
}
