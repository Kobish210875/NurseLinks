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

type NavCountsProviderProps = {
  pendingInvitations: number;
  unreadMessages: number;
  unreadJobs: number;
  children: React.ReactNode;
};

export function NavCountsProvider({
  pendingInvitations,
  unreadMessages,
  unreadJobs,
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

  return (
    <NavCountsContext.Provider value={{ ...counts, updateCounts: setCounts }}>
      <NavCountsPoller />
      {children}
    </NavCountsContext.Provider>
  );
}

export function useNavCounts() {
  return useContext(NavCountsContext);
}
