import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getNetworkPeer } from "@/lib/data/connections";
import { getThreadMessages } from "@/lib/data/messages";
import { getMessagesVersion } from "@/lib/data/sync-versions";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ peerId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { peerId } = await context.params;
  const supabase = await createClient();
  const peer = await getNetworkPeer(supabase, user.id, peerId);

  if (!peer) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }

  const [messages, messagesVersion] = await Promise.all([
    getThreadMessages(supabase, user.id, peerId),
    getMessagesVersion(supabase, user.id, peerId),
  ]);

  return NextResponse.json({
    peer,
    messages,
    messagesVersion,
    currentUserId: user.id,
  });
}
