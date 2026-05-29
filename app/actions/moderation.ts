"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createUserReportFlag } from "@/lib/moderation/flags";
import type { ModerationContentType } from "@/lib/moderation/types";
import { createClient } from "@/lib/supabase/server";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isContentType(value: string): value is ModerationContentType {
  return value === "post" || value === "comment" || value === "message";
}

async function loadContentBody(
  contentType: ModerationContentType,
  contentId: string,
): Promise<{ body: string; subjectUserId: string } | null> {
  const supabase = await createClient();

  if (contentType === "post") {
    const { data } = await supabase
      .from("posts")
      .select("body, author_id")
      .eq("id", contentId)
      .maybeSingle<{ body: string; author_id: string }>();
    return data ? { body: data.body, subjectUserId: data.author_id } : null;
  }

  if (contentType === "comment") {
    const { data } = await supabase
      .from("post_comments")
      .select("body, author_id")
      .eq("id", contentId)
      .maybeSingle<{ body: string; author_id: string }>();
    return data ? { body: data.body, subjectUserId: data.author_id } : null;
  }

  const { data } = await supabase
    .from("direct_messages")
    .select("body, sender_id")
    .eq("id", contentId)
    .maybeSingle<{ body: string; sender_id: string }>();
  return data ? { body: data.body, subjectUserId: data.sender_id } : null;
}

export async function reportContent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const contentType = getString(formData, "contentType");
  const contentId = getString(formData, "contentId");
  const reportNote = getString(formData, "reportNote");

  if (!isContentType(contentType) || !contentId) {
    return { error: "invalid-request" as const };
  }

  const content = await loadContentBody(contentType, contentId);
  if (!content) {
    return { error: "not-found" as const };
  }

  if (content.subjectUserId === user.id) {
    return { error: "self" as const };
  }

  const result = await createUserReportFlag({
    contentType,
    contentId,
    subjectUserId: content.subjectUserId,
    reporterId: user.id,
    body: content.body,
    reportNote: reportNote || null,
  });

  if (!("ok" in result)) {
    if (result.error === "not-configured") {
      return { error: "not-configured" as const };
    }
    if (result.error === "duplicate") {
      return { error: "duplicate" as const };
    }
    return { error: "failed" as const };
  }

  revalidatePath("/admin/moderation");
  return { success: true as const };
}
