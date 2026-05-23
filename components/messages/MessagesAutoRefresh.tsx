"use client";

import VersionAutoRefresh from "@/components/sync/VersionAutoRefresh";
import { POLL_MESSAGES_MS } from "@/lib/sync/poll-intervals";

type MessagesAutoRefreshProps = {
  initialVersion: string;
  peerId?: string;
};

export default function MessagesAutoRefresh({
  initialVersion,
  peerId,
}: MessagesAutoRefreshProps) {
  const versionUrl = peerId
    ? `/api/messages/version?peerId=${encodeURIComponent(peerId)}`
    : "/api/messages/version";

  return (
    <VersionAutoRefresh
      initialVersion={initialVersion}
      versionUrl={versionUrl}
      intervalMs={POLL_MESSAGES_MS}
    />
  );
}
