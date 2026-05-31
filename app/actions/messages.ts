"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertUserCanPublish } from "@/lib/auth/suspension";
import { markThreadRead } from "@/lib/data/messages";
import { autoFlagContentIfNeeded } from "@/lib/moderation/flags";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

const MAX_BODY = 4000;

type MessageInsert = Database["public"]["Tables"]["direct_messages"]["Insert"];

function revalidateMessaging(peerId: string) {
  revalidatePath("/messages");
  revalidatePath(`/messages/${peerId}`);
}

function classifyMessageError(message: string) {
  const lower = message.toLowerCase();
  if (
    lower.includes("direct_messages") ||
    lower.includes("does not exist") ||
    lower.includes("schema cache")
  ) {
    return "messaging-not-configured" as const;
  }
  if (lower.includes("row-level security") || lower.includes("policy")) {
    return "send-blocked" as const;
  }
  return "send-failed" as const;
}

export async function markThreadAsRead(peerId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || peerId === user.id) {
    return { error: "unauthorized" as const };
  }

  await markThreadRead(supabase, user.id, peerId);
  revalidateMessaging(peerId);
  return { success: true as const };
}

export async function sendDirectMessage(peerId: string, formData: FormData) {
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

  const body = (formData.get("body") as string | null)?.trim() ?? "";
  if (!body || body.length > MAX_BODY) {
    return { error: "invalid-body" as const };
  }

  if (peerId === user.id) {
    return { error: "self" as const };
  }

  const row: MessageInsert = {
    sender_id: user.id,
    recipient_id: peerId,
    body,
  };

  const { data: inserted, error } = await supabase
    .from("direct_messages")
    .insert(row as never)
    .select("id")
    .single<{ id: string }>();

  if (error || !inserted?.id) {
    return { error: classifyMessageError(error?.message ?? "") };
  }

  await autoFlagContentIfNeeded({
    contentType: "message",
    contentId: inserted.id,
    subjectUserId: user.id,
    body,
  });

  revalidateMessaging(peerId);
  return { success: true as const };
}
