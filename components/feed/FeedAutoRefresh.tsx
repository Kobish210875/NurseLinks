"use client";

import VersionAutoRefresh from "@/components/sync/VersionAutoRefresh";
import { POLL_FEED_MS } from "@/lib/sync/poll-intervals";

type FeedAutoRefreshProps = {
  initialVersion: string;
};

export default function FeedAutoRefresh({ initialVersion }: FeedAutoRefreshProps) {
  return (
    <VersionAutoRefresh
      initialVersion={initialVersion}
      versionUrl="/api/feed/version"
      intervalMs={POLL_FEED_MS}
    />
  );
}
