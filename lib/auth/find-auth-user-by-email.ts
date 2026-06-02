import { AUTH_LOOKUP_TIMEOUT_MS } from "@/lib/auth/auth-timeouts";
import { isTimeoutError, withTimeout } from "@/lib/async/with-timeout";
import type { User } from "@supabase/supabase-js";

/** GoTrue admin filter by email (single request). */
async function findAuthUserByEmailViaAdminApi(email: string): Promise<User | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    return null;
  }

  try {
    const response = await withTimeout(
      fetch(`${url}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        cache: "no-store",
      }),
      AUTH_LOOKUP_TIMEOUT_MS,
    );

    if (!response.ok) {
      return null;
    }

    const body = (await response.json()) as { users?: User[] };
    return body.users?.[0] ?? null;
  } catch (error) {
    if (isTimeoutError(error)) {
      console.warn("[auth] findAuthUserByEmail: admin API timed out");
    }
    return null;
  }
}

export async function findAuthUserByEmail(email: string): Promise<User | null> {
  const normalizedEmail = email.trim().toLowerCase();
  return findAuthUserByEmailViaAdminApi(normalizedEmail);
}
