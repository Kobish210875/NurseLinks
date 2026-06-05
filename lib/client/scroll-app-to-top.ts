/** Reset window and in-column feed scroll positions (mobile page scroll + desktop feed panel). */
export function scrollAppToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;

  document.querySelectorAll<HTMLElement>(".home-feed-posts-scroll-panel").forEach((panel) => {
    panel.scrollTop = 0;
  });
}

/** Run scroll reset after layout (iOS / shell paint). */
export function scrollAppToTopAfterPaint() {
  scrollAppToTop();
  window.requestAnimationFrame(() => {
    scrollAppToTop();
    window.setTimeout(scrollAppToTop, 0);
    window.setTimeout(scrollAppToTop, 100);
    window.setTimeout(scrollAppToTop, 300);
  });
}
