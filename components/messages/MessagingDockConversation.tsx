"use client";

import MessageThreadView from "@/components/messages/MessageThreadView";
import {
  getCachedMessageThread,
  prefetchMessageThread,
  refreshMessageThread,
  type MessageThreadPayload,
} from "@/lib/client/message-thread-cache";
import { useEffect, useRef, useState } from "react";

type MessagingDockConversationProps = {
  peerId: string;
  /** Incremented by parent whenever inbox polling detects new activity on this thread. */
  inboxSignal: number;
  onClose: () => void;
  onThreadUpdated: () => void;
};

export default function MessagingDockConversation({
  peerId,
  inboxSignal,
  onClose,
  onThreadUpdated,
}: MessagingDockConversationProps) {
  const [payload, setPayload] = useState<MessageThreadPayload | null>(
    () => getCachedMessageThread(peerId),
  );
  const [reloadToken, setReloadToken] = useState(0);
  // Track inbox signal so we only react to increments, not the initial value.
  const lastInboxSignalRef = useRef(inboxSignal);

  // Initial load (or explicit self-reload after sending).
  useEffect(() => {
    let cancelled = false;

    const load =
      reloadToken === 0 ? prefetchMessageThread(peerId) : refreshMessageThread(peerId);

    void load.then((data) => {
      if (!cancelled && data) {
        setPayload(data);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [peerId, reloadToken]);

  // React to inbox signal — parent detected new messages; refresh immediately.
  useEffect(() => {
    if (inboxSignal === lastInboxSignalRef.current) {
      return;
    }
    lastInboxSignalRef.current = inboxSignal;

    let cancelled = false;
    void refreshMessageThread(peerId).then((data) => {
      if (!cancelled && data) {
        setPayload(data);
        onThreadUpdated();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [inboxSignal, peerId, onThreadUpdated]);

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
          onThreadUpdated();
          setReloadToken((n) => n + 1);
        }}
      />
    </div>
  );
}
