import { getInitials } from "@/lib/auth/initials";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  ModerationContentType,
  ModerationFlagSource,
  ModerationResolution,
} from "@/lib/moderation/types";

export type AdminModerationFlag = {
  id: string;
  contentType: ModerationContentType;
  contentId: string;
  subjectUserId: string;
  subjectName: string;
  subjectInitials: string;
  reporterId: string | null;
  reporterName: string | null;
  bodyExcerpt: string;
  source: ModerationFlagSource;
  matchedTerm: string | null;
  reportNote: string | null;
  createdAt: string;
  resolution: ModerationResolution | null;
};

type FlagRow = {
  id: string;
  content_type: ModerationContentType;
  content_id: string;
  subject_user_id: string;
  reporter_id: string | null;
  body_excerpt: string;
  source: ModerationFlagSource;
  matched_term: string | null;
  report_note: string | null;
  created_at: string;
  resolution: ModerationResolution | null;
};

export async function getAdminModerationFlags(
  status: "pending" | "reviewed" = "pending",
): Promise<{ flags: AdminModerationFlag[]; error: string | null }> {
  const admin = createAdminClient();
  if (!admin) {
    return { flags: [], error: "missing-service-role" };
  }

  const { data, error } = await admin
    .from("moderation_flags")
    .select(
      "id, content_type, content_id, subject_user_id, reporter_id, body_excerpt, source, matched_term, report_note, created_at, resolution",
    )
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    if (error.message.toLowerCase().includes("moderation_flags")) {
      return { flags: [], error: "not-configured" };
    }
    return { flags: [], error: "load-failed" };
  }

  const rows = (data ?? []) as FlagRow[];
  const profileIds = [
    ...new Set(
      rows.flatMap((r) => [r.subject_user_id, r.reporter_id].filter((id): id is string => Boolean(id))),
    ),
  ];

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name")
    .in("id", profileIds.length ? profileIds : ["00000000-0000-0000-0000-000000000000"]);

  const nameById = new Map(
    ((profiles ?? []) as { id: string; full_name: string }[]).map((p) => [
      p.id,
      p.full_name.trim() || "User",
    ]),
  );

  return {
    flags: rows.map((row) => {
      const subjectName = nameById.get(row.subject_user_id) ?? "User";
      const reporterName = row.reporter_id ? nameById.get(row.reporter_id) ?? "User" : null;
      return {
        id: row.id,
        contentType: row.content_type,
        contentId: row.content_id,
        subjectUserId: row.subject_user_id,
        subjectName,
        subjectInitials: getInitials(subjectName),
        reporterId: row.reporter_id,
        reporterName,
        bodyExcerpt: row.body_excerpt,
        source: row.source,
        matchedTerm: row.matched_term,
        reportNote: row.report_note,
        createdAt: row.created_at,
        resolution: row.resolution,
      };
    }),
    error: null,
  };
}

export async function getPendingModerationCount(): Promise<number> {
  const admin = createAdminClient();
  if (!admin) {
    return 0;
  }

  const { count, error } = await admin
    .from("moderation_flags")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  if (error) {
    return 0;
  }

  return count ?? 0;
}
