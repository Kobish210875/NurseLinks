"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { loadConnectionRows, resolveConnectionStatus } from "@/lib/data/connections";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type ConnectionInsert = Database["public"]["Tables"]["connections"]["Insert"];
function revalidateNetworkPages() {
  revalidatePath("/network");
  revalidatePath("/messages");
  revalidatePath("/home");
}

/** Nav badge counts (pending invitations) live in the root layout. */
function revalidateNetworkNav() {
  revalidateNetworkPages();
  revalidatePath("/", "layout");
}

export async function sendConnectionRequest(addresseeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  if (addresseeId === user.id) {
    return { error: "self" as const };
  }

  const rows = await loadConnectionRows(supabase, user.id);
  const existing = resolveConnectionStatus(user.id, addresseeId, rows);

  if (existing.status === "connected") {
    return { error: "already-connected" as const };
  }

  if (existing.status === "pending_out") {
    return { success: true as const };
  }

  if (existing.status === "pending_in") {
    const { error } = await supabase
      .from("connections")
      .update({ status: "accepted", updated_at: new Date().toISOString() } as never)
      .eq("requester_id", addresseeId)
      .eq("addressee_id", user.id)
      .eq("status", "pending");

    if (error) {
      return { error: "accept-failed" as const };
    }

    revalidateNetworkNav();
    return { success: true as const, accepted: true as const };
  }

  if (existing.status === "blocked") {
    return { error: "blocked" as const };
  }

  const row: ConnectionInsert = {
    requester_id: user.id,
    addressee_id: addresseeId,
    status: "pending",
  };

  const { error } = await supabase.from("connections").insert(row as never);

  if (error) {
    return { error: "request-failed" as const };
  }

  revalidateNetworkPages();
  return { success: true as const };
}

export async function acceptConnectionRequest(requesterId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { error } = await supabase
    .from("connections")
    .update({ status: "accepted", updated_at: new Date().toISOString() } as never)
    .eq("requester_id", requesterId)
    .eq("addressee_id", user.id)
    .eq("status", "pending");

  if (error) {
    return { error: "accept-failed" as const };
  }

  revalidateNetworkNav();
  return { success: true as const };
}

export async function rejectConnectionRequest(requesterId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { error } = await supabase
    .from("connections")
    .delete()
    .eq("requester_id", requesterId)
    .eq("addressee_id", user.id)
    .eq("status", "pending");

  if (error) {
    return { error: "reject-failed" as const };
  }

  revalidateNetworkNav();
  return { success: true as const };
}

export async function cancelConnectionRequest(addresseeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { error } = await supabase
    .from("connections")
    .delete()
    .eq("requester_id", user.id)
    .eq("addressee_id", addresseeId)
    .eq("status", "pending");

  if (error) {
    return { error: "cancel-failed" as const };
  }

  revalidateNetworkPages();
  return { success: true as const };
}

export async function removeConnection(peerId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  if (peerId === user.id) {
    return { error: "self" as const };
  }

  const rows = await loadConnectionRows(supabase, user.id);
  const existing = resolveConnectionStatus(user.id, peerId, rows);

  if (existing.status !== "connected") {
    return { error: "not-connected" as const };
  }

  const row = rows.find(
    (entry) =>
      entry.status === "accepted" &&
      ((entry.requester_id === user.id && entry.addressee_id === peerId) ||
        (entry.requester_id === peerId && entry.addressee_id === user.id)),
  );

  if (!row) {
    return { error: "not-connected" as const };
  }

  const { error } = await supabase
    .from("connections")
    .delete()
    .eq("requester_id", row.requester_id)
    .eq("addressee_id", row.addressee_id)
    .eq("status", "accepted");

  if (error) {
    return { error: "remove-failed" as const };
  }

  revalidateNetworkNav();
  revalidatePath(`/profile/${peerId}`);
  revalidatePath(`/messages/${peerId}`);
  return { success: true as const };
}
