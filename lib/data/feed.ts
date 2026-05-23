import type { Locale } from "@/lib/i18n/config";
import { getInitials } from "@/lib/auth/initials";
import { formatFeedTimestamp } from "@/lib/i18n/format-feed-time";
import { formatProfileHeadline } from "@/lib/profile/display-professional";
import { resolveWorkplaceSlug } from "@/lib/profile/workplace";
import { createT, getMessages } from "@/lib/i18n/messages";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type FeedComment = {
  id: string;
  postId: string;
  body: string;
  createdAt: string;
  timeLabel: string;
  authorName: string;
  authorAvatarUrl: string | null;
  authorInitials: string;
};

export type FeedPost = {
  id: string;
  body: string;
  imageUrl: string | null;
  createdAt: string;
  timeLabel: string;
  authorId: string;
  authorName: string;
  authorHeadline: string | null;
  authorAvatarUrl: string | null;
  authorInitials: string;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  comments: FeedComment[];
};

const POST_LIMIT = 40;
const COMMENTS_FETCH = 200;
const MAX_COMMENTS_PER_POST = 8;

type PostRow = {
  id: string;
  body: string;
  image_url: string | null;
  created_at: string;
  author_id: string;
};

type CommentRow = {
  id: string;
  post_id: string;
  body: string;
  created_at: string;
  author_id: string;
};

type LikeRow = { post_id: string };
type CommentIdRow = { post_id: string };

type ProfileRow = {
  id: string;
  full_name: string;
  headline: string | null;
  workplace_institution_slug?: string | null;
  avatar_url: string | null;
  cv_draft?: unknown;
};

export async function getFeedPosts(
  supabase: SupabaseClient<Database>,
  currentUserId: string,
  locale: Locale,
): Promise<FeedPost[]> {
  let { data: postsRaw, error: postsError } = await supabase
    .from("posts")
    .select("id, body, image_url, created_at, author_id")
    .order("created_at", { ascending: false })
    .limit(POST_LIMIT);

  if (postsError?.message?.toLowerCase().includes("image_url")) {
    const fallback = await supabase
      .from("posts")
      .select("id, body, created_at, author_id")
      .order("created_at", { ascending: false })
      .limit(POST_LIMIT);
    postsRaw = fallback.data;
    postsError = fallback.error;
  }

  const posts = ((postsRaw ?? []) as PostRow[]).map((row) => ({
    ...row,
    image_url: row.image_url ?? null,
  }));

  if (postsError || !posts.length) {
    return [];
  }

  const authorIds = [...new Set(posts.map((p) => p.author_id))];
  const postIds = posts.map((p) => p.id);
  const t = createT(getMessages(locale));

  let profilesQuery = await supabase
    .from("profiles")
    .select("id, full_name, headline, workplace_institution_slug, avatar_url, cv_draft")
    .in("id", authorIds);

  if (profilesQuery.error?.message?.toLowerCase().includes("workplace_institution_slug")) {
    profilesQuery = await supabase
      .from("profiles")
      .select("id, full_name, headline, avatar_url, cv_draft")
      .in("id", authorIds);
  }

  const bundle = await Promise.all([
      Promise.resolve(profilesQuery),
      supabase
        .from("post_comments")
        .select("id, post_id, body, created_at, author_id")
        .in("post_id", postIds)
        .order("created_at", { ascending: false })
        .limit(COMMENTS_FETCH),
      supabase.from("post_likes").select("post_id").eq("user_id", currentUserId).in("post_id", postIds),
      // Supabase-js + createServerClient loses RPC arg typing for custom functions.
      supabase.rpc("feed_post_stats", { post_ids: postIds } as never),
    ]);

  const profilesData = (profilesQuery.data ?? []) as ProfileRow[];
  const { data: commentsRaw } = bundle[1];
  const { data: myLikes } = bundle[2];
  const rpcResult = bundle[3] as {
    data: { post_id: string; like_count: number; comment_count: number }[] | null;
    error: { message: string } | null;
  };

  const statsMap = new Map<string, { likeCount: number; commentCount: number }>();

  if (rpcResult.error || !rpcResult.data) {
    const [{ data: likeRows }, { data: commentCountRows }] = await Promise.all([
      supabase.from("post_likes").select("post_id").in("post_id", postIds),
      supabase.from("post_comments").select("post_id").in("post_id", postIds),
    ]);
    for (const r of (likeRows ?? []) as LikeRow[]) {
      statsMap.set(r.post_id, {
        likeCount: (statsMap.get(r.post_id)?.likeCount ?? 0) + 1,
        commentCount: statsMap.get(r.post_id)?.commentCount ?? 0,
      });
    }
    for (const r of (commentCountRows ?? []) as CommentIdRow[]) {
      const cur = statsMap.get(r.post_id) ?? { likeCount: 0, commentCount: 0 };
      statsMap.set(r.post_id, {
        likeCount: cur.likeCount,
        commentCount: cur.commentCount + 1,
      });
    }
  } else {
    const rows = (rpcResult.data ?? []) as {
      post_id: string;
      like_count: number;
      comment_count: number;
    }[];
    for (const row of rows) {
      statsMap.set(row.post_id, {
        likeCount: Number(row.like_count),
        commentCount: Number(row.comment_count),
      });
    }
  }

  const likedByMe = new Set((myLikes ?? []).map((r) => (r as LikeRow).post_id));

  const profileById = new Map(
    profilesData.map((row) => [
      row.id,
      {
        full_name: row.full_name,
        headline: row.headline,
        workplaceInstitutionSlug: resolveWorkplaceSlug(
          row.workplace_institution_slug,
          row.cv_draft,
        ),
        avatar_url: row.avatar_url,
      },
    ]),
  );

  const commentsByPost = new Map<string, CommentRow[]>();
  for (const c of (commentsRaw ?? []) as CommentRow[]) {
    const list = commentsByPost.get(c.post_id) ?? [];
    list.push(c);
    commentsByPost.set(c.post_id, list);
  }

  for (const [pid, list] of commentsByPost) {
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    commentsByPost.set(pid, list.slice(0, MAX_COMMENTS_PER_POST).reverse());
  }

  const commentAuthorIds = new Set<string>();
  for (const list of commentsByPost.values()) {
    for (const c of list) {
      commentAuthorIds.add(c.author_id);
    }
  }
  const missingCommentAuthors = [...commentAuthorIds].filter((id) => !profileById.has(id));

  if (missingCommentAuthors.length > 0) {
    let commentProfilesQuery = await supabase
      .from("profiles")
      .select("id, full_name, headline, workplace_institution_slug, avatar_url, cv_draft")
      .in("id", missingCommentAuthors);

    if (commentProfilesQuery.error?.message?.toLowerCase().includes("workplace_institution_slug")) {
      commentProfilesQuery = await supabase
        .from("profiles")
        .select("id, full_name, headline, avatar_url, cv_draft")
        .in("id", missingCommentAuthors);
    }

    const { data: commentProfiles } = commentProfilesQuery;
    for (const row of (commentProfiles ?? []) as ProfileRow[]) {
      profileById.set(row.id, {
        full_name: row.full_name,
        headline: row.headline,
        workplaceInstitutionSlug: resolveWorkplaceSlug(
          row.workplace_institution_slug,
          row.cv_draft,
        ),
        avatar_url: row.avatar_url,
      });
    }
  }

  return posts.map((p) => {
    const prof = profileById.get(p.author_id);
    const fullName = prof?.full_name?.trim() || "User";
    const stats = statsMap.get(p.id);

    const comments = (commentsByPost.get(p.id) ?? []).map((c) => {
      const cp = profileById.get(c.author_id);
      const name = cp?.full_name?.trim() || "User";
      return {
        id: c.id,
        postId: c.post_id,
        body: c.body,
        createdAt: c.created_at,
        timeLabel: formatFeedTimestamp(c.created_at, locale),
        authorName: name,
        authorAvatarUrl: cp?.avatar_url ?? null,
        authorInitials: getInitials(name),
      };
    });

    return {
      id: p.id,
      body: p.body,
      imageUrl: p.image_url,
      createdAt: p.created_at,
      timeLabel: formatFeedTimestamp(p.created_at, locale),
      authorId: p.author_id,
      authorName: fullName,
      authorHeadline:
        formatProfileHeadline(
          prof?.headline ?? null,
          prof?.workplaceInstitutionSlug ?? null,
          t("profile.institutionOther"),
        ) ?? null,
      authorAvatarUrl: prof?.avatar_url ?? null,
      authorInitials: getInitials(fullName),
      likeCount: stats?.likeCount ?? 0,
      commentCount: stats?.commentCount ?? comments.length,
      likedByMe: likedByMe.has(p.id),
      comments,
    };
  });
}

export async function getFeedVersion(supabase: SupabaseClient<Database>) {
  const [postsRes, likesRes, commentsRes] = await Promise.all([
    supabase.from("posts").select("created_at").order("created_at", { ascending: false }).limit(1),
    supabase.from("post_likes").select("created_at").order("created_at", { ascending: false }).limit(1),
    supabase.from("post_comments").select("created_at").order("created_at", { ascending: false }).limit(1),
  ]);

  const latestPost = (postsRes.data?.[0] as { created_at?: string } | undefined)?.created_at;
  const latestLike = (likesRes.data?.[0] as { created_at?: string } | undefined)?.created_at;
  const latestComment = (commentsRes.data?.[0] as { created_at?: string } | undefined)?.created_at;

  const candidates = [latestPost, latestLike, latestComment].filter(Boolean) as string[];

  if (candidates.length === 0) {
    return "empty";
  }

  return candidates.sort().at(-1) ?? "empty";
}
