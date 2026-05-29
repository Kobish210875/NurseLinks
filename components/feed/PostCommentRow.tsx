"use client";

import { deletePostComment, toggleCommentLike } from "@/app/actions/feed";
import { useT } from "@/components/i18n/LocaleProvider";
import ReportContentButton from "@/components/moderation/ReportContentButton";
import { PostLikeIcon, formatEngagementCount } from "@/components/feed/PostEngagementIcons";
import type { FeedComment } from "@/lib/data/feed";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

type PostCommentRowProps = {
  comment: FeedComment;
  currentUserId: string;
  isAdmin?: boolean;
  onDeleted: () => void;
};

export default function PostCommentRow({
  comment,
  currentUserId,
  isAdmin = false,
  onDeleted,
}: PostCommentRowProps) {
  const t = useT();
  const router = useRouter();
  const [pendingLike, startLike] = useTransition();
  const [pendingDelete, startDelete] = useTransition();
  const [likeError, setLikeError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [liked, setLiked] = useState(comment.likedByMe);
  const [likeCount, setLikeCount] = useState(comment.likeCount);
  const isAuthor = comment.authorId === currentUserId;
  const canDelete = isAuthor || isAdmin;

  useEffect(() => {
    setLiked(comment.likedByMe);
    setLikeCount(comment.likeCount);
  }, [comment.id, comment.likedByMe, comment.likeCount]);

  function handleLike() {
    if (pendingLike) {
      return;
    }
    setLikeError(null);
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((c) => Math.max(0, c + (nextLiked ? 1 : -1)));

    startLike(async () => {
      const res = await toggleCommentLike(comment.id);
      if (res?.error === "likes-not-configured") {
        setLiked(!nextLiked);
        setLikeCount((c) => Math.max(0, c + (nextLiked ? -1 : 1)));
        setLikeError(t("post.commentLikesNotConfigured"));
        return;
      }
      if (res?.error) {
        setLiked(!nextLiked);
        setLikeCount((c) => Math.max(0, c + (nextLiked ? -1 : 1)));
        setLikeError(t("errors.comment-like-failed"));
        return;
      }
      router.refresh();
    });
  }

  function handleDelete() {
    if (pendingDelete || !canDelete) {
      return;
    }
    if (!window.confirm(t("post.commentDeleteConfirm"))) {
      return;
    }
    setDeleteError(null);
    startDelete(async () => {
      const res = await deletePostComment(comment.id);
      if (res?.error) {
        setDeleteError(t("errors.comment-delete-failed"));
        return;
      }
      onDeleted();
      router.refresh();
    });
  }

  return (
    <li className="flex gap-2 text-start">
      <Link
        href={`/profile/${comment.authorId}`}
        className="flex size-8 shrink-0 overflow-hidden rounded-full border border-border bg-muted/40 transition hover:ring-2 hover:ring-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        aria-label={comment.authorName}
      >
        {comment.authorAvatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={comment.authorAvatarUrl} alt="" className="size-full object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center text-[10px] font-semibold text-primary">
            {comment.authorInitials}
          </span>
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <div className="post-comment-bubble rounded-lg bg-muted/25 px-3 py-2">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-sm font-semibold text-foreground">{comment.authorName}</span>
            <time className="text-[10px] text-muted-foreground" dateTime={comment.createdAt}>
              {comment.timeLabel}
            </time>
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{comment.body}</p>
          {canDelete ? (
            <div className="post-comment-delete-row mt-1.5 text-left">
              <button
                type="button"
                onClick={handleDelete}
                disabled={pendingDelete}
                aria-label={t("post.commentDelete")}
                className="post-comment-delete rounded-md px-0.5 py-0.5 text-[11px] font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
              >
                {pendingDelete
                  ? "…"
                  : isAdmin && !isAuthor
                    ? t("post.commentAdminDelete")
                    : t("post.commentDelete")}
              </button>
            </div>
          ) : null}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 px-1">
          {!isAuthor ? (
            <ReportContentButton
              contentType="comment"
              contentId={comment.id}
              subjectUserId={comment.authorId}
              currentUserId={currentUserId}
            />
          ) : null}
          <button
            type="button"
            onClick={handleLike}
            disabled={pendingLike}
            aria-pressed={liked}
            aria-label={t("post.commentLikeAria")}
            className={`post-comment-like inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold transition hover:bg-muted/50 disabled:opacity-60 ${liked ? "text-[var(--like-heart)]" : "text-muted-foreground"}`}
          >
            <PostLikeIcon filled={liked} size={16} />
            <span>{likeCount > 0 ? formatEngagementCount(likeCount) : t("post.like")}</span>
          </button>
        </div>
        {likeError ? (
          <p className="mt-0.5 px-1 text-[10px] text-red-600" role="alert">
            {likeError}
          </p>
        ) : null}
        {deleteError ? (
          <p className="mt-0.5 px-1 text-[10px] text-red-600" role="alert">
            {deleteError}
          </p>
        ) : null}
      </div>
    </li>
  );
}
