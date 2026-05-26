"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function adminSoftDeleteUser(formData: FormData) {
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

  const now = new Date().toISOString();
  const anonymizedEmail = `deleted+${targetUserId.replaceAll("-", "")}-${crypto.randomUUID()}@nurselinks.invalid`;
  const deletedProfile: ProfileUpdate & { id: string; full_name: string } = {
    id: targetUserId,
    full_name: "משתמש שנמחק",
    headline: null,
    workplace_institution_slug: null,
    license_number: null,
    city: null,
    avatar_url: null,
    cv_draft: {},
    deleted_at: now,
    updated_at: now,
  };

  const cleanupResults = await Promise.all([
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

  if (cleanupResults.some((result) => result.error)) {
    redirect("/admin/users?error=delete-failed");
  }

  const { error: profileError } = await admin.from("profiles").upsert(
    [deletedProfile] as never,
    { onConflict: "id" },
  );

  if (profileError) {
    redirect("/admin/users?error=delete-failed");
  }

  const { error: authError } = await admin.auth.admin.updateUserById(targetUserId, {
    email: anonymizedEmail,
    password: crypto.randomUUID(),
    user_metadata: {
      full_name: "משתמש שנמחק",
      deleted_at: now,
      deleted_by_admin: adminUser.id,
    },
  });

  if (authError) {
    redirect("/admin/users?error=delete-failed");
  }

  await admin.storage.from("avatars").remove([`${targetUserId}/avatar.jpg`]);

  revalidatePath("/admin/users");
  revalidatePath("/network");
  revalidatePath("/home");
  redirect("/admin/users?deleted=1");
}
