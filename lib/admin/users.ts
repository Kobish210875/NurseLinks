import { createAdminClient } from "@/lib/supabase/admin";
import type { User } from "@supabase/supabase-js";

const USERS_PAGE_SIZE = 1000;
const MAX_USER_PAGES = 20;

export type AdminUserListItem = {
  id: string;
  email: string;
  fullName: string;
  headline: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  emailConfirmedAt: string | null;
  deletedAt: string | null;
};

export type AdminUsersSummary = {
  total: number;
  shown: number;
  active: number;
  pendingEmail: number;
  deleted: number;
};

type ProfileRow = {
  id: string;
  full_name: string;
  headline: string | null;
  deleted_at: string | null;
};

export async function getAdminUsers(query = "") {
  const admin = createAdminClient();
  if (!admin) {
    return {
      users: [] as AdminUserListItem[],
      summary: { total: 0, shown: 0, active: 0, pendingEmail: 0, deleted: 0 },
      error: "missing-service-role",
    };
  }

  const authUsers: User[] = [];
  for (let page = 1; page <= MAX_USER_PAGES; page += 1) {
    const { data: authData, error: authError } = await admin.auth.admin.listUsers({
      page,
      perPage: USERS_PAGE_SIZE,
    });

    if (authError) {
      return {
        users: [] as AdminUserListItem[],
        summary: { total: 0, shown: 0, active: 0, pendingEmail: 0, deleted: 0 },
        error: "load-failed",
      };
    }

    authUsers.push(...authData.users);
    if (authData.users.length < USERS_PAGE_SIZE) {
      break;
    }
  }

  const ids = authUsers.map((user) => user.id);
  const { data: profiles } = ids.length
    ? await admin
        .from("profiles")
        .select("id, full_name, headline, deleted_at")
        .in("id", ids)
        .returns<ProfileRow[]>()
    : { data: [] as ProfileRow[] };

  const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const normalizedQuery = query.trim().toLowerCase();

  const allUsers = authUsers
    .map<AdminUserListItem>((user) => {
      const profile = profilesById.get(user.id);
      const email = user.email ?? "";

      return {
        id: user.id,
        email,
        fullName:
          profile?.full_name?.trim() ||
          (user.user_metadata?.full_name as string | undefined)?.trim() ||
          email.split("@")[0] ||
          "User",
        headline:
          profile?.headline ??
          ((user.user_metadata?.headline as string | undefined)?.trim() || null),
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at ?? null,
        emailConfirmedAt: user.email_confirmed_at ?? null,
        deletedAt: profile?.deleted_at ?? null,
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const users = allUsers
    .filter((user) => {
      if (!normalizedQuery) {
        return true;
      }

      return (
        user.fullName.toLowerCase().includes(normalizedQuery) ||
        user.email.toLowerCase().includes(normalizedQuery)
      );
    });

  const summary: AdminUsersSummary = {
    total: allUsers.length,
    shown: users.length,
    active: allUsers.filter((user) => !user.deletedAt && user.emailConfirmedAt).length,
    pendingEmail: allUsers.filter((user) => !user.deletedAt && !user.emailConfirmedAt).length,
    deleted: allUsers.filter((user) => user.deletedAt).length,
  };

  return { users, summary, error: null };
}
