"use client";

import PostComposerPanel from "@/components/feed/PostComposerModal";
import { useT } from "@/components/i18n/LocaleProvider";
import type { CurrentUser } from "@/lib/auth/get-current-user";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/** Space above mobile browser URL bar (Safari/Chrome). */
const MOBILE_BROWSER_CHROME = "4.75rem";

type ComposerViewport = {
  height: number;
  top: number;
  keyboard: boolean;
};

function useComposerViewport(open: boolean): ComposerViewport {
  const [layout, setLayout] = useState<ComposerViewport>({
    height: 0,
    top: 0,
    keyboard: false,
  });

  useEffect(() => {
    if (!open) {
      setLayout({ height: 0, top: 0, keyboard: false });
      return;
    }

    const viewport = window.visualViewport;
    if (!viewport) {
      return;
    }

    const update = () => {
      setLayout({
        height: viewport.height,
        top: viewport.offsetTop,
        keyboard: viewport.height < window.innerHeight * 0.82,
      });
    };

    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, [open]);

  return layout;
}

type FeedComposerProps = {
  user: CurrentUser;
};

export default function FeedComposer({ user }: FeedComposerProps) {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const composerViewport = useComposerViewport(open);

  useEffect(() => {
    if (searchParams.get("compose") === "1") {
      setOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const scrollY = window.scrollY;
    const { overflow, position, top, width } = document.body.style;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    return () => {
      document.body.style.overflow = overflow;
      document.body.style.position = position;
      document.body.style.top = top;
      document.body.style.width = width;
      window.scrollTo(0, scrollY);
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
            className="composer-backdrop fixed inset-0 z-[70] bg-black/45 md:hidden"
            onClick={closeComposer}
          />
          <div
            className="composer-sheet fixed inset-x-0 z-[71] flex w-full max-w-[100vw] flex-col overflow-hidden rounded-b-2xl bg-white shadow-[0_8px_32px_rgb(44_74_110_/_0.15)] md:hidden"
            style={
              composerViewport.keyboard && composerViewport.height > 0
                ? {
                    top: composerViewport.top,
                    height: composerViewport.height,
                    maxHeight: composerViewport.height,
                    paddingTop: "env(safe-area-inset-top, 0px)",
                  }
                : {
                    top: 0,
                    height: `min(56vh, calc(100dvh - ${MOBILE_BROWSER_CHROME}))`,
                    maxHeight: `min(56vh, calc(100dvh - ${MOBILE_BROWSER_CHROME}))`,
                    paddingTop: "env(safe-area-inset-top, 0px)",
                  }
            }
          >
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
