"use client";

import { useVisiblePolling } from "@/lib/hooks/use-visible-polling";
import { VERSION_REFRESH_MIN_MS } from "@/lib/sync/poll-intervals";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";

type VersionAutoRefreshProps = {
  initialVersion: string;
  versionUrl: string;
  intervalMs: number;
};

export default function VersionAutoRefresh({
  initialVersion,
  versionUrl,
  intervalMs,
}: VersionAutoRefreshProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const lastVersionRef = useRef(initialVersion);
  const lastRefreshAtRef = useRef(0);

  useEffect(() => {
    lastVersionRef.current = initialVersion;
  }, [initialVersion]);

  useVisiblePolling(async () => {
    try {
      const res = await fetch(versionUrl, { cache: "no-store" });
      if (!res.ok) {
        return;
      }
      const payload = (await res.json()) as { version?: string };
      if (!payload.version || payload.version === lastVersionRef.current) {
        return;
      }
      lastVersionRef.current = payload.version;

      const now = Date.now();
      if (now - lastRefreshAtRef.current < VERSION_REFRESH_MIN_MS) {
        return;
      }
      lastRefreshAtRef.current = now;
      startTransition(() => {
        router.refresh();
      });
    } catch {
      // Best-effort polling.
    }
  }, intervalMs);

  return null;
}
