"use client";

import { useEffect } from "react";

/** Scroll to #post-{id} after navigation from messages or share links. */
export default function FeedHashScroll() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith("#post-")) {
      return;
    }
    const targetId = hash.slice(1);

    function scrollToPost() {
      const el = document.getElementById(targetId);
      if (!el) {
        return;
      }
      el.scrollIntoView({ block: "start", behavior: "smooth" });
    }

    const frame = window.requestAnimationFrame(() => {
      window.setTimeout(scrollToPost, 150);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return null;
}
