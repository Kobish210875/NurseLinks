import { AUTH_LOOKUP_TIMEOUT_MS } from "@/lib/auth/auth-timeouts";
import { isTimeoutError, withTimeout } from "@/lib/async/with-timeout";
import type { User } from "@supabase/supabase-js";

const MAX_USER_PAGES = 20;
const USERS_PER_PAGE = 1000;

function pickUserByEmail(users: User[] | undefined, normalizedEmail: string): User | null {
  if (!users?.length) {
    return null;
  }
  return users.find((user) => user.email?.trim().toLowerCase() === normalizedEmail) ?? null;
}

async function fetchAdminUsersPage(
  url: string,
  serviceRoleKey: string,
  page: number,
  email?: string,
): Promise<User[]> {
  const query = email
    ? `email=${encodeURIComponent(email)}&page=${page}&per_page=${USERS_PER_PAGE}`
    : `page=${page}&per_page=${USERS_PER_PAGE}`;

  const response = await withTimeout(
    fetch(`${url}/auth/v1/admin/users?${query}`, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      cache: "no-store",
    }),
    AUTH_LOOKUP_TIMEOUT_MS,
  );

  if (!response.ok) {
    return [];
  }

  const body = (await response.json()) as { users?: User[] };
  return body.users ?? [];
}

/** Look up an auth user by exact email (admin API). */
async function findAuthUserByEmailViaAdminApi(email: string): Promise<User | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    return null;
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const firstPage = await fetchAdminUsersPage(url, serviceRoleKey, 1, normalizedEmail);
    const directMatch = pickUserByEmail(firstPage, normalizedEmail);
    if (directMatch) {
      return directMatch;
    }

    // GoTrue may ignore the email query param and return an unfiltered page — scan all pages.
    for (let page = 1; page <= MAX_USER_PAGES; page += 1) {
      const users = await fetchAdminUsersPage(url, serviceRoleKey, page);
      const match = pickUserByEmail(users, normalizedEmail);
      if (match) {
        return match;
      }
      if (users.length < USERS_PER_PAGE) {
        break;
      }
    }

    return null;
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
