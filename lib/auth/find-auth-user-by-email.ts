import { createAdminClient } from "@/lib/supabase/admin";
import type { User } from "@supabase/supabase-js";

const USERS_PAGE_SIZE = 1000;
const MAX_USER_PAGES = 20;

export async function findAuthUserByEmail(email: string): Promise<User | null> {
  const admin = createAdminClient();
  if (!admin) {
    return null;
  }

  const normalizedEmail = email.trim().toLowerCase();

  for (let page = 1; page <= MAX_USER_PAGES; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: USERS_PAGE_SIZE,
    });

    if (error) {
      return null;
    }

    const match = data.users.find((user) => user.email?.toLowerCase() === normalizedEmail);
    if (match) {
      return match;
    }

    if (data.users.length < USERS_PAGE_SIZE) {
      break;
    }
  }

  return null;
}
