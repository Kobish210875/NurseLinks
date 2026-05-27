"use server";

import { ensureAuthUserProfile } from "@/lib/auth/ensure-auth-user-profile";
import { revokeOtherAuthSessions } from "@/lib/auth/single-session";
import { createClient } from "@/lib/supabase/server";

export type CompleteAuthCallbackResult =
  | { ok: true }
  | { ok: false; error: "auth-callback-failed" | "account-not-found" | "auth-profile-failed" };

export async function completeAuthCallback(): Promise<CompleteAuthCallbackResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "auth-callback-failed" };
  }

  const profileStatus = await ensureAuthUserProfile(supabase, user);
  if (profileStatus === "deleted") {
    await supabase.auth.signOut({ scope: "local" });
    return { ok: false, error: "account-not-found" };
  }
  if (profileStatus === "failed") {
    await supabase.auth.signOut({ scope: "local" });
    return { ok: false, error: "auth-profile-failed" };
  }

  await revokeOtherAuthSessions(supabase);
  return { ok: true };
}
