"use client";

import PostComposerPanel from "@/components/feed/PostComposerModal";
import { useT } from "@/components/i18n/LocaleProvider";
import type { CurrentUser } from "@/lib/auth/get-current-user";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type FeedComposerProps = {
  user: CurrentUser;
};

export default function FeedComposer({ user }: FeedComposerProps) {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("compose") === "1") {
      setOpen(true);
    }
  }, [searchParams]);

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

  function closeComposer() {
    setOpen(false);
    if (searchParams.get("compose") === "1") {
      router.replace("/home", { scroll: false });
    }
  }

  return (
    <>
      {open ? (
        <>
          <button
            type="button"
            aria-label={t("profile.cancel")}
            className="fixed inset-0 z-[70] bg-black/40 md:hidden"
            onClick={closeComposer}
          />
          <div className="fixed inset-0 z-[71] flex flex-col bg-white md:hidden">
            <PostComposerPanel user={user} onClose={closeComposer} fullScreen />
          </div>
        </>
      ) : null}

      <div
        className={`feed-card p-3 md:p-4 ${open ? "relative z-50 max-md:hidden shadow-lg ring-1 ring-primary/15 md:block" : ""}`}
      >
        {open ? (
          <PostComposerPanel user={user} onClose={closeComposer} />
        ) : (
          <div className="flex items-center gap-3">
            <span className="relative flex size-10 shrink-0 overflow-hidden rounded-full border-2 border-border bg-primary/10 md:size-12">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt="" className="size-full object-cover" />
              ) : (
                <span className="flex size-full items-center justify-center text-xs font-semibold text-primary md:text-sm">
                  {user.initials}
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="min-h-[2.5rem] flex-1 rounded-full border border-border bg-muted/30 px-4 py-2 text-start text-sm text-muted-foreground transition hover:border-primary/30 hover:bg-white focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15 md:min-h-[2.75rem] md:py-2.5"
            >
              {t("feed.composerPlaceholder")}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
