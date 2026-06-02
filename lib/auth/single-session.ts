import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Keep only the current browser session — ends refresh tokens on all other devices.
 * Call immediately after a successful sign-in on this device.
 * We intentionally cap how long we wait so login UX is not blocked by
 * occasional network slowness during cross-device token revocation.
 */
export async function revokeOtherAuthSessions(supabase: SupabaseClient): Promise<void> {
  const revokePromise = supabase.auth
    .signOut({ scope: "others" })
    .then(({ error }) => {
      if (error) {
        console.error("[auth] revokeOtherAuthSessions:", error.message);
      }
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[auth] revokeOtherAuthSessions:", message);
    });

  await Promise.race([
    revokePromise,
    new Promise<void>((resolve) => {
      setTimeout(resolve, 450);
    }),
  ]);
}
