"use client";

import { useCurrentUser } from "@/components/nav/CurrentUserProvider";
import { isZoomableFormField, resetIosPageZoomAfterBlur } from "@/lib/client/ios-form-zoom";
import { scrollAppToTopAfterPaint } from "@/lib/client/scroll-app-to-top";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const APP_SHELL_PREFIXES = ["/home", "/network", "/jobs", "/messages", "/profile", "/hospitals"];

function isAppShellPath(pathname: string) {
  return APP_SHELL_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Adds bottom padding and hides footer on mobile for logged-in app shell. */
export default function MobileShellEffects() {
  const user = useCurrentUser();
  const pathname = usePathname();
  const prevPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    const on = Boolean(user);
    document.documentElement.classList.toggle("has-mobile-app-shell", on);
    document.body.classList.toggle("has-mobile-app-shell", on);
    return () => {
      document.documentElement.classList.remove("has-mobile-app-shell");
      document.body.classList.remove("has-mobile-app-shell");
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    return () => {
      if ("scrollRestoration" in history) {
        history.scrollRestoration = "auto";
      }
    };
  }, [user]);

  useEffect(() => {
    if (!user || !isAppShellPath(pathname)) {
      prevPathnameRef.current = pathname;
      return;
    }

    const prev = prevPathnameRef.current;
    prevPathnameRef.current = pathname;
    if (prev === pathname) {
      return;
    }

    scrollAppToTopAfterPaint();
  }, [pathname, user]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    if (!mq.matches) {
      return;
    }

    function onFocusOut(event: FocusEvent) {
      if (isZoomableFormField(event.target)) {
        window.setTimeout(resetIosPageZoomAfterBlur, 100);
      }
    }

    document.addEventListener("focusout", onFocusOut);
    return () => document.removeEventListener("focusout", onFocusOut);
  }, []);

  return null;
}
