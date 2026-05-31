/** Restore `html`/`body` overflow after a native file picker on pages that lock scroll (e.g. home feed). */
export function unlockBodyOverflowForFilePicker(): () => void {
  if (typeof document === "undefined") {
    return () => {};
  }

  const html = document.documentElement;
  const body = document.body;
  const prevHtmlOverflow = html.style.overflow;
  const prevBodyOverflow = body.style.overflow;

  html.style.overflow = "";
  body.style.overflow = "";

  let restored = false;
  const restore = () => {
    if (restored) {
      return;
    }
    restored = true;
    html.style.overflow = prevHtmlOverflow;
    body.style.overflow = prevBodyOverflow;
    window.removeEventListener("focus", onWindowFocus);
  };

  const onWindowFocus = () => {
    window.setTimeout(restore, 0);
  };

  window.addEventListener("focus", onWindowFocus, { once: true });

  return restore;
}
