"use client";

import { listConnectionsForShare, sharePostWithConnection } from "@/app/actions/feed";
import { useT } from "@/components/i18n/LocaleProvider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";

type ShareConnection = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  initials: string;
};

type PostShareDialogProps = {
  postId: string;
  authorName: string;
  open: boolean;
  onClose: () => void;
  onShared?: () => void;
};

export default function PostShareDialog({
  postId,
  authorName,
  open,
  onClose,
  onShared,
}: PostShareDialogProps) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [connections, setConnections] = useState<ShareConnection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sentToId, setSentToId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setError(null);
      setSentToId(null);
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) {
        onClose();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, pending]);

  useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void listConnectionsForShare().then((res) => {
      if (cancelled) {
        return;
      }
      if (res.error) {
        setError(t("post.shareLoadFailed"));
        setConnections([]);
      } else {
        setConnections(res.connections);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [open, t]);

  if (!open || !mounted) {
    return null;
  }

  function sendTo(peerId: string) {
    setError(null);
    startTransition(async () => {
      const res = await sharePostWithConnection(postId, peerId);
      if (res?.error === "not-connected") {
        setError(t("post.shareNotConnected"));
        return;
      }
      if (res?.error === "shares-not-configured") {
        setError(t("post.sharesNotConfigured"));
        return;
      }
      if (res?.error === "messaging-not-configured") {
        setError(t("post.shareMessagingMissing"));
        return;
      }
      if (res?.error) {
        setError(t("post.shareFailed"));
        return;
      }
      setSentToId(peerId);
      onShared?.();
      router.refresh();
      window.setTimeout(() => onClose(), 400);
    });
  }

  return createPortal(
    <div
      className="post-share-overlay fixed inset-0 z-[200] flex items-center justify-center bg-black/45 p-4 max-sm:items-end max-sm:p-0"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !pending) {
          onClose();
        }
      }}
    >
      <div
        className="flex max-h-[min(85dvh,32rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl max-sm:max-w-none max-sm:rounded-b-none max-sm:rounded-t-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="post-share-title"
      >
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-3">
          <h2 id="post-share-title" className="text-base font-semibold text-foreground">
            {t("post.shareDialogTitle")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="rounded-full px-2 py-1 text-sm text-muted-foreground hover:bg-muted disabled:opacity-60"
          >
            {t("profile.cancel")}
          </button>
        </header>

        <p className="shrink-0 px-4 pt-2 text-sm text-muted-foreground">
          {t("post.shareDialogHint").replace("{author}", authorName)}
        </p>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2">
          {loading ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">{t("post.shareLoading")}</p>
          ) : connections.length === 0 ? (
            <div className="space-y-3 px-2 py-4 text-center">
              <p className="text-sm text-muted-foreground">{t("post.shareNoConnections")}</p>
              <Link
                href="/network"
                className="inline-block text-sm font-medium text-primary hover:underline"
                onClick={onClose}
              >
                {t("network.title")}
              </Link>
            </div>
          ) : (
            <ul className="space-y-1">
              {connections.map((member) => {
                const sent = sentToId === member.id;
                return (
                  <li key={member.id}>
                    <button
                      type="button"
                      disabled={pending || sent}
                      onClick={() => sendTo(member.id)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start transition hover:bg-muted/50 disabled:opacity-60"
                    >
                      <span className="relative flex size-10 shrink-0 overflow-hidden rounded-full border border-border bg-primary/10">
                        {member.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={member.avatarUrl} alt="" className="size-full object-cover" />
                        ) : (
                          <span className="flex size-full items-center justify-center text-xs font-semibold text-primary">
                            {member.initials}
                          </span>
                        )}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                        {member.fullName}
                      </span>
                      <span className="shrink-0 text-xs font-medium text-primary">
                        {sent ? t("post.shareSent") : t("post.shareSend")}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {error ? (
          <p className="shrink-0 px-4 pb-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
