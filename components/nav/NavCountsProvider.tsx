"use client";

import { createContext, useContext } from "react";

type NavCounts = {
  pendingInvitations: number;
  unreadMessages: number;
  unreadJobs: number;
};

const NavCountsContext = createContext<NavCounts>({
  pendingInvitations: 0,
  unreadMessages: 0,
  unreadJobs: 0,
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
  return (
    <NavCountsContext.Provider value={{ pendingInvitations, unreadMessages, unreadJobs }}>
      {children}
    </NavCountsContext.Provider>
  );
}

export function useNavCounts() {
  return useContext(NavCountsContext);
}
