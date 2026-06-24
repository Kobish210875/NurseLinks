"use client";

import Link from "next/link";
import { markThreadAsRead, sendDirectMessage } from "@/app/actions/messages";
import { useLocale, useT } from "@/components/i18n/LocaleProvider";
import MessageBody from "@/components/messages/MessageBody";
import ReportContentButton from "@/components/moderation/ReportContentButton";
import NavUnreadDot from "@/components/nav/NavUnreadDot";
import { useNavCounts } from "@/components/nav/NavCountsProvider";
import { formatFeedTimestamp } from "@/lib/i18n/format-feed-time";
import type { DirectMessage, NetworkMember } from "@/lib/network/types";
import { formatProfileHeadline } from "@/lib/profile/display-professional";
import { useMobileThreadComposeInset } from "@/lib/hooks/use-mobile-thread-compose-inset";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";

type MessageThreadViewProps = {
  peer: NetworkMember;
  messages: DirectMessage[];
  currentUserId: string;
  dockMode?: boolean;
  onClose?: () => void;
  onMessageSent?: () => void;
};

export default function MessageThreadView({
  peer,
  messages,
  currentUserId,
  dockMode = false,
  onClose,
  onMessageSent,
}: MessageThreadViewProps) {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const messageBodyId = useId();
  const { unreadMessages, updateCounts } = useNavCounts();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [displayMessages, setDisplayMessages] = useState(messages);
  const markedReadRef = useRef(false);
  const messagesListRef = useRef<HTMLUListElement>(null);
  const composeRef = useRef<HTMLFormElement>(null);

  useMobileThreadComposeInset(!dockMode);

  const canSend = body.trim().length > 0;
  const closeAfterSend = displayMessages.length === 0;

  useEffect(() => {
    setDisplayMessages(messages);
    markedReadRef.current = false;
  }, [messages, peer.id]);

  useEffect(() => {
    if (displayMessages.length === 0) {
      return;
    }

    function scrollToLatest() {
      const list = messagesListRef.current;
      if (!list) {
        return;
      }
      list.scrollTop = list.scrollHeight;
    }

    const frame = window.requestAnimationFrame(() => {
      scrollToLatest();
      window.setTimeout(scrollToLatest, 80);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [displayMessages, dockMode, peer.id]);

  useEffect(() => {
    if (dockMode) {
      return;
    }

    const compose = composeRef.current;
    if (!compose) {
      return;
    }

    function syncComposeHeight() {
      const node = composeRef.current;
      if (!node) {
        return;
      }
      document.documentElement.style.setProperty(
        "--message-thread-compose-height",
        `${node.offsetHeight}px`,
      );
    }

    syncComposeHeight();
    const observer = new ResizeObserver(syncComposeHeight);
    observer.observe(compose);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--message-thread-compose-height");
    };
  }, [dockMode, error]);

  useEffect(() => {
    if (markedReadRef.current) {
      return;
    }
    markedReadRef.current = true;

    const unreadInThread = messages.filter((m) => !m.isMine && m.isUnread).length;
    if (unreadInThread === 0) {
      return;
    }

    setDisplayMessages((prev) =>
      prev.map((m) => (!m.isMine && m.isUnread ? { ...m, isUnread: false } : m)),
    );
    updateCounts({ unreadMessages: Math.max(0, unreadMessages - unreadInThread) });
    void markThreadAsRead(peer.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per thread open
  }, [messages, peer.id]);

  const professionalLine = formatProfileHeadline(
    peer.headline,
    peer.workplaceInstitutionSlug,
    t("profile.institutionOther"),
  );

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage();
  }

  function sendMessage() {
    const trimmed = body.trim();
    if (!trimmed || pending) {
      return;
    }

    setError(null);
    const formData = new FormData();
    formData.set("body", trimmed);

    startTransition(async () => {
      const res = await sendDirectMessage(peer.id, formData);
      if (res?.error === "suspended") {
        setError(t("moderation.suspended"));
        return;
      }
      if (res?.error === "send-blocked") {
        setError(t("messages.sendFailed"));
        return;
      }
      if (res?.error === "messaging-not-configured") {
        setError(t("messages.notConfigured"));
        return;
      }
      if (res?.error) {
        setError(t("messages.sendFailed"));
        return;
      }
      const sentBody = trimmed;
      setBody("");
      setDisplayMessages((prev) => [
        ...prev,
        {
          id: `optimistic-${Date.now()}`,
          senderId: currentUserId,
          recipientId: peer.id,
          body: sentBody,
          createdAt: new Date().toISOString(),
          isMine: true,
          isUnread: false,
        },
      ]);
      if (dockMode) {
        onMessageSent?.();
        return;
      }
      if (closeAfterSend) {
        router.push("/messages");
        return;
      }
      router.refresh();
    });
  }

  function handleTextareaKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
      return;
    }
    event.preventDefault();
    sendMessage();
  }

  const peerAvatar = (
    <Link
      href={`/profile/${peer.id}`}
      className={`message-thread-peer-avatar flex size-10 shrink-0 overflow-hidden rounded-full border border-border bg-primary/10 transition hover:ring-2 hover:ring-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${dockMode ? "" : "max-md:size-8"}`}
      aria-label={peer.fullName}
    >
      {peer.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={peer.avatarUrl} alt="" className="size-full object-cover" />
      ) : (
        <span className="flex size-full items-center justify-center text-xs font-semibold text-primary">
          {peer.initials}
        </span>
      )}
    </Link>
  );

  return (
    <div
      className={`message-thread-shell flex flex-col overflow-hidden ${
        dockMode
          ? "h-full min-h-0"
          : "feed-card min-h-[min(480px,70dvh)] max-md:min-h-0 max-md:flex-1 max-md:border-0 max-md:shadow-none max-md:rounded-none"
      }`}
    >
      <header className="message-thread-header flex shrink-0 items-center gap-2 border-b border-border bg-card px-3 py-2.5 max-md:gap-1.5 max-md:py-1.5">
        {dockMode ? null : (
          <Link
            href="/messages"
            className="shrink-0 text-sm font-medium text-primary hover:underline max-md:text-xs"
          >
            {t("messages.back")}
          </Link>
        )}
        {peerAvatar}
        <div className="min-w-0 flex-1 text-start">
          <Link
            href={`/profile/${peer.id}`}
            className="truncate text-sm font-semibold text-foreground hover:text-primary hover:underline max-md:text-xs"
          >
            {peer.fullName}
          </Link>
          {professionalLine && !dockMode ? (
            <p className="message-thread-peer-headline truncate text-xs text-muted-foreground">
              {professionalLine}
            </p>
          ) : null}
        </div>
        {dockMode && onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted/60"
            aria-label={t("messages.dockCloseConversation")}
          >
            ×
          </button>
        ) : null}
      </header>

      <ul
        ref={messagesListRef}
        className={`message-thread-messages min-h-0 flex-1 space-y-3 overscroll-contain p-4 ${
          dockMode
            ? displayMessages.length === 0
              ? "overflow-hidden"
              : "overflow-y-auto"
            : "overflow-y-auto"
        }`}
      >
        {displayMessages.length === 0 ? (
          <li className="flex min-h-[8rem] items-center justify-center text-center text-sm text-muted-foreground">
            {t("messages.threadEmpty")}
          </li>
        ) : (
          displayMessages.map((m) => (
            <li
              key={m.id}
              className={`flex items-end gap-1.5 ${m.isMine ? "justify-end" : "justify-start"}`}
            >
              {!m.isMine && m.isUnread ? (
                <span className="mb-2 shrink-0">
                  <NavUnreadDot ariaLabel={t("messages.unreadMessage")} />
                </span>
              ) : null}
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  m.isMine
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-foreground"
                }`}
              >
                <p className="text-sm leading-relaxed">
                  <MessageBody body={m.body} isMine={m.isMine} />
                </p>
                {!m.isMine ? (
                  <div className="mt-1">
                    <ReportContentButton
                      contentType="message"
                      contentId={m.id}
                      subjectUserId={m.senderId}
                      currentUserId={currentUserId}
                      className="text-[10px] text-muted-foreground hover:text-foreground"
                    />
                  </div>
                ) : null}
                <time
                  className={`mt-1 block text-[10px] ${
                    m.isMine ? "text-primary-foreground/80" : "text-muted-foreground"
                  }`}
                  dateTime={m.createdAt}
                >
                  {formatFeedTimestamp(m.createdAt, locale)}
                </time>
              </div>
            </li>
          ))
        )}
      </ul>
      <form
        ref={composeRef}
        onSubmit={submit}
        className={`message-thread-compose shrink-0 border-t border-border bg-card ${
          dockMode ? "p-2.5" : "p-4 max-md:p-3"
        }`}
      >
            <label className="sr-only" htmlFor={messageBodyId}>
              {t("messages.inputLabel")}
            </label>
            <textarea
              id={messageBodyId}
              name="body"
              rows={dockMode ? 2 : 2}
              maxLength={4000}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              onKeyDown={handleTextareaKeyDown}
              disabled={pending}
              placeholder={t("messages.inputPlaceholder")}
              className={`message-thread-input w-full rounded-lg border border-border bg-white px-3 py-2 text-base outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15 disabled:opacity-60 md:text-sm ${
                dockMode ? "resize-y" : "resize-none md:resize-y"
              }`}
            />
            {error ? (
              <p className="mt-2 text-xs text-red-600" role="alert">
                {error}
              </p>
            ) : null}
            <div className="mt-2 flex justify-end">
              <button
                type="submit"
                disabled={pending || !canSend}
                className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pending ? "..." : t("messages.send")}
              </button>
            </div>
          </form>
    </div>
  );
}
