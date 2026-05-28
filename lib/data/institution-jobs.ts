import { formatFeedTimestamp } from "@/lib/i18n/format-feed-time";
import type { Locale } from "@/lib/i18n/config";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type InstitutionJobRow = {
  id: string;
  title: string;
  body: string;
  city: string | null;
  created_at: string;
};

export type InstitutionOpenJob = {
  id: string;
  title: string;
  bodyPreview: string;
  city: string | null;
  createdAt: string;
  timeLabel: string;
};

const MAX_PREVIEW_LEN = 140;

function toPreview(body: string) {
  const normalized = body.replace(/\s+/g, " ").trim();
  if (normalized.length <= MAX_PREVIEW_LEN) {
    return normalized;
  }
  return `${normalized.slice(0, MAX_PREVIEW_LEN - 1)}…`;
}

export async function getInstitutionOpenJobs(
  supabase: SupabaseClient<Database>,
  institutionSlug: string,
  locale: Locale,
): Promise<InstitutionOpenJob[]> {
  const { data, error } = await supabase
    .from("jobs")
    .select("id, title, body, city, created_at")
    .eq("status", "active")
    .eq("institution_slug", institutionSlug)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return [];
  }

  return ((data ?? []) as InstitutionJobRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    bodyPreview: toPreview(row.body),
    city: row.city,
    createdAt: row.created_at,
    timeLabel: formatFeedTimestamp(row.created_at, locale),
  }));
}
