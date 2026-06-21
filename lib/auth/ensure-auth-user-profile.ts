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
  const admin = createAdminClient();
  const profileClient = admin ?? supabase;

  const profileWithDeletedAt = await profileClient
    .from("profiles")
    .select("id, deleted_at")
    .eq("id", user.id)
    .maybeSingle<{ id: string; deleted_at: string | null }>();

  if (profileWithDeletedAt.error?.message.toLowerCase().includes("deleted_at")) {
    const { data: legacyProfile, error } = await profileClient
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle<{ id: string }>();

    if (error) {
      console.error("[auth] ensureAuthUserProfile legacy select:", error.message);
      if (!admin) {
        return "failed";
      }
    } else if (legacyProfile) {
      return "ok";
    }
  } else if (profileWithDeletedAt.error) {
    console.error("[auth] ensureAuthUserProfile select:", profileWithDeletedAt.error.message);
    if (!admin) {
      return "failed";
    }
  } else if (profileWithDeletedAt.data?.deleted_at) {
    return "deleted";
  } else if (profileWithDeletedAt.data) {
    return "ok";
  }

  const { fullName, headline } = getUserProfileDefaults(user);
  const writeClient = admin ?? supabase;
  const { error } = await writeClient.from("profiles").upsert(
    [
      {
        id: user.id,
        full_name: fullName,
        headline,
      },
    ] as never,
    { onConflict: "id" },
  );

  if (error) {
    console.error("[auth] ensureAuthUserProfile upsert:", error.message);
  }

  return error ? "failed" : "ok";
}
