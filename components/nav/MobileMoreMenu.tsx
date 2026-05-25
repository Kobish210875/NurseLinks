"use client";

import { signOut } from "@/app/actions/auth";
import AboutStoryDialog from "@/components/feed/AboutStoryDialog";
import { useT } from "@/components/i18n/LocaleProvider";
import NurseLinkWordmark from "@/components/NurseLinkWordmark";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type MobileMoreMenuProps = {
  open: boolean;
  onClose: () => void;
};

export default function MobileMoreMenu({ open, onClose }: MobileMoreMenuProps) {
  const t = useT();
  const [aboutOpen, setAboutOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  return (
    <>
      {open && mounted
        ? createPortal(
            <>
              <button
                type="button"
                aria-label={t("profile.cancel")}
                className="fixed inset-0 z-[80] bg-slate-950/35 backdrop-blur-[1px] md:hidden"
                onClick={onClose}
              />
              <aside
                className="fixed inset-y-0 right-0 z-[81] flex h-dvh w-[min(82vw,20rem)] flex-col overflow-hidden rounded-l-3xl border-s border-border bg-white shadow-2xl md:hidden"
                role="dialog"
                aria-modal="true"
                aria-label={t("nav.openMenu")}
                dir="rtl"
              >
                <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
                  <NurseLinkWordmark
                    textClassName="text-primary text-base font-bold"
                    iconClassName="size-[0.9em] shrink-0 text-primary"
                  />
                  <button
                    type="button"
                    className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
                    aria-label={t("profile.cancel")}
                    onClick={onClose}
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
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                </header>

                <nav className="flex-1 overflow-y-auto px-4 py-4">
                  <ul className="space-y-2 text-start">
                    <li>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between rounded-2xl bg-primary/10 px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-primary/15"
                        onClick={() => {
                          onClose();
                          setAboutOpen(true);
                        }}
                      >
                        <span>{t("feed.aboutCardTitle")}</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-primary"
                          aria-hidden="true"
                        >
                          <path d="m15 18-6-6 6-6" />
                        </svg>
                      </button>
                    </li>
                  </ul>
                </nav>

                <div className="border-t border-border p-4">
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-start text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    >
                      {t("profile.signOut")}
                    </button>
                  </form>
                </div>
              </aside>
            </>,
            document.body,
          )
        : null}

      <AboutStoryDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </>
  );
}
