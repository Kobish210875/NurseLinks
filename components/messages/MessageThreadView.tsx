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
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";

type MessageThreadViewProps = {
  peer: NetworkMember;
  messages: DirectMessage[];
  currentUserId: string;
};

export default function MessageThreadView({ peer, messages, currentUserId }: MessageThreadViewProps) {
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesListRef = useRef<HTMLUListElement>(null);

  const canSend = body.trim().length > 0;
  const closeAfterSend = displayMessages.length === 0;

  useEffect(() => {
    setDisplayMessages(messages);
  }, [messages]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [peer.id]);

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

  useEffect(() => {
    if (displayMessages.length === 0) {
      return;
    }

    function scrollToLatest() {
      const list = messagesListRef.current;
      if (list && list.scrollHeight > list.clientHeight) {
        list.scrollTop = list.scrollHeight;
      }

      messagesEndRef.current?.scrollIntoView({ block: "end", behavior: "auto" });
    }

    const frame = window.requestAnimationFrame(() => {
      window.setTimeout(scrollToLatest, 80);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [displayMessages, peer.id]);
  const professionalLine = formatProfileHeadline(
    peer.headline,
    peer.workplaceInstitutionSlug,
    t("profile.institutionOther"),
  );

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) {
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
      setBody("");
      if (closeAfterSend) {
        router.push("/messages");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="message-thread-shell feed-card flex min-h-[min(480px,70dvh)] flex-col overflow-hidden max-md:min-h-0">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Link
          href="/messages"
          className="text-sm font-medium text-primary hover:underline"
        >
          {t("messages.back")}
        </Link>
        <Link
          href={`/profile/${peer.id}`}
          className="flex size-10 overflow-hidden rounded-full border border-border bg-primary/10 transition hover:ring-2 hover:ring-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
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
        <div className="min-w-0 text-start">
          <Link
            href={`/profile/${peer.id}`}
            className="font-semibold text-foreground hover:text-primary hover:underline"
          >
            {peer.fullName}
          </Link>
          {professionalLine ? (
            <p className="truncate text-xs text-muted-foreground">{professionalLine}</p>
          ) : null}
        </div>
      </header>

      <>
          <ul
            ref={messagesListRef}
            className="message-thread-messages flex-1 space-y-3 overflow-y-auto overscroll-contain p-4"
          >
            {displayMessages.length === 0 ? (
              <li className="text-center text-sm text-muted-foreground">
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
          <form onSubmit={submit} className="message-thread-compose shrink-0 border-t border-border p-4">
            <label className="sr-only" htmlFor={messageBodyId}>
              {t("messages.inputLabel")}
            </label>
            <textarea
              id={messageBodyId}
              name="body"
              rows={3}
              maxLength={4000}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              disabled={pending}
              placeholder={t("messages.inputPlaceholder")}
              className="message-thread-input w-full resize-none rounded-lg border border-border bg-white px-3 py-2 text-base outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15 disabled:opacity-60 md:resize-y md:text-sm"
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
          <div
            ref={messagesEndRef}
            className="message-thread-end-anchor h-px shrink-0"
            aria-hidden="true"
          />
      </>
    </div>
  );
}
