"use client";

import AboutStoryDialog from "@/components/feed/AboutStoryDialog";
import { useT } from "@/components/i18n/LocaleProvider";
import { useState } from "react";

type AboutStoryCardProps = {
  className?: string;
};

export default function AboutStoryCard({ className = "" }: AboutStoryCardProps) {
  const t = useT();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className={`feed-card border-border p-4 text-start ${className}`}>
        <p className="text-sm font-semibold text-foreground">{t("feed.aboutCardTitle")}</p>
        <p className="home-feed-card-body mt-1.5 leading-relaxed text-muted-foreground">
          {t("feed.aboutCardTeaser")}
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition hover:text-primary-dark hover:underline"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
            <path d="M8 7h8M8 11h6" />
          </svg>
          {t("feed.aboutOpenCta")}
        </button>
      </div>

      <AboutStoryDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
