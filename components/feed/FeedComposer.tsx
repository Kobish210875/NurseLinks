"use client";

import PostComposerPanel from "@/components/feed/PostComposerModal";
import { useT } from "@/components/i18n/LocaleProvider";
import type { CurrentUser } from "@/lib/auth/get-current-user";
import { useEffect, useState } from "react";

type FeedComposerProps = {
  user: CurrentUser;
};

export default function FeedComposer({ user }: FeedComposerProps) {
  const t = useT();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label={t("profile.cancel")}
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div
        className={`feed-card p-4 ${open ? "relative z-50 shadow-lg ring-1 ring-primary/15" : ""}`}
      >
        {open ? (
          <PostComposerPanel user={user} onClose={() => setOpen(false)} />
        ) : (
          <div className="flex items-center gap-3">
            <span className="relative flex size-12 shrink-0 overflow-hidden rounded-full border-2 border-border bg-primary/10">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt="" className="size-full object-cover" />
              ) : (
                <span className="flex size-full items-center justify-center text-sm font-semibold text-primary">
                  {user.initials}
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="min-h-[2.75rem] flex-1 rounded-full border border-border bg-muted/30 px-4 py-2.5 text-start text-sm text-muted-foreground transition hover:border-primary/30 hover:bg-white focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
            >
              {t("feed.composerPlaceholder")}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
