"use client";

import Link from "next/link";
import { addPostComment, deletePost, togglePostLike } from "@/app/actions/feed";
import { useT } from "@/components/i18n/LocaleProvider";
import PostShareDialog from "@/components/feed/PostShareDialog";
import {
  formatEngagementCount,
  PostCommentIcon,
  PostLikeIcon,
  PostShareIcon,
} from "@/components/feed/PostEngagementIcons";
import type { FeedPost } from "@/lib/data/feed";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

type PostCardProps = {
  post: FeedPost;
  currentUserId: string;
};

export default function PostCard({ post, currentUserId }: PostCardProps) {
  const t = useT();
  const router = useRouter();
  const [pendingLike, startLike] = useTransition();
  const [pendingComment, startComment] = useTransition();
  const [pendingDelete, startDelete] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const isAuthor = post.authorId === currentUserId;
  const [commentError, setCommentError] = useState<string | null>(null);
  const [likeError, setLikeError] = useState<string | null>(null);
  const [liked, setLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [shareCount, setShareCount] = useState(post.shareCount);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    setLiked(post.likedByMe);
    setLikeCount(post.likeCount);
    setCommentCount(post.commentCount);
    setShareCount(post.shareCount);
  }, [post.id, post.likedByMe, post.likeCount, post.commentCount, post.shareCount]);

  function handleLike() {
    if (pendingLike) return;
    setLikeError(null);
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((c) => c + (nextLiked ? 1 : -1));
    startLike(async () => {
      const res = await togglePostLike(post.id);
      if (res?.error) {
        setLiked(!nextLiked);
        setLikeCount((c) => c + (nextLiked ? -1 : 1));
        setLikeError(t("errors.like-failed"));
        return;
      }
      if (res?.success) {
        setLiked(res.liked);
      }
      router.refresh();
    });
  }

  function focusComment() {
    const el = document.getElementById(`comment-input-${post.id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.focus();
  }

  async function submitComment(formData: FormData) {
    setCommentError(null);
    startComment(async () => {
      const res = await addPostComment(post.id, formData);
      if (res?.error === "invalid-body") {
        setCommentError(t("errors.comment-empty"));
        return;
      }
      if (res?.error) {
        setCommentError(t("errors.comment-failed"));
        return;
      }
      setCommentCount((c) => c + 1);
      router.refresh();
    });
  }

  function handleDelete() {
    if (pendingDelete || !isAuthor) {
      return;
    }
    if (!window.confirm(t("post.deleteConfirm"))) {
      return;
    }
    setDeleteError(null);
    startDelete(async () => {
      const res = await deletePost(post.id);
      if (res?.error) {
        setDeleteError(t("errors.post-delete-failed"));
        return;
      }
      router.refresh();
    });
  }

  const engagementBtn =
    "post-engagement-btn inline-flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-2 text-muted-foreground transition hover:bg-muted/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 sm:flex-row sm:gap-2 sm:py-2.5";

  return (
    <article id={`post-${post.id}`} className="feed-card p-4">
      <header className="mb-3 flex items-start gap-3">
        <Link
          href={`/profile/${post.authorId}`}
          className="relative flex size-12 shrink-0 overflow-hidden rounded-full border-2 border-border bg-accent/15 transition hover:ring-2 hover:ring-primary/25"
        >
          {post.authorAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.authorAvatarUrl} alt="" className="size-full object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center text-sm font-semibold text-accent">
              {post.authorInitials}
            </span>
          )}
        </Link>
        <div className="min-w-0 flex-1 text-start">
          <Link
            href={`/profile/${post.authorId}`}
            className="font-semibold text-foreground hover:text-primary hover:underline"
          >
            {post.authorName}
          </Link>
          {post.authorHeadline ? <p className="text-xs text-muted-foreground">{post.authorHeadline}</p> : null}
          <p className="text-xs text-muted-foreground">
            <time dateTime={post.createdAt}>{post.timeLabel}</time>
          </p>
        </div>
        {isAuthor ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={pendingDelete}
            className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
            aria-label={t("post.delete")}
          >
            {pendingDelete ? "..." : t("post.delete")}
          </button>
        ) : null}
      </header>
      {deleteError ? (
        <p className="mb-2 text-xs text-red-600" role="alert">
          {deleteError}
        </p>
      ) : null}
      {post.imageUrl ? (
        <div className="mb-3 overflow-hidden rounded-lg border border-border bg-muted/15">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.imageUrl}
            alt=""
            loading="lazy"
            className="mx-auto max-h-[min(70vh,28rem)] w-full object-contain"
          />
        </div>
      ) : null}
      {post.body.trim() ? (
        <p className="mb-4 whitespace-pre-wrap text-start leading-relaxed text-foreground">{post.body}</p>
      ) : null}

      {likeError ? (
        <p className="mb-2 text-xs text-red-600" role="alert">
          {likeError}
        </p>
      ) : null}

      <div
        className="post-engagement-bar -mx-1 flex items-stretch justify-between border-t border-border pt-1"
        role="toolbar"
        aria-label={t("post.engagementAria")}
      >
        <button
          type="button"
          onClick={handleLike}
          disabled={pendingLike}
          aria-pressed={liked}
          aria-label={t("post.likeAria")}
          className={`${engagementBtn} ${liked ? "post-engagement-btn--liked" : ""}`}
        >
          <span className="post-engagement-icon-wrap">
            <PostLikeIcon filled={liked} />
          </span>
          <span className="text-xs font-semibold tabular-nums sm:text-sm">
            {formatEngagementCount(likeCount)}
          </span>
        </button>
        <button
          type="button"
          onClick={focusComment}
          aria-label={t("post.commentAria")}
          className={engagementBtn}
        >
          <span className="post-engagement-icon-wrap">
            <PostCommentIcon />
          </span>
          <span className="text-xs font-semibold tabular-nums sm:text-sm">
            {formatEngagementCount(commentCount)}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setShareOpen(true)}
          aria-label={t("post.shareAria")}
          className={engagementBtn}
        >
          <span className="post-engagement-icon-wrap">
            <PostShareIcon />
          </span>
          <span className="text-xs font-semibold tabular-nums sm:text-sm">
            {formatEngagementCount(shareCount)}
          </span>
        </button>
      </div>

      <PostShareDialog
        postId={post.id}
        authorName={post.authorName}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        onShared={() => setShareCount((c) => c + 1)}
      />

      {post.comments.length > 0 ? (
        <ul className="mt-4 space-y-3 border-t border-border pt-4">
          {post.comments.map((c) => (
            <li key={c.id} className="flex gap-2 text-start">
              <span className="flex size-8 shrink-0 overflow-hidden rounded-full border border-border bg-muted/40">
                {c.authorAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.authorAvatarUrl} alt="" className="size-full object-cover" />
                ) : (
                  <span className="flex size-full items-center justify-center text-[10px] font-semibold text-primary">
                    {c.authorInitials}
                  </span>
                )}
              </span>
              <div className="min-w-0 flex-1 rounded-lg bg-muted/25 px-3 py-2">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-sm font-semibold text-foreground">{c.authorName}</span>
                  <time className="text-[10px] text-muted-foreground" dateTime={c.createdAt}>
                    {c.timeLabel}
                  </time>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <form action={submitComment} className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
        <label className="sr-only" htmlFor={`comment-input-${post.id}`}>
          {t("post.commentLabel")}
        </label>
        <textarea
          id={`comment-input-${post.id}`}
          name="body"
          rows={2}
          maxLength={2000}
          disabled={pendingComment}
          placeholder={t("post.commentPlaceholder")}
          className="w-full resize-y rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15 disabled:opacity-60"
        />
        {commentError ? (
          <p className="text-xs text-red-600" role="alert">
            {commentError}
          </p>
        ) : null}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pendingComment}
            className="rounded-full border border-border bg-white px-4 py-1.5 text-sm font-medium text-primary transition hover:bg-muted disabled:opacity-60"
          >
            {pendingComment ? "..." : t("post.sendComment")}
          </button>
        </div>
      </form>
    </article>
  );
}
