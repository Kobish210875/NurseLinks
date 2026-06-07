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
    let inFlight = false;
    let intervalId: number | undefined;
    let skipInitialPageShow = true;

    function stopPolling() {
      cancelled = true;
      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
        intervalId = undefined;
      }
    }

    async function run() {
      if (cancelled || document.visibilityState !== "visible" || inFlight) {
        return;
      }
      inFlight = true;
      try {
        const result = await tickRef.current();
        if (result === false) {
          stopPolling();
        }
      } finally {
        inFlight = false;
      }
    }

    void run();

    const onVisibilityChange = () => {
      if (!cancelled && document.visibilityState === "visible") {
        void run();
      }
    };

    const onPageShow = () => {
      if (skipInitialPageShow) {
        skipInitialPageShow = false;
        return;
      }
      if (!cancelled && document.visibilityState === "visible") {
        void run();
      }
    };

    intervalId = window.setInterval(() => {
      void run();
    }, intervalMs);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [intervalMs]);
}
