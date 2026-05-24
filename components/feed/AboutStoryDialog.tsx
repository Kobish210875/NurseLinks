"use client";

import NurseLinkWordmark from "@/components/NurseLinkWordmark";
import { useT } from "@/components/i18n/LocaleProvider";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type AboutStoryDialogProps = {
  open: boolean;
  onClose: () => void;
};

const STORY_KEYS = [
  "feed.aboutStoryP1",
  "feed.aboutStoryP2",
  "feed.aboutStoryP3",
] as const;

export default function AboutStoryDialog({ open, onClose }: AboutStoryDialogProps) {
  const t = useT();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open || !mounted) {
    return null;
  }

  return createPortal(
    <div
      className="about-story-overlay fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto p-4 pt-12 sm:items-start sm:pt-16"
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-story-title"
    >
      <button
        type="button"
        aria-label={t("feed.aboutClose")}
        className="fixed inset-0 bg-foreground/40"
        onClick={onClose}
      />

      <article className="relative z-10 w-full max-w-xl overflow-hidden rounded-xl border border-border bg-card shadow-xl">
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 text-start sm:px-6 sm:py-5">
          <h2
            id="about-story-title"
            className="flex flex-wrap items-baseline gap-x-2 text-lg font-semibold text-foreground sm:text-xl"
          >
            <span>{t("feed.aboutStoryTitle")}</span>
            <NurseLinkWordmark textClassName="text-lg text-primary sm:text-xl" />
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label={t("feed.aboutClose")}
          >
            ✕
          </button>
        </header>

        <div className="max-h-[min(70vh,28rem)] overflow-y-auto px-5 py-4 text-start sm:px-6 sm:py-5">
          {STORY_KEYS.map((key) => (
            <p key={key} className="mb-4 text-sm leading-[1.75] text-foreground/90 last:mb-0">
              {t(key)}
            </p>
          ))}
        </div>

        <footer className="border-t border-border px-5 py-3 text-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            {t("feed.aboutClose")}
          </button>
        </footer>
      </article>
    </div>,
    document.body,
  );
}
