"use client";

import { useEffect, useRef } from "react";

/** Return false from tick to stop polling permanently (e.g. 401). */
export function useVisiblePolling(
  tick: () => void | false | Promise<void | false>,
  intervalMs: number,
) {
  const tickRef = useRef(tick);
  tickRef.current = tick;

  useEffect(() => {
    let cancelled = false;
    let intervalId: number | undefined;

    function stopPolling() {
      cancelled = true;
      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
        intervalId = undefined;
      }
    }

    async function run() {
      if (cancelled || document.visibilityState !== "visible") {
        return;
      }
      const result = await tickRef.current();
      if (result === false) {
        stopPolling();
      }
    }

    void run();

    const onVisible = () => {
      if (!cancelled && document.visibilityState === "visible") {
        void run();
      }
    };

    intervalId = window.setInterval(() => {
      void run();
    }, intervalMs);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    window.addEventListener("pageshow", onVisible);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("pageshow", onVisible);
    };
  }, [intervalMs]);
}
