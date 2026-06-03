"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useT } from "@/components/i18n/LocaleProvider";
import MessagingDockConversation from "@/components/messages/MessagingDockConversation";
import { useMessagingDock } from "@/components/messages/MessagingDockContext";
import MessagingDockThreadList from "@/components/messages/MessagingDockThreadList";
import type { NewMessageFriend } from "@/components/messages/NewMessagePicker";
import NavUnreadDot from "@/components/nav/NavUnreadDot";
import { useNavCounts } from "@/components/nav/NavCountsProvider";
import { useVisiblePolling } from "@/lib/hooks/use-visible-polling";
import { POLL_MESSAGES_MS } from "@/lib/sync/poll-intervals";
import type { MessageThread } from "@/lib/network/types";

type InboxPayload = {
  currentUserId: string;
  threads: MessageThread[];
  connections: NewMessageFriend[];
};

const POPOUT_GAP_PX = 12;
const POPOUT_VIEWPORT_INSET_PX = 16;
const POPOUT_MIN_WIDTH_PX = 24 * 16;
const POPOUT_WIDTH_FACTOR = 1.65;

function getConversationPopoutStyle(panelRect: DOMRect) {
  const listWidth = panelRect.width;
  const maxWidth = Math.max(listWidth, panelRect.left - POPOUT_GAP_PX - POPOUT_VIEWPORT_INSET_PX);
  const preferredWidth = Math.max(listWidth * POPOUT_WIDTH_FACTOR, POPOUT_MIN_WIDTH_PX);
  const width = Math.min(preferredWidth, maxWidth);

  return {
    width,
    height: panelRect.height,
    top: panelRect.top,
    right: window.innerWidth - panelRect.left + POPOUT_GAP_PX,
  };
}

export default function MessagingSidebarPanel() {
  const t = useT();
  const searchId = useId();
  const { unreadMessages } = useNavCounts();
  const { activePeerId, openThread, closeThread } = useMessagingDock();
  const panelRef = useRef<HTMLElement>(null);
  const [panelRect, setPanelRect] = useState<DOMRect | null>(null);

  const [inbox, setInbox] = useState<InboxPayload | null>(null);
  const [loadingInbox, setLoadingInbox] = useState(true);
  const [search, setSearch] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);

  async function loadInbox() {
    try {
      const res = await fetch("/api/messages/inbox", { cache: "no-store" });
      if (!res.ok) {
        return;
      }
      const data = (await res.json()) as InboxPayload;
      setInbox(data);
    } finally {
      setLoadingInbox(false);
    }
  }

  useEffect(() => {
    void loadInbox();
  }, []);

  useEffect(() => {
    if (!activePeerId) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }
      event.preventDefault();
      closeThread();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activePeerId, closeThread]);

  useVisiblePolling(async () => {
    await loadInbox();
  }, POLL_MESSAGES_MS);

  useLayoutEffect(() => {
    const panelEl = panelRef.current;
    if (!activePeerId || !panelEl) {
      setPanelRect(null);
      return;
    }

    function updateRect() {
      if (panelRef.current) {
        setPanelRect(panelRef.current.getBoundingClientRect());
      }
    }

    updateRect();
    const raf1 = window.requestAnimationFrame(() => {
      updateRect();
      window.requestAnimationFrame(updateRect);
    });

    const observer = new ResizeObserver(() => {
      updateRect();
    });
    observer.observe(panelEl);

    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    return () => {
      window.cancelAnimationFrame(raf1);
      observer.disconnect();
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [activePeerId, composeOpen]);

  const filteredThreads = useMemo(() => {
    if (!inbox) {
      return [];
    }
    const q = search.trim().toLowerCase();
    if (!q) {
      return inbox.threads;
    }
    return inbox.threads.filter((thread) => {
      const haystack = [thread.peerName, thread.lastMessageBody, thread.peerHeadline ?? ""]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [inbox, search]);

  const conversationPopout =
    activePeerId && panelRect && typeof document !== "undefined"
      ? createPortal(
          <section
            className="messages-sidebar-popout feed-card fixed z-[60] flex flex-col overflow-hidden shadow-xl"
            style={getConversationPopoutStyle(panelRect)}
            aria-label={t("messages.dockConversationAria")}
          >
            <MessagingDockConversation
              key={activePeerId}
              peerId={activePeerId}
              onClose={closeThread}
              onThreadUpdated={() => void loadInbox()}
              onLayoutReady={() => {
                if (panelRef.current) {
                  setPanelRect(panelRef.current.getBoundingClientRect());
                }
              }}
            />
          </section>,
          document.body,
        )
      : null;

  return (
    <div className="hidden min-h-0 flex-1 flex-col lg:flex">
      {conversationPopout}

      <section
        ref={panelRef}
        className="feed-card flex min-h-0 flex-1 flex-col overflow-hidden"
        aria-label={t("messages.dockListAria")}
      >
        <header className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2.5">
          <h2 className="inline-flex min-w-0 flex-1 items-center gap-1.5 truncate text-sm font-semibold text-foreground">
            {t("messages.dockTitle")}
            {unreadMessages > 0 ? (
              <NavUnreadDot
                ariaLabel={t("nav.unreadMessages").replace("{count}", String(unreadMessages))}
              />
            ) : null}
          </h2>
          <button
            type="button"
            onClick={() => setComposeOpen((v) => !v)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted/60"
            aria-label={t("messages.newMessage")}
            title={t("messages.newMessage")}
          >
            ✎
          </button>
        </header>

        <div className="shrink-0 border-b border-border px-3 py-2">
          <label className="sr-only" htmlFor={searchId}>
            {t("messages.dockSearchLabel")}
          </label>
          <input
            id={searchId}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("messages.dockSearchPlaceholder")}
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
          />
        </div>

        {composeOpen ? (
          <div className="max-h-36 shrink-0 overflow-y-auto border-b border-border px-2 py-2">
            {inbox?.connections.length ? (
              <ul className="space-y-0.5">
                {inbox.connections.map((member) => (
                  <li key={member.id}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-start hover:bg-muted/50"
                      onClick={() => {
                        setComposeOpen(false);
                        window.requestAnimationFrame(() => {
                          openThread(member.id);
                        });
                      }}
                    >
                      <span className="flex size-8 shrink-0 overflow-hidden rounded-full border border-border bg-primary/10">
                        {member.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={member.avatarUrl} alt="" className="size-full object-cover" />
                        ) : (
                          <span className="flex size-full items-center justify-center text-[10px] font-semibold text-primary">
                            {member.initials}
                          </span>
                        )}
                      </span>
                      <span className="truncate text-sm font-medium">{member.fullName}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-2 py-2 text-center text-xs text-muted-foreground">
                {t("messages.newMessageNoConnections")}
              </p>
            )}
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {loadingInbox && !inbox ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">…</p>
          ) : (
            <MessagingDockThreadList
              threads={filteredThreads}
              activePeerId={activePeerId}
              onSelect={openThread}
            />
          )}
        </div>
      </section>
    </div>
  );
}
