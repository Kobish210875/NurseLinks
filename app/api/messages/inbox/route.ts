import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getAcceptedConnections } from "@/lib/data/connections";
import { getMessageThreads } from "@/lib/data/messages";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const [threads, connections] = await Promise.all([
    getMessageThreads(supabase, user.id),
    getAcceptedConnections(supabase, user.id),
  ]);

  return NextResponse.json({
    currentUserId: user.id,
    threads,
    connections: connections.map((c) => ({
      id: c.id,
      fullName: c.fullName,
      avatarUrl: c.avatarUrl,
      initials: c.initials,
    })),
  });
}
