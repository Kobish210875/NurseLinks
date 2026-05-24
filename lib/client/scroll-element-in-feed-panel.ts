/** Scroll so `el` is visible inside the home feed column (not the window). */
export function scrollElementInFeedPanel(
  el: HTMLElement,
  options?: { behavior?: ScrollBehavior },
) {
  const behavior = options?.behavior ?? "smooth";
  const scrollPanel = el.closest<HTMLElement>(".home-feed-posts-scroll-panel");
  if (!scrollPanel) {
    el.scrollIntoView({ block: "center", behavior });
    return;
  }

  const panelRect = scrollPanel.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  const offsetTop = elRect.top - panelRect.top + scrollPanel.scrollTop;
  const target = offsetTop - (panelRect.height - elRect.height) / 2;

  scrollPanel.scrollTo({
    top: Math.max(0, target),
    behavior,
  });
}
