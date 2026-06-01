"use client";

import NavCountsPoller from "@/components/nav/NavCountsPoller";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

type NavCounts = {
  pendingInvitations: number;
  unreadMessages: number;
  unreadJobs: number;
};

type NavCountsContextValue = NavCounts & {
  updateCounts: (patch: Partial<NavCounts>) => void;
};

const NavCountsContext = createContext<NavCountsContextValue>({
  pendingInvitations: 0,
  unreadMessages: 0,
  unreadJobs: 0,
  updateCounts: () => {},
});

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

  // Merge-patch so callers only need to specify the keys they're changing.
  const updateCounts = useCallback((patch: Partial<NavCounts>) => {
    setCounts((prev) => ({ ...prev, ...patch }));
  }, []);

  return (
    <NavCountsContext.Provider value={{ ...counts, updateCounts }}>
      {enablePolling ? <NavCountsPoller /> : null}
      {children}
    </NavCountsContext.Provider>
  );
}

export function useNavCounts() {
  return useContext(NavCountsContext);
}
