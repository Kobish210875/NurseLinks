"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ModerationContentType } from "@/lib/moderation/types";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function markFlagReviewed(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  flagId: string,
  adminId: string,
  resolution: "dismissed" | "content_deleted" | "user_suspended",
) {
  await admin
    .from("moderation_flags")
    .update({
      status: "reviewed",
      resolution,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
    } as never)
    .eq("id", flagId)
    .eq("status", "pending");
}

async function deleteFlaggedContent(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  contentType: ModerationContentType,
  contentId: string,
) {
  if (contentType === "post") {
    await admin.from("posts").delete().eq("id", contentId);
    return;
  }
  if (contentType === "comment") {
    await admin.from("post_comments").delete().eq("id", contentId);
    return;
  }
  await admin.from("direct_messages").delete().eq("id", contentId);
}

function revalidateModeration() {
  revalidatePath("/admin/moderation");
  revalidatePath("/home");
  revalidatePath("/messages");
  revalidatePath("/network");
}

export async function adminDismissModerationFlag(formData: FormData) {
  const adminUser = await requireAdmin();
  const flagId = getString(formData, "flagId");
  if (!flagId) {
    redirect("/admin/moderation?error=missing-flag");
  }

  const admin = createAdminClient();
  if (!admin) {
    redirect("/admin/moderation?error=missing-service-role");
  }

  await markFlagReviewed(admin, flagId, adminUser.id, "dismissed");
  revalidateModeration();
  redirect("/admin/moderation?done=1");
}

export async function adminDeleteModerationContent(formData: FormData) {
  const adminUser = await requireAdmin();
  const flagId = getString(formData, "flagId");
  if (!flagId) {
    redirect("/admin/moderation?error=missing-flag");
  }

  const admin = createAdminClient();
  if (!admin) {
    redirect("/admin/moderation?error=missing-service-role");
  }

  const { data: flag } = await admin
    .from("moderation_flags")
    .select("content_type, content_id")
    .eq("id", flagId)
    .maybeSingle<{ content_type: ModerationContentType; content_id: string }>();

  if (!flag) {
    redirect("/admin/moderation?error=missing-flag");
  }

  await deleteFlaggedContent(admin, flag.content_type, flag.content_id);
  await markFlagReviewed(admin, flagId, adminUser.id, "content_deleted");
  revalidateModeration();
  redirect("/admin/moderation?done=1");
}

export async function adminSuspendUserFromFlag(formData: FormData) {
  const adminUser = await requireAdmin();
  const flagId = getString(formData, "flagId");
  const userId = getString(formData, "userId");
  const suspendedUntil = getString(formData, "suspendedUntil");
  const reason = getString(formData, "reason");

  if (!flagId || !userId || !suspendedUntil) {
    redirect("/admin/moderation?error=missing-fields");
  }

  const untilMs = new Date(suspendedUntil).getTime();
  if (Number.isNaN(untilMs) || untilMs <= Date.now()) {
    redirect("/admin/moderation?error=invalid-until");
  }

  const admin = createAdminClient();
  if (!admin) {
    redirect("/admin/moderation?error=missing-service-role");
  }

  const { data: targetAdmin } = await admin
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle<{ user_id: string }>();
  if (targetAdmin?.user_id) {
    redirect("/admin/moderation?error=cannot-suspend-admin");
  }

  await admin
    .from("profiles")
    .update({
      suspended_until: new Date(suspendedUntil).toISOString(),
      suspension_reason: reason || null,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", userId);

  await markFlagReviewed(admin, flagId, adminUser.id, "user_suspended");
  revalidateModeration();
  redirect("/admin/moderation?done=1");
}

export async function adminLiftUserSuspension(formData: FormData) {
  await requireAdmin();
  const userId = getString(formData, "userId");
  if (!userId) {
    redirect("/admin/moderation?error=missing-user");
  }

  const admin = createAdminClient();
  if (!admin) {
    redirect("/admin/moderation?error=missing-service-role");
  }

  await admin
    .from("profiles")
    .update({
      suspended_until: null,
      suspension_reason: null,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", userId);

  revalidateModeration();
  redirect("/admin/moderation?done=1");
}
