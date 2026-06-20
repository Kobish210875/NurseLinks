"use client";

import { signOut } from "@/app/actions/auth";
import AboutStoryDialog from "@/components/feed/AboutStoryDialog";
import { useT } from "@/components/i18n/LocaleProvider";
import { useCurrentUser } from "@/components/nav/CurrentUserProvider";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type MobileMoreMenuProps = {
  open: boolean;
  onClose: () => void;
};

export default function MobileMoreMenu({ open, onClose }: MobileMoreMenuProps) {
  const t = useT();
  const user = useCurrentUser();
  const [aboutOpen, setAboutOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <>
      {open && mounted
        ? createPortal(
            <>
              <button
                type="button"
                aria-label={t("profile.cancel")}
                className="fixed inset-0 z-[80] bg-transparent md:hidden"
                onClick={onClose}
              />
              <div
                className="fixed right-3 top-16 z-[81] w-56 overflow-hidden rounded-2xl border border-border bg-white p-2 shadow-xl ring-1 ring-slate-900/5 md:hidden"
                role="dialog"
                aria-modal="true"
                aria-label={t("nav.openMenu")}
                dir="rtl"
              >
                <div className="absolute -top-2 right-4 size-4 rotate-45 border-s border-t border-border bg-white" />
                <nav className="relative">
                  <ul className="space-y-2 text-start">
                    <li>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground transition hover:bg-primary/10"
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
                    {user?.isAdmin ? (
                      <>
                      <li>
                        <Link
                          href="/admin/users"
                          className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground transition hover:bg-primary/10"
                          onClick={onClose}
                        >
                          <span>{t("nav.adminUsers")}</span>
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
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/admin/backups"
                          className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground transition hover:bg-primary/10"
                          onClick={onClose}
                        >
                          <span>{t("nav.adminBackups")}</span>
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
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/admin/moderation"
                          className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground transition hover:bg-primary/10"
                          onClick={onClose}
                        >
                          <span>{t("nav.adminModeration")}</span>
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
                        </Link>
                      </li>
                      </>
                    ) : null}
                    <li className="border-t border-border pt-2">
                      <form action={signOut}>
                        <button
                          type="submit"
                          className="w-full rounded-xl px-3 py-2.5 text-start text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        >
                          {t("profile.signOut")}
                        </button>
                      </form>
                    </li>
                  </ul>
                </nav>
              </div>
            </>,
            document.body,
          )
        : null}

      <AboutStoryDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </>
  );
}
