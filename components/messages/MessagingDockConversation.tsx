"use client";

import MessageThreadView from "@/components/messages/MessageThreadView";
import {
  getCachedMessageThread,
  prefetchMessageThread,
  refreshMessageThread,
  type MessageThreadPayload,
} from "@/lib/client/message-thread-cache";
import { useEffect, useState } from "react";

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
