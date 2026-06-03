"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type MessagingDockContextValue = {
  activePeerId: string | null;
  openThread: (peerId: string) => void;
  closeThread: () => void;
};

const MessagingDockContext = createContext<MessagingDockContextValue | null>(null);

export function MessagingDockProvider({ children }: { children: React.ReactNode }) {
  const [activePeerId, setActivePeerId] = useState<string | null>(null);

  const openThread = useCallback((peerId: string) => {
    setActivePeerId(peerId);
  }, []);

  const closeThread = useCallback(() => {
    setActivePeerId(null);
  }, []);

  const value = useMemo(
    () => ({
      activePeerId,
      openThread,
      closeThread,
    }),
    [activePeerId, openThread, closeThread],
  );

  return (
    <MessagingDockContext.Provider value={value}>{children}</MessagingDockContext.Provider>
  );
}

export function useMessagingDock() {
  const ctx = useContext(MessagingDockContext);
  if (!ctx) {
    throw new Error("useMessagingDock must be used within MessagingDockProvider");
  }
  return ctx;
}

export function useMessagingDockOptional() {
  return useContext(MessagingDockContext);
}
