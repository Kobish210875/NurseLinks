"use client";

import Link from "next/link";
import { useLocale, useT } from "@/components/i18n/LocaleProvider";
import NavUnreadDot from "@/components/nav/NavUnreadDot";
import { formatFeedTimestamp } from "@/lib/i18n/format-feed-time";
import type { MessageThread } from "@/lib/network/types";

type MessagesInboxProps = {
  threads: MessageThread[];
};

export default function MessagesInbox({ threads }: MessagesInboxProps) {
  const t = useT();
  const { locale } = useLocale();

  return (
    <div className="feed-card p-4 md:p-6">
      <h1 className="mb-4 text-xl font-bold text-foreground">{t("messages.title")}</h1>
      {threads.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("messages.empty")}</p>
      ) : (
        <ul className="divide-y divide-border">
          {threads.map((thread) => (
            <li key={thread.peerId}>
              <Link
                href={`/messages/${thread.peerId}`}
                className="flex items-start gap-3 py-4 transition hover:bg-muted/30"
              >
                <span className="flex size-12 shrink-0 overflow-hidden rounded-full border border-border bg-primary/10">
                  {thread.peerAvatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thread.peerAvatarUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <span className="flex size-full items-center justify-center text-xs font-semibold text-primary">
                      {thread.peerInitials}
                    </span>
                  )}
                </span>
                <div className="min-w-0 flex-1 text-start">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="inline-flex min-w-0 items-center gap-1.5 font-semibold text-foreground">
                      {thread.peerName}
                      {thread.unreadCount > 0 ? (
                        <NavUnreadDot
                          ariaLabel={t("nav.unreadMessages").replace(
                            "{count}",
                            String(thread.unreadCount),
                          )}
                        />
                      ) : null}
                    </span>
                    <time className="shrink-0 text-xs text-muted-foreground">
                      {formatFeedTimestamp(thread.lastMessageAt, locale)}
                    </time>
                  </div>
                  {thread.peerHeadline ? (
                    <p className="text-xs text-muted-foreground">{thread.peerHeadline}</p>
                  ) : null}
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {thread.lastMessageBody}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
