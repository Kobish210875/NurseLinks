"use client";

import { useT } from "@/components/i18n/LocaleProvider";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

type PostImageProps = {
  src: string;
};

function fileNameFromUrl(src: string): string {
  try {
    const url = new URL(src, window.location.origin);
    const last = url.pathname.split("/").filter(Boolean).pop();
    if (last && /\.[a-z0-9]+$/i.test(last)) {
      return decodeURIComponent(last);
    }
  } catch {
    // ignore malformed URLs and fall back to a generic name
  }
  return "nurselinks-image.jpg";
}

export default function PostImage({ src }: PostImageProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    const fileName = fileNameFromUrl(src);
    try {
      const res = await fetch(src, { mode: "cors" });
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      // Cross-origin fetch can fail; fall back to opening in a new tab.
      window.open(src, "_blank", "noopener,noreferrer");
    } finally {
      setDownloading(false);
    }
  }, [src]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("post.imageOpen")}
        className="post-image-frame mx-auto mb-0 block w-fit max-w-full cursor-zoom-in overflow-hidden rounded-lg border border-border bg-muted/15 transition hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          loading="lazy"
          className="block h-auto max-h-[min(70vh,28rem)] w-auto max-w-full object-contain"
        />
      </button>

      {open && mounted
        ? createPortal(
            <div
              className="fixed inset-0 z-[200] flex flex-col bg-black/85"
              role="dialog"
              aria-modal="true"
              aria-label={t("post.imageOpen")}
            >
              <div className="flex shrink-0 items-center justify-end gap-2 p-3">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-white disabled:opacity-60"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  {t("post.imageDownload")}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={t("post.imageClose")}
                  className="inline-flex size-10 items-center justify-center rounded-full bg-white/90 text-xl text-foreground transition hover:bg-white"
                >
                  ×
                </button>
              </div>
              <button
                type="button"
                aria-label={t("post.imageClose")}
                onClick={() => setOpen(false)}
                className="flex min-h-0 flex-1 cursor-zoom-out items-center justify-center p-4 pt-0"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  onClick={(event) => event.stopPropagation()}
                  className="max-h-full max-w-full object-contain"
                />
              </button>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
