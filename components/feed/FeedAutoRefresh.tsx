"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

type FeedAutoRefreshProps = {
  initialVersion: string;
  intervalMs?: number;
};

export default function FeedAutoRefresh({
  initialVersion,
  intervalMs = 12000,
}: FeedAutoRefreshProps) {
  const router = useRouter();
  const lastVersionRef = useRef(initialVersion);

  useEffect(() => {
    lastVersionRef.current = initialVersion;
  }, [initialVersion]);

  useEffect(() => {
    let cancelled = false;

    async function checkVersion() {
      if (cancelled || document.visibilityState !== "visible") {
        return;
      }

      try {
        const res = await fetch("/api/feed/version", { cache: "no-store" });
        if (!res.ok) {
          return;
        }
        const payload = (await res.json()) as { version?: string };
        if (!payload.version) {
          return;
        }

        if (payload.version !== lastVersionRef.current) {
          lastVersionRef.current = payload.version;
          router.refresh();
        }
      } catch {
        // Best-effort polling to keep infra costs low.
      }
    }

    void checkVersion();

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void checkVersion();
      }
    };

    const id = window.setInterval(checkVersion, intervalMs);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [intervalMs, router]);

  return null;
}
