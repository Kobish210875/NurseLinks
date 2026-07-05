import { getInitials } from "@/lib/auth/initials";
import { formatFeedTimestamp } from "@/lib/i18n/format-feed-time";
import type { Locale } from "@/lib/i18n/config";
import { createT, getMessages } from "@/lib/i18n/messages";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type DiscussionAuthorDisplay = {
  id: string;
  name: string;
  avatarUrl: string | null;
  initials: string;
  isAnonymous: boolean;
  profileHref: string | null;
};

export type DiscussionThreadSummary = {
  id: string;
  title: string;
  bodyPreview: string;
  replyCount: number;
  createdAt: string;
  lastActivityAt: string;
  timeLabel: string;
  author: DiscussionAuthorDisplay;
};

export type DiscussionReply = {
  id: string;
  threadId: string;
  body: string;
  createdAt: string;
  timeLabel: string;
  author: DiscussionAuthorDisplay;
  isMine: boolean;
};

export type DiscussionThreadDetail = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  timeLabel: string;
  replyCount: number;
  author: DiscussionAuthorDisplay;
  replies: DiscussionReply[];
};

type ThreadRow = {
  id: string;
  author_id: string;
  title: string;
  body: string;
  is_anonymous: boolean;
  anonymous_label: string | null;
  reply_count: number;
  created_at: string;
  last_reply_at: string | null;
};

type ReplyRow = {
  id: string;
  thread_id: string;
  author_id: string;
  body: string;
  is_anonymous: boolean;
  anonymous_label: string | null;
  created_at: string;
};

type ProfileRow = {
  id: string;
  full_name: string;
  avatar_url: string | null;
};

const BODY_PREVIEW_LEN = 160;

function isDiscussionsNotConfigured(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes("discussion_threads") ||
    lower.includes("discussion_replies") ||
    lower.includes("does not exist") ||
    lower.includes("schema cache")
  );
}

function previewBody(body: string) {
  const trimmed = body.trim();
  if (trimmed.length <= BODY_PREVIEW_LEN) {
    return trimmed;
  }
  return `${trimmed.slice(0, BODY_PREVIEW_LEN).trim()}…`;
}

function resolveAuthorDisplay(args: {
  authorId: string;
  profile: ProfileRow | undefined;
  isAnonymous: boolean;
  anonymousLabel: string | null;
  anonymousDefault: string;
}): DiscussionAuthorDisplay {
  if (args.isAnonymous) {
    const name = args.anonymousLabel?.trim() || args.anonymousDefault;
    return {
      id: args.authorId,
      name,
      avatarUrl: null,
      initials: name.slice(0, 2),
      isAnonymous: true,
      profileHref: null,
    };
  }

  const fullName = args.profile?.full_name?.trim() || args.anonymousDefault;
  return {
    id: args.authorId,
    name: fullName,
    avatarUrl: args.profile?.avatar_url ?? null,
    initials: getInitials(fullName),
    isAnonymous: false,
    profileHref: `/profile/${args.authorId}`,
  };
}

async function loadProfiles(
  supabase: SupabaseClient<Database>,
  authorIds: string[],
): Promise<Map<string, ProfileRow>> {
  const unique = [...new Set(authorIds.filter(Boolean))];
  if (unique.length === 0) {
    return new Map();
  }

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", unique);

  const map = new Map<string, ProfileRow>();
  for (const row of (data ?? []) as ProfileRow[]) {
    map.set(row.id, row);
  }
  return map;
}

export async function getDiscussionThreads(
  supabase: SupabaseClient<Database>,
  locale: Locale,
): Promise<{ threads: DiscussionThreadSummary[] } | { error: "not-configured" }> {
  const t = createT(getMessages(locale));

  const { data, error } = await supabase
    .from("discussion_threads")
    .select(
      "id, author_id, title, body, is_anonymous, anonymous_label, reply_count, created_at, last_reply_at",
    )
    .order("last_reply_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    if (isDiscussionsNotConfigured(error.message)) {
      return { error: "not-configured" };
    }
    throw error;
  }

  const rows = ((data ?? []) as ThreadRow[]);
  const profiles = await loadProfiles(
    supabase,
    rows.map((row) => row.author_id),
  );

  const threads = rows.map((row) => {
    const activityAt = row.last_reply_at ?? row.created_at;
    return {
      id: row.id,
      title: row.title,
      bodyPreview: previewBody(row.body),
      replyCount: row.reply_count,
      createdAt: row.created_at,
      lastActivityAt: activityAt,
      timeLabel: formatFeedTimestamp(activityAt, locale),
      author: resolveAuthorDisplay({
        authorId: row.author_id,
        profile: profiles.get(row.author_id),
        isAnonymous: row.is_anonymous,
        anonymousLabel: row.anonymous_label,
        anonymousDefault: t("discussions.anonymousDefault"),
      }),
    };
  });

  return { threads };
}

export async function getDiscussionThread(
  supabase: SupabaseClient<Database>,
  threadId: string,
  currentUserId: string,
  locale: Locale,
): Promise<{ thread: DiscussionThreadDetail } | { error: "not-found" | "not-configured" }> {
  const t = createT(getMessages(locale));

  const { data: threadRaw, error: threadError } = await supabase
    .from("discussion_threads")
    .select(
      "id, author_id, title, body, is_anonymous, anonymous_label, reply_count, created_at",
    )
    .eq("id", threadId)
    .maybeSingle();

  if (threadError) {
    if (isDiscussionsNotConfigured(threadError.message)) {
      return { error: "not-configured" };
    }
    throw threadError;
  }

  if (!threadRaw) {
    return { error: "not-found" };
  }

  const threadRow = threadRaw as ThreadRow;

  const { data: repliesRaw, error: repliesError } = await supabase
    .from("discussion_replies")
    .select("id, thread_id, author_id, body, is_anonymous, anonymous_label, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (repliesError) {
    if (isDiscussionsNotConfigured(repliesError.message)) {
      return { error: "not-configured" };
    }
    throw repliesError;
  }

  const replyRows = (repliesRaw ?? []) as ReplyRow[];
  const profiles = await loadProfiles(supabase, [
    threadRow.author_id,
    ...replyRows.map((row) => row.author_id),
  ]);

  const anonymousDefault = t("discussions.anonymousDefault");

  const thread: DiscussionThreadDetail = {
    id: threadRow.id,
    title: threadRow.title,
    body: threadRow.body,
    createdAt: threadRow.created_at,
    timeLabel: formatFeedTimestamp(threadRow.created_at, locale),
    replyCount: threadRow.reply_count,
    author: resolveAuthorDisplay({
      authorId: threadRow.author_id,
      profile: profiles.get(threadRow.author_id),
      isAnonymous: threadRow.is_anonymous,
      anonymousLabel: threadRow.anonymous_label,
      anonymousDefault,
    }),
    replies: replyRows.map((row) => ({
      id: row.id,
      threadId: row.thread_id,
      body: row.body,
      createdAt: row.created_at,
      timeLabel: formatFeedTimestamp(row.created_at, locale),
      author: resolveAuthorDisplay({
        authorId: row.author_id,
        profile: profiles.get(row.author_id),
        isAnonymous: row.is_anonymous,
        anonymousLabel: row.anonymous_label,
        anonymousDefault,
      }),
      isMine: row.author_id === currentUserId,
    })),
  };

  return { thread };
}
