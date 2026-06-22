"use client";

import { useT } from "@/components/i18n/LocaleProvider";
import { useEffect, useState } from "react";

const DISMISS_KEY = "nurselinks-pwa-hint-dismissed";

function isIosSafari() {
  if (typeof navigator === "undefined") {
    return false;
  }
  const ua = navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return isIos && isSafari;
}

function isStandalonePwa() {
  if (typeof window === "undefined") {
    return false;
  }
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

export default function InstallPwaHint() {
  const t = useT();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (localStorage.getItem(DISMISS_KEY) === "1") {
      return;
    }
    if (!isIosSafari() || isStandalonePwa()) {
      return;
    }
    setVisible(true);
  }, []);

  if (!visible) {
    return null;
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  return (
    <div
      className="fixed inset-x-3 bottom-[calc(var(--mobile-bottom-nav-offset)+0.75rem)] z-[80] rounded-xl border border-primary/20 bg-white p-4 shadow-lg md:hidden"
      role="status"
    >
      <p className="text-sm font-semibold text-foreground">{t("pwa.installTitle")}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("pwa.installSteps")}</p>
      <button
        type="button"
        onClick={dismiss}
        className="mt-3 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
      >
        {t("pwa.installDismiss")}
      </button>
    </div>
  );
}
