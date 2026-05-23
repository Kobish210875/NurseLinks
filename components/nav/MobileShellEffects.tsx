"use client";

import { useCurrentUser } from "@/components/nav/CurrentUserProvider";
import { useEffect } from "react";

/** Adds bottom padding and hides footer on mobile for logged-in app shell. */
export default function MobileShellEffects() {
  const user = useCurrentUser();

  useEffect(() => {
    document.body.classList.toggle("has-mobile-app-shell", Boolean(user));
    return () => {
      document.body.classList.remove("has-mobile-app-shell");
    };
  }, [user]);

  return null;
}
