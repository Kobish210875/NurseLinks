import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Keep only the current browser session — ends refresh tokens on all other devices.
 * Call immediately after a successful sign-in on this device.
 */
export async function revokeOtherAuthSessions(supabase: SupabaseClient): Promise<void> {
  const { error } = await supabase.auth.signOut({ scope: "others" });
  if (error) {
    console.error("[auth] revokeOtherAuthSessions:", error.message);
  }
}
