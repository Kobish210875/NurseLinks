"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function adminDeleteUser(formData: FormData) {
  const adminUser = await requireAdmin();
  const targetUserId = getRequiredString(formData, "userId");

  if (!targetUserId) {
    redirect("/admin/users?error=missing-user");
  }
  if (targetUserId === adminUser.id) {
    redirect("/admin/users?error=cannot-delete-self");
  }

  const admin = createAdminClient();
  if (!admin) {
    redirect("/admin/users?error=missing-service-role");
  }

  const { data: targetAdmin } = await admin
    .from("admin_users")
    .select("user_id")
    .eq("user_id", targetUserId)
    .maybeSingle<{ user_id: string }>();
  if (targetAdmin?.user_id) {
    redirect("/admin/users?error=cannot-delete-admin");
  }

  // Best-effort row cleanup. FK cascades from auth.users -> profiles also remove
  // these, so failures here must NOT block the authoritative auth-user deletion.
  await Promise.allSettled([
    admin
      .from("connections")
      .delete()
      .or(`requester_id.eq.${targetUserId},addressee_id.eq.${targetUserId}`),
    admin
      .from("follows")
      .delete()
      .or(`follower_id.eq.${targetUserId},following_id.eq.${targetUserId}`),
    admin.from("user_specialties").delete().eq("user_id", targetUserId),
    admin.from("user_workplaces").delete().eq("user_id", targetUserId),
    admin.from("job_list_views").delete().eq("user_id", targetUserId),
    admin
      .from("post_shares")
      .delete()
      .or(`sharer_id.eq.${targetUserId},recipient_id.eq.${targetUserId}`),
    admin
      .from("direct_messages")
      .delete()
      .or(`sender_id.eq.${targetUserId},recipient_id.eq.${targetUserId}`),
    admin.from("job_applications").delete().eq("applicant_id", targetUserId),
  ]);

  // Remove storage objects (not covered by DB cascade). Best-effort.
  await admin.storage
    .from("avatars")
    .remove([`${targetUserId}/avatar.jpg`])
    .catch(() => undefined);

  // Remove the profile row, which cascades the remaining owned content.
  await admin.from("profiles").delete().eq("id", targetUserId);

  // Authoritative step: hard-delete the auth user so the email is freed.
  const { error: authError } = await admin.auth.admin.deleteUser(targetUserId);

  if (authError) {
    redirect("/admin/users?error=delete-failed");
  }

  revalidatePath("/admin/users");
  revalidatePath("/network");
  revalidatePath("/home");
  redirect("/admin/users?deleted=1");
}
