"use client";

import { addPostComment, deletePostComment, toggleCommentLike } from "@/app/actions/feed";
import { useT } from "@/components/i18n/LocaleProvider";
import ReportContentButton from "@/components/moderation/ReportContentButton";
import { PostLikeIcon, formatEngagementCount } from "@/components/feed/PostEngagementIcons";
import type { FeedComment } from "@/lib/data/feed";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

type PostCommentRowProps = {
  postId: string;
  comment: FeedComment;
  currentUserId: string;
  isAdmin?: boolean;
  depth?: number;
  onDeleted: (commentId: string) => void;
  onReplyPosted?: () => void;
};

export default function PostCommentRow({
  postId,
  comment,
  currentUserId,
  isAdmin = false,
  depth = 0,
  onDeleted,
  onReplyPosted,
}: PostCommentRowProps) {
  const t = useT();
  const router = useRouter();
  const [pendingLike, startLike] = useTransition();
  const [pendingDelete, startDelete] = useTransition();
  const [pendingReply, startReply] = useTransition();
  const [likeError, setLikeError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [liked, setLiked] = useState(comment.likedByMe);
  const [likeCount, setLikeCount] = useState(comment.likeCount);
  const [replyOpen, setReplyOpen] = useState(false);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);
  const isAuthor = comment.authorId === currentUserId;
  const canDelete = isAuthor || isAdmin;
  const canReply = depth === 0;

  useEffect(() => {
    setLiked(comment.likedByMe);
    setLikeCount(comment.likeCount);
  }, [comment.id, comment.likedByMe, comment.likeCount]);

  useEffect(() => {
    if (!replyOpen) {
      return;
    }
    window.requestAnimationFrame(() => {
      replyInputRef.current?.focus();
    });
  }, [replyOpen]);

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
      onDeleted(comment.id);
      router.refresh();
    });
  }

  async function submitReply(formData: FormData) {
    setReplyError(null);
    startReply(async () => {
      const res = await addPostComment(postId, formData);
      if (res?.error === "invalid-body") {
        setReplyError(t("errors.comment-empty"));
        return;
      }
      if (res?.error === "invalid-parent") {
        setReplyError(t("errors.comment-invalid-parent"));
        return;
      }
      if (res?.error === "suspended") {
        setReplyError(t("moderation.suspended"));
        return;
      }
      if (res?.error) {
        setReplyError(t("errors.comment-failed"));
        return;
      }
      setReplyOpen(false);
      onReplyPosted?.();
      router.refresh();
    });
  }

  const replyPlaceholder = t("post.replyPlaceholder").replace("{name}", comment.authorName);

  return (
    <li className={`flex min-w-0 flex-col text-start ${depth > 0 ? "mt-3" : ""}`}>
      <div className={`flex min-w-0 w-full gap-2 ${depth > 0 ? "ms-2 sm:ms-4" : ""}`}>
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
          <div className="post-comment-bubble min-w-0 max-w-full rounded-lg bg-muted/25 px-3 py-2">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-sm font-semibold text-foreground">{comment.authorName}</span>
              <time className="text-[10px] text-muted-foreground" dateTime={comment.createdAt}>
                {comment.timeLabel}
              </time>
            </div>
            <p className="post-comment-body mt-1 whitespace-pre-wrap text-sm text-foreground">
              {comment.body}
            </p>
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
            {canReply ? (
              <button
                type="button"
                onClick={() => setReplyOpen((open) => !open)}
                className="rounded-md px-1.5 py-0.5 text-xs font-semibold text-primary transition hover:bg-primary/5"
              >
                {t("post.replyToComment")}
              </button>
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
          {replyOpen && canReply ? (
            <form action={submitReply} className="mt-2 flex flex-col gap-2 px-1">
              <input type="hidden" name="parentCommentId" value={comment.id} />
              <label className="sr-only" htmlFor={`reply-${comment.id}`}>
                {t("post.replyToAuthor").replace("{name}", comment.authorName)}
              </label>
              <textarea
                ref={replyInputRef}
                id={`reply-${comment.id}`}
                name="body"
                rows={2}
                maxLength={2000}
                disabled={pendingReply}
                placeholder={replyPlaceholder}
                className="w-full resize-none rounded-lg border border-border bg-white px-3 py-2 text-base outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15 disabled:opacity-60 md:text-sm"
              />
              {replyError ? (
                <p className="text-[10px] text-red-600" role="alert">
                  {replyError}
                </p>
              ) : null}
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReplyOpen(false)}
                  className="rounded-full px-3 py-1 text-xs font-medium text-muted-foreground transition hover:bg-muted/50"
                >
                  {t("post.cancelReply")}
                </button>
                <button
                  type="submit"
                  disabled={pendingReply}
                  className="rounded-full border border-border bg-white px-4 py-1.5 text-xs font-semibold text-primary transition hover:bg-muted disabled:opacity-60"
                >
                  {pendingReply ? "…" : t("post.sendReply")}
                </button>
              </div>
            </form>
          ) : null}
        </div>
      </div>

      {comment.replies.length > 0 ? (
        <ul
          className="mt-2 min-w-0 space-y-0 border-s-2 border-border/40 ps-2 sm:ps-3"
          aria-label={t("post.comments")}
        >
          {comment.replies.map((reply) => (
            <PostCommentRow
              key={reply.id}
              postId={postId}
              comment={reply}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              depth={depth + 1}
              onDeleted={onDeleted}
              onReplyPosted={onReplyPosted}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
