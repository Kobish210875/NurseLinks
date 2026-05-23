import { getUnreadMessageCount } from "@/lib/data/messages";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type LatestMessageRow = { id: string; created_at: string };

export async function getMessagesVersion(
  supabase: SupabaseClient<Database>,
  userId: string,
  peerId?: string,
): Promise<string> {
  let query = supabase
    .from("direct_messages")
    .select("id, created_at")
    .order("created_at", { ascending: false })
    .limit(1);

  if (peerId) {
    query = query.or(
      `and(sender_id.eq.${userId},recipient_id.eq.${peerId}),and(sender_id.eq.${peerId},recipient_id.eq.${userId})`,
    );
  } else {
    query = query.or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);
  }

  const { data } = await query;
  const latest = (data?.[0] as LatestMessageRow | undefined) ?? null;

  if (!peerId) {
    const unread = await getUnreadMessageCount(supabase, userId);
    return `${latest?.created_at ?? "empty"}:${latest?.id ?? ""}:u${unread}`;
  }

  return `${latest?.created_at ?? "empty"}:${latest?.id ?? ""}`;
}

export async function getJobsVersion(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<string> {
  const [jobsRes, appsRes, viewsRes] = await Promise.all([
    supabase.from("jobs").select("created_at").order("created_at", { ascending: false }).limit(1),
    supabase
      .from("job_applications")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1),
    supabase.from("job_list_views").select("seen_at").eq("user_id", userId).maybeSingle(),
  ]);

  const latestJob = (jobsRes.data?.[0] as { created_at?: string } | undefined)?.created_at;
  const latestApp = (appsRes.data?.[0] as { created_at?: string } | undefined)?.created_at;
  const lastSeen = (viewsRes.data as { seen_at?: string } | null)?.seen_at;
  const candidates = [latestJob, latestApp, lastSeen].filter(Boolean) as string[];

  if (candidates.length === 0) {
    return "empty";
  }

  return candidates.sort().at(-1) ?? "empty";
}
