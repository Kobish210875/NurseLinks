"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { markThreadRead, usersAreConnected } from "@/lib/data/messages";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

const MAX_BODY = 4000;

type MessageInsert = Database["public"]["Tables"]["direct_messages"]["Insert"];

function revalidateMessaging(peerId: string) {
  revalidatePath("/messages");
  revalidatePath(`/messages/${peerId}`);
  revalidatePath("/", "layout");
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

  const connected = await usersAreConnected(supabase, user.id, peerId);
  if (!connected) {
    return { error: "not-connected" as const };
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

  const body = (formData.get("body") as string | null)?.trim() ?? "";
  if (!body || body.length > MAX_BODY) {
    return { error: "invalid-body" as const };
  }

  if (peerId === user.id) {
    return { error: "self" as const };
  }

  const connected = await usersAreConnected(supabase, user.id, peerId);
  if (!connected) {
    return { error: "not-connected" as const };
  }

  const row: MessageInsert = {
    sender_id: user.id,
    recipient_id: peerId,
    body,
  };

  const { error } = await supabase.from("direct_messages").insert(row as never);

  if (error) {
    return { error: classifyMessageError(error.message) };
  }

  revalidateMessaging(peerId);
  return { success: true as const };
}
