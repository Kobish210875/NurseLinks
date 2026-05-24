"use client";

import { useEffect, useRef } from "react";

type FeedPostsScrollProps = {
  children: React.ReactNode;
};

/**
 * WEB RTL: native scrollbar sits on the left; mirror the scroll box so the bar
 * appears on the right (beside the profile sidebar), then un-mirror the posts.
 */
export default function FeedPostsScroll({ children }: FeedPostsScrollProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) {
      return;
    }

    const mq = window.matchMedia("(min-width: 1024px)");
    const inner = panel.querySelector<HTMLElement>(".home-feed-posts-scroll-inner");

    function apply() {
      if (!panel || !inner) {
        return;
      }
      if (mq.matches && document.documentElement.dir === "rtl") {
        panel.style.transform = "scaleX(-1)";
        inner.style.transform = "scaleX(-1)";
        inner.style.direction = "rtl";
      } else {
        panel.style.transform = "";
        inner.style.transform = "";
        inner.style.direction = "";
      }
    }

    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return (
    <div
      ref={panelRef}
      className="home-feed-posts-scroll-panel flex min-h-0 flex-1 flex-col lg:overflow-y-auto lg:overscroll-contain"
    >
      <div className="home-feed-posts-scroll-inner flex flex-col gap-4" dir="rtl">
        {children}
        <div className="mobile-feed-bottom-spacer shrink-0 md:hidden" aria-hidden="true" />
      </div>
    </div>
  );
}
