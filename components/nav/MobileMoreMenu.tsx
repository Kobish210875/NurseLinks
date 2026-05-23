"use client";

import { signOut } from "@/app/actions/auth";
import AboutStoryDialog from "@/components/feed/AboutStoryDialog";
import LanguageToggle from "@/components/i18n/LanguageToggle";
import { useT } from "@/components/i18n/LocaleProvider";
import { useState } from "react";

type MobileMoreMenuProps = {
  open: boolean;
  onClose: () => void;
};

export default function MobileMoreMenu({ open, onClose }: MobileMoreMenuProps) {
  const t = useT();
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <>
      {open ? (
        <>
          <button
            type="button"
            aria-label={t("profile.cancel")}
            className="fixed inset-0 z-[60] bg-black/40 md:hidden"
            onClick={onClose}
          />
          <div
            className="fixed inset-x-0 top-14 z-[61] max-h-[min(70vh,24rem)] overflow-y-auto border-b border-border bg-nav-bg shadow-lg md:hidden"
            role="dialog"
            aria-label={t("nav.openMenu")}
          >
            <ul className="space-y-1 px-4 py-3 text-start">
              <li>
                <button
                  type="button"
                  className="flex w-full items-center rounded-md px-3 py-2.5 text-sm font-medium text-foreground transition hover:bg-white"
                  onClick={() => {
                    onClose();
                    setAboutOpen(true);
                  }}
                >
                  {t("feed.aboutCardTitle")}
                </button>
              </li>
              <li className="flex items-center justify-between rounded-md px-3 py-2.5">
                <span className="text-sm font-medium text-foreground">{t("lang.label")}</span>
                <LanguageToggle />
              </li>
              <li className="border-t border-border pt-2">
                <form action={signOut}>
                  <button
                    type="submit"
                    className="w-full rounded-md px-3 py-2.5 text-start text-sm font-medium text-muted-foreground transition hover:bg-white hover:text-foreground"
                  >
                    {t("profile.signOut")}
                  </button>
                </form>
              </li>
            </ul>
          </div>
        </>
      ) : null}

      <AboutStoryDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </>
  );
}
