import { createAdminClient } from "@/lib/supabase/admin";

export async function confirmUserEmail(userId: string) {
  const admin = createAdminClient();
  if (!admin) {
    return false;
  }

  const { error } = await admin.auth.admin.updateUserById(userId, {
    email_confirm: true,
  });

  return !error;
}
