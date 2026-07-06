"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertUserCanPublish } from "@/lib/auth/suspension";
import { isCurrentUserAdmin } from "@/lib/auth/admin";
import { autoFlagContentIfNeeded } from "@/lib/moderation/flags";
import { isDiscussionsNotConfigured } from "@/lib/discussions/setup-error";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

const MAX_TITLE = 200;
const MAX_BODY = 4000;
const MAX_ANON_LABEL = 80;

type ThreadInsert = Database["public"]["Tables"]["discussion_threads"]["Insert"];
type ReplyInsert = Database["public"]["Tables"]["discussion_replies"]["Insert"];

function getText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseAnonymous(formData: FormData) {
  const isAnonymous = formData.get("isAnonymous") === "on" || formData.get("isAnonymous") === "true";
  const anonymousLabel = getText(formData, "anonymousLabel").slice(0, MAX_ANON_LABEL);
  return {
    isAnonymous,
    anonymousLabel: isAnonymous && anonymousLabel ? anonymousLabel : null,
  };
}


function revalidateDiscussions(threadId?: string) {
  revalidatePath("/discussions");
  if (threadId) {
    revalidatePath(`/discussions/${threadId}`);
  }
}

export async function createDiscussionThread(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const publishCheck = await assertUserCanPublish(user.id);
  if (!publishCheck.ok) {
    return { error: "suspended" as const };
  }

  const title = getText(formData, "title");
  const body = getText(formData, "body");
  if (!title || title.length > MAX_TITLE || !body || body.length > MAX_BODY) {
    return { error: "invalid-input" as const };
  }

  const { isAnonymous, anonymousLabel } = parseAnonymous(formData);

  const threadId = randomUUID();

  const row: ThreadInsert = {
    id: threadId,
    author_id: user.id,
    title,
    body,
    is_anonymous: isAnonymous,
    anonymous_label: anonymousLabel,
  };

  const { error } = await supabase.from("discussion_threads").insert(row as never);

  if (error) {
    if (isDiscussionsNotConfigured(error.message, error.code)) {
      return { error: "not-configured" as const };
    }
    return { error: "create-failed" as const };
  }

  await autoFlagContentIfNeeded({
    contentType: "discussion",
    contentId: threadId,
    subjectUserId: user.id,
    body: `${title}\n${body}`,
  });

  revalidateDiscussions(threadId);
  redirect(`/discussions/${threadId}`);
}

export async function createDiscussionReply(threadId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const publishCheck = await assertUserCanPublish(user.id);
  if (!publishCheck.ok) {
    return { error: "suspended" as const };
  }

  const body = getText(formData, "body");
  if (!body || body.length > MAX_BODY) {
    return { error: "invalid-input" as const };
  }

  const { isAnonymous, anonymousLabel } = parseAnonymous(formData);

  const replyId = randomUUID();

  const row: ReplyInsert = {
    id: replyId,
    thread_id: threadId,
    author_id: user.id,
    body,
    is_anonymous: isAnonymous,
    anonymous_label: anonymousLabel,
  };

  const { error } = await supabase.from("discussion_replies").insert(row as never);

  if (error) {
    if (isDiscussionsNotConfigured(error.message, error.code)) {
      return { error: "not-configured" as const };
    }
    return { error: "create-failed" as const };
  }

  await autoFlagContentIfNeeded({
    contentType: "discussion_reply",
    contentId: replyId,
    subjectUserId: user.id,
    body,
  });

  revalidateDiscussions(threadId);
  return { success: true as const };
}

async function syncThreadReplyStats(
  client: NonNullable<ReturnType<typeof createAdminClient>>,
  threadId: string,
) {
  const { count, error: countError } = await client
    .from("discussion_replies")
    .select("*", { count: "exact", head: true })
    .eq("thread_id", threadId);

  if (countError) {
    throw countError;
  }

  const { data: lastReply, error: lastError } = await client
    .from("discussion_replies")
    .select("created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ created_at: string }>();

  if (lastError) {
    throw lastError;
  }

  const { error: updateError } = await client
    .from("discussion_threads")
    .update({
      reply_count: count ?? 0,
      last_reply_at: lastReply?.created_at ?? null,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", threadId);

  if (updateError) {
    throw updateError;
  }
}

export async function deleteDiscussionThread(threadId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "unauthorized" as const };
  }

  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return { error: "forbidden" as const };
  }

  const admin = createAdminClient();
  if (!admin) {
    return { error: "delete-failed" as const };
  }

  const { error } = await admin.from("discussion_threads").delete().eq("id", threadId);
  if (error) {
    if (isDiscussionsNotConfigured(error.message, error.code)) {
      return { error: "not-configured" as const };
    }
    return { error: "delete-failed" as const };
  }

  revalidateDiscussions();
  return { success: true as const };
}

export async function deleteDiscussionReply(threadId: string, replyId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "unauthorized" as const };
  }

  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return { error: "forbidden" as const };
  }

  const admin = createAdminClient();
  if (!admin) {
    return { error: "delete-failed" as const };
  }

  const { error } = await admin.from("discussion_replies").delete().eq("id", replyId);
  if (error) {
    if (isDiscussionsNotConfigured(error.message, error.code)) {
      return { error: "not-configured" as const };
    }
    return { error: "delete-failed" as const };
  }

  try {
    await syncThreadReplyStats(admin, threadId);
  } catch {
    return { error: "delete-failed" as const };
  }

  revalidateDiscussions(threadId);
  return { success: true as const };
}
