/** True when the element can trigger iOS Safari's focus zoom (<16px font). */
export function isZoomableFormField(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  if (target instanceof HTMLInputElement) {
    const type = target.type;
    return !["checkbox", "radio", "file", "hidden", "range", "color", "button", "submit", "reset"].includes(
      type,
    );
  }
  return target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement;
}

/**
 * After iOS zooms the page on a small input, reset the viewport scale on blur.
 * Pair with 16px mobile form controls in globals.css.
 */
export function resetIosPageZoomAfterBlur() {
  const meta = document.querySelector('meta[name="viewport"]');
  if (!meta) {
    return;
  }
  const base =
    meta.getAttribute("content") ??
    "width=device-width, initial-scale=1, interactive-widget=overlays-content";
  const bumped = `${base.replace(/,?\s*maximum-scale=[^,]*/gi, "")}, maximum-scale=1`;
  meta.setAttribute("content", bumped);
  requestAnimationFrame(() => {
    meta.setAttribute("content", base);
  });
}
