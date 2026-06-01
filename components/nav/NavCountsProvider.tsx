"use client";

import NavCountsPoller from "@/components/nav/NavCountsPoller";
import { createContext, useContext, useEffect, useState } from "react";

type NavCounts = {
  pendingInvitations: number;
  unreadMessages: number;
  unreadJobs: number;
};

type NavCountsContextValue = NavCounts & {
  updateCounts: (counts: NavCounts) => void;
};

const NavCountsContext = createContext<NavCountsContextValue>({
  pendingInvitations: 0,
  unreadMessages: 0,
  unreadJobs: 0,
  updateCounts: () => {},
});

async function fetchNavCounts(): Promise<NavCounts | null> {
  try {
    const res = await fetch("/api/sync/nav", { cache: "no-store" });
    if (!res.ok) {
      return null;
    }
    const payload = (await res.json()) as NavCounts;
    return {
      pendingInvitations: payload.pendingInvitations ?? 0,
      unreadMessages: payload.unreadMessages ?? 0,
      unreadJobs: payload.unreadJobs ?? 0,
    };
  } catch {
    return null;
  }
}

type NavCountsProviderProps = {
  pendingInvitations: number;
  unreadMessages: number;
  unreadJobs: number;
  /** When false, skip client polling (logged-out pages). */
  enablePolling?: boolean;
  children: React.ReactNode;
};

export function NavCountsProvider({
  pendingInvitations,
  unreadMessages,
  unreadJobs,
  enablePolling = true,
  children,
}: NavCountsProviderProps) {
  const [counts, setCounts] = useState({
    pendingInvitations,
    unreadMessages,
    unreadJobs,
  });

  useEffect(() => {
    setCounts({ pendingInvitations, unreadMessages, unreadJobs });
  }, [pendingInvitations, unreadMessages, unreadJobs]);

  useEffect(() => {
    if (!enablePolling) {
      return;
    }
    let cancelled = false;
    void (async () => {
      const fresh = await fetchNavCounts();
      if (!cancelled && fresh) {
        setCounts(fresh);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enablePolling]);

  return (
    <NavCountsContext.Provider value={{ ...counts, updateCounts: setCounts }}>
      {enablePolling ? <NavCountsPoller /> : null}
      {children}
    </NavCountsContext.Provider>
  );
}

export function useNavCounts() {
  return useContext(NavCountsContext);
}
