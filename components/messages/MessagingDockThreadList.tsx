"use client";

import { useLocale, useT } from "@/components/i18n/LocaleProvider";
import NavUnreadDot from "@/components/nav/NavUnreadDot";
import { formatFeedTimestamp } from "@/lib/i18n/format-feed-time";
import type { MessageThread } from "@/lib/network/types";

type MessagingDockThreadListProps = {
  threads: MessageThread[];
  activePeerId: string | null;
  onSelect: (peerId: string) => void;
};

export default function MessagingDockThreadList({
  threads,
  activePeerId,
  onSelect,
}: MessagingDockThreadListProps) {
  const t = useT();
  const { locale } = useLocale();

  if (threads.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-muted-foreground">{t("messages.empty")}</p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {threads.map((thread) => {
        const active = thread.peerId === activePeerId;
        return (
          <li key={thread.peerId}>
            <button
              type="button"
              onClick={() => onSelect(thread.peerId)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-start transition hover:bg-muted/40 ${
                active ? "bg-primary/5" : ""
              }`}
            >
              <span className="flex size-9 shrink-0 overflow-hidden rounded-full border border-border bg-primary/10">
                {thread.peerAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thread.peerAvatarUrl} alt="" className="size-full object-cover" />
                ) : (
                  <span className="flex size-full items-center justify-center text-xs font-semibold text-primary">
                    {thread.peerInitials}
                  </span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="inline-flex min-w-0 items-center gap-1.5 truncate text-sm font-semibold text-foreground">
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
                  <time className="shrink-0 text-[10px] text-muted-foreground">
                    {formatFeedTimestamp(thread.lastMessageAt, locale)}
                  </time>
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
