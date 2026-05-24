"use client";

import { useCurrentUser } from "@/components/nav/CurrentUserProvider";
import { useEffect } from "react";

/** Adds bottom padding and hides footer on mobile for logged-in app shell. */
export default function MobileShellEffects() {
  const user = useCurrentUser();

  useEffect(() => {
    const on = Boolean(user);
    document.documentElement.classList.toggle("has-mobile-app-shell", on);
    document.body.classList.toggle("has-mobile-app-shell", on);
    return () => {
      document.documentElement.classList.remove("has-mobile-app-shell");
      document.body.classList.remove("has-mobile-app-shell");
    };
  }, [user]);

  return null;
}
