"use client";

import { useEffect } from "react";

/** Keeps the thread compose bar above the bottom nav or iOS keyboard on mobile. */
export function useMobileThreadComposeInset(enabled: boolean) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const mq = window.matchMedia("(max-width: 767px)");
    if (!mq.matches) {
      return;
    }

    const viewport = window.visualViewport;
    if (!viewport) {
      return;
    }

    function update() {
      if (!viewport) {
        return;
      }
      const navOffset =
        getComputedStyle(document.documentElement)
          .getPropertyValue("--mobile-bottom-nav-offset")
          .trim() || "0px";
      const keyboardOpen = viewport.height < window.innerHeight * 0.85;

      if (keyboardOpen) {
        const inset = Math.max(0, window.innerHeight - viewport.offsetTop - viewport.height);
        document.documentElement.style.setProperty("--message-thread-compose-bottom", `${inset}px`);
        return;
      }

      document.documentElement.style.setProperty("--message-thread-compose-bottom", navOffset);
    }

    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      document.documentElement.style.removeProperty("--message-thread-compose-bottom");
    };
  }, [enabled]);
}
