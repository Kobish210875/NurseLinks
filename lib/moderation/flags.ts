import { createAdminClient } from "@/lib/supabase/admin";
import { excerptForModeration } from "@/lib/moderation/normalize";
import { scanTextForModeration } from "@/lib/moderation/scan";
import type { ModerationContentType } from "@/lib/moderation/types";

type FlagInsert = {
  content_type: ModerationContentType;
  content_id: string;
  subject_user_id: string;
  body_excerpt: string;
  source: "auto" | "user_report";
  reporter_id?: string | null;
  matched_term?: string | null;
  report_note?: string | null;
};

async function insertFlag(row: FlagInsert): Promise<void> {
  const admin = createAdminClient();
  if (!admin) {
    return;
  }

  await admin.from("moderation_flags").insert(row as never);
}

export async function autoFlagContentIfNeeded(args: {
  contentType: ModerationContentType;
  contentId: string;
  subjectUserId: string;
  body: string;
}): Promise<void> {
  const scan = scanTextForModeration(args.body);
  if (!scan.flagged) {
    return;
  }

  await insertFlag({
    content_type: args.contentType,
    content_id: args.contentId,
    subject_user_id: args.subjectUserId,
    body_excerpt: excerptForModeration(args.body),
    source: "auto",
    reporter_id: null,
    matched_term: scan.matchedTerm,
  });
}

export async function createUserReportFlag(args: {
  contentType: ModerationContentType;
  contentId: string;
  subjectUserId: string;
  reporterId: string;
  body: string;
  reportNote?: string | null;
}): Promise<{ ok: true } | { error: "duplicate" | "failed" | "not-configured" }> {
  const admin = createAdminClient();
  const row: FlagInsert = {
    content_type: args.contentType,
    content_id: args.contentId,
    subject_user_id: args.subjectUserId,
    reporter_id: args.reporterId,
    body_excerpt: excerptForModeration(args.body),
    source: "user_report",
    report_note: args.reportNote?.trim() || null,
  };

  if (admin) {
    const { error } = await admin.from("moderation_flags").insert(row as never);
    if (error?.message?.toLowerCase().includes("duplicate")) {
      return { error: "duplicate" };
    }
    if (error) {
      return { error: "failed" };
    }
    return { ok: true };
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { error } = await supabase.from("moderation_flags").insert(row as never);

  if (error?.message?.toLowerCase().includes("moderation_flags")) {
    return { error: "not-configured" };
  }
  if (error?.code === "23505" || error?.message?.toLowerCase().includes("duplicate")) {
    return { error: "duplicate" };
  }
  if (error) {
    return { error: "failed" };
  }

  return { ok: true };
}
