"use client";

import { useNavCounts } from "@/components/nav/NavCountsProvider";
import { useVisiblePolling } from "@/lib/hooks/use-visible-polling";
import { POLL_NAV_MS } from "@/lib/sync/poll-intervals";

export default function NavCountsPoller() {
  const { updateCounts } = useNavCounts();

  useVisiblePolling(async () => {
    try {
      const res = await fetch("/api/sync/nav", { cache: "no-store" });
      if (res.status === 401) {
        return false;
      }
      if (!res.ok) {
        return;
      }
      const payload = (await res.json()) as {
        pendingInvitations?: number;
        unreadMessages?: number;
        unreadJobs?: number;
        acceptedConnections?: number;
      };
      updateCounts({
        pendingInvitations: payload.pendingInvitations ?? 0,
        unreadMessages: payload.unreadMessages ?? 0,
        unreadJobs: payload.unreadJobs ?? 0,
        acceptedConnections: payload.acceptedConnections ?? 0,
      });
    } catch {
      // Best-effort polling.
    }
  }, POLL_NAV_MS);

  return null;
}
