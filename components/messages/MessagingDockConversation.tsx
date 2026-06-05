"use client";

import MessageThreadView from "@/components/messages/MessageThreadView";
import type { DirectMessage, NetworkMember } from "@/lib/network/types";
import { useEffect, useState } from "react";

type MessagingDockConversationProps = {
  peerId: string;
  onClose: () => void;
  onThreadUpdated: () => void;
};

type ThreadPayload = {
  peer: NetworkMember;
  messages: DirectMessage[];
  currentUserId: string;
  messagesVersion: string;
};

export default function MessagingDockConversation({
  peerId,
  onClose,
  onThreadUpdated,
}: MessagingDockConversationProps) {
  const [payload, setPayload] = useState<ThreadPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    void (async () => {
      try {
        const res = await fetch(`/api/messages/thread/${peerId}`, { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) {
            setError(true);
            setPayload(null);
          }
          return;
        }
        const data = (await res.json()) as ThreadPayload;
        if (!cancelled) {
          setPayload(data);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setPayload(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [peerId, reloadToken]);

  if (loading) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center text-sm text-muted-foreground">
        …
      </div>
    );
  }

  if (error || !payload) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center px-4 text-center text-sm text-muted-foreground">
        —
      </div>
    );
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
