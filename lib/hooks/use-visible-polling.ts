"use client";

import { useEffect, useRef } from "react";

export function useVisiblePolling(
  tick: () => void | Promise<void>,
  intervalMs: number,
) {
  const tickRef = useRef(tick);
  tickRef.current = tick;

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (cancelled || document.visibilityState !== "visible") {
        return;
      }
      await tickRef.current();
    }

    void run();

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void run();
      }
    };

    const id = window.setInterval(run, intervalMs);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    window.addEventListener("pageshow", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("pageshow", onVisible);
    };
  }, [intervalMs]);
}
