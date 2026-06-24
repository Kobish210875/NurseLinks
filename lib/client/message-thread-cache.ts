import type { DirectMessage, NetworkMember } from "@/lib/network/types";

export type MessageThreadPayload = {
  peer: NetworkMember;
  messages: DirectMessage[];
  currentUserId: string;
  messagesVersion: string;
};

const cache = new Map<string, MessageThreadPayload>();
const inFlight = new Map<string, Promise<MessageThreadPayload | null>>();

export function getCachedMessageThread(peerId: string) {
  return cache.get(peerId) ?? null;
}

export function invalidateMessageThread(peerId: string) {
  cache.delete(peerId);
  inFlight.delete(peerId);
}

async function fetchMessageThread(peerId: string): Promise<MessageThreadPayload | null> {
  try {
    const res = await fetch(`/api/messages/thread/${peerId}`, { cache: "no-store" });
    if (!res.ok) {
      return null;
    }
    const data = (await res.json()) as MessageThreadPayload;
    cache.set(peerId, data);
    return data;
  } catch {
    return null;
  }
}

export function prefetchMessageThread(peerId: string) {
  const cached = cache.get(peerId);
  if (cached) {
    return Promise.resolve(cached);
  }

  const pending = inFlight.get(peerId);
  if (pending) {
    return pending;
  }

  const request = fetchMessageThread(peerId).finally(() => {
    inFlight.delete(peerId);
  });
  inFlight.set(peerId, request);
  return request;
}

export function refreshMessageThread(peerId: string) {
  invalidateMessageThread(peerId);
  return prefetchMessageThread(peerId);
}
