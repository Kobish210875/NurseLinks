"use client";

import { createContext, useContext } from "react";

export type MobileNavUser = {
  id: string;
  avatarUrl: string | null;
  initials: string;
  fullName: string;
};

const CurrentUserContext = createContext<MobileNavUser | null>(null);

type CurrentUserProviderProps = {
  user: MobileNavUser | null;
  children: React.ReactNode;
};

export function CurrentUserProvider({ user, children }: CurrentUserProviderProps) {
  return (
    <CurrentUserContext.Provider value={user}>{children}</CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  return useContext(CurrentUserContext);
}
