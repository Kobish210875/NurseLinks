import { getInitials } from "@/lib/auth/initials";
import { loadConnectionRows, resolveConnectionStatus } from "@/lib/data/connections";
import type { DirectMessage, MessageThread } from "@/lib/network/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type MessageRow = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

type ProfileRow = {
  id: string;
  full_name: string;
  headline: string | null;
  avatar_url: string | null;
};

export async function usersAreConnected(
  supabase: SupabaseClient<Database>,
  userId: string,
  peerId: string,
): Promise<boolean> {
  const rows = await loadConnectionRows(supabase, userId);
  return resolveConnectionStatus(userId, peerId, rows).status === "connected";
}

export async function getMessageThreads(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<MessageThread[]> {
  const { data: messagesRaw } = await supabase
    .from("direct_messages")
    .select("id, sender_id, recipient_id, body, created_at, read_at")
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(500);

  const messages = (messagesRaw ?? []) as MessageRow[];
  const byPeer = new Map<
    string,
    { last: MessageRow; unread: number }
  >();

  for (const m of messages) {
    const peerId = m.sender_id === userId ? m.recipient_id : m.sender_id;
    if (byPeer.has(peerId)) {
      const entry = byPeer.get(peerId)!;
      if (m.recipient_id === userId && !m.read_at) {
        entry.unread += 1;
      }
      continue;
    }
    byPeer.set(peerId, {
      last: m,
      unread: m.recipient_id === userId && !m.read_at ? 1 : 0,
    });
  }

  const peerIds = [...byPeer.keys()];
  if (!peerIds.length) {
    return [];
  }

  const { data: profilesRaw } = await supabase
    .from("profiles")
    .select("id, full_name, headline, avatar_url")
    .in("id", peerIds);

  const profiles = new Map(((profilesRaw ?? []) as ProfileRow[]).map((p) => [p.id, p]));

  return peerIds
    .map((peerId) => {
      const profile = profiles.get(peerId);
      const entry = byPeer.get(peerId)!;
      if (!profile) {
        return null;
      }
      const name = profile.full_name.trim() || "User";
      return {
        peerId,
        peerName: name,
        peerHeadline: profile.headline,
        peerAvatarUrl: profile.avatar_url,
        peerInitials: getInitials(name),
        lastMessageBody: entry.last.body,
        lastMessageAt: entry.last.created_at,
        unreadCount: entry.unread,
      } satisfies MessageThread;
    })
    .filter((t): t is MessageThread => t !== null)
    .sort(
      (a, b) =>
        new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
    );
}

export async function getThreadMessages(
  supabase: SupabaseClient<Database>,
  userId: string,
  peerId: string,
  limit = 80,
): Promise<DirectMessage[]> {
  const { data } = await supabase
    .from("direct_messages")
    .select("id, sender_id, recipient_id, body, created_at")
    .or(
      `and(sender_id.eq.${userId},recipient_id.eq.${peerId}),and(sender_id.eq.${peerId},recipient_id.eq.${userId})`,
    )
    .order("created_at", { ascending: true })
    .limit(limit);

  return ((data ?? []) as Omit<MessageRow, "read_at">[]).map((m) => ({
    id: m.id,
    senderId: m.sender_id,
    recipientId: m.recipient_id,
    body: m.body,
    createdAt: m.created_at,
    isMine: m.sender_id === userId,
  }));
}

export async function getUnreadMessageCount(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("direct_messages")
    .select("*", { count: "exact", head: true })
    .eq("recipient_id", userId)
    .is("read_at", null);

  if (error) {
    return 0;
  }

  return count ?? 0;
}

export async function markThreadRead(
  supabase: SupabaseClient<Database>,
  userId: string,
  peerId: string,
) {
  await supabase
    .from("direct_messages")
    .update({ read_at: new Date().toISOString() } as never)
    .eq("recipient_id", userId)
    .eq("sender_id", peerId)
    .is("read_at", null);
}
