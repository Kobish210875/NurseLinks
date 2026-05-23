"use client";

import VersionAutoRefresh from "@/components/sync/VersionAutoRefresh";
import { POLL_JOBS_MS } from "@/lib/sync/poll-intervals";

type JobsAutoRefreshProps = {
  initialVersion: string;
};

export default function JobsAutoRefresh({ initialVersion }: JobsAutoRefreshProps) {
  return (
    <VersionAutoRefresh
      initialVersion={initialVersion}
      versionUrl="/api/jobs/version"
      intervalMs={POLL_JOBS_MS}
    />
  );
}
