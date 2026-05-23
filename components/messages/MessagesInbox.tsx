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
    <div className="md:feed-card md:p-6">
      <h1 className="mb-3 px-1 text-lg font-bold text-foreground md:mb-4 md:px-0 md:text-xl">
        {t("messages.title")}
      </h1>
      {threads.length === 0 ? (
        <p className="px-1 text-sm text-muted-foreground md:px-0">{t("messages.empty")}</p>
      ) : (
        <ul className="divide-y divide-border md:feed-card md:overflow-hidden">
          {threads.map((thread) => (
            <li key={thread.peerId}>
              <Link
                href={`/messages/${thread.peerId}`}
                className="flex items-center gap-2.5 px-1 py-2.5 transition hover:bg-muted/30 md:gap-3 md:px-4 md:py-3"
              >
                <span className="relative flex size-9 shrink-0 overflow-hidden rounded-full border border-border bg-primary/10 md:size-12">
                  {thread.peerAvatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thread.peerAvatarUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <span className="flex size-full items-center justify-center text-[10px] font-semibold text-primary md:text-xs">
                      {thread.peerInitials}
                    </span>
                  )}
                  {thread.unreadCount > 0 ? (
                    <span className="absolute -top-0.5 end-0 md:hidden">
                      <NavUnreadDot
                        ariaLabel={t("nav.unreadMessages").replace(
                          "{count}",
                          String(thread.unreadCount),
                        )}
                      />
                    </span>
                  ) : null}
                </span>
                <div className="min-w-0 flex-1 text-start">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="inline-flex min-w-0 items-center gap-1.5 truncate text-sm font-semibold text-foreground">
                      {thread.peerName}
                      {thread.unreadCount > 0 ? (
                        <span className="hidden md:inline-flex">
                          <NavUnreadDot
                            ariaLabel={t("nav.unreadMessages").replace(
                              "{count}",
                              String(thread.unreadCount),
                            )}
                          />
                        </span>
                      ) : null}
                    </span>
                    <time className="shrink-0 text-[10px] text-muted-foreground md:text-xs">
                      {formatFeedTimestamp(thread.lastMessageAt, locale)}
                    </time>
                  </div>
                  {thread.peerHeadline ? (
                    <p className="hidden truncate text-xs text-muted-foreground md:block">
                      {thread.peerHeadline}
                    </p>
                  ) : null}
                  <p className="mt-0.5 truncate text-xs text-muted-foreground md:mt-1 md:text-sm">
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
