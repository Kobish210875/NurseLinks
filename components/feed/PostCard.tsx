"use client";

import Link from "next/link";
import { addPostComment, deletePost, togglePostLike } from "@/app/actions/feed";
import { useT } from "@/components/i18n/LocaleProvider";
import PostShareDialog from "@/components/feed/PostShareDialog";
import {
  PostCommentIcon,
  PostLikeBadge,
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

  const actionBtn =
    "post-engagement-action inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-[15px] font-semibold text-muted-foreground transition hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20";

  const hasEngagementStats = likeCount > 0 || commentCount > 0 || shareCount > 0;

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
      {post.body.trim() ? (
        <p className="mb-3 whitespace-pre-wrap text-start text-[15px] leading-relaxed text-foreground">
          {post.body}
        </p>
      ) : null}

      {post.imageUrl ? (
        <div className="mb-0 overflow-hidden rounded-lg border border-border bg-muted/15">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.imageUrl}
            alt=""
            loading="lazy"
            className="mx-auto max-h-[min(70vh,28rem)] w-full object-contain"
          />
        </div>
      ) : null}

      <div className="post-engagement-block mt-3 border-t border-border">
        {hasEngagementStats ? (
          <div className="flex items-center justify-between gap-3 py-2.5 text-[13px] text-muted-foreground">
            <span className="inline-flex min-h-[18px] items-center gap-1.5">
              {likeCount > 0 ? (
                <>
                  <PostLikeBadge />
                  <span className="font-medium tabular-nums">{likeCount}</span>
                </>
              ) : null}
            </span>
            <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-0.5 text-end">
              {commentCount > 0 ? (
                <span>{t("post.commentsCountLine").replace("{count}", String(commentCount))}</span>
              ) : null}
              {shareCount > 0 ? (
                <span>{t("post.sharesCountLine").replace("{count}", String(shareCount))}</span>
              ) : null}
            </div>
          </div>
        ) : null}

        {likeError ? (
          <p className="px-1 pb-2 text-xs text-red-600" role="alert">
            {likeError}
          </p>
        ) : null}

        <div
          className={`flex items-stretch justify-between gap-1 ${hasEngagementStats ? "border-t border-border" : ""}`}
          role="toolbar"
          aria-label={t("post.engagementAria")}
        >
          <button
            type="button"
            onClick={handleLike}
            disabled={pendingLike}
            aria-pressed={liked}
            aria-label={t("post.likeAria")}
            className={`${actionBtn} ${liked ? "post-engagement-action--liked text-primary" : ""}`}
          >
            <PostLikeIcon filled={liked} size={20} />
            <span>{t("post.like")}</span>
          </button>
          <button
            type="button"
            onClick={focusComment}
            aria-label={t("post.commentAria")}
            className={actionBtn}
          >
            <PostCommentIcon size={20} />
            <span>{t("post.reply")}</span>
          </button>
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            aria-label={t("post.shareAria")}
            className={actionBtn}
          >
            <PostShareIcon size={20} />
            <span>{t("post.share")}</span>
          </button>
        </div>
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
