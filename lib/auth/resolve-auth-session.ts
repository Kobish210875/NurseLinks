import { AUTH_SESSION_TIMEOUT_MS } from "@/lib/auth/auth-timeouts";
import { isTimeoutError, withTimeout } from "@/lib/async/with-timeout";
import type { Database } from "@/lib/supabase/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ResolvedAuthSession =
  | { status: "authenticated"; userId: string }
  | { status: "unauthenticated" }
  | { status: "invalid" };

/** Verify the JWT with Supabase and ensure a live profiles row exists. */
export async function resolveAuthSession(
  supabase: SupabaseClient<Database>,
): Promise<ResolvedAuthSession> {
  let userId: string | null = null;

  try {
    const {
      data: { user },
      error,
    } = await withTimeout(supabase.auth.getUser(), AUTH_SESSION_TIMEOUT_MS);

    if (error || !user) {
      return { status: "invalid" };
    }
    userId = user.id;
  } catch (error) {
    if (isTimeoutError(error)) {
      console.warn("[auth] resolveAuthSession: getUser timed out");
    }
    return { status: "invalid" };
  }

  type ProfileRow = { id: string; deleted_at?: string | null };

  try {
    const profileResult = (await withTimeout(
      supabase.from("profiles").select("id, deleted_at").eq("id", userId).maybeSingle<ProfileRow>(),
      AUTH_SESSION_TIMEOUT_MS,
    )) as { data: ProfileRow | null; error: { message?: string } | null };
    const { data: profile, error: profileError } = profileResult;

    if (profileError?.message?.toLowerCase().includes("deleted_at")) {
      const fallback = (await withTimeout(
        supabase.from("profiles").select("id").eq("id", userId).maybeSingle<{ id: string }>(),
        AUTH_SESSION_TIMEOUT_MS,
      )) as { data: { id: string } | null };
      if (!fallback.data?.id) {
        return { status: "invalid" };
      }
      return { status: "authenticated", userId };
    }

    if (!profile?.id || profile.deleted_at) {
      return { status: "invalid" };
    }

    return { status: "authenticated", userId };
  } catch (error) {
    if (isTimeoutError(error)) {
      console.warn("[auth] resolveAuthSession: profile query timed out");
    }
    return { status: "invalid" };
  }
}

export async function clearLocalAuthSession(supabase: SupabaseClient<Database>) {
  await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
}
