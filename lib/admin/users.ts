import { createAdminClient } from "@/lib/supabase/admin";

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

type ProfileRow = {
  id: string;
  full_name: string;
  headline: string | null;
  deleted_at: string | null;
};

export async function getAdminUsers(query = "") {
  const admin = createAdminClient();
  if (!admin) {
    return { users: [] as AdminUserListItem[], error: "missing-service-role" };
  }

  const { data: authData, error: authError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });

  if (authError) {
    return { users: [] as AdminUserListItem[], error: "load-failed" };
  }

  const authUsers = authData.users;
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

  const users = authUsers
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
    .filter((user) => {
      if (!normalizedQuery) {
        return true;
      }

      return (
        user.fullName.toLowerCase().includes(normalizedQuery) ||
        user.email.toLowerCase().includes(normalizedQuery)
      );
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return { users, error: null };
}
