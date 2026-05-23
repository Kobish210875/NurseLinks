"use client";

import { useVisiblePolling } from "@/lib/hooks/use-visible-polling";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

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
  const lastVersionRef = useRef(initialVersion);

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
      router.refresh();
    } catch {
      // Best-effort polling.
    }
  }, intervalMs);

  return null;
}
