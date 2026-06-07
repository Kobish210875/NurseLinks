"use client";

import PostCard from "@/components/feed/PostCard";
import { useT } from "@/components/i18n/LocaleProvider";
import type { FeedPost } from "@/lib/data/feed";
import { useEffect, useState, useTransition } from "react";

type FeedPagePayload = {
  posts: FeedPost[];
  hasMore: boolean;
  nextCursor: string | null;
};

type FeedPostsListProps = {
  resetKey: string;
  initialPosts: FeedPost[];
  initialHasMore: boolean;
  initialNextCursor: string | null;
  currentUserId: string;
  isAdmin: boolean;
  emptyMessage: string;
};

export default function FeedPostsList({
  resetKey,
  initialPosts,
  initialHasMore,
  initialNextCursor,
  currentUserId,
  isAdmin,
  emptyMessage,
}: FeedPostsListProps) {
  const t = useT();
  const [posts, setPosts] = useState(initialPosts);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setPosts(initialPosts);
    setHasMore(initialHasMore);
    setNextCursor(initialNextCursor);
    setError(null);
  }, [resetKey, initialPosts, initialHasMore, initialNextCursor]);

  function loadMore() {
    if (!hasMore || !nextCursor || pending) {
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const params = new URLSearchParams({ cursor: nextCursor });
        const res = await fetch(`/api/feed/posts?${params.toString()}`, { cache: "no-store" });
        if (!res.ok) {
          setError(t("feed.loadMoreFailed"));
          return;
        }
        const data = (await res.json()) as FeedPagePayload;
        setPosts((prev) => [...prev, ...data.posts]);
        setHasMore(data.hasMore);
        setNextCursor(data.nextCursor);
      } catch {
        setError(t("feed.loadMoreFailed"));
      }
    });
  }

  if (posts.length === 0) {
    return (
      <div className="feed-card flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
        />
      ))}
      {hasMore ? (
        <div className="flex flex-col items-center gap-2 pb-2 pt-1">
          {error ? (
            <p className="text-xs text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            onClick={loadMore}
            disabled={pending}
            className="rounded-full border border-border bg-white px-5 py-2 text-sm font-medium text-foreground transition hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "…" : t("feed.loadMore")}
          </button>
        </div>
      ) : null}
    </>
  );
}
