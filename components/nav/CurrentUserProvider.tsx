"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type MobileNavUser = {
  id: string;
  avatarUrl: string | null;
  initials: string;
  fullName: string;
  isAdmin: boolean;
};

const CurrentUserContext = createContext<MobileNavUser | null>(null);
const UpdateAvatarContext = createContext<((avatarUrl: string) => void) | null>(null);

type CurrentUserProviderProps = {
  user: MobileNavUser | null;
  children: React.ReactNode;
};

export function CurrentUserProvider({ user: initialUser, children }: CurrentUserProviderProps) {
  const [user, setUser] = useState(initialUser);

  useEffect(() => {
    setUser((current) => {
      if (!initialUser) {
        return null;
      }
      if (!current || current.id !== initialUser.id) {
        return initialUser;
      }
      return {
        ...current,
        fullName: initialUser.fullName,
        initials: initialUser.initials,
        isAdmin: initialUser.isAdmin,
        avatarUrl: current.avatarUrl ?? initialUser.avatarUrl,
      };
    });
  }, [initialUser]);

  const updateAvatarUrl = useCallback((avatarUrl: string) => {
    setUser((current) => (current ? { ...current, avatarUrl } : null));
  }, []);

  return (
    <CurrentUserContext.Provider value={user}>
      <UpdateAvatarContext.Provider value={updateAvatarUrl}>{children}</UpdateAvatarContext.Provider>
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  return useContext(CurrentUserContext);
}

export function useUpdateCurrentUserAvatar() {
  return useContext(UpdateAvatarContext);
}
