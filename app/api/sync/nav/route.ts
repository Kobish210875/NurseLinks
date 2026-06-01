import { NextResponse } from "next/server";
import { getPendingInvitationCount } from "@/lib/data/connections";
import { getNavJobsUnreadCount } from "@/lib/data/jobs";
import { getUnreadMessageCount } from "@/lib/data/messages";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [pendingInvitations, unreadMessages, unreadJobs] = await Promise.all([
    getPendingInvitationCount(supabase, user.id),
    getUnreadMessageCount(supabase, user.id),
    getNavJobsUnreadCount(supabase, user.id),
  ]);

  return NextResponse.json(
    { pendingInvitations, unreadMessages, unreadJobs },
    { headers: { "Cache-Control": "no-store" } },
  );
}
