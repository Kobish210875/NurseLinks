"use client";

import MessageThreadView from "@/components/messages/MessageThreadView";
import {
  getCachedMessageThread,
  prefetchMessageThread,
  refreshMessageThread,
  type MessageThreadPayload,
} from "@/lib/client/message-thread-cache";
import { useVisiblePolling } from "@/lib/hooks/use-visible-polling";
import { POLL_MESSAGES_MS } from "@/lib/sync/poll-intervals";
import { useEffect, useRef, useState } from "react";

type MessagingDockConversationProps = {
  peerId: string;
  onClose: () => void;
  onThreadUpdated: () => void;
};

export default function MessagingDockConversation({
  peerId,
  onClose,
  onThreadUpdated,
}: MessagingDockConversationProps) {
  const [payload, setPayload] = useState<MessageThreadPayload | null>(
    () => getCachedMessageThread(peerId),
  );
  const [reloadToken, setReloadToken] = useState(0);
  const lastVersionRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load =
      reloadToken === 0 ? prefetchMessageThread(peerId) : refreshMessageThread(peerId);

    void load.then((data) => {
      if (!cancelled && data) {
        setPayload(data);
        lastVersionRef.current = data.messagesVersion;
      }
    });

    return () => {
      cancelled = true;
    };
  }, [peerId, reloadToken]);

  // Poll for incoming messages while conversation is open.
  useVisiblePolling(async () => {
    try {
      const res = await fetch(`/api/messages/version?peerId=${encodeURIComponent(peerId)}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        return;
      }
      const { version } = (await res.json()) as { version?: string };
      if (!version || version === lastVersionRef.current) {
        return;
      }
      lastVersionRef.current = version;
      const data = await refreshMessageThread(peerId);
      if (data) {
        setPayload(data);
        onThreadUpdated();
      }
    } catch {
      // Best-effort polling.
    }
  }, POLL_MESSAGES_MS);

  if (!payload) {
    return null;
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <MessageThreadView
        peer={payload.peer}
        messages={payload.messages}
        currentUserId={payload.currentUserId}
        dockMode
        onClose={onClose}
        onMessageSent={() => {
          lastVersionRef.current = null;
          onThreadUpdated();
          setReloadToken((n) => n + 1);
        }}
      />
    </div>
  );
}
