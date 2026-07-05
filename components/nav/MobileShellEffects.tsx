"use client";

import { useCurrentUser } from "@/components/nav/CurrentUserProvider";
import { isZoomableFormField, resetIosPageZoomAfterBlur } from "@/lib/client/ios-form-zoom";
import { scrollAppToTopAfterPaint } from "@/lib/client/scroll-app-to-top";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const APP_SHELL_PREFIXES = ["/home", "/network", "/discussions", "/jobs", "/messages", "/profile", "/hospitals", "/institutions"];

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

    const mq = window.matchMedia("(max-width: 767px)");
    if (!mq.matches) {
      return;
    }

    const viewport = window.visualViewport;
    if (!viewport) {
      return;
    }

    function updateKeyboardState() {
      if (!viewport) {
        return;
      }
      const keyboardOpen = viewport.height < window.innerHeight * 0.85;
      document.documentElement.classList.toggle("mobile-keyboard-open", keyboardOpen);
      document.body.classList.toggle("mobile-keyboard-open", keyboardOpen);
    }

    updateKeyboardState();
    viewport.addEventListener("resize", updateKeyboardState);
    viewport.addEventListener("scroll", updateKeyboardState);
    return () => {
      viewport.removeEventListener("resize", updateKeyboardState);
      viewport.removeEventListener("scroll", updateKeyboardState);
      document.documentElement.classList.remove("mobile-keyboard-open");
      document.body.classList.remove("mobile-keyboard-open");
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
    if (!user) {
      return;
    }

    function onPageShow(event: PageTransitionEvent) {
      if (!isAppShellPath(window.location.pathname)) {
        return;
      }
      scrollAppToTopAfterPaint();
      if (event.persisted) {
        window.setTimeout(scrollAppToTopAfterPaint, 150);
      }
    }

    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [user]);

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
